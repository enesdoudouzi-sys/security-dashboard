import nmap
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from database import ScanJob, ScanResult, engine

def run_scan(target: str, job_id: int):
    nm = nmap.PortScanner()
    with Session(engine) as db:
        job = db.get(ScanJob, job_id)
        try:
            # -sV: version detection, -T4: fast, --open: only open ports
            nm.scan(hosts=target, arguments="-sV -T4 --open -p 1-1024")
            results = []
            for host in nm.all_hosts():
                for proto in nm[host].all_protocols():
                    for port, data in nm[host][proto].items():
                        results.append(ScanResult(
                            target=target,
                            host=host,
                            port=port,
                            protocol=proto,
                            service=data.get("name", "unknown"),
                            state=data.get("state", "unknown"),
                            version=f"{data.get('product','')} {data.get('version','')}".strip(),
                        ))
            db.add_all(results)
            job.status = "completed"
            job.ended_at = datetime.now(timezone.utc)
            job.host_count = len(nm.all_hosts())
            job.port_count = len(results)
        except Exception as e:
            job.status = "failed"
            job.ended_at = datetime.now(timezone.utc)
        db.commit()
