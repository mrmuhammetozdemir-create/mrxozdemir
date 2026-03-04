from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import os
import uuid
import logging
import io
import json
import requests
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "proptech-turkey"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "pdf": "application/pdf",
    "json": "application/json", "csv": "text/csv", "txt": "text/plain",
    "doc": "application/msword", "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel", "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "kml": "application/vnd.google-earth.kml+xml", "kmz": "application/vnd.google-earth.kmz",
    "geojson": "application/geo+json",
}

app = FastAPI(title="PropTech Turkey API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= HELPERS =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============= MODELS =============

class UserLogin(BaseModel):
    email: EmailStr
    password: str

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

# ============= AUTH =============

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": credentials.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"email": user["email"], "full_name": user.get("full_name", ""), "role": user["role"]}
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ============= PROJECTS CRUD =============

PROJECT_TYPES = ["TOKİ", "Emlak Konut", "Özel Proje", "Kamu Projesi"]

@api_router.post("/admin/projects")
async def create_project(
    admin: dict = Depends(require_admin),
    project_name: str = Form(...),
    city: str = Form(...),
    district: str = Form(...),
    neighborhood: str = Form(""),
    description: str = Form(""),
    project_type: str = Form("TOKİ"),
    total_housing: int = Form(0),
    commercial_count: int = Form(0),
    school_count: int = Form(0),
    mosque_count: int = Form(0),
    social_facility_count: int = Form(0),
    project_area_sqm: float = Form(0),
    start_date: str = Form(""),
    planned_end_date: str = Form(""),
    progress_percentage: int = Form(0),
    location_lat: float = Form(41.0082),
    location_lng: float = Form(28.9784),
):
    project = {
        "id": str(uuid.uuid4()),
        "project_name": project_name,
        "city": city,
        "district": district,
        "neighborhood": neighborhood,
        "description": description,
        "project_type": project_type,
        "total_housing": total_housing,
        "commercial_count": commercial_count,
        "school_count": school_count,
        "mosque_count": mosque_count,
        "social_facility_count": social_facility_count,
        "project_area_sqm": project_area_sqm,
        "start_date": start_date,
        "planned_end_date": planned_end_date,
        "progress_percentage": progress_percentage,
        "location": {"lat": location_lat, "lng": location_lng},
        "youtube_videos": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.projects.insert_one(project)
    project.pop("_id", None)
    return project

@api_router.get("/projects")
async def get_projects(city: Optional[str] = None, district: Optional[str] = None, project_name: Optional[str] = None, project_type: Optional[str] = None):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if project_name:
        query["project_name"] = {"$regex": project_name, "$options": "i"}
    if project_type:
        query["project_type"] = project_type
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@api_router.put("/admin/projects/{project_id}")
async def update_project(
    project_id: str,
    admin: dict = Depends(require_admin),
    project_name: str = Form(...),
    city: str = Form(...),
    district: str = Form(...),
    neighborhood: str = Form(""),
    description: str = Form(""),
    project_type: str = Form("TOKİ"),
    total_housing: int = Form(0),
    commercial_count: int = Form(0),
    school_count: int = Form(0),
    mosque_count: int = Form(0),
    social_facility_count: int = Form(0),
    project_area_sqm: float = Form(0),
    start_date: str = Form(""),
    planned_end_date: str = Form(""),
    progress_percentage: int = Form(0),
    location_lat: float = Form(41.0082),
    location_lng: float = Form(28.9784),
):
    update_data = {
        "project_name": project_name, "city": city, "district": district,
        "neighborhood": neighborhood, "description": description, "project_type": project_type,
        "total_housing": total_housing, "commercial_count": commercial_count,
        "school_count": school_count, "mosque_count": mosque_count,
        "social_facility_count": social_facility_count, "project_area_sqm": project_area_sqm,
        "start_date": start_date, "planned_end_date": planned_end_date,
        "progress_percentage": progress_percentage,
        "location": {"lat": location_lat, "lng": location_lng},
    }
    result = await db.projects.update_one({"id": project_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return project

@api_router.delete("/admin/projects/{project_id}")
async def delete_project(project_id: str, admin: dict = Depends(require_admin)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    # Clean up related data
    await db.project_adas.delete_many({"project_id": project_id})
    await db.project_parsels.delete_many({"project_id": project_id})
    await db.project_media.delete_many({"project_id": project_id})
    await db.project_documents.delete_many({"project_id": project_id})
    await db.project_map_layers.delete_many({"project_id": project_id})
    return {"message": "Project deleted"}

# ============= ADA (BLOCK) CRUD =============

@api_router.post("/admin/projects/{project_id}/adas")
async def create_ada(project_id: str, admin: dict = Depends(require_admin), ada_no: str = Form(...), description: str = Form("")):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    existing = await db.project_adas.find_one({"project_id": project_id, "ada_no": ada_no})
    if existing:
        raise HTTPException(status_code=400, detail=f"Ada {ada_no} already exists in this project")
    ada = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "ada_no": ada_no,
        "description": description,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.project_adas.insert_one(ada)
    ada.pop("_id", None)
    return ada

@api_router.get("/projects/{project_id}/adas")
async def get_adas(project_id: str):
    adas = await db.project_adas.find({"project_id": project_id}, {"_id": 0}).sort("ada_no", 1).to_list(1000)
    return adas

@api_router.put("/admin/adas/{ada_id}")
async def update_ada(ada_id: str, admin: dict = Depends(require_admin), ada_no: str = Form(...), description: str = Form("")):
    result = await db.project_adas.update_one({"id": ada_id}, {"$set": {"ada_no": ada_no, "description": description}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ada not found")
    ada = await db.project_adas.find_one({"id": ada_id}, {"_id": 0})
    return ada

@api_router.delete("/admin/adas/{ada_id}")
async def delete_ada(ada_id: str, admin: dict = Depends(require_admin)):
    ada = await db.project_adas.find_one({"id": ada_id})
    if not ada:
        raise HTTPException(status_code=404, detail="Ada not found")
    await db.project_adas.delete_one({"id": ada_id})
    await db.project_parsels.delete_many({"ada_id": ada_id})
    return {"message": "Ada and its parcels deleted"}

# ============= PARSEL (PARCEL) CRUD =============

@api_router.post("/admin/adas/{ada_id}/parsels")
async def create_parsel(ada_id: str, admin: dict = Depends(require_admin), parsel_no: str = Form(...), area_sqm: float = Form(0), note: str = Form("")):
    ada = await db.project_adas.find_one({"id": ada_id})
    if not ada:
        raise HTTPException(status_code=404, detail="Ada not found")
    parsel = {
        "id": str(uuid.uuid4()),
        "project_id": ada["project_id"],
        "ada_id": ada_id,
        "parsel_no": parsel_no,
        "area_sqm": area_sqm if area_sqm > 0 else None,
        "note": note,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.project_parsels.insert_one(parsel)
    parsel.pop("_id", None)
    return parsel

@api_router.get("/projects/{project_id}/parsels")
async def get_parsels(project_id: str):
    parsels = await db.project_parsels.find({"project_id": project_id}, {"_id": 0}).to_list(10000)
    return parsels

@api_router.put("/admin/parsels/{parsel_id}")
async def update_parsel(parsel_id: str, admin: dict = Depends(require_admin), parsel_no: str = Form(...), area_sqm: float = Form(0), note: str = Form("")):
    result = await db.project_parsels.update_one({"id": parsel_id}, {"$set": {"parsel_no": parsel_no, "area_sqm": area_sqm if area_sqm > 0 else None, "note": note}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Parsel not found")
    parsel = await db.project_parsels.find_one({"id": parsel_id}, {"_id": 0})
    return parsel

@api_router.delete("/admin/parsels/{parsel_id}")
async def delete_parsel(parsel_id: str, admin: dict = Depends(require_admin)):
    result = await db.project_parsels.delete_one({"id": parsel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Parsel not found")
    return {"message": "Parsel deleted"}

# ============= EXCEL IMPORT =============

@api_router.post("/admin/projects/{project_id}/import-excel")
async def import_excel(project_id: str, file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ("xlsx", "xls", "csv"):
        raise HTTPException(status_code=400, detail="Only xlsx, xls, csv files are supported")

    content = await file.read()
    errors = []
    success_count = 0

    try:
        if ext == "csv":
            import csv
            reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
            rows = list(reader)
        else:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            ws = wb.active
            headers = [str(cell.value or "").strip() for cell in ws[1]]
            rows = []
            for row in ws.iter_rows(min_row=2, values_only=True):
                row_dict = {}
                for i, val in enumerate(row):
                    if i < len(headers):
                        row_dict[headers[i]] = val
                rows.append(row_dict)

        for idx, row in enumerate(rows, start=2):
            ada_no = str(row.get("Ada", "") or "").strip()
            parsel_no = str(row.get("Parsel", "") or "").strip()
            area_str = row.get("Alan_m2", "")
            note = str(row.get("Not", "") or "").strip()

            if not ada_no or not parsel_no:
                errors.append({"row": idx, "error": "Ada veya Parsel boş"})
                continue

            area_sqm = None
            if area_str:
                try:
                    area_sqm = float(area_str)
                except (ValueError, TypeError):
                    errors.append({"row": idx, "error": f"Geçersiz alan değeri: {area_str}"})
                    continue

            # Find or create ada
            ada = await db.project_adas.find_one({"project_id": project_id, "ada_no": ada_no})
            if not ada:
                ada = {
                    "id": str(uuid.uuid4()),
                    "project_id": project_id,
                    "ada_no": ada_no,
                    "description": "",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                await db.project_adas.insert_one(ada)

            ada_id = ada["id"]
            parsel = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "ada_id": ada_id,
                "parsel_no": parsel_no,
                "area_sqm": area_sqm,
                "note": note,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.project_parsels.insert_one(parsel)
            success_count += 1

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File processing error: {str(e)}")

    return {"success_count": success_count, "error_count": len(errors), "errors": errors}

@api_router.get("/admin/excel-template")
async def download_excel_template():
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Ada-Parsel"
    ws.append(["Ada", "Parsel", "Alan_m2", "Not"])
    ws.append(["33", "1", "500", "Örnek not"])
    ws.append(["33", "2", "750", ""])
    ws.append(["34", "7", "1200", "Köşe parsel"])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ada_parsel_sablonu.xlsx"}
    )

# ============= MEDIA MANAGEMENT =============

MEDIA_CATEGORIES = ["Altyapı", "Blok Resimleri", "Peyzaj", "Zemin", "Drone", "Master Plan"]

@api_router.post("/admin/projects/{project_id}/media")
async def upload_media(project_id: str, file: UploadFile = File(...), category: str = Form(...), admin: dict = Depends(require_admin)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    storage_path = f"{APP_NAME}/media/{project_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    put_object(storage_path, data, content_type)

    media = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "category": category,
        "storage_path": storage_path,
        "original_filename": file.filename,
        "content_type": content_type,
        "size": len(data),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.project_media.insert_one(media)
    media.pop("_id", None)
    return media

@api_router.get("/projects/{project_id}/media")
async def get_project_media(project_id: str, category: Optional[str] = None):
    query = {"project_id": project_id}
    if category:
        query["category"] = category
    media = await db.project_media.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return media

@api_router.delete("/admin/media/{media_id}")
async def delete_media(media_id: str, admin: dict = Depends(require_admin)):
    result = await db.project_media.delete_one({"id": media_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"message": "Media deleted"}

# ============= DOCUMENT MANAGEMENT =============

DOC_TYPES = ["Zemin Etüt", "Jeoloji / Jeoteknik", "ÇED", "İhale Belgeleri", "Plan Notları", "Vaziyet Planı", "Diğer"]

@api_router.post("/admin/projects/{project_id}/documents")
async def upload_document(project_id: str, file: UploadFile = File(...), title: str = Form(...), doc_type: str = Form(...), admin: dict = Depends(require_admin)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    storage_path = f"{APP_NAME}/documents/{project_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    put_object(storage_path, data, content_type)

    doc = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "title": title,
        "doc_type": doc_type,
        "storage_path": storage_path,
        "original_filename": file.filename,
        "content_type": content_type,
        "size": len(data),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.project_documents.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/projects/{project_id}/documents")
async def get_project_documents(project_id: str):
    docs = await db.project_documents.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.delete("/admin/documents/{doc_id}")
async def delete_document(doc_id: str, admin: dict = Depends(require_admin)):
    result = await db.project_documents.delete_one({"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}

# ============= VIDEO MANAGEMENT =============

@api_router.post("/admin/projects/{project_id}/videos")
async def add_video(project_id: str, admin: dict = Depends(require_admin), youtube_url: str = Form(...)):
    result = await db.projects.update_one({"id": project_id}, {"$push": {"youtube_videos": youtube_url}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Video added"}

@api_router.delete("/admin/projects/{project_id}/videos")
async def remove_video(project_id: str, admin: dict = Depends(require_admin), youtube_url: str = Form(...)):
    result = await db.projects.update_one({"id": project_id}, {"$pull": {"youtube_videos": youtube_url}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Video removed"}

# ============= MAP LAYERS =============

@api_router.post("/admin/projects/{project_id}/map-layers")
async def upload_map_layer(project_id: str, file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ("kml", "kmz", "geojson", "json"):
        raise HTTPException(status_code=400, detail="Only KML, KMZ, GeoJSON files are supported")

    storage_path = f"{APP_NAME}/map-layers/{project_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    put_object(storage_path, data, content_type)

    layer = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "storage_path": storage_path,
        "original_filename": file.filename,
        "content_type": content_type,
        "file_type": ext.upper(),
        "size": len(data),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.project_map_layers.insert_one(layer)
    layer.pop("_id", None)
    return layer

@api_router.get("/projects/{project_id}/map-layers")
async def get_map_layers(project_id: str):
    layers = await db.project_map_layers.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    return layers

@api_router.delete("/admin/map-layers/{layer_id}")
async def delete_map_layer(layer_id: str, admin: dict = Depends(require_admin)):
    result = await db.project_map_layers.delete_one({"id": layer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Map layer not found")
    return {"message": "Map layer deleted"}

# ============= FILE SERVING =============

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

# ============= MAP LAYER DATA (GeoJSON content) =============

@api_router.get("/projects/{project_id}/map-layers/{layer_id}/data")
async def get_map_layer_data(project_id: str, layer_id: str):
    layer = await db.project_map_layers.find_one({"id": layer_id, "project_id": project_id}, {"_id": 0})
    if not layer:
        raise HTTPException(status_code=404, detail="Map layer not found")
    try:
        data, _ = get_object(layer["storage_path"])
        if layer["file_type"] in ("GEOJSON", "JSON"):
            return json.loads(data)
        return Response(content=data, media_type=layer["content_type"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cannot read layer: {str(e)}")

# ============= BACKWARD COMPAT: TOKI ENDPOINTS =============

@api_router.get("/toki/projects")
async def get_toki_projects(city: Optional[str] = None, district: Optional[str] = None, project_name: Optional[str] = None):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if project_name:
        query["project_name"] = {"$regex": project_name, "$options": "i"}
    # Search in both old and new collections
    projects_old = await db.toki_projects.find(query, {"_id": 0}).to_list(1000)
    projects_new = await db.projects.find(query, {"_id": 0}).to_list(1000)
    return projects_old + projects_new

@api_router.get("/toki/projects/{project_id}")
async def get_toki_project(project_id: str):
    project = await db.toki_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# ============= INVESTMENT CALCULATOR =============

@api_router.post("/investment/calculate", response_model=InvestmentResult)
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

@api_router.post("/admin/mega-projects")
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

@api_router.get("/mega-projects")
async def get_mega_projects():
    projects = await db.mega_projects.find({}, {"_id": 0}).to_list(1000)
    # Also include all projects from projects collection (auto-map)
    all_projects = await db.projects.find({}, {"_id": 0, "id": 1, "project_name": 1, "city": 1, "district": 1, "project_type": 1, "location": 1, "progress_percentage": 1}).to_list(1000)
    for p in all_projects:
        if p.get("location"):
            projects.append({
                "id": p["id"], "name": p.get("project_name", ""), "category": p.get("project_type", "TOKİ"),
                "description": f"{p.get('city','')} / {p.get('district','')}", "timeline": "",
                "location": p["location"], "images": [], "from_projects": True,
                "progress_percentage": p.get("progress_percentage", 0),
            })
    return projects

@api_router.put("/admin/mega-projects/{project_id}")
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
    project = await db.mega_projects.find_one({"id": project_id}, {"_id": 0})
    return project

@api_router.delete("/admin/mega-projects/{project_id}")
async def delete_mega_project(project_id: str, admin: dict = Depends(require_admin)):
    result = await db.mega_projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# ============= e-IPAT (LAND PARCELS) ADMIN =============

@api_router.post("/admin/land-parcels")
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

@api_router.get("/land-parcels")
async def get_land_parcels(city: Optional[str] = None, district: Optional[str] = None):
    query = {}
    if city: query["city"] = {"$regex": city, "$options": "i"}
    if district: query["district"] = {"$regex": district, "$options": "i"}
    parcels = await db.land_parcels.find(query, {"_id": 0}).to_list(1000)
    return parcels

@api_router.put("/admin/land-parcels/{parcel_id}")
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
    p = await db.land_parcels.find_one({"id": parcel_id}, {"_id": 0})
    return p

@api_router.delete("/admin/land-parcels/{parcel_id}")
async def delete_land_parcel(parcel_id: str, admin: dict = Depends(require_admin)):
    result = await db.land_parcels.delete_one({"id": parcel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# ============= EDUCATION ADMIN =============

@api_router.post("/admin/courses")
async def create_course(
    admin: dict = Depends(require_admin),
    title: str = Form(...), description: str = Form(""), video_url: str = Form(""),
    duration_minutes: int = Form(0), thumbnail: str = Form(""),
):
    course = {
        "id": str(uuid.uuid4()), "title": title, "description": description,
        "video_url": video_url, "duration_minutes": duration_minutes, "thumbnail": thumbnail,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.courses.insert_one(course)
    course.pop("_id", None)
    return course

@api_router.get("/courses")
async def get_courses():
    return await db.courses.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.delete("/admin/courses/{course_id}")
async def delete_course(course_id: str, admin: dict = Depends(require_admin)):
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

@api_router.post("/admin/seminars")
async def create_seminar(
    admin: dict = Depends(require_admin),
    title: str = Form(...), description: str = Form(""), speaker: str = Form(""),
    date: str = Form(""), registration_link: str = Form(""), thumbnail: str = Form(""),
):
    seminar = {
        "id": str(uuid.uuid4()), "title": title, "description": description,
        "speaker": speaker, "date": date, "registration_link": registration_link,
        "thumbnail": thumbnail, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.seminars.insert_one(seminar)
    seminar.pop("_id", None)
    return seminar

@api_router.get("/seminars")
async def get_seminars():
    return await db.seminars.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.delete("/admin/seminars/{seminar_id}")
async def delete_seminar(seminar_id: str, admin: dict = Depends(require_admin)):
    result = await db.seminars.delete_one({"id": seminar_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# ============= COMMUNITY ADMIN =============

@api_router.post("/community/posts")
async def create_post(title: str = Form(...), content: str = Form(...), category: str = Form("tartışma")):
    post = {
        "id": str(uuid.uuid4()), "author_email": "anonymous@proptech.com",
        "title": title, "content": content, "category": category,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.community_posts.insert_one(post)
    post.pop("_id", None)
    return post

@api_router.get("/community/posts")
async def get_posts(category: Optional[str] = None):
    query = {} if not category else {"category": category}
    return await db.community_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.delete("/admin/community/posts/{post_id}")
async def delete_post(post_id: str, admin: dict = Depends(require_admin)):
    result = await db.community_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# ============= LAND OPPORTUNITIES ADMIN =============

@api_router.post("/admin/opportunities")
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

@api_router.get("/opportunities")
async def get_opportunities():
    return await db.land_opportunities.find({}, {"_id": 0}).to_list(1000)

@api_router.delete("/admin/opportunities/{opp_id}")
async def delete_opportunity(opp_id: str, admin: dict = Depends(require_admin)):
    result = await db.land_opportunities.delete_one({"id": opp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# ============= MARKET DATA ADMIN =============

@api_router.post("/admin/market-data")
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

@api_router.get("/market-data")
async def get_market_data(city: Optional[str] = None):
    query = {} if not city else {"city": {"$regex": city, "$options": "i"}}
    return await db.market_data.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.delete("/admin/market-data/{data_id}")
async def delete_market_data(data_id: str, admin: dict = Depends(require_admin)):
    result = await db.market_data.delete_one({"id": data_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# ============= ADMIN STATS =============

@api_router.get("/admin/stats")
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
    }

# ============= STARTUP =============

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Object Storage initialized successfully")
    except Exception as e:
        logger.error(f"Object Storage init failed: {e}")
    # Ensure admin user exists
    admin = await db.users.find_one({"email": "ipatarazi@gmail.com"})
    if not admin:
        await db.users.insert_one({
            "email": "ipatarazi@gmail.com",
            "full_name": "Admin",
            "password": hash_password("As537273"),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin user created")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
