from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from app.auth.routes import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.dashboard import router as dashboard_router

from app.api.v1.upload import router as upload_router
from app.api.v1.pdfs import router as pdfs_router
from app.api.v1.courses import router as courses_router
from app.api.v1.quizzes import router as quizzes_router
from app.api.v1.search import router as search_router
from app.api.v1.bookmarks import router as bookmarks_router
from app.api.v1.notes import router as notes_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.personalization import router as personalization_router
from app.api.v1.health import router as health_router
from app.utils.storage import verify_storage_bucket
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify storage bucket configuration
    verify_storage_bucket()
    yield

app = FastAPI(
    title="PDF2Course API",
    description="Backend API for PDF2Course",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://learn-forge-ai-alpha.vercel.app"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Group all routes under /api/v1
api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(dashboard_router)
api_router.include_router(upload_router)
api_router.include_router(pdfs_router)
api_router.include_router(courses_router)
api_router.include_router(quizzes_router)
api_router.include_router(search_router)
api_router.include_router(bookmarks_router)
api_router.include_router(notes_router)
api_router.include_router(analytics_router)
api_router.include_router(personalization_router)
api_router.include_router(health_router)

app.include_router(api_router)

@app.get("/")
def read_root():
    return {"status": "ok", "app": "PDF2Course API"}
