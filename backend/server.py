from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
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
import logging
from pathlib import Path
import cloudinary
import cloudinary.uploader

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Cloudinary config
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
    api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', '')
)

# Create FastAPI app
app = FastAPI(title="PropTech Turkey API")
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    full_name: str
    role: str = "user"  # user or admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TOKIProject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    project_name: str
    city: str  # İl
    district: str  # İlçe
    region: Optional[str] = None  # Bölge/Etap
    description: str
    construction_status: str
    location: Dict[str, float]  # {"lat": 41.0082, "lng": 28.9784}
    housing_details: Dict[str, Any]
    documents: List[str] = []  # Cloudinary URLs
    images: List[str] = []  # Cloudinary URLs
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TOKIProjectCreate(BaseModel):
    project_name: str
    city: str
    district: str
    region: Optional[str] = None
    description: str
    construction_status: str
    location: Dict[str, float]
    housing_details: Dict[str, Any]

class LandParcel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    city: str  # İl
    district: str  # İlçe
    neighborhood: str  # Mahalle
    ada: str  # Ada
    parsel: str  # Parsel
    size_sqm: float  # m²
    zoning_info: str  # İmar durumu
    development_potential: str
    location: Dict[str, float]
    documents: List[str] = []
    images: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LandParcelCreate(BaseModel):
    city: str
    district: str
    neighborhood: str
    ada: str
    parsel: str
    size_sqm: float
    zoning_info: str
    development_potential: str
    location: Dict[str, float]

class InvestmentCalculation(BaseModel):
    city: str
    district: str
    neighborhood: str
    ada: str
    parsel: str
    land_size_sqm: float  # Arsa büyüklüğü
    emsal: float  # Emsal/KAKS
    construction_cost_per_sqm: float  # İnşaat maliyeti (TL/m²)

class InvestmentResult(BaseModel):
    total_construction_area: float
    estimated_apartments: int
    total_construction_cost: float
    estimated_project_value: float
    potential_profit: float
    roi_percentage: float

class MegaProject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str  # köprü, havalimanı, metro, otoyol, kanal, sanayi bölgesi
    description: str
    timeline: str
    location: Dict[str, float]
    images: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MegaProjectCreate(BaseModel):
    name: str
    category: str
    description: str
    timeline: str
    location: Dict[str, float]

