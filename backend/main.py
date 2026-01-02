from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.database import engine, get_db
from app import models
from app.routers import auth, profiles, events, matches, connections, chat, leaderboard
from app.config import settings
from app.middleware.security import (
    limiter,
    SecurityHeadersMiddleware,
    RequestLoggingMiddleware,
    rate_limit_exceeded_handler
)

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VibeConnect API",
    description="Blockchain-based event connection platform",
    version="1.0.0"
)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# CORS configuration - more restrictive in production
allowed_origins = [
    "http://localhost:3000",  # Local development web
    "http://localhost:19006",  # Expo local development
]

# Add production origins in production environment
if settings.ENVIRONMENT == "production":
    allowed_origins.extend([
        "https://vibeconnect.vercel.app",
        "https://vibeconnect-plum.vercel.app",
        "https://vibeconnect-*.vercel.app",  # Vercel preview deployments
    ])
else:
    # Development: whitelist local origins only (security improvement)
    allowed_origins.extend([
        "http://localhost:8081",   # Expo development server
        "http://127.0.0.1:3000",   # Alternative localhost
        "http://127.0.0.1:19006",  # Alternative Expo
        "exp://localhost:19000",   # Expo deep linking
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(matches.router, prefix="/api/matches", tags=["Matches"])
app.include_router(connections.router, prefix="/api/connections", tags=["Connections"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard"])

@app.get("/")
async def root():
    return {
        "message": "VibeConnect API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
