from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import seed data
try:
    from seed_data import SEED_DATA
except ImportError:
    SEED_DATA = {}

from database import db, client
from auth_utils import hash_password
from storage import init_storage
from routers.user_panel import seed_exams
from routers import auth, admin_users, projects, content, agent, mrxakademi, user_panel

app = FastAPI(title="PropTech Turkey API")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platform."""
    return {"status": "ok"}


# CRITICAL: Add CORS middleware BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(admin_users.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(content.router, prefix="/api")
app.include_router(agent.router, prefix="/api")
app.include_router(mrxakademi.router, prefix="/api")
app.include_router(user_panel.router, prefix="/api")


@app.on_event("startup")
async def startup():
    import asyncio

    try:
        init_storage()
        logger.info("Object Storage initialized successfully")
    except Exception as e:
        logger.error(f"Object Storage init failed: {e}")

    # Ensure admin user exists (always update password to stay in sync)
    try:
        await db.users.update_one(
            {"email": "admin@mrxozdemir.com"},
            {"$set": {
                "email": "admin@mrxozdemir.com",
                "full_name": "Admin",
                "password": hash_password("As537273"),
                "role": "admin",
            }},
            upsert=True
        )
        logger.info("Admin user ensured")
    except Exception as e:
        logger.error(f"Admin seed error: {e}")

    # Run seeding in background so startup completes fast
    asyncio.create_task(_background_seed())


async def _background_seed():
    """Seed collections in the background after startup."""
    import asyncio

    SEED_COLLECTIONS = [
        "projects", "shared_facilities", "project_map_layers", "project_media",
        "courses", "seminars", "land_parcels", "land_opportunities",
        "mega_projects", "market_data", "edu_page_settings", "weekly_live",
        "app_users", "yatirim_fonu_basvurulari", "yatirim_fonu_bekleme",
        "seo_settings",
    ]
    for col_name in SEED_COLLECTIONS:
        try:
            col = db[col_name]
            count = await col.count_documents({})
            if count == 0 and col_name in SEED_DATA and SEED_DATA[col_name]:
                docs = SEED_DATA[col_name]
                await col.insert_many(docs)
                logger.info(f"Seeded {col_name}: {len(docs)} documents")
            elif count > 0:
                logger.info(f"{col_name}: {count} mevcut, seed atlandı")
        except Exception as e:
            logger.error(f"Seed error for {col_name}: {e}")

    # Seed exams for user panel demo
    try:
        await seed_exams()
    except Exception as e:
        logger.error(f"Exam seed error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
