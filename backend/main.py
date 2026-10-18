import os
from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from database import get_db, ScanJob, ScanResult
from scanner import run_scan
from policy import validate_target, TargetNotAllowed, check_rate, _allowed_entries

app = FastAPI(title="CyberShield API")

# Erlaubte Website-Herkünfte, per Env erweiterbar (Komma-getrennt).
_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://security-dashboard-irl5.onrender.com",
    "https://enesdoudouzi-sys.github.io",
]
_origins += [o.strip() for o in os.getenv("EXTRA_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key"],
)

# Optionaler Schlüssel: ist SCAN_API_KEY gesetzt, braucht jeder Scan diesen
# Header. Für ein öffentliches Dashboard dringend empfohlen.
SCAN_API_KEY = os.getenv("SCAN_API_KEY", "")

class ScanRequest(BaseModel):
    target: str  # z. B. "scanme.nmap.org" oder eine freigegebene IP/CIDR

# ── Scan starten ──────────────────────────────────────────────
@app.post("/api/scans")
def start_scan(
    req: ScanRequest,
    bg: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    x_api_key: str = Header(default=""),
):
    # 1) Optionaler API-Schlüssel
    if SCAN_API_KEY and x_api_key != SCAN_API_KEY:
        raise HTTPException(401, "Ungültiger oder fehlender API-Schlüssel.")

    # 2) Ratenlimit pro IP
    client_ip = (request.headers.get("x-forwarded-for", "") or (request.client.host if request.client else "")).split(",")[0].strip()
    if not check_rate(client_ip or "unknown"):
        raise HTTPException(429, "Zu viele Scans. Bitte später erneut versuchen.")

    # 3) Ziel gegen die Freigabeliste prüfen
    try:
        target = validate_target(req.target)
    except TargetNotAllowed as e:
        raise HTTPException(403, str(e))

    job = ScanJob(target=target)
    db.add(job)
    db.commit()
    db.refresh(job)
    bg.add_task(run_scan, target, job.id)
    return {"job_id": job.id, "target": target, "status": "running"}

# ── Welche Ziele sind erlaubt? (für das Frontend) ─────────────
@app.get("/api/policy")
def policy():
    return {"allowed_targets": _allowed_entries(), "api_key_required": bool(SCAN_API_KEY)}

# ── Schwachstellen-Scan (leicht, nur freigegebene Ziele) ──────
@app.post("/api/vulnscan")
def vulnscan(
    req: ScanRequest,
    request: Request,
    x_api_key: str = Header(default=""),
):
    if SCAN_API_KEY and x_api_key != SCAN_API_KEY:
        raise HTTPException(401, "Ungültiger oder fehlender API-Schlüssel.")
    client_ip = (request.headers.get("x-forwarded-for", "") or (request.client.host if request.client else "")).split(",")[0].strip()
    if not check_rate(client_ip or "unknown"):
        raise HTTPException(429, "Zu viele Scans. Bitte später erneut versuchen.")
    try:
        target = validate_target(req.target)
    except TargetNotAllowed as e:
        raise HTTPException(403, str(e))
    try:
        from vuln import run_vulnscan
        return run_vulnscan(target)
    except Exception:
        raise HTTPException(503, "Scan nicht möglich (nmap verfügbar?).")

# ── Alle Jobs auflisten ───────────────────────────────────────
@app.get("/api/scans")
def list_scans(db: Session = Depends(get_db)):
    jobs = db.query(ScanJob).order_by(ScanJob.started_at.desc()).all()
    return [
        {
            "id": j.id,
            "target": j.target,
            "status": j.status,
            "started_at": j.started_at,
            "ended_at": j.ended_at,
            "host_count": j.host_count,
            "port_count": j.port_count,
        }
        for j in jobs
    ]

# ── Einzelnen Job abfragen ────────────────────────────────────
@app.get("/api/scans/{job_id}")
def get_scan(job_id: int, db: Session = Depends(get_db)):
    job = db.get(ScanJob, job_id)
    if not job:
        raise HTTPException(404, "Scan nicht gefunden")
    results = db.query(ScanResult).filter(ScanResult.target == job.target).all()
    return {
        "id": job.id,
        "target": job.target,
        "status": job.status,
        "started_at": job.started_at,
        "ended_at": job.ended_at,
        "host_count": job.host_count,
        "port_count": job.port_count,
        "results": [
            {
                "host": r.host,
                "port": r.port,
                "protocol": r.protocol,
                "service": r.service,
                "state": r.state,
                "version": r.version,
                "scanned_at": r.scanned_at,
            }
            for r in results
        ],
    }

# ── Alle offenen Ports ────────────────────────────────────────
@app.get("/api/results")
def all_results(db: Session = Depends(get_db)):
    results = db.query(ScanResult).order_by(ScanResult.scanned_at.desc()).limit(500).all()
    return [
        {
            "host": r.host,
            "port": r.port,
            "protocol": r.protocol,
            "service": r.service,
            "state": r.state,
            "version": r.version,
            "scanned_at": r.scanned_at,
        }
        for r in results
    ]

# ── Health ────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc)}
