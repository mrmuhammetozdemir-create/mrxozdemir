from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Body, Request
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import uuid, json

from database import db
from auth_utils import require_admin, get_session_user
from storage import put_object, MIME_TYPES, APP_NAME

router = APIRouter()


class SeminarCreate(BaseModel):
    title: str
    description: str = ""
    date: str = ""
    time: str = ""
    duration: str = ""
    speaker: str = ""
    seminar_type: str = "free"
    location: str = ""
    zoom_link: str = ""
    cover_image: str = ""
    status: str = "active"


class SeminarRegistrationCreate(BaseModel):
    name: str
    phone: str
    email: str


class CourseCreate(BaseModel):
    title: str
    short_description: str = ""
    full_description: str = ""
    cover_image: str = ""
    promo_video: str = ""
    price: float = 0
    discount_price: Optional[float] = None
    level: str = "başlangıç"
    tags: List[str] = []
    status: str = "active"
    order: int = 0
    student_count: int = 0
    rating: float = 5.0


class CourseModuleCreate(BaseModel):
    title: str
    order: int = 0


class CourseLessonCreate(BaseModel):
    title: str
    video_url: str = ""
    pdf_files: List[str] = []
    duration: str = ""
    is_preview: bool = False
    order: int = 0


class LiveTrainingUpdate(BaseModel):
    title: str = "Haftalık Canlı Online Eğitim"
    description: str = ""
    day_of_week: str = ""
    time: str = ""
    zoom_link: str = ""
    status: str = "active"


class LiveArchiveCreate(BaseModel):
    title: str
    video_url: str = ""
    date: str = ""
    thumbnail: str = ""


# ============= INVESTMENT CALCULATOR =============

class InvestmentCalculation(BaseModel):
    city: str
    district: str
    neighborhood: str
    ada: str
    parsel: str
    land_size_sqm: float
    emsal: float
    construction_cost_per_sqm: float


class InvestmentResult(BaseModel):
    total_construction_area: float
    estimated_apartments: int
    total_construction_cost: float
    estimated_project_value: float
    potential_profit: float
    roi_percentage: float


@router.post("/investment/calculate", response_model=InvestmentResult)
async def calculate_investment(data: InvestmentCalculation):
    total_construction_area = data.land_size_sqm * data.emsal
    estimated_apartments = int(total_construction_area / 100)
    total_construction_cost = total_construction_area * data.construction_cost_per_sqm
    estimated_project_value = total_construction_cost * 1.5
    potential_profit = estimated_project_value - total_construction_cost
    roi_percentage = (potential_profit / total_construction_cost) * 100 if total_construction_cost > 0 else 0
    return InvestmentResult(
        total_construction_area=total_construction_area,
        estimated_apartments=estimated_apartments,
        total_construction_cost=total_construction_cost,
        estimated_project_value=estimated_project_value,
        potential_profit=potential_profit,
        roi_percentage=round(roi_percentage, 2)
    )


# ============= MEGA PROJECTS ADMIN =============

@router.post("/admin/mega-projects")
async def create_mega_project(
    admin: dict = Depends(require_admin),
    name: str = Form(...), category: str = Form(...), description: str = Form(""),
    timeline: str = Form(""), location_lat: float = Form(41.0082), location_lng: float = Form(28.9784),
):
    project = {
        "id": str(uuid.uuid4()), "name": name, "category": category, "description": description,
        "timeline": timeline, "location": {"lat": location_lat, "lng": location_lng},
        "images": [], "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.mega_projects.insert_one(project)
    project.pop("_id", None)
    return project


@router.get("/mega-projects")
async def get_mega_projects():
    projects = await db.mega_projects.find({}, {"_id": 0}).limit(500).to_list(500)
    all_projects = await db.projects.find({}, {"_id": 0, "id": 1, "project_name": 1, "city": 1, "district": 1, "project_type": 1, "location": 1, "progress_percentage": 1}).limit(500).to_list(500)
    for p in all_projects:
        if p.get("location"):
            projects.append({
                "id": p["id"], "name": p.get("project_name", ""), "category": p.get("project_type", "TOKİ"),
                "description": f"{p.get('city','')} / {p.get('district','')}", "timeline": "",
                "location": p["location"], "images": [], "from_projects": True,
                "progress_percentage": p.get("progress_percentage", 0),
            })
    return projects


@router.put("/admin/mega-projects/{project_id}")
async def update_mega_project(
    project_id: str, admin: dict = Depends(require_admin),
    name: str = Form(...), category: str = Form(...), description: str = Form(""),
    timeline: str = Form(""), location_lat: float = Form(41.0082), location_lng: float = Form(28.9784),
):
    result = await db.mega_projects.update_one({"id": project_id}, {"$set": {
        "name": name, "category": category, "description": description,
        "timeline": timeline, "location": {"lat": location_lat, "lng": location_lng},
    }})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return await db.mega_projects.find_one({"id": project_id}, {"_id": 0})


@router.delete("/admin/mega-projects/{project_id}")
async def delete_mega_project(project_id: str, admin: dict = Depends(require_admin)):
    result = await db.mega_projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}


