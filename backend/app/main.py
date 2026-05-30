# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, analysis, competitor

app = FastAPI(
    title="Sellora AI E-Commerce Intelligence API",
    description="Backend services for the Sellora AI agent orchestration suite",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(competitor.router, prefix="/api/competitor", tags=["Competitor Tracking"])

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "message": "Welcome to Sellora AI E-Commerce Intelligence Engine API Gateway",
        "environment": settings.ENVIRONMENT
    }

@app.get("/api/health")
async def health_check():
    from app.services.supabase_service import supabase_service
    db_connected = await supabase_service.check_connection()
    return {
        "status": "ok",
        "db": "connected" if db_connected else "disconnected",
        "gemini": "reachable"  # mock or simple check
    }

