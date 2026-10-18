# Eigenes Übungslabor einrichten (Ubuntu)

Ein Labor ist ein **abgeschlossenes Netz aus virtuellen Maschinen auf deinem
eigenen Rechner**. Hier darfst du alles ausprobieren, weil nichts Fremdes
beteiligt ist. Nichts aus dem Labor nach draußen richten.

## Grundregeln
- VMs ins **„Host-only“- oder „NAT-Netzwerk“** stellen, nicht ins Internet brücken.
- Keine echten Daten, keine echten Passwörter im Labor verwenden.
- Niemals vom Labor aus fremde Systeme angreifen.

---

## 1. Virtualisierung installieren (Ubuntu-Terminal)
```bash
sudo apt update
sudo apt install -y virtualbox            # oder: GNOME Boxes / VMware
```

## 2. Angreifer-VM: Kali Linux
- ISO/VM: <https://www.kali.org/get-kali/>
- In VirtualBox importieren, Netzwerk auf **Host-only Adapter** stellen.

## 3. Ziel-VMs (absichtlich verwundbar, legal)
- **Metasploitable 2** – Klassiker zum Üben: <https://sourceforge.net/projects/metasploitable/>
- **OWASP Juice Shop** – moderne, verwundbare Web-App (läuft auch per Docker):
```bash
sudo apt install -y docker.io
sudo docker run --rm -p 3000:3000 bkimminich/juice-shop
# dann im Browser: http://localhost:3000
```
- **DVWA** (Damn Vulnerable Web Application):
```bash
sudo docker run --rm -p 8080:80 vulnerables/web-dvwa
# dann im Browser: http://localhost:8080
```
- Weitere fertige Ziel-VMs: <https://www.vulnhub.com>

## 4. Dein Dashboard im Labor nutzen
Das Backend darf im Labor auch private Netze scannen – dafür die Freigabe
erweitern (nur lokal, nicht auf dem öffentlichen Render-Dienst!):
```bash
cd ~/security-dashboard/backend
source .venv/bin/activate
export ALLOW_PRIVATE_RANGES=1
export ALLOWED_TARGETS="scanme.nmap.org,127.0.0.1,localhost,192.168.56.0/24"
uvicorn main:app --reload --port 8000
```
Dann im Dashboard z. B. `192.168.56.101` (deine Ziel-VM) scannen.

## 5. Erste Übungen
1. Mit Nmap die Ziel-VM finden und Dienste auflisten.
2. Juice Shop: die OWASP Top 10 der Reihe nach durchspielen
   (die App hat ein eingebautes Punktesystem).
3. DVWA auf „Low“ stellen und SQL-Injection / XSS nachvollziehen,
   dann „Medium“/„High“ als Steigerung.
4. Jeden Fund kurz dokumentieren: Was? Wie gefunden? Wie beheben?

---

## Sicherheit des Labors
- Snapshots der VMs anlegen, bevor du etwas kaputt machst (zum Zurücksetzen).
- Das Labor nach dem Üben herunterfahren.
- Kali und Ziele getrennt vom Heimnetz halten (Host-only).
