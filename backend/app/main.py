"""
AEGIS — AI-Native Autonomous Parametric Insurance Protocol
FastAPI Backend Application Entrypoint
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.routes.risk import router as risk_router
from backend.app.routes.premium import router as premium_router
from backend.app.routes.policy import router as policy_router
from backend.app.routes.oracle import router as oracle_router
from backend.app.routes.telemetry import router as telemetry_router

app = FastAPI(
    title="AEGIS Protocol API",
    description="AI-Native Autonomous Parametric Health Insurance Protocol Backend",
    version="1.0.0",
)

# CORS Middleware to allow React Frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static report images
reports_dir = Path("ml/reports")
if reports_dir.exists():
    app.mount("/static/reports", StaticFiles(directory="ml/reports"), name="reports")

# Include API Routers
app.include_router(risk_router)
app.include_router(premium_router)
app.include_router(policy_router)
app.include_router(oracle_router)
app.include_router(telemetry_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "protocol": "AEGIS AI-Native Parametric Insurance",
        "version": "1.0.0",
        "ai_engine": "LightGBM-Calibrated-Sigmoid",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
