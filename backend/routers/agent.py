from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid, json, os

from database import db
from auth_utils import require_admin
from storage import put_object, APP_NAME

router = APIRouter()

AGENT_SYSTEM_PROMPT = """Sen bir e-Konut Veri Yönetim Asistanısın. Kullanıcı sana Türkçe komutlar gönderecek ve sen bu komutları anlayıp yapılacak veritabanı işlemlerini JSON formatında döndüreceksin.

Desteklenen işlemler:
- create: Yeni proje oluştur
- bulk_create: Birden fazla proje oluştur (data.projects array içinde)
- update: Mevcut projeyi güncelle
- delete: Projeyi sil
- query: Projeleri listele/sorgula

Proje alanları: project_name (zorunlu), city (İl), district (İlçe), neighborhood (Mahalle), project_type (TOKİ/Emlak Konut/Özel Proje), total_housing, commercial_count, school_count, mosque_count, social_facility_count, progress_percentage (0-100), start_date, planned_end_date, description

SADECE geçerli JSON döndür:
{"message":"Türkçe açıklama","actions":[{"type":"create|bulk_create|update|delete|query","data":{...},"search_name":"güncelle/sil için proje adı","filters":{"city":"...","district":"..."}}]}

bulk_create için: "data":{"projects":[{...},{...}]}
update/delete için: "search_name" zorunlu"""


class AgentMessage(BaseModel):
    message: str
    session_id: str = "default"


