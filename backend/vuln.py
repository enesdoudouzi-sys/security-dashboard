"""Leichter Schwachstellen-Check: bewertet das Ergebnis eines Portscans
gegen eine Regel-Tabelle (unsichere Dienste, riskante offene Ports).

Das ist kein Ersatz für einen vollen Schwachstellen-Scanner, aber ein
schneller, legaler Überblick – nur gegen freigegebene Ziele (siehe policy.py).
"""
from datetime import datetime, timezone

# Schneller, aussagekräftiger Portsatz.
SCAN_PORTS = "21,22,23,25,53,80,110,135,139,143,443,445,3306,3389,5432,5900,8080,8443"

# Regeln: Port/Dienst -> Befund. severity: critical | high | medium | low | info
RULES = {
    23:   ("high",     "Telnet offen", "Telnet überträgt alles unverschlüsselt. Durch SSH ersetzen."),
    21:   ("medium",   "FTP offen", "FTP ist oft unverschlüsselt. SFTP/FTPS verwenden."),
    445:  ("high",     "SMB offen", "SMB nach außen ist gefährlich (z. B. EternalBlue). Nicht ins Internet."),
    139:  ("medium",   "NetBIOS offen", "Alter NetBIOS-Dienst. Wenn nicht nötig, abschalten."),
    3389: ("high",     "RDP offen", "Remotedesktop im Internet ist ein häufiges Angriffsziel. VPN davor schalten."),
    3306: ("high",     "MySQL offen", "Datenbank sollte nicht öffentlich erreichbar sein."),
    5432: ("high",     "PostgreSQL offen", "Datenbank sollte nicht öffentlich erreichbar sein."),
    5900: ("high",     "VNC offen", "VNC ist oft schwach geschützt. Nur über VPN."),
    25:   ("low",      "SMTP offen", "Mailserver – auf Open-Relay prüfen."),
    135:  ("medium",   "MS-RPC offen", "Windows-RPC nach außen vermeiden."),
}


def evaluate(hosts):
    """hosts: [{host, ports:[{port, service, version, state}]}] -> Befunde + Score."""
    findings = []
    open_ports = 0
    has_http, has_https = False, False

    for h in hosts:
        for p in h["ports"]:
            if p["state"] != "open":
                continue
            open_ports += 1
            port, service = p["port"], (p.get("service") or "").lower()
            if port in (80, 8080) or service in ("http",):
                has_http = True
            if port in (443, 8443) or service in ("https", "ssl"):
                has_https = True
            rule = RULES.get(port)
            if rule:
                sev, title, rec = rule
                findings.append({
                    "severity": sev, "title": title, "host": h["host"],
                    "port": port, "service": p.get("service", ""),
                    "version": p.get("version", ""), "recommendation": rec,
                })

    # Web ohne HTTPS?
    if has_http and not has_https:
        findings.append({
            "severity": "medium", "title": "Webserver ohne HTTPS", "host": "",
            "port": 80, "service": "http", "version": "",
            "recommendation": "Verschlüsselung (HTTPS/TLS) einrichten, HTTP auf HTTPS umleiten.",
        })

    if not findings:
        findings.append({
            "severity": "info", "title": "Keine offensichtlichen Schwachpunkte",
            "host": "", "port": 0, "service": "", "version": "",
            "recommendation": "Trotzdem regelmäßig Updates einspielen und neu prüfen.",
        })

    weights = {"critical": 25, "high": 15, "medium": 7, "low": 3, "info": 0}
    risk = min(100, sum(weights.get(f["severity"], 0) for f in findings))
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    findings.sort(key=lambda f: order.get(f["severity"], 9))
    return {"risk_score": risk, "open_ports": open_ports, "findings": findings}


def run_vulnscan(target: str):
    """Führt einen schnellen Scan aus und bewertet ihn. Gibt dict zurück."""
    import nmap
    nm = nmap.PortScanner()
    nm.scan(hosts=target, arguments=f"-sV -T4 --open --host-timeout 90s -p {SCAN_PORTS}")
    hosts = []
    for host in nm.all_hosts():
        ports = []
        for proto in nm[host].all_protocols():
            for port, data in nm[host][proto].items():
                ports.append({
                    "port": port, "service": data.get("name", ""),
                    "version": f"{data.get('product','')} {data.get('version','')}".strip(),
                    "state": data.get("state", ""),
                })
        hosts.append({"host": host, "ports": ports})
    result = evaluate(hosts)
    result["target"] = target
    result["scanned_at"] = datetime.now(timezone.utc).isoformat()
    return result
