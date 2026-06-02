from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime
from sqlalchemy.orm import DeclarativeBase, Session
from datetime import datetime, timezone

engine = create_engine("sqlite:///./security.db")

class Base(DeclarativeBase):
    pass

class ScanResult(Base):
    __tablename__ = "scan_results"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    target     = Column(String)
    host       = Column(String)
    port       = Column(Integer)
    protocol   = Column(String)
    service    = Column(String)
    state      = Column(String)
    version    = Column(String, default="")
    scanned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ScanJob(Base):
    __tablename__ = "scan_jobs"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    target     = Column(String)
    status     = Column(String, default="running")  # running | completed | failed
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at   = Column(DateTime, nullable=True)
    host_count = Column(Integer, default=0)
    port_count = Column(Integer, default=0)

Base.metadata.create_all(engine)

def get_db():
    with Session(engine) as session:
        yield session