@router.post("/admin/agent/chat")
async def agent_chat(body: AgentMessage, admin: dict = Depends(require_admin)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage as LlmUserMessage
    llm_key = os.environ.get('EMERGENT_LLM_KEY')
    if not llm_key:
        raise HTTPException(status_code=500, detail="LLM key yapılandırılmamış")

    projects_cursor = db.projects.find({}, {"_id": 0, "id": 1, "project_name": 1, "city": 1, "district": 1, "progress_percentage": 1}).limit(200)
    existing_projects = await projects_cursor.to_list(length=200)
    context_msg = f"\nMevcut projeler: {json.dumps([{'id':p['id'],'ad':p.get('project_name'),'il':p.get('city'),'ilce':p.get('district')} for p in existing_projects], ensure_ascii=False)}"

    chat = LlmChat(api_key=llm_key, session_id=f"agent_{body.session_id}", system_message=AGENT_SYSTEM_PROMPT).with_model("anthropic", "claude-sonnet-4-5-20250929")
    response_text = await chat.send_message(LlmUserMessage(text=body.message + context_msg))

    agent_response = None
    try:
        raw = response_text.strip()
        if "```json" in raw: raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw: raw = raw.split("```")[1].split("```")[0].strip()
        agent_response = json.loads(raw)
    except Exception as e:
        return {"message": f"Yanıt işlenemedi: {str(e)}", "actions": [], "results": []}

    if not agent_response:
        return {"message": "İşlem tamamlandı.", "results": []}

    results = []
    for action in agent_response.get("actions", []):
        atype = action.get("type")
        try:
            if atype in ("create", "bulk_create"):
                items = action.get("data", {}).get("projects", [action.get("data", {})]) if atype == "bulk_create" else [action.get("data", {})]
                created = []
                for d in items:
                    p = {"id": str(uuid.uuid4()), "project_name": d.get("project_name",""), "city": d.get("city",""), "district": d.get("district",""), "neighborhood": d.get("neighborhood",""), "description": d.get("description",""), "project_type": d.get("project_type","TOKİ"), "total_housing": int(d.get("total_housing",0)), "commercial_count": int(d.get("commercial_count",0)), "school_count": int(d.get("school_count",0)), "mosque_count": int(d.get("mosque_count",0)), "social_facility_count": int(d.get("social_facility_count",0)), "progress_percentage": int(d.get("progress_percentage",0)), "start_date": d.get("start_date",""), "planned_end_date": d.get("planned_end_date",""), "created_at": datetime.now(timezone.utc).isoformat()}
                    await db.projects.insert_one(p)
                    created.append(p["project_name"])
                results.append({"type": atype, "status": "ok", "count": len(created), "names": created})
            elif atype == "update":
                sname = action.get("search_name","")
                existing = await db.projects.find_one({"project_name": {"$regex": sname, "$options": "i"}}, {"_id": 0})
                if existing:
                    await db.projects.update_one({"id": existing["id"]}, {"$set": {k:v for k,v in action.get("data",{}).items() if v is not None and k!="id"}})
                    results.append({"type": "update", "status": "ok", "name": existing["project_name"]})
                else:
                    results.append({"type": "update", "status": "not_found", "search": sname})
            elif atype == "delete":
                sname = action.get("search_name","")
                existing = await db.projects.find_one({"project_name": {"$regex": sname, "$options": "i"}}, {"_id": 0})
                if existing:
                    await db.projects.delete_one({"id": existing["id"]})
                    results.append({"type": "delete", "status": "ok", "name": existing["project_name"]})
                else:
                    results.append({"type": "delete", "status": "not_found", "search": sname})
            elif atype == "query":
                f = action.get("filters", {})
                q = {k: {"$regex": v, "$options": "i"} for k, v in [("city", f.get("city")), ("district", f.get("district"))] if v}
                if f.get("project_type"): q["project_type"] = f["project_type"]
                found = await db.projects.find(q, {"_id": 0, "id": 1, "project_name": 1, "city": 1, "district": 1, "progress_percentage": 1, "total_housing": 1}).to_list(50)
                results.append({"type": "query", "status": "ok", "count": len(found), "projects": found})
        except Exception as e:
            results.append({"type": atype, "status": "error", "error": str(e)})

    return {"message": agent_response.get("message","İşlem tamamlandı."), "results": results}


@router.post("/admin/agent/upload-zip")
async def agent_upload_zip(
    file: UploadFile = File(...),
    project_id: str = Form(None),
    message: str = Form(""),
    admin: dict = Depends(require_admin)
):
    import zipfile
    import io as _io
    import rarfile
    from PIL import Image as PilImage
    from storage import MIME_TYPES
    from routers.projects import extract_centroid_from_kml, extract_centroid_from_geojson

    raw = await file.read()
    fname = file.filename or "upload"
    ext = fname.rsplit(".", 1)[-1].lower() if "." in fname else ""

    GEO_EXTS = {"kml", "kmz", "geojson", "json"}
    IMG_EXTS = {"jpg", "jpeg", "png", "webp"}
    DOC_EXTS = {"docx"}
    GEO_MIME = {"kml":"application/vnd.google-earth.kml+xml","kmz":"application/vnd.google-earth.kmz","geojson":"application/geo+json","json":"application/json"}

    all_files = []

    def _add(name, data):
        bname = name.replace("\\", "/").split("/")[-1]
        if not bname or bname.startswith(".") or bname.lower() == "thumbs.db":
            return
        fext = bname.rsplit(".", 1)[-1].lower() if "." in bname else ""
        if fext in GEO_EXTS | IMG_EXTS | DOC_EXTS:
            all_files.append((bname, fext, data))

    if ext == "zip":
        with zipfile.ZipFile(_io.BytesIO(raw)) as z:
            for name in z.namelist():
                if not name.startswith("__MACOSX") and not name.endswith("/"):
                    _add(name, z.read(name))
    elif ext == "rar":
        import tempfile, os as _os
        with tempfile.NamedTemporaryFile(suffix=".rar", delete=False) as tmp:
            tmp.write(raw)
            tmp_path = tmp.name
        try:
            with rarfile.RarFile(tmp_path) as rf:
                for info in rf.infolist():
                    if not info.is_dir():
                        _add(info.filename, rf.read(info.filename))
        finally:
            _os.unlink(tmp_path)
    elif ext in GEO_EXTS | IMG_EXTS:
        all_files.append((fname, ext, raw))
    else:
        raise HTTPException(status_code=400, detail="ZIP, RAR, KML, KMZ, GeoJSON veya görsel dosyası yükleyin")

    if not all_files:
        raise HTTPException(status_code=400, detail="Desteklenen dosya bulunamadı")

    # Extract DOCX text
    docx_full_text = ""
    for (orig_name, fext, data) in all_files:
        if fext == "docx" and not docx_full_text:
            try:
                from docx import Document as DocxDoc
                doc = DocxDoc(_io.BytesIO(data))
                lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
                docx_full_text = "\n".join(lines[:40])
            except Exception:
                pass

    created_project = None
    if not project_id:
        llm_key = os.environ.get("EMERGENT_LLM_KEY")
        project_info = {}
        combined_input = ""
        if message.strip():
            combined_input += f"Kullanıcı açıklaması:\n{message.strip()}\n\n"
        if docx_full_text:
            combined_input += f"DOCX dosyasından elde edilen metin:\n{docx_full_text[:2000]}\n\n"
        if not combined_input:
            combined_input = f"ZIP dosya adı: {fname}"

        if llm_key:
            try:
                from emergentintegrations.llm.chat import LlmChat, UserMessage as LlmUserMessage
                extraction_prompt = f"""Aşağıdaki bilgilerden e-Konut projesi verilerini çıkar ve SADECE geçerli JSON döndür:\n\n{combined_input}\n\nJSON şeması:\n{{"project_name":"","city":"","district":"","neighborhood":"","description":"","project_type":"TOKİ","total_housing":0,"progress_percentage":0,"start_date":"","planned_end_date":""}}\n\nproject_name zorunludur. Bulunamazsa şundan türet: {fname.rsplit('.', 1)[0].replace('-', ' ').replace('_', ' ').title()}"""
                chat = LlmChat(api_key=llm_key, session_id=f"zip_extract_{uuid.uuid4()}", system_message="Sen bir veri çıkarma asistanısın. Sadece geçerli JSON döndür.").with_model("anthropic", "claude-sonnet-4-5-20250929")
                raw_resp = await chat.send_message(LlmUserMessage(text=extraction_prompt))
                raw_resp = raw_resp.strip()
                if "```json" in raw_resp: raw_resp = raw_resp.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_resp: raw_resp = raw_resp.split("```")[1].split("```")[0].strip()
                project_info = json.loads(raw_resp)
            except Exception:
                project_info = {}

        if not project_info.get("project_name"):
            project_info["project_name"] = fname.rsplit(".", 1)[0].replace("-", " ").replace("_", " ").title()

        new_project = {
            "id": str(uuid.uuid4()),
            "project_name": project_info.get("project_name", "Yeni Proje"),
            "city": project_info.get("city", ""), "district": project_info.get("district", ""),
            "neighborhood": project_info.get("neighborhood", ""),
            "description": project_info.get("description", docx_full_text[:500] if docx_full_text else ""),
            "project_type": project_info.get("project_type", "TOKİ"),
            "total_housing": int(project_info.get("total_housing", 0) or 0),
            "commercial_count": 0, "school_count": 0, "mosque_count": 0, "social_facility_count": 0,
            "progress_percentage": int(project_info.get("progress_percentage", 0) or 0),
            "start_date": project_info.get("start_date", ""),
            "planned_end_date": project_info.get("planned_end_date", ""),
            "youtube_videos": [], "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.projects.insert_one(new_project)
        new_project.pop("_id", None)
        project_id = new_project["id"]
        created_project = new_project
    else:
        existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")

    added_layers = []
    added_images = []
    description_text = docx_full_text or None
    project_center = None

    def _compress_image(data: bytes) -> bytes:
        img = PilImage.open(_io.BytesIO(data))
        img.thumbnail((1280, 960), PilImage.LANCZOS)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        buf = _io.BytesIO()
        img.save(buf, "JPEG", quality=82, optimize=True)
        return buf.getvalue()

    for (orig_name, fext, data) in all_files:
        if fext in GEO_EXTS:
            storage_path = f"{APP_NAME}/map-layers/{project_id}/{uuid.uuid4()}.{fext}"
            content_type = GEO_MIME.get(fext, "application/octet-stream")
            put_object(storage_path, data, content_type)
            layer = {"id": str(uuid.uuid4()), "project_id": project_id, "storage_path": storage_path, "original_filename": orig_name, "content_type": content_type, "file_type": fext.upper(), "size": len(data), "created_at": datetime.now(timezone.utc).isoformat()}
            await db.project_map_layers.insert_one(layer)
            added_layers.append(orig_name)
            if project_center is None:
                try:
                    if fext in ("kml", "kmz"):
                        project_center = extract_centroid_from_kml(fext, data)
                    elif fext in ("geojson", "json"):
                        project_center = extract_centroid_from_geojson(data)
                except Exception:
                    pass
        elif fext in IMG_EXTS:
            try:
                compressed = _compress_image(data)
            except Exception:
                compressed = data
            storage_path = f"{APP_NAME}/media/{project_id}/{uuid.uuid4()}.jpg"
            put_object(storage_path, compressed, "image/jpeg")
            media_doc = {"id": str(uuid.uuid4()), "project_id": project_id, "storage_path": storage_path, "original_filename": orig_name, "media_type": "IMAGE", "category": "Görsel", "title": orig_name, "content_type": "image/jpeg", "size": len(compressed), "created_at": datetime.now(timezone.utc).isoformat()}
            await db.project_media.insert_one(media_doc)
            added_images.append(orig_name)

    update_fields = {}
    if project_center:
        update_fields["location"] = project_center
    if description_text and not created_project:
        existing_desc = (await db.projects.find_one({"id": project_id}, {"_id": 0, "description": 1}) or {}).get("description", "")
        if not existing_desc:
            update_fields["description"] = description_text[:500]
    if update_fields:
        await db.projects.update_one({"id": project_id}, {"$set": update_fields})

    project_doc = await db.projects.find_one({"id": project_id}, {"_id": 0, "project_name": 1})
    project_name = project_doc.get("project_name", "") if project_doc else (created_project or {}).get("project_name", "")

    response = {
        "added_layers": added_layers, "added_images": added_images,
        "layers_count": len(added_layers), "images_count": len(added_images),
        "project_name": project_name, "location_updated": project_center is not None,
        "description_extracted": description_text is not None,
    }
    if created_project:
        response["new_project"] = {"id": created_project["id"], "name": created_project["project_name"], "city": created_project.get("city", ""), "district": created_project.get("district", "")}
    return response


# ============= SHARED FACILITIES =============

@router.get("/shared-facilities")
async def get_shared_facilities():
    return await db.shared_facilities.find({}, {"_id": 0}).to_list(500)


@router.post("/admin/shared-facilities")
async def create_shared_facility(body: dict, admin: dict = Depends(require_admin)):
    facility = {
        "id": str(uuid.uuid4()), "name": body.get("name", ""), "type": body.get("type", "diger"),
        "lat": float(body.get("lat", 0)), "lng": float(body.get("lng", 0)),
        "description": body.get("description", ""), "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.shared_facilities.insert_one(facility)
    facility.pop("_id", None)
    return facility


@router.delete("/admin/shared-facilities/{facility_id}")
async def delete_shared_facility(facility_id: str, admin: dict = Depends(require_admin)):
    result = await db.shared_facilities.delete_one({"id": facility_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tesis bulunamadı")
    return {"message": "Silindi"}


@router.put("/admin/shared-facilities/{facility_id}")
async def update_shared_facility(facility_id: str, body: dict, admin: dict = Depends(require_admin)):
    update = {k: v for k, v in body.items() if k in ("name", "type", "lat", "lng", "description")}
    if "lat" in update: update["lat"] = float(update["lat"])
    if "lng" in update: update["lng"] = float(update["lng"])
    await db.shared_facilities.update_one({"id": facility_id}, {"$set": update})
    return {"message": "Güncellendi"}
