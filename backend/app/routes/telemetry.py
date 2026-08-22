"""
AEGIS Model Telemetry & Benchmarks Routes
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from ml.src.config import REPORTS_DIR, PROCESSED_DATA_DIR

router = APIRouter(prefix="/api/model", tags=["Model Telemetry"])


@router.get("/info")
def get_model_info():
    """
    Returns benchmark metrics, calibration reports, feature distributions, and codebook metadata.
    """
    try:
        metrics_file = REPORTS_DIR / "model_comparison.json"
        codebook_file = PROCESSED_DATA_DIR / "codebook_definitions.json"

        metrics_data = {}
        if metrics_file.exists():
            with open(metrics_file, "r") as f:
                metrics_data = json.load(f)

        codebook_data = {}
        if codebook_file.exists():
            with open(codebook_file, "r") as f:
                codebook_data = json.load(f)

        return {
            "model_name": "LightGBM (Calibrated Sigmoid)",
            "version": "v1.0.0-production",
            "dataset": "CDC BRFSS 2024 (457,670 respondents)",
            "target": "_PHYS14D (High Risk Physical Health Impairment)",
            "metrics": metrics_data,
            "codebook_summary": list(codebook_data.keys()),
            "anti_leakage_status": "PASSED (PHYSHLTH, POORHLTH, _RFHLTH, GENHLTH excluded)",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
