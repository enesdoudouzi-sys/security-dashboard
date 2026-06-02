from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from database import get_db, ScanJob, ScanResult
from scanner import run_scan

app = FastAPI(title="CyberShield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    target: str  # e.g. "192.168.1.0/24" or "scanme.nmap.org"

# ── Scan starten ──────────────────────────────────────────────
@app.post("/api/scans")
def start_scan(req: ScanRequest, bg: BackgroundTasks, db: Session = Depends(get_db)):
    job = ScanJob(target=req.target)
    db.add(job)
    db.commit()
    db.refresh(job)
    bg.add_task(run_scan, req.target, job.id)
    return {"job_id": job.id, "target": req.target, "status": "running"}

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
