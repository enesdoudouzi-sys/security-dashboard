# CyberShield SOC Dashboard

A Security Operations Center (SOC) dashboard for monitoring vulnerabilities, threats, network events, and running real network scans.

## Features

- **Overview** — Risk Score, KPI cards, top CVEs, active threats
- **Vulnerabilities** — CVE table with filter and sortable columns
- **Threat Intel** — Threat actor cards with Block / Investigate / Resolve actions
- **Network Events** — Firewall event log
- **Scan History** — Real-time port scans powered by Nmap

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, Tailwind CSS, TypeScript |
| Backend | Python, FastAPI, SQLAlchemy |
| Scanner | Nmap via python-nmap |
| Database | SQLite |

## Project Structure

```
security-dashboard/
├── src/
│   ├── app/                  # Next.js App Router
│   ├── components/
│   │   ├── layout/           # Navbar, Dashboard
│   │   ├── tabs/             # Tab components
│   │   └── ui/               # StatCard, SeverityBadge
│   ├── lib/                  # Data loading
│   └── types/                # TypeScript interfaces
├── backend/
│   ├── main.py               # FastAPI routes
│   ├── scanner.py            # Nmap integration
│   ├── database.py           # SQLite models
│   └── requirements.txt
└── data/
    └── scans.json            # Static demo data
```

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs at [http://localhost:8000/docs](http://localhost:8000/docs)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scans` | Start a new scan |
| GET | `/api/scans` | List all scan jobs |
| GET | `/api/scans/{id}` | Get scan results |
| GET | `/api/results` | All discovered ports |
| GET | `/api/health` | Health check |