class Course(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    video_url: str  # Cloudinary veya YouTube
    duration_minutes: int
    thumbnail: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CourseCreate(BaseModel):
    title: str
    description: str
    video_url: str
    duration_minutes: int
    thumbnail: str

class Seminar(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    date: datetime
    speaker: str
    registration_link: Optional[str] = None
    thumbnail: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SeminarCreate(BaseModel):
    title: str
    description: str
    date: datetime
    speaker: str
    registration_link: Optional[str] = None
    thumbnail: str

class CommunityPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    author_email: str
    title: str
    content: str
    category: str  # tartışma, soru, paylaşım
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommunityPostCreate(BaseModel):
    title: str
    content: str
    category: str

class LandOpportunity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    location: str
    parcel_size_sqm: float
    zoning_type: str
    investment_potential: str  # düşük, orta, yüksek
    risk_score: int  # 1-10
    development_potential: str
    price_per_sqm: Optional[float] = None
    location_coords: Dict[str, float]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LandOpportunityCreate(BaseModel):
    location: str
    parcel_size_sqm: float
    zoning_type: str
    investment_potential: str
    risk_score: int
    development_potential: str
    price_per_sqm: Optional[float] = None
    location_coords: Dict[str, float]

class MarketData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    neighborhood: str
    city: str
    district: str
    avg_price_per_sqm: float
    price_change_percentage: float  # son 1 yıl
    data_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarketDataCreate(BaseModel):
    neighborhood: str
    city: str
    district: str
    avg_price_per_sqm: float
    price_change_percentage: float
    data_date: datetime

# ============= HELPER FUNCTIONS =============

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
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "password": hash_password(user_data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token({"sub": user_data.email})
    user = User(email=user_data.email, full_name=user_data.full_name, role="user")
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": credentials.email})
    user_obj = User(email=user["email"], full_name=user["full_name"], role=user["role"])
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ============= TOKI ENDPOINTS =============

@api_router.post("/toki/projects", response_model=TOKIProject)
async def create_toki_project(project: TOKIProjectCreate, admin: dict = Depends(require_admin)):
    import uuid
    project_dict = project.model_dump()
    project_dict["id"] = str(uuid.uuid4())
    project_dict["documents"] = []
    project_dict["images"] = []
    project_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.toki_projects.insert_one(project_dict)
    return TOKIProject(**project_dict)

@api_router.get("/toki/projects", response_model=List[TOKIProject])
async def get_toki_projects(city: Optional[str] = None, district: Optional[str] = None, project_name: Optional[str] = None):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if project_name:
        query["project_name"] = {"$regex": project_name, "$options": "i"}
    
    projects = await db.toki_projects.find(query, {"_id": 0}).to_list(1000)
    return [TOKIProject(**p) for p in projects]

@api_router.get("/toki/projects/{project_id}", response_model=TOKIProject)
async def get_toki_project(project_id: str):
    project = await db.toki_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return TOKIProject(**project)

# ============= LAND PARCEL ENDPOINTS =============

@api_router.post("/land/parcels", response_model=LandParcel)
async def create_land_parcel(parcel: LandParcelCreate, admin: dict = Depends(require_admin)):
    import uuid
    parcel_dict = parcel.model_dump()
    parcel_dict["id"] = str(uuid.uuid4())
    parcel_dict["documents"] = []
    parcel_dict["images"] = []
    parcel_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.land_parcels.insert_one(parcel_dict)
    return LandParcel(**parcel_dict)

@api_router.get("/land/parcels", response_model=List[LandParcel])
async def get_land_parcels(city: Optional[str] = None, district: Optional[str] = None, neighborhood: Optional[str] = None, ada: Optional[str] = None, parsel: Optional[str] = None):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if neighborhood:
        query["neighborhood"] = {"$regex": neighborhood, "$options": "i"}
    if ada:
        query["ada"] = ada
    if parsel:
        query["parsel"] = parsel
    
    parcels = await db.land_parcels.find(query, {"_id": 0}).to_list(1000)
    return [LandParcel(**p) for p in parcels]

@api_router.get("/land/parcels/{parcel_id}", response_model=LandParcel)
async def get_land_parcel(parcel_id: str):
    parcel = await db.land_parcels.find_one({"id": parcel_id}, {"_id": 0})
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return LandParcel(**parcel)

# ============= INVESTMENT CALCULATOR =============

@api_router.post("/investment/calculate", response_model=InvestmentResult)
async def calculate_investment(data: InvestmentCalculation):
    # Hesaplama mantığı
    total_construction_area = data.land_size_sqm * data.emsal
    estimated_apartments = int(total_construction_area / 100)  # Ortalama 100m² daire
    total_construction_cost = total_construction_area * data.construction_cost_per_sqm
    
    # Basit değerleme: inşaat maliyetinin 1.5 katı
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

# ============= MEGA PROJECTS =============

@api_router.post("/mega-projects", response_model=MegaProject)
async def create_mega_project(project: MegaProjectCreate, admin: dict = Depends(require_admin)):
    import uuid
    project_dict = project.model_dump()
    project_dict["id"] = str(uuid.uuid4())
    project_dict["images"] = []
    project_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.mega_projects.insert_one(project_dict)
    return MegaProject(**project_dict)

@api_router.get("/mega-projects", response_model=List[MegaProject])
async def get_mega_projects():
    projects = await db.mega_projects.find({}, {"_id": 0}).to_list(1000)
    return [MegaProject(**p) for p in projects]

# ============= EDUCATION =============

@api_router.post("/education/courses", response_model=Course)
async def create_course(course: CourseCreate, admin: dict = Depends(require_admin)):
    import uuid
    course_dict = course.model_dump()
    course_dict["id"] = str(uuid.uuid4())
    course_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.courses.insert_one(course_dict)
    return Course(**course_dict)

@api_router.get("/education/courses", response_model=List[Course])
async def get_courses():
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    return [Course(**c) for c in courses]

@api_router.post("/education/seminars", response_model=Seminar)
async def create_seminar(seminar: SeminarCreate, admin: dict = Depends(require_admin)):
    import uuid
    seminar_dict = seminar.model_dump()
    seminar_dict["id"] = str(uuid.uuid4())
    seminar_dict["date"] = seminar_dict["date"].isoformat()
    seminar_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.seminars.insert_one(seminar_dict)
    return Seminar(**{**seminar_dict, "date": datetime.fromisoformat(seminar_dict["date"])})

@api_router.get("/education/seminars", response_model=List[Seminar])
async def get_seminars():
    seminars = await db.seminars.find({}, {"_id": 0}).to_list(1000)
    for s in seminars:
        if isinstance(s['date'], str):
            s['date'] = datetime.fromisoformat(s['date'])
    return [Seminar(**s) for s in seminars]

# ============= COMMUNITY =============

@api_router.post("/community/posts", response_model=CommunityPost)
async def create_post(post: CommunityPostCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    post_dict = post.model_dump()
    post_dict["id"] = str(uuid.uuid4())
    post_dict["author_email"] = current_user["email"]
    post_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.community_posts.insert_one(post_dict)
    return CommunityPost(**post_dict)

@api_router.get("/community/posts", response_model=List[CommunityPost])
async def get_posts(category: Optional[str] = None):
    query = {} if not category else {"category": category}
    posts = await db.community_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [CommunityPost(**p) for p in posts]

# ============= LAND OPPORTUNITIES =============

@api_router.post("/opportunities", response_model=LandOpportunity)
async def create_opportunity(opp: LandOpportunityCreate, admin: dict = Depends(require_admin)):
    import uuid
    opp_dict = opp.model_dump()
    opp_dict["id"] = str(uuid.uuid4())
    opp_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.land_opportunities.insert_one(opp_dict)
    return LandOpportunity(**opp_dict)

@api_router.get("/opportunities", response_model=List[LandOpportunity])
async def get_opportunities():
    opps = await db.land_opportunities.find({}, {"_id": 0}).to_list(1000)
    return [LandOpportunity(**o) for o in opps]

# ============= MARKET ANALYSIS =============

@api_router.post("/market/data", response_model=MarketData)
async def create_market_data(data: MarketDataCreate, admin: dict = Depends(require_admin)):
    import uuid
    data_dict = data.model_dump()
    data_dict["id"] = str(uuid.uuid4())
    data_dict["data_date"] = data_dict["data_date"].isoformat()
    data_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.market_data.insert_one(data_dict)
    return MarketData(**{**data_dict, "data_date": datetime.fromisoformat(data_dict["data_date"])})

@api_router.get("/market/data", response_model=List[MarketData])
async def get_market_data(city: Optional[str] = None, district: Optional[str] = None):
    query = {}
    if city:
        query["city"] = city
    if district:
        query["district"] = district
    
    data = await db.market_data.find(query, {"_id": 0}).to_list(1000)
    for d in data:
        if isinstance(d['data_date'], str):
            d['data_date'] = datetime.fromisoformat(d['data_date'])
    return [MarketData(**d) for d in data]

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
