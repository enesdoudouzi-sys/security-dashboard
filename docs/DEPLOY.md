# Live schalten: Frontend (GitHub Pages) + Backend (Render)

Das Dashboard besteht aus zwei Teilen:

| Teil | Technik | Läuft auf | Adresse |
|------|---------|-----------|---------|
| Frontend (Oberfläche) | Next.js, statisch | GitHub Pages | `https://enesdoudouzi-sys.github.io/security-dashboard/` |
| Backend (Scanner-API) | FastAPI + Nmap, Docker | Render | `https://security-dashboard-api.onrender.com` |

> ⚠️ **Nur erlaubte Ziele!** Das Backend scannt ausschließlich Ziele aus
> `ALLOWED_TARGETS` (Standard: `scanme.nmap.org`, Localhost). Fremde Systeme
> ohne Erlaubnis zu scannen ist illegal.

---

## 1. Frontend auf GitHub Pages

GitHub baut die Seite automatisch (Workflow `.github/workflows/deploy.yml`).

1. Auf GitHub: **Settings → Pages → Source: „GitHub Actions“** wählen.
2. Nach jedem Push auf `main` wird neu gebaut.

**Lokal prüfen (Ubuntu-Terminal):**
```bash
cd ~/security-dashboard
npm ci
DEPLOY_TARGET=github npm run build   # Ergebnis landet in out/
npx serve out                        # http://localhost:3000 zum Testen
```

---

## 2. Backend auf Render

### Variante A: Blueprint (am einfachsten)
1. In Render: **New + → Blueprint → dieses Repo** auswählen.
   Render liest `render.yaml` und richtet alles ein.
2. Unter **Environment** setzen:
   - `SCAN_API_KEY` → ein langes Geheimnis (siehe unten, Befehl zum Erzeugen)
   - optional `ALLOWED_TARGETS`, `EXTRA_ORIGINS`
3. **Deploy** klicken. Fertig, wenn `…/api/health` `{"status":"ok"}` liefert.

### Variante B: Web Service von Hand
- **Root Directory:** `backend`
- **Runtime:** Docker
- **Health Check Path:** `/api/health`

**Geheimen Schlüssel erzeugen (Ubuntu-Terminal):**
```bash
openssl rand -hex 24
```
Den Wert in Render als `SCAN_API_KEY` eintragen.

**Danach testen (Ubuntu-Terminal):**
```bash
API=https://security-dashboard-api.onrender.com
KEY=dein-geheimer-schluessel

curl $API/api/health
curl $API/api/policy
# erlaubtes Ziel (sollte 200 liefern):
curl -X POST $API/api/scans -H "Content-Type: application/json" -H "X-API-Key: $KEY" -d '{"target":"scanme.nmap.org"}'
# verbotenes Ziel (sollte 403 liefern):
curl -i -X POST $API/api/scans -H "Content-Type: application/json" -H "X-API-Key: $KEY" -d '{"target":"google.com"}'
```

> Hinweis: Der kostenlose Render-Dienst schläft nach ~15 Minuten ein; der
> erste Aufruf danach dauert etwas länger.

---

## 3. Frontend mit dem Schlüssel verbinden

Wenn `SCAN_API_KEY` gesetzt ist, braucht die Oberfläche den Schlüssel. Im
Browser auf der Dashboard-Seite einmalig in der Konsole (F12) setzen:
```js
localStorage.setItem("scan-api-key", "dein-geheimer-schluessel")
```

---

## Lokal entwickeln (beide Teile, Ubuntu-Terminal)

```bash
# Backend
cd ~/security-dashboard/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
sudo apt install -y nmap          # Scanner-Programm
uvicorn main:app --reload --port 8000

# Frontend (zweites Terminal)
cd ~/security-dashboard
npm ci
npm run dev                        # http://localhost:3000
```

**Tests (Ubuntu-Terminal):**
```bash
cd ~/security-dashboard/backend && source .venv/bin/activate
pip install pytest
pytest -q
```