# ============= e-IPAT (LAND PARCELS) ADMIN =============

@router.post("/admin/land-parcels")
async def create_land_parcel(
    admin: dict = Depends(require_admin),
    city: str = Form(...), district: str = Form(...), neighborhood: str = Form(""),
    ada: str = Form(...), parsel: str = Form(...), size_sqm: float = Form(0),
    zoning_info: str = Form(""), development_potential: str = Form(""),
    location_lat: float = Form(41.0082), location_lng: float = Form(28.9784),
):
    parcel = {
        "id": str(uuid.uuid4()), "city": city, "district": district, "neighborhood": neighborhood,
        "ada": ada, "parsel": parsel, "size_sqm": size_sqm, "zoning_info": zoning_info,
        "development_potential": development_potential, "location": {"lat": location_lat, "lng": location_lng},
        "documents": [], "images": [], "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.land_parcels.insert_one(parcel)
    parcel.pop("_id", None)
    return parcel


@router.get("/land-parcels")
async def get_land_parcels(city: Optional[str] = None, district: Optional[str] = None):
    query = {}
    if city: query["city"] = {"$regex": city, "$options": "i"}
    if district: query["district"] = {"$regex": district, "$options": "i"}
    return await db.land_parcels.find(query, {"_id": 0}).limit(500).to_list(500)


@router.put("/admin/land-parcels/{parcel_id}")
async def update_land_parcel(
    parcel_id: str, admin: dict = Depends(require_admin),
    city: str = Form(...), district: str = Form(...), neighborhood: str = Form(""),
    ada: str = Form(...), parsel: str = Form(...), size_sqm: float = Form(0),
    zoning_info: str = Form(""), development_potential: str = Form(""),
    location_lat: float = Form(41.0082), location_lng: float = Form(28.9784),
):
    result = await db.land_parcels.update_one({"id": parcel_id}, {"$set": {
        "city": city, "district": district, "neighborhood": neighborhood,
        "ada": ada, "parsel": parsel, "size_sqm": size_sqm, "zoning_info": zoning_info,
        "development_potential": development_potential, "location": {"lat": location_lat, "lng": location_lng},
    }})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return await db.land_parcels.find_one({"id": parcel_id}, {"_id": 0})


@router.delete("/admin/land-parcels/{parcel_id}")
async def delete_land_parcel(parcel_id: str, admin: dict = Depends(require_admin)):
    result = await db.land_parcels.delete_one({"id": parcel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}


# ============= SEO SETTINGS =============

SEO_PAGES = [
    {"id": "home",           "page_name": "Ana Sayfa",          "path": "/"},
    {"id": "e-konut",        "page_name": "e-Konut Projeleri",  "path": "/toki"},
    {"id": "mega-projects",  "page_name": "Mega Projeler",      "path": "/mega-projects"},
    {"id": "ipat",           "page_name": "e-İPAT Arsa Analizi","path": "/ipar"},
    {"id": "egitim",         "page_name": "Eğitim Platformu",   "path": "/egitim"},
    {"id": "topluluk",       "page_name": "Topluluk Forumu",    "path": "/topluluk"},
    {"id": "yatirim-fonu",   "page_name": "Yatırım Fonu",       "path": "/yatirim-fonu"},
]

SEO_PAGE_CONTEXTS = {
    "home":          "mrxakademi - Türkiye'nin lider PropTech platformu.",
    "e-konut":       "e-Konut / TOKİ projeleri sayfası.",
    "mega-projects": "Türkiye'nin mega altyapı projeleri interaktif haritası.",
    "ipat":          "e-İPAT ada parsel sorgulama ve analiz aracı.",
    "egitim":        "Gayrimenkul ve yatırım eğitim platformu.",
    "topluluk":      "mrxakademi gayrimenkul yatırımcıları topluluğu.",
    "yatirim-fonu":  "Kurumsal ve bireysel gayrimenkul yatırım fonu fırsatları.",
}


@router.get("/seo")
async def get_all_seo_public():
    docs = await db.seo_settings.find({}, {"_id": 0}).to_list(50)
    return {d["page_id"]: d for d in docs}


@router.get("/admin/seo")
async def get_all_seo_admin(admin: dict = Depends(require_admin)):
    docs = await db.seo_settings.find({}, {"_id": 0}).to_list(50)
    existing = {d["page_id"] for d in docs}
    for page in SEO_PAGES:
        if page["id"] not in existing:
            default = {
                "page_id": page["id"], "page_name": page["page_name"], "path": page["path"],
                "title": f"{page['page_name']} | mrxakademi", "description": "",
                "keywords": "", "og_title": f"{page['page_name']} | mrxakademi",
                "og_description": "", "og_image": "", "robots": "index,follow",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.seo_settings.insert_one(default)
            default.pop("_id", None)
            docs.append(default)
    for d in docs:
        d.pop("_id", None)
    return docs


@router.put("/admin/seo/{page_id}")
async def update_seo(page_id: str, body: dict, admin: dict = Depends(require_admin)):
    body.pop("_id", None)
    body["page_id"] = page_id
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.seo_settings.update_one({"page_id": page_id}, {"$set": body}, upsert=True)
    body.pop("_id", None)
    return body


@router.post("/admin/seo/generate/{page_id}")
async def generate_seo_ai(page_id: str, admin: dict = Depends(require_admin)):
    import os
    llm_key = os.environ.get("EMERGENT_LLM_KEY")
    if not llm_key:
        raise HTTPException(status_code=500, detail="LLM key bulunamadı")
    context = SEO_PAGE_CONTEXTS.get(page_id, f"mrxakademi {page_id} sayfası")
    prompt = f"""Aşağıdaki sayfa için Türkçe SEO metaları üret.\nSayfa bağlamı: {context}\nSADECE geçerli JSON döndür:\n{{"title": "","description": "","keywords": "","og_title": "","og_description": ""}}"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage as LlmUM
        chat = LlmChat(api_key=llm_key, session_id=f"seo_{page_id}_{uuid.uuid4()}", system_message="Sen bir SEO uzmanısın. Sadece geçerli JSON döndür.").with_model("anthropic", "claude-sonnet-4-5-20250929")
        raw = await chat.send_message(LlmUM(text=prompt))
        raw = raw.strip()
        if "```json" in raw: raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw: raw = raw.split("```")[1].split("```")[0].strip()
        return json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI SEO üretim hatası: {str(e)}")


# ============= EDUCATION SYSTEM =============

@router.get("/education/courses")
async def list_edu_courses():
    return await db.courses.find({"status": "active"}, {"_id": 0}).sort("order", 1).limit(500).to_list(500)


@router.get("/courses")
async def get_courses():
    return await db.courses.find({}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)


@router.get("/education/courses/{course_id}")
async def get_edu_course(course_id: str):
    c = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not c: raise HTTPException(status_code=404, detail="Kurs bulunamadı")
    return c


@router.get("/education/seminars")
async def list_edu_seminars():
    return await db.seminars.find({"status": "active"}, {"_id": 0}).sort("date", -1).limit(500).to_list(500)


@router.get("/seminars")
async def get_seminars():
    return await db.seminars.find({}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)


@router.post("/education/seminars/{seminar_id}/register")
async def register_for_seminar(seminar_id: str, data: SeminarRegistrationCreate):
    seminar = await db.seminars.find_one({"id": seminar_id})
    if not seminar: raise HTTPException(status_code=404, detail="Seminer bulunamadı")
    existing = await db.seminar_registrations.find_one({"seminar_id": seminar_id, "email": data.email})
    if existing: raise HTTPException(status_code=400, detail="Bu email ile zaten kayıt yapılmış")
    reg = {
        "id": str(uuid.uuid4()), "seminar_id": seminar_id,
        "seminar_title": seminar.get("title", ""),
        "name": data.name, "phone": data.phone, "email": data.email,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.seminar_registrations.insert_one(reg)
    reg.pop("_id", None)
    return {"message": "Kaydınız başarıyla alındı.", "registration": reg}


@router.get("/education/live")
async def get_live_training():
    live = await db.weekly_live.find_one({}, {"_id": 0})
    return live or {"title": "Haftalık Canlı Online Eğitim", "description": "Her hafta yatırımcılarla birlikte canlı analiz yapılır.", "day_of_week": "Çarşamba", "time": "20:00", "zoom_link": "", "status": "active", "archives": []}


@router.get("/education/page-settings")
async def get_edu_page_settings():
    return await db.edu_page_settings.find_one({}, {"_id": 0}) or {}


@router.get("/user/my-seminars")
async def get_my_seminars(request: Request):
    session = await get_session_user(request)
    if not session: raise HTTPException(status_code=401, detail="Giriş gerekli")
    return await db.seminar_registrations.find({"email": session["email"]}, {"_id": 0}).to_list(100)


@router.get("/admin/education/courses")
async def admin_list_courses(admin: dict = Depends(require_admin)):
    return await db.courses.find({}, {"_id": 0}).sort("order", 1).limit(500).to_list(500)


@router.post("/admin/education/courses")
async def admin_create_course(data: CourseCreate, admin: dict = Depends(require_admin)):
    c = {"id": str(uuid.uuid4()), "modules": [], "created_at": datetime.now(timezone.utc).isoformat(), **data.dict()}
    await db.courses.insert_one(c)
    c.pop("_id", None)
    return c


@router.put("/admin/education/courses/{course_id}")
async def admin_update_course(course_id: str, data: CourseCreate, admin: dict = Depends(require_admin)):
    upd = {k: v for k, v in data.dict().items()}
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.courses.update_one({"id": course_id}, {"$set": upd})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Kurs bulunamadı")
    return await db.courses.find_one({"id": course_id}, {"_id": 0})


@router.delete("/admin/education/courses/{course_id}")
async def admin_delete_course(course_id: str, admin: dict = Depends(require_admin)):
    await db.courses.delete_one({"id": course_id})
    return {"message": "Silindi"}


@router.post("/admin/education/courses/{course_id}/modules")
async def admin_add_module(course_id: str, data: CourseModuleCreate, admin: dict = Depends(require_admin)):
    module = {"module_id": str(uuid.uuid4()), "title": data.title, "order": data.order, "lessons": []}
    result = await db.courses.update_one({"id": course_id}, {"$push": {"modules": module}})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Kurs bulunamadı")
    return module


@router.put("/admin/education/courses/{course_id}/modules/{module_id}")
async def admin_update_module(course_id: str, module_id: str, data: CourseModuleCreate, admin: dict = Depends(require_admin)):
    await db.courses.update_one(
        {"id": course_id, "modules.module_id": module_id},
        {"$set": {"modules.$.title": data.title, "modules.$.order": data.order}}
    )
    return {"message": "Güncellendi"}


@router.delete("/admin/education/courses/{course_id}/modules/{module_id}")
async def admin_delete_module(course_id: str, module_id: str, admin: dict = Depends(require_admin)):
    await db.courses.update_one({"id": course_id}, {"$pull": {"modules": {"module_id": module_id}}})
    return {"message": "Silindi"}


@router.post("/admin/education/courses/{course_id}/modules/{module_id}/lessons")
async def admin_add_lesson(course_id: str, module_id: str, data: CourseLessonCreate, admin: dict = Depends(require_admin)):
    lesson = {"lesson_id": str(uuid.uuid4()), **data.dict()}
    await db.courses.update_one(
        {"id": course_id, "modules.module_id": module_id},
        {"$push": {"modules.$.lessons": lesson}}
    )
    return lesson


@router.delete("/admin/education/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}")
async def admin_delete_lesson(course_id: str, module_id: str, lesson_id: str, admin: dict = Depends(require_admin)):
    await db.courses.update_one(
        {"id": course_id, "modules.module_id": module_id},
        {"$pull": {"modules.$.lessons": {"lesson_id": lesson_id}}}
    )
    return {"message": "Silindi"}


@router.get("/admin/education/seminars")
async def admin_list_seminars(admin: dict = Depends(require_admin)):
    pipeline = [
        {"$sort": {"date": -1}}, {"$limit": 500},
        {"$lookup": {"from": "seminar_registrations", "localField": "id", "foreignField": "seminar_id", "as": "_regs"}},
        {"$addFields": {"registration_count": {"$size": "$_regs"}}},
        {"$project": {"_id": 0, "_regs": 0}},
    ]
    return await db.seminars.aggregate(pipeline).to_list(500)


@router.post("/admin/education/seminars")
async def admin_create_seminar(data: SeminarCreate, admin: dict = Depends(require_admin)):
    s = {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat(), **data.dict()}
    await db.seminars.insert_one(s)
    s.pop("_id", None)
    return s


@router.put("/admin/education/seminars/{seminar_id}")
async def admin_update_seminar(seminar_id: str, data: SeminarCreate, admin: dict = Depends(require_admin)):
    upd = {**data.dict(), "updated_at": datetime.now(timezone.utc).isoformat()}
    result = await db.seminars.update_one({"id": seminar_id}, {"$set": upd})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Seminer bulunamadı")
    return await db.seminars.find_one({"id": seminar_id}, {"_id": 0})


@router.delete("/admin/education/seminars/{seminar_id}")
async def admin_delete_seminar(seminar_id: str, admin: dict = Depends(require_admin)):
    await db.seminars.delete_one({"id": seminar_id})
    return {"message": "Silindi"}


@router.get("/admin/education/seminars/{seminar_id}/registrations")
async def admin_seminar_registrations(seminar_id: str, admin: dict = Depends(require_admin)):
    return await db.seminar_registrations.find({"seminar_id": seminar_id}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)


@router.get("/admin/education/live")
async def admin_get_live(admin: dict = Depends(require_admin)):
    return await db.weekly_live.find_one({}, {"_id": 0}) or {}


@router.put("/admin/education/live")
async def admin_update_live(data: LiveTrainingUpdate, admin: dict = Depends(require_admin)):
    upd = {**data.dict(), "updated_at": datetime.now(timezone.utc).isoformat()}
    existing = await db.weekly_live.find_one({})
    if existing:
        await db.weekly_live.update_one({}, {"$set": upd})
    else:
        await db.weekly_live.insert_one({"id": str(uuid.uuid4()), "archives": [], **upd})
    return await db.weekly_live.find_one({}, {"_id": 0})


@router.post("/admin/education/live/archives")
async def admin_add_archive(data: LiveArchiveCreate, admin: dict = Depends(require_admin)):
    archive = {"archive_id": str(uuid.uuid4()), **data.dict()}
    existing = await db.weekly_live.find_one({})
    if existing:
        await db.weekly_live.update_one({}, {"$push": {"archives": archive}})
    return archive


@router.delete("/admin/education/live/archives/{archive_id}")
async def admin_delete_archive(archive_id: str, admin: dict = Depends(require_admin)):
    await db.weekly_live.update_one({}, {"$pull": {"archives": {"archive_id": archive_id}}})
    return {"message": "Silindi"}


@router.post("/admin/education/media/upload")
async def upload_edu_media(file: UploadFile = File(...), folder: str = Form("genel"), admin: dict = Depends(require_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    storage_path = f"{APP_NAME}/education/media/{folder}/{uuid.uuid4()}.{ext}"
    data_bytes = await file.read()
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    put_object(storage_path, data_bytes, content_type)
    media_type = "image" if ext in ["jpg", "jpeg", "png", "gif", "webp"] else "video" if ext in ["mp4", "mov", "avi"] else "pdf" if ext == "pdf" else "other"
    record = {
        "id": str(uuid.uuid4()), "name": file.filename, "original_name": file.filename,
        "type": media_type, "ext": ext, "storage_path": storage_path,
        "size": len(data_bytes), "folder": folder,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.education_media.insert_one(record)
    record.pop("_id", None)
    return record


@router.get("/admin/education/media")
async def list_edu_media(folder: str = Query(""), search: str = Query(""), admin: dict = Depends(require_admin)):
    query = {}
    if folder: query["folder"] = folder
    if search: query["name"] = {"$regex": search, "$options": "i"}
    return await db.education_media.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)


@router.delete("/admin/education/media/{media_id}")
async def delete_edu_media(media_id: str, admin: dict = Depends(require_admin)):
    result = await db.education_media.delete_one({"id": media_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Medya bulunamadı")
    return {"message": "Silindi"}


@router.put("/admin/education/page-settings")
async def update_edu_page_settings(sections: List[Dict[str, Any]] = Body(...), admin: dict = Depends(require_admin)):
    await db.edu_page_settings.delete_many({})
    await db.edu_page_settings.insert_one({"sections": sections})
    return {"sections": sections}


@router.post("/admin/courses")
async def create_course_compat(admin: dict = Depends(require_admin), title: str = Form(...), description: str = Form(""), video_url: str = Form(""), duration_minutes: int = Form(0), thumbnail: str = Form("")):
    c = {"id": str(uuid.uuid4()), "title": title, "short_description": description, "full_description": "", "cover_image": thumbnail, "promo_video": video_url, "price": 0, "level": "başlangıç", "tags": [], "status": "active", "order": 0, "modules": [], "student_count": duration_minutes, "rating": 5.0, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.courses.insert_one(c)
    c.pop("_id", None)
    return c


@router.delete("/admin/courses/{course_id}")
async def delete_course_compat(course_id: str, admin: dict = Depends(require_admin)):
    await db.courses.delete_one({"id": course_id})
    return {"message": "Deleted"}


@router.post("/admin/seminars")
async def create_seminar_compat(admin: dict = Depends(require_admin), title: str = Form(...), description: str = Form(""), speaker: str = Form(""), date: str = Form(""), registration_link: str = Form(""), thumbnail: str = Form("")):
    s = {"id": str(uuid.uuid4()), "title": title, "description": description, "speaker": speaker, "date": date, "zoom_link": registration_link, "cover_image": thumbnail, "seminar_type": "free", "time": "", "duration": "", "location": "", "status": "active", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.seminars.insert_one(s)
    s.pop("_id", None)
    return s


@router.delete("/admin/seminars/{seminar_id}")
async def delete_seminar_compat(seminar_id: str, admin: dict = Depends(require_admin)):
    await db.seminars.delete_one({"id": seminar_id})
    return {"message": "Deleted"}


# ============= COMMUNITY ADMIN =============

@router.post("/community/posts")
async def create_post(title: str = Form(...), content: str = Form(...), category: str = Form("tartışma")):
    post = {
        "id": str(uuid.uuid4()), "author_email": "anonymous@proptech.com",
        "title": title, "content": content, "category": category,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.community_posts.insert_one(post)
    post.pop("_id", None)
    return post


@router.get("/community/posts")
async def get_posts(category: Optional[str] = None):
    query = {} if not category else {"category": category}
    return await db.community_posts.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)


@router.delete("/admin/community/posts/{post_id}")
async def delete_post(post_id: str, admin: dict = Depends(require_admin)):
    result = await db.community_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}


# ============= LAND OPPORTUNITIES ADMIN =============

@router.post("/admin/opportunities")
async def create_opportunity(
    admin: dict = Depends(require_admin),
    location_text: str = Form(...), parcel_size_sqm: float = Form(0), zoning_type: str = Form(""),
    investment_potential: str = Form("orta"), risk_score: int = Form(5),
    development_potential: str = Form(""), price_per_sqm: float = Form(0),
    location_lat: float = Form(41.0082), location_lng: float = Form(28.9784),
):
    opp = {
        "id": str(uuid.uuid4()), "location": location_text, "parcel_size_sqm": parcel_size_sqm,
        "zoning_type": zoning_type, "investment_potential": investment_potential,
        "risk_score": risk_score, "development_potential": development_potential,
        "price_per_sqm": price_per_sqm if price_per_sqm > 0 else None,
        "location_coords": {"lat": location_lat, "lng": location_lng},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.land_opportunities.insert_one(opp)
    opp.pop("_id", None)
    return opp


@router.get("/opportunities")
async def get_opportunities():
    return await db.land_opportunities.find({}, {"_id": 0}).limit(500).to_list(500)


@router.delete("/admin/opportunities/{opp_id}")
async def delete_opportunity(opp_id: str, admin: dict = Depends(require_admin)):
    result = await db.land_opportunities.delete_one({"id": opp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}


# ============= MARKET DATA ADMIN =============

@router.post("/admin/market-data")
async def create_market_data(
    admin: dict = Depends(require_admin),
    neighborhood: str = Form(...), city: str = Form(...), district: str = Form(""),
    avg_price_per_sqm: float = Form(0), price_change_percentage: float = Form(0),
    data_date: str = Form(""),
):
    data_item = {
        "id": str(uuid.uuid4()), "neighborhood": neighborhood, "city": city,
        "district": district, "avg_price_per_sqm": avg_price_per_sqm,
        "price_change_percentage": price_change_percentage, "data_date": data_date,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.market_data.insert_one(data_item)
    data_item.pop("_id", None)
    return data_item


@router.get("/market-data")
async def get_market_data(city: Optional[str] = None):
    query = {} if not city else {"city": {"$regex": city, "$options": "i"}}
    return await db.market_data.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)


@router.delete("/admin/market-data/{data_id}")
async def delete_market_data(data_id: str, admin: dict = Depends(require_admin)):
    result = await db.market_data.delete_one({"id": data_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}


# ============= YATIRIM FONU =============

class YatirimFonuBasvuruCreate(BaseModel):
    ad_soyad: str
    telefon: str
    email: str
    sehir: str = ""
    meslek: str = ""
    yatirim_butcesi: str
    ilgi_duyulan_bolge: str
    yatirim_suresi: str
    aciklama: str = ""
    genel_bilgilendirme_onay: bool = False
    iletisim_onay: bool = False


class BeklemeListesiCreate(BaseModel):
    ad_soyad: str
    telefon_veya_email: str


@router.post("/yatirim-fonu/basvuru")
async def create_yatirim_fonu_basvuru(data: YatirimFonuBasvuruCreate):
    basvuru = {"id": str(uuid.uuid4()), **data.dict(), "created_at": datetime.now(timezone.utc).isoformat(), "status": "pending"}
    await db.yatirim_fonu_basvurulari.insert_one(basvuru)
    basvuru.pop("_id", None)
    return {"message": "Başvurunuz alınmıştır.", "id": basvuru["id"]}


@router.post("/yatirim-fonu/bekleme-listesi")
async def join_bekleme_listesi(data: BeklemeListesiCreate):
    kayit = {"id": str(uuid.uuid4()), **data.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.yatirim_fonu_bekleme.insert_one(kayit)
    kayit.pop("_id", None)
    return {"message": "Bekleme listesine eklendiniz.", "id": kayit["id"]}


@router.get("/admin/yatirim-fonu/basvurular")
async def get_yatirim_fonu_basvurulari(admin: dict = Depends(require_admin)):
    return await db.yatirim_fonu_basvurulari.find({}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)


@router.get("/admin/yatirim-fonu/bekleme-listesi")
async def get_bekleme_listesi_admin(admin: dict = Depends(require_admin)):
    return await db.yatirim_fonu_bekleme.find({}, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)


# ============= ADMIN STATS =============

@router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    return {
        "projects": await db.projects.count_documents({}),
        "land_parcels": await db.land_parcels.count_documents({}),
        "mega_projects": await db.mega_projects.count_documents({}),
        "courses": await db.courses.count_documents({}),
        "seminars": await db.seminars.count_documents({}),
        "community_posts": await db.community_posts.count_documents({}),
        "opportunities": await db.land_opportunities.count_documents({}),
        "market_data": await db.market_data.count_documents({}),
        "app_users": await db.app_users.count_documents({}),
    }
