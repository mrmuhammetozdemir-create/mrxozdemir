from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response, Request, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from emergentintegrations.llm.chat import LlmChat, UserMessage as LlmUserMessage
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
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

async def get_session_user(request: Request) -> Optional[dict]:
    """Get user from session cookie or Authorization header."""
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        return None
    user = await db.app_users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password": 0})
    return user

async def require_session_user(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============= MODELS =============

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    full_name: str
    phone: str = ""
    email: EmailStr
    password: str

class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    admin_note: Optional[str] = None
    tags: Optional[List[str]] = None

class MembershipUpdate(BaseModel):
    membership_plan: Optional[str] = None
    membership_start_at: Optional[str] = None
    membership_end_at: Optional[str] = None
    membership_active: Optional[bool] = None
    extend_days: Optional[int] = None

class PermissionsUpdate(BaseModel):
    permissions: Dict[str, str]

class NoteUpdate(BaseModel):
    admin_note: str = ""
    tags: List[str] = []

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

# ============= ADMIN AUTH =============

@api_router.post("/auth/login")
async def admin_login(credentials: UserLogin):
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
async def get_me(request: Request):
    # Try session cookie first (app users)
    session_user = await get_session_user(request)
    if session_user:
        return session_user
    # Try JWT bearer token (admin)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            payload = jwt.decode(auth[7:], SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if email:
                user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
                if user:
                    return user
        except JWTError:
            pass
    raise HTTPException(status_code=401, detail="Not authenticated")

# ============= USER REGISTRATION & LOGIN =============

@api_router.post("/auth/register")
async def register_user(data: UserRegister):
    existing = await db.app_users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id,
        "full_name": data.full_name,
        "phone": data.phone,
        "email": data.email,
        "password": hash_password(data.password),
        "role": "user",
        "auth_provider": "email",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.app_users.insert_one(user)
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    response = JSONResponse(content={
        "user": {"user_id": user_id, "full_name": data.full_name, "email": data.email, "role": "user"},
        "session_token": session_token,
    })
    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    return response

@api_router.post("/auth/user-login")
async def user_login(credentials: UserLogin):
    # Check app_users first
    user = await db.app_users.find_one({"email": credentials.email}, {"_id": 0})
    is_admin = False
    if not user:
        # Also check admin users collection
        admin = await db.users.find_one({"email": credentials.email}, {"_id": 0})
        if admin:
            user = admin
            is_admin = True
    if not user:
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    if not user.get("password"):
        raise HTTPException(status_code=401, detail="Bu hesap Google ile oluşturulmuş. Google ile giriş yapın.")
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    # Determine user_id
    user_id = user.get("user_id") or user.get("id") or f"user_{uuid.uuid4().hex[:12]}"
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    # Update last login & log activity
    await db.app_users.update_one({"user_id": user_id}, {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}})
    await db.activity_logs.insert_one({
        "log_id": str(uuid.uuid4()), "user_id": user_id, "action_type": "login",
        "metadata": {"auth_provider": "email", "email": credentials.email},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    role = user.get("role", "admin" if is_admin else "user")
    response_data = {
        "user": {"user_id": user_id, "full_name": user.get("full_name", ""), "email": user["email"], "role": role},
        "session_token": session_token,
    }
    # For admin users also return JWT access_token
    if is_admin:
        response_data["access_token"] = create_access_token({"sub": credentials.email})
    response = JSONResponse(content=response_data)
    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    return response

# ============= GOOGLE OAUTH =============

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

@api_router.post("/auth/google-session")
async def google_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    # Exchange session_id with Emergent Auth
    resp = requests.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id}, timeout=10)
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Google auth failed")
    google_data = resp.json()
    email = google_data.get("email")
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")
    # Find or create user
    existing = await db.app_users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.app_users.update_one({"user_id": user_id}, {"$set": {"full_name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.app_users.insert_one({
            "user_id": user_id,
            "full_name": name,
            "email": email,
            "phone": "",
            "password": None,
            "picture": picture,
            "role": "user",
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    response = JSONResponse(content={
        "user": {"user_id": user_id, "full_name": name, "email": email, "role": "user", "picture": picture},
        "session_token": session_token,
    })
    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    return response

@api_router.post("/auth/logout")
async def logout_user(request: Request):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token", path="/")
    return response

# ============= USER MANAGEMENT (ADMIN) =============

@api_router.get("/admin/app-users")
async def list_app_users(
    admin: dict = Depends(require_admin),
    search: str = Query(""), role: str = Query(""),
    plan: str = Query(""), status: str = Query(""),
    page: int = Query(1), limit: int = Query(20)
):
    query = {}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"user_id": {"$regex": search, "$options": "i"}},
        ]
    if role: query["role"] = role
    if plan: query["membership_plan"] = plan
    if status: query["status"] = status
    total = await db.app_users.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.app_users.find(query, {"_id": 0, "password": 0}).skip(skip).limit(limit).sort("created_at", -1)
    users = await cursor.to_list(length=limit)
    return {"users": users, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.get("/admin/app-users/{user_id}")
async def get_app_user(user_id: str, admin: dict = Depends(require_admin)):
    user = await db.app_users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return user

@api_router.put("/admin/app-users/{user_id}")
async def update_app_user(user_id: str, data: UserUpdateAdmin, admin: dict = Depends(require_admin)):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.app_users.update_one({"user_id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    user = await db.app_users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    return user

@api_router.put("/admin/app-users/{user_id}/status")
async def update_user_status(user_id: str, status: str = Query(...), admin: dict = Depends(require_admin)):
    if status not in ["active", "passive", "banned"]:
        raise HTTPException(status_code=400, detail="Geçersiz durum")
    await db.app_users.update_one(
        {"user_id": user_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await db.activity_logs.insert_one({
        "log_id": str(uuid.uuid4()), "user_id": user_id, "action_type": f"status_changed_{status}",
        "metadata": {"by_admin": admin.get("email"), "new_status": status},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": status}

@api_router.put("/admin/app-users/{user_id}/membership")
async def update_user_membership(user_id: str, data: MembershipUpdate, admin: dict = Depends(require_admin)):
    user = await db.app_users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.membership_plan is not None: update_data["membership_plan"] = data.membership_plan
    if data.membership_start_at is not None: update_data["membership_start_at"] = data.membership_start_at
    if data.membership_end_at is not None: update_data["membership_end_at"] = data.membership_end_at
    if data.membership_active is not None: update_data["membership_active"] = data.membership_active
    if data.extend_days:
        current_end = user.get("membership_end_at")
        try:
            end_dt = datetime.fromisoformat(current_end.replace("Z", "+00:00")) if current_end else datetime.now(timezone.utc)
        except Exception:
            end_dt = datetime.now(timezone.utc)
        if end_dt.tzinfo is None: end_dt = end_dt.replace(tzinfo=timezone.utc)
        update_data["membership_end_at"] = (end_dt + timedelta(days=data.extend_days)).isoformat()
    await db.app_users.update_one({"user_id": user_id}, {"$set": update_data})
    updated = await db.app_users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    return updated

@api_router.put("/admin/app-users/{user_id}/permissions")
async def update_user_permissions(user_id: str, data: PermissionsUpdate, admin: dict = Depends(require_admin)):
    await db.app_users.update_one(
        {"user_id": user_id},
        {"$set": {"permissions": data.permissions, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"permissions": data.permissions}

@api_router.put("/admin/app-users/{user_id}/note")
async def update_user_note(user_id: str, data: NoteUpdate, admin: dict = Depends(require_admin)):
    await db.app_users.update_one(
        {"user_id": user_id},
        {"$set": {"admin_note": data.admin_note, "tags": data.tags, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"admin_note": data.admin_note, "tags": data.tags}

@api_router.get("/admin/app-users/{user_id}/activity")
async def get_user_activity(
    user_id: str, admin: dict = Depends(require_admin),
    page: int = Query(1), limit: int = Query(20)
):
    query = {"user_id": user_id}
    total = await db.activity_logs.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.activity_logs.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
    logs = await cursor.to_list(length=limit)
    return {"logs": logs, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.post("/admin/app-users/{user_id}/end-sessions")
async def end_user_sessions(user_id: str, admin: dict = Depends(require_admin)):
    result = await db.user_sessions.delete_many({"user_id": user_id})
    return {"deleted_count": result.deleted_count}

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

# ============= PROJECT EXCEL IMPORT =============

@api_router.get("/admin/project-excel-template")
async def download_project_excel_template():
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Projeler"
    headers = ["Proje_Adi", "Il", "Ilce", "Mahalle", "Proje_Tipi", "Aciklama",
               "Konut_Sayisi", "Ticari_Alan", "Okul", "Cami", "Sosyal_Tesis",
               "Proje_Alani_m2", "Baslangic_Tarihi", "Bitis_Tarihi", "Ilerleme_Yuzde",
               "Enlem", "Boylam"]
    ws.append(headers)
    ws.append(["Örnek Proje", "İstanbul", "Arnavutköy", "Tayakadın", "TOKİ", "Açıklama metni",
               "761", "197", "1", "1", "2", "50000", "2024-01-15", "2026-06-30", "45",
               "41.0082", "28.9784"])
    # Adjust column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = max(max_len + 2, 12)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=proje_sablonu.xlsx"}
    )

@api_router.post("/admin/projects/import-excel")
async def import_projects_excel(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ("xlsx", "xls", "csv"):
        raise HTTPException(status_code=400, detail="Sadece xlsx, xls, csv desteklenir")

    content = await file.read()
    errors = []
    success_count = 0
    created_ids = []

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
            name = str(row.get("Proje_Adi", "") or "").strip()
            city = str(row.get("Il", "") or "").strip()
            district = str(row.get("Ilce", "") or "").strip()

            if not name or not city:
                errors.append({"row": idx, "error": "Proje_Adi veya Il boş"})
                continue

            def safe_int(val, default=0):
                try:
                    return int(float(val)) if val else default
                except (ValueError, TypeError):
                    return default

            def safe_float(val, default=0.0):
                try:
                    return float(val) if val else default
                except (ValueError, TypeError):
                    return default

            project = {
                "id": str(uuid.uuid4()),
                "project_name": name,
                "city": city,
                "district": district,
                "neighborhood": str(row.get("Mahalle", "") or "").strip(),
                "description": str(row.get("Aciklama", "") or "").strip(),
                "project_type": str(row.get("Proje_Tipi", "TOKİ") or "TOKİ").strip(),
                "total_housing": safe_int(row.get("Konut_Sayisi")),
                "commercial_count": safe_int(row.get("Ticari_Alan")),
                "school_count": safe_int(row.get("Okul")),
                "mosque_count": safe_int(row.get("Cami")),
                "social_facility_count": safe_int(row.get("Sosyal_Tesis")),
                "project_area_sqm": safe_float(row.get("Proje_Alani_m2")),
                "start_date": str(row.get("Baslangic_Tarihi", "") or "").strip(),
                "planned_end_date": str(row.get("Bitis_Tarihi", "") or "").strip(),
                "progress_percentage": safe_int(row.get("Ilerleme_Yuzde")),
                "location": {
                    "lat": safe_float(row.get("Enlem"), 41.0082),
                    "lng": safe_float(row.get("Boylam"), 28.9784),
                },
                "youtube_videos": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.projects.insert_one(project)
            project.pop("_id", None)
            created_ids.append(project["id"])
            success_count += 1

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dosya işleme hatası: {str(e)}")

    return {"success_count": success_count, "error_count": len(errors), "errors": errors, "created_ids": created_ids}

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
        # KMZ: unzip and return inner KML
        if layer["file_type"] == "KMZ":
            import zipfile, io
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                kml_files = [n for n in z.namelist() if n.endswith('.kml')]
                if not kml_files:
                    raise HTTPException(status_code=400, detail="No KML found inside KMZ")
                kml_content = z.read(kml_files[0])
            return Response(content=kml_content, media_type="application/vnd.google-earth.kml+xml")
        return Response(content=data, media_type=layer["content_type"])
    except HTTPException:
        raise
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
    return await db.projects.find(query, {"_id": 0}).to_list(1000)

@api_router.get("/toki/projects/{project_id}")
async def get_toki_project(project_id: str):
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
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
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

# ============= EDUCATION SYSTEM =============

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

# --- Public Education Endpoints ---

@api_router.get("/education/courses")
async def list_edu_courses():
    return await db.courses.find({"status": "active"}, {"_id": 0}).sort("order", 1).to_list(1000)

@api_router.get("/courses")  # backward compat
async def get_courses():
    return await db.courses.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.get("/education/courses/{course_id}")
async def get_edu_course(course_id: str):
    c = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not c: raise HTTPException(status_code=404, detail="Kurs bulunamadı")
    return c

@api_router.get("/education/seminars")
async def list_edu_seminars():
    return await db.seminars.find({"status": "active"}, {"_id": 0}).sort("date", -1).to_list(1000)

@api_router.get("/seminars")  # backward compat
async def get_seminars():
    return await db.seminars.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.post("/education/seminars/{seminar_id}/register")
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
    return {"message": "Kaydınız başarıyla alındı. Seminer bilgileri size SMS ve email ile gönderilecektir.", "registration": reg}

@api_router.get("/education/live")
async def get_live_training():
    live = await db.weekly_live.find_one({}, {"_id": 0})
    return live or {"title": "Haftalık Canlı Online Eğitim", "description": "Her hafta yatırımcılarla birlikte canlı analiz yapılır.", "day_of_week": "Çarşamba", "time": "20:00", "zoom_link": "", "status": "active", "archives": []}

@api_router.get("/education/page-settings")
async def get_edu_page_settings():
    return await db.edu_page_settings.find_one({}, {"_id": 0}) or {}

# User dashboard
@api_router.get("/user/my-seminars")
async def get_my_seminars(request: Request):
    session = await get_session_user(request)
    if not session: raise HTTPException(status_code=401, detail="Giriş gerekli")
    regs = await db.seminar_registrations.find({"email": session["email"]}, {"_id": 0}).to_list(100)
    return regs

# --- Admin Education Endpoints ---

@api_router.get("/admin/education/courses")
async def admin_list_courses(admin: dict = Depends(require_admin)):
    return await db.courses.find({}, {"_id": 0}).sort("order", 1).to_list(1000)

@api_router.post("/admin/education/courses")
async def admin_create_course(data: CourseCreate, admin: dict = Depends(require_admin)):
    c = {"id": str(uuid.uuid4()), "modules": [], "created_at": datetime.now(timezone.utc).isoformat(), **data.dict()}
    await db.courses.insert_one(c)
    c.pop("_id", None)
    return c

@api_router.put("/admin/education/courses/{course_id}")
async def admin_update_course(course_id: str, data: CourseCreate, admin: dict = Depends(require_admin)):
    upd = {k: v for k, v in data.dict().items()}
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.courses.update_one({"id": course_id}, {"$set": upd})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Kurs bulunamadı")
    return await db.courses.find_one({"id": course_id}, {"_id": 0})

@api_router.delete("/admin/education/courses/{course_id}")
async def admin_delete_course(course_id: str, admin: dict = Depends(require_admin)):
    await db.courses.delete_one({"id": course_id})
    return {"message": "Silindi"}

@api_router.post("/admin/education/courses/{course_id}/modules")
async def admin_add_module(course_id: str, data: CourseModuleCreate, admin: dict = Depends(require_admin)):
    module = {"module_id": str(uuid.uuid4()), "title": data.title, "order": data.order, "lessons": []}
    result = await db.courses.update_one({"id": course_id}, {"$push": {"modules": module}})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Kurs bulunamadı")
    return module

@api_router.put("/admin/education/courses/{course_id}/modules/{module_id}")
async def admin_update_module(course_id: str, module_id: str, data: CourseModuleCreate, admin: dict = Depends(require_admin)):
    await db.courses.update_one(
        {"id": course_id, "modules.module_id": module_id},
        {"$set": {"modules.$.title": data.title, "modules.$.order": data.order}}
    )
    return {"message": "Güncellendi"}

@api_router.delete("/admin/education/courses/{course_id}/modules/{module_id}")
async def admin_delete_module(course_id: str, module_id: str, admin: dict = Depends(require_admin)):
    await db.courses.update_one({"id": course_id}, {"$pull": {"modules": {"module_id": module_id}}})
    return {"message": "Silindi"}

@api_router.post("/admin/education/courses/{course_id}/modules/{module_id}/lessons")
async def admin_add_lesson(course_id: str, module_id: str, data: CourseLessonCreate, admin: dict = Depends(require_admin)):
    lesson = {"lesson_id": str(uuid.uuid4()), **data.dict()}
    await db.courses.update_one(
        {"id": course_id, "modules.module_id": module_id},
        {"$push": {"modules.$.lessons": lesson}}
    )
    return lesson

@api_router.delete("/admin/education/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}")
async def admin_delete_lesson(course_id: str, module_id: str, lesson_id: str, admin: dict = Depends(require_admin)):
    await db.courses.update_one(
        {"id": course_id, "modules.module_id": module_id},
        {"$pull": {"modules.$.lessons": {"lesson_id": lesson_id}}}
    )
    return {"message": "Silindi"}

# --- Admin Seminar Endpoints ---

@api_router.get("/admin/education/seminars")
async def admin_list_seminars(admin: dict = Depends(require_admin)):
    seminars = await db.seminars.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    for s in seminars:
        s["registration_count"] = await db.seminar_registrations.count_documents({"seminar_id": s["id"]})
    return seminars

@api_router.post("/admin/education/seminars")
async def admin_create_seminar(data: SeminarCreate, admin: dict = Depends(require_admin)):
    s = {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat(), **data.dict()}
    await db.seminars.insert_one(s)
    s.pop("_id", None)
    return s

@api_router.put("/admin/education/seminars/{seminar_id}")
async def admin_update_seminar(seminar_id: str, data: SeminarCreate, admin: dict = Depends(require_admin)):
    upd = {**data.dict(), "updated_at": datetime.now(timezone.utc).isoformat()}
    result = await db.seminars.update_one({"id": seminar_id}, {"$set": upd})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Seminer bulunamadı")
    return await db.seminars.find_one({"id": seminar_id}, {"_id": 0})

@api_router.delete("/admin/education/seminars/{seminar_id}")
async def admin_delete_seminar(seminar_id: str, admin: dict = Depends(require_admin)):
    await db.seminars.delete_one({"id": seminar_id})
    return {"message": "Silindi"}

@api_router.get("/admin/education/seminars/{seminar_id}/registrations")
async def admin_seminar_registrations(seminar_id: str, admin: dict = Depends(require_admin)):
    return await db.seminar_registrations.find({"seminar_id": seminar_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)

# --- Admin Live Training ---

@api_router.get("/admin/education/live")
async def admin_get_live(admin: dict = Depends(require_admin)):
    live = await db.weekly_live.find_one({}, {"_id": 0})
    return live or {}

@api_router.put("/admin/education/live")
async def admin_update_live(data: LiveTrainingUpdate, admin: dict = Depends(require_admin)):
    upd = {**data.dict(), "updated_at": datetime.now(timezone.utc).isoformat()}
    existing = await db.weekly_live.find_one({})
    if existing:
        await db.weekly_live.update_one({}, {"$set": upd})
    else:
        await db.weekly_live.insert_one({"id": str(uuid.uuid4()), "archives": [], **upd})
    return await db.weekly_live.find_one({}, {"_id": 0})

@api_router.post("/admin/education/live/archives")
async def admin_add_archive(data: LiveArchiveCreate, admin: dict = Depends(require_admin)):
    archive = {"archive_id": str(uuid.uuid4()), **data.dict()}
    existing = await db.weekly_live.find_one({})
    if existing:
        await db.weekly_live.update_one({}, {"$push": {"archives": archive}})
    return archive

@api_router.delete("/admin/education/live/archives/{archive_id}")
async def admin_delete_archive(archive_id: str, admin: dict = Depends(require_admin)):
    await db.weekly_live.update_one({}, {"$pull": {"archives": {"archive_id": archive_id}}})
    return {"message": "Silindi"}

# --- Admin Media Library ---

@api_router.post("/admin/education/media/upload")
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

@api_router.get("/admin/education/media")
async def list_edu_media(folder: str = Query(""), search: str = Query(""), admin: dict = Depends(require_admin)):
    query = {}
    if folder: query["folder"] = folder
    if search: query["name"] = {"$regex": search, "$options": "i"}
    return await db.education_media.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.delete("/admin/education/media/{media_id}")
async def delete_edu_media(media_id: str, admin: dict = Depends(require_admin)):
    result = await db.education_media.delete_one({"id": media_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Medya bulunamadı")
    return {"message": "Silindi"}

# --- Admin Page Settings ---

@api_router.put("/admin/education/page-settings")
async def update_edu_page_settings(sections: List[Dict[str, Any]] = Body(...), admin: dict = Depends(require_admin)):
    await db.edu_page_settings.delete_many({})
    await db.edu_page_settings.insert_one({"sections": sections})
    return {"sections": sections}

# Backward compat - old admin endpoints
@api_router.post("/admin/courses")
async def create_course_compat(admin: dict = Depends(require_admin), title: str = Form(...), description: str = Form(""), video_url: str = Form(""), duration_minutes: int = Form(0), thumbnail: str = Form("")):
    c = {"id": str(uuid.uuid4()), "title": title, "short_description": description, "full_description": "", "cover_image": thumbnail, "promo_video": video_url, "price": 0, "level": "başlangıç", "tags": [], "status": "active", "order": 0, "modules": [], "student_count": duration_minutes, "rating": 5.0, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.courses.insert_one(c)
    c.pop("_id", None)
    return c

@api_router.delete("/admin/courses/{course_id}")
async def delete_course_compat(course_id: str, admin: dict = Depends(require_admin)):
    await db.courses.delete_one({"id": course_id})
    return {"message": "Deleted"}

@api_router.post("/admin/seminars")
async def create_seminar_compat(admin: dict = Depends(require_admin), title: str = Form(...), description: str = Form(""), speaker: str = Form(""), date: str = Form(""), registration_link: str = Form(""), thumbnail: str = Form("")):
    s = {"id": str(uuid.uuid4()), "title": title, "description": description, "speaker": speaker, "date": date, "zoom_link": registration_link, "cover_image": thumbnail, "seminar_type": "free", "time": "", "duration": "", "location": "", "status": "active", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.seminars.insert_one(s)
    s.pop("_id", None)
    return s

@api_router.delete("/admin/seminars/{seminar_id}")
async def delete_seminar_compat(seminar_id: str, admin: dict = Depends(require_admin)):
    await db.seminars.delete_one({"id": seminar_id})
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

@api_router.post("/yatirim-fonu/basvuru")
async def create_yatirim_fonu_basvuru(data: YatirimFonuBasvuruCreate):
    basvuru = {
        "id": str(uuid.uuid4()),
        **data.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
    }
    await db.yatirim_fonu_basvurulari.insert_one(basvuru)
    basvuru.pop("_id", None)
    return {"message": "Başvurunuz alınmıştır.", "id": basvuru["id"]}

@api_router.post("/yatirim-fonu/bekleme-listesi")
async def join_bekleme_listesi(data: BeklemeListesiCreate):
    kayit = {
        "id": str(uuid.uuid4()),
        **data.dict(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.yatirim_fonu_bekleme.insert_one(kayit)
    kayit.pop("_id", None)
    return {"message": "Bekleme listesine eklendiniz.", "id": kayit["id"]}

@api_router.get("/admin/yatirim-fonu/basvurular")
async def get_yatirim_fonu_basvurulari(admin: dict = Depends(require_admin)):
    return await db.yatirim_fonu_basvurulari.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.get("/admin/yatirim-fonu/bekleme-listesi")
async def get_bekleme_listesi_admin(admin: dict = Depends(require_admin)):
    return await db.yatirim_fonu_bekleme.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

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
        "app_users": await db.app_users.count_documents({}),
    }

# ==================== AI AGENT ====================

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

@api_router.post("/admin/agent/chat")
async def agent_chat(body: AgentMessage, admin: dict = Depends(require_admin)):
    llm_key = os.environ.get('EMERGENT_LLM_KEY')
    if not llm_key:
        raise HTTPException(status_code=500, detail="LLM key yapılandırılmamış")

    projects_cursor = db.projects.find({}, {"_id": 0, "id": 1, "project_name": 1, "city": 1, "district": 1, "progress_percentage": 1}).limit(200)
    existing_projects = await projects_cursor.to_list(length=200)
    context_msg = f"\nMevcut projeler: {json.dumps([{'id':p['id'],'ad':p.get('project_name'),'il':p.get('city'),'ilce':p.get('district')} for p in existing_projects], ensure_ascii=False)}"

    chat = LlmChat(api_key=llm_key, session_id=f"agent_{body.session_id}", system_message=AGENT_SYSTEM_PROMPT).with_model("anthropic", "claude-sonnet-4-5-20250929")
    response_text = await chat.send_message(LlmUserMessage(text=body.message + context_msg))

    try:
        raw = response_text.strip()
        if "```json" in raw: raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw: raw = raw.split("```")[1].split("```")[0].strip()
        agent_response = json.loads(raw)
    except Exception as e:
        return {"message": f"Yanıt işlenemedi: {str(e)}", "actions": [], "results": []}

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

# ---- Agent ZIP Upload ----
@api_router.post("/admin/agent/upload-zip")
async def agent_upload_zip(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    admin: dict = Depends(require_admin)
):
    """Accept a ZIP/RAR (or single KML/KMZ/GeoJSON/image) and process all contents:
    - KML/KMZ/GeoJSON → map layers
    - JPG/PNG/WEBP    → project gallery (auto-resized to max 1280px)
    - DOCX            → extract description text
    """
    import zipfile, io as _io
    import rarfile
    from PIL import Image as PilImage

    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")

    raw = await file.read()
    fname = file.filename or ""
    ext = fname.rsplit(".", 1)[-1].lower() if "." in fname else ""

    GEO_EXTS   = {"kml", "kmz", "geojson", "json"}
    IMG_EXTS   = {"jpg", "jpeg", "png", "webp"}
    DOC_EXTS   = {"docx"}

    # --- collect (basename, ext, bytes) from archive or single file ---
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
            tmp.write(raw); tmp_path = tmp.name
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
        raise HTTPException(status_code=400, detail="Desteklenen dosya bulunamadı (KML/KMZ/GeoJSON/JPG/PNG/DOCX)")

    added_layers = []
    added_images = []
    description_text = None
    project_center = None

    def _compress_image(data: bytes) -> bytes:
        """Resize image to max 1280px wide and compress."""
        img = PilImage.open(_io.BytesIO(data))
        img.thumbnail((1280, 960), PilImage.LANCZOS)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        buf = _io.BytesIO()
        img.save(buf, "JPEG", quality=82, optimize=True)
        return buf.getvalue()

    def _extract_kml_center(fext, data):
        import re, xml.etree.ElementTree as ET
        kml_bytes = data
        if fext == "kmz":
            import zipfile as _zf, io as _io2
            with _zf.ZipFile(_io2.BytesIO(data)) as z2:
                kfiles = [n for n in z2.namelist() if n.endswith('.kml')]
                if kfiles:
                    kml_bytes = z2.read(kfiles[0])
        kml_text = kml_bytes.decode('utf-8', errors='ignore')
        coords_raw = ' '.join(el.text or '' for el in ET.fromstring(kml_text).iter() if el.tag.endswith('coordinates'))
        pairs = re.findall(r'([-\d.]+),([-\d.]+)', coords_raw)
        if pairs:
            lons = [float(p[0]) for p in pairs]
            lats = [float(p[1]) for p in pairs]
            return {"lat": sum(lats)/len(lats), "lng": sum(lons)/len(lons)}
        return None

    for (orig_name, fext, data) in all_files:
        # --- Geo files → map layers ---
        if fext in GEO_EXTS:
            storage_path = f"{APP_NAME}/map-layers/{project_id}/{uuid.uuid4()}.{fext}"
            content_type = MIME_TYPES.get(fext, "application/octet-stream")
            put_object(storage_path, data, content_type)
            layer = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "storage_path": storage_path,
                "original_filename": orig_name,
                "content_type": content_type,
                "file_type": fext.upper(),
                "size": len(data),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.project_map_layers.insert_one(layer)
            added_layers.append(orig_name)
            if project_center is None and fext in ("kml", "kmz"):
                try:
                    project_center = _extract_kml_center(fext, data)
                except Exception:
                    pass

        # --- Images → project media (auto-resized) ---
        elif fext in IMG_EXTS:
            try:
                compressed = _compress_image(data)
            except Exception:
                compressed = data
            storage_path = f"{APP_NAME}/media/{project_id}/{uuid.uuid4()}.jpg"
            put_object(storage_path, compressed, "image/jpeg")
            media_doc = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "storage_path": storage_path,
                "original_filename": orig_name,
                "media_type": "IMAGE",
                "category": "Görsel",
                "title": orig_name,
                "content_type": "image/jpeg",
                "size": len(compressed),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.project_media.insert_one(media_doc)
            added_images.append(orig_name)

        # --- DOCX → extract description ---
        elif fext in DOC_EXTS and description_text is None:
            try:
                from docx import Document as DocxDoc
                doc = DocxDoc(_io.BytesIO(data))
                lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()][:30]
                description_text = "\n".join(lines[:15])
            except Exception:
                pass

    # Save location & description updates
    update_fields = {}
    if project_center:
        update_fields["location"] = project_center
    if description_text and not project.get("description"):
        update_fields["description"] = description_text
    if update_fields:
        await db.projects.update_one({"id": project_id}, {"$set": update_fields})

    return {
        "added_layers": added_layers,
        "added_images": added_images,
        "layers_count": len(added_layers),
        "images_count": len(added_images),
        "project_name": project.get("project_name", ""),
        "location_updated": project_center is not None,
        "description_extracted": description_text is not None,
    }

# ============= SHARED FACILITIES =============

@api_router.get("/shared-facilities")
async def get_shared_facilities():
    docs = await db.shared_facilities.find({}, {"_id": 0}).to_list(500)
    return docs

@api_router.post("/admin/shared-facilities")
async def create_shared_facility(body: dict, admin: dict = Depends(require_admin)):
    facility = {
        "id": str(uuid.uuid4()),
        "name": body.get("name", ""),
        "type": body.get("type", "diger"),
        "lat": float(body.get("lat", 0)),
        "lng": float(body.get("lng", 0)),
        "description": body.get("description", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.shared_facilities.insert_one(facility)
    facility.pop("_id", None)
    return facility

@api_router.delete("/admin/shared-facilities/{facility_id}")
async def delete_shared_facility(facility_id: str, admin: dict = Depends(require_admin)):
    result = await db.shared_facilities.delete_one({"id": facility_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tesis bulunamadı")
    return {"message": "Silindi"}

@api_router.put("/admin/shared-facilities/{facility_id}")
async def update_shared_facility(facility_id: str, body: dict, admin: dict = Depends(require_admin)):
    update = {k: v for k, v in body.items() if k in ("name", "type", "lat", "lng", "description")}
    if "lat" in update: update["lat"] = float(update["lat"])
    if "lng" in update: update["lng"] = float(update["lng"])
    await db.shared_facilities.update_one({"id": facility_id}, {"$set": update})
    return {"message": "Güncellendi"}



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

