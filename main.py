from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import requests
import uvicorn
from datetime import datetime
import json

app = FastAPI(title="Adaptive Control System Visualizer", version="1.0.0")

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS for cross-origin frontends (e.g., Google Cloud Storage static site)
# TODO: Replace the example origins below with your actual site origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # For quick testing; tighten this in production.
        # "https://storage.googleapis.com/<your-bucket>",
        # "https://<your-bucket>.storage.googleapis.com",
        # "https://<your-custom-domain>",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ControlRequest(BaseModel):
    current_h: float = Field(..., ge=0.1, le=100.0, description="Current input value")
    previous_h: Optional[float] = Field(None, ge=0.1, le=100.0, description="Previous input value")
    beta_0: float = Field(1.0, ge=0.1, le=5.0, description="Base sensitivity parameter")
    lambda_factor: float = Field(1.0, ge=0.1, le=3.0, description="Scaling factor")
    epsilon: float = Field(1e-10, ge=1e-12, le=1e-6, description="Stability constant")
    base_output: List[float] = Field(..., min_items=1, max_items=20, description="Base output array")
    system_id: Optional[str] = Field(None, description="System identifier")
    output_labels: Optional[List[str]] = Field(None, description="Output labels")
    alpha_param: float = Field(1.0, ge=0.1, le=10.0, description="Primary system coefficient")
    gamma_param: float = Field(1.0, ge=0.1, le=5.0, description="Secondary system coefficient")

class GraphRequest(BaseModel):
    parameter_name: str = Field(..., description="Parameter to vary")
    start_value: float = Field(..., description="Start value for parameter sweep")
    end_value: float = Field(..., description="End value for parameter sweep")
    steps: int = Field(20, ge=5, le=100, description="Number of steps")
    base_request: ControlRequest = Field(..., description="Base request parameters")

# Note: We no longer persist API credentials server-side. Each request may
# provide RapidAPI credentials via headers. This ensures every user uses their
# own key without storing it on the server.

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    try:
        with open("static/index.html", "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Frontend not found. Please ensure static/index.html exists.</h1>")

@app.post("/api/config")
async def set_api_config(config: Dict[str, str]):
    """Deprecated: No-op endpoint kept for compatibility.
    This server does not persist API credentials. Return success without storing.
    """
    return {"message": "API configuration ignored (credentials are per-request)"}

@app.get("/api/config")
async def get_api_config():
    """Return empty config to signal no server-side storage."""
    return {
        "base_url": "",
        "has_api_key": False,
        "api_host": ""
    }

@app.post("/api/calculate")
async def calculate_control(
    request: ControlRequest,
    x_rapidapi_key: Optional[str] = Header(default=None, alias="X-RapidAPI-Key"),
    x_rapidapi_host: Optional[str] = Header(default=None, alias="X-RapidAPI-Host"),
    x_base_url: Optional[str] = Header(default=None, alias="X-RapidAPI-Base-Url"),
):
    """Calculate adaptive control parameters.
    Uses per-request RapidAPI credentials from headers. The provided X-RapidAPI-Base-Url must be the FULL upstream endpoint URL (e.g., https://.../calculate or https://.../calculate/batch). No suffix is appended server-side.
    """
    if not x_base_url or not x_rapidapi_key or not x_rapidapi_host:
        raise HTTPException(status_code=400, detail="Missing RapidAPI credentials (Base URL, Key, and Host are required)")

    try:
        headers = {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": x_rapidapi_key,
            "X-RapidAPI-Host": x_rapidapi_host,
        }

        response = requests.post(
            f"{x_base_url}",
            json=request.model_dump(exclude_none=True),
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Upstream API request failed: {str(exc)}")

@app.post("/api/graph")
async def generate_graph_data(
    graph_request: GraphRequest,
    x_rapidapi_key: Optional[str] = Header(default=None, alias="X-RapidAPI-Key"),
    x_rapidapi_host: Optional[str] = Header(default=None, alias="X-RapidAPI-Host"),
    x_base_url: Optional[str] = Header(default=None, alias="X-RapidAPI-Base-Url"),
):
    """Generate data for parameter sweep graphing using per-request creds. Demo fallback removed.
    The provided X-RapidAPI-Base-Url must be the FULL upstream endpoint URL.
    """
    if not x_base_url or not x_rapidapi_key or not x_rapidapi_host:
        raise HTTPException(status_code=400, detail="Missing RapidAPI credentials (Base URL, Key, and Host are required)")
    results = []
    param_values = []

    # Generate parameter values
    start, end, steps = graph_request.start_value, graph_request.end_value, graph_request.steps
    step_size = (end - start) / (steps - 1)

    for i in range(steps):
        param_value = start + i * step_size
        param_values.append(param_value)

        # Create modified request
        modified_request = graph_request.base_request.model_copy()
        setattr(modified_request, graph_request.parameter_name, param_value)

        # Calculate result
        try:
            headers = {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": x_rapidapi_key,
                "X-RapidAPI-Host": x_rapidapi_host,
            }

            response = requests.post(
                f"{x_base_url}",
                json=modified_request.model_dump(exclude_none=True),
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            result = response.json()

            results.append(result)

        except requests.exceptions.RequestException as exc:
            raise HTTPException(status_code=502, detail=f"Upstream API request failed during sweep: {str(exc)}")

    return {
        "parameter_values": param_values,
        "results": results,
        "parameter_name": graph_request.parameter_name,
    }

def generate_mock_response(request: ControlRequest) -> Dict[str, Any]:
    """Generate mock response for demo purposes"""
    import math
    
    h_value = request.current_h
    delta_h = (request.current_h - request.previous_h) if request.previous_h else 0.0
    
    # Mock calculations for demo
    processing_factor = 0.4 * (1 + 0.1 * math.sin(h_value))
    control_parameter = request.beta_0 * (1 + delta_h * 0.1)
    output_gain = request.alpha_param * request.lambda_factor * (1 + processing_factor)
    
    processed_output = [val * output_gain for val in request.base_output]
    
    response = {
        "h_value": h_value,
        "delta_h": delta_h,
        "processing_factor": processing_factor,
        "control_parameter": control_parameter,
        "output_gain": output_gain,
        "processed_output": processed_output,
        "timestamp": datetime.now().isoformat()
    }
    
    if request.system_id:
        response["system_id"] = request.system_id
    
    if request.output_labels and len(request.output_labels) == len(processed_output):
        response["output_mapping"] = dict(zip(request.output_labels, processed_output))
    
    return response

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
