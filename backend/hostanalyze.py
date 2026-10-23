"""Port-Analyzer: wertet die Ausgabe von `netstat -ano` oder
`Get-NetTCPConnection` aus und bewertet die offenen Ports nach Risiko.
Reine Text-Analyse – kein nmap, keine Netzwerkverbindung nötig.
"""
import re

# Port -> (Dienst, Risiko, Hinweis)
PORT_RULES = {
    20:   ("FTP-Data", "mittel", "Dateiübertragung, unverschlüsselt"),
    21:   ("FTP", "hoch", "unverschlüsselt – besser SFTP/FTPS"),
    22:   ("SSH", "niedrig", "ok, aber mit Schlüssel statt Passwort absichern"),
    23:   ("Telnet", "kritisch", "völlig unverschlüsselt – abschalten, SSH nutzen"),
    25:   ("SMTP", "mittel", "Mailversand"),
    53:   ("DNS", "niedrig", "Namensauflösung"),
    80:   ("HTTP", "info", "Webserver unverschlüsselt – HTTPS bevorzugen"),
    110:  ("POP3", "mittel", "unverschlüsselt"),
    135:  ("RPC Endpoint Mapper", "mittel", "Windows-intern, nie ins Internet"),
    137:  ("NetBIOS Name", "hoch", "nie ins Internet"),
    138:  ("NetBIOS Datagram", "hoch", "nie ins Internet"),
    139:  ("NetBIOS Session", "hoch", "nur im Heimnetz ok, extern gefährlich"),
    143:  ("IMAP", "mittel", "unverschlüsselt"),
    443:  ("HTTPS", "info", "Webserver verschlüsselt – ok"),
    445:  ("SMB", "hoch", "Datei-/Druckerfreigabe – NIE ins Internet (WannaCry/EternalBlue)"),
    1433: ("MSSQL", "hoch", "Datenbank – nie ins Internet"),
    3306: ("MySQL", "hoch", "Datenbank – nie ins Internet"),
    3389: ("RDP", "hoch", "Remote Desktop – häufigstes Angriffsziel, nie offen ins Internet"),
    5432: ("PostgreSQL", "hoch", "Datenbank – nie ins Internet"),
    5900: ("VNC", "hoch", "Fernsteuerung – oft unsicher"),
    6379: ("Redis", "hoch", "Datenbank – oft ohne Passwort, nie ins Internet"),
    8080: ("HTTP-Alt", "info", "alternativer Webserver"),
    27017:("MongoDB", "hoch", "Datenbank – nie ins Internet"),
    5040: ("Windows CDPSvc", "niedrig", "Connected Devices Platform – normal, lokal"),
    7680: ("Delivery Optimization", "niedrig", "Windows-Update P2P – normal"),
}

# Prozessname (klein) -> (Beschreibung, Risiko, Hinweis)
PROC_NOTES = {
    "spoolsv":      ("Druckerwarteschlange", "mittel", "PrintNightmare-Risiko (CVE-2021-34527) – abschalten, falls kein Drucker nötig"),
    "lsass":        ("Windows-Anmeldedienst", "niedrig", "sensibel (Passwörter) – normal, aber Ziel für Credential-Dumping"),
    "ninjarmmagent":("Fernwartung (NinjaRMM)", "info", "verwalteter/Arbeits-PC – IT kann remote zugreifen"),
    "teamviewer":   ("Fernwartung (TeamViewer)", "mittel", "Fernzugriff – stark absichern (2FA)"),
    "anydesk":      ("Fernwartung (AnyDesk)", "mittel", "Fernzugriff – stark absichern"),
    "vnc":          ("VNC-Server", "hoch", "Fernsteuerung – oft unsicher"),
}

RISK_ORDER = {"kritisch": 0, "hoch": 1, "mittel": 2, "niedrig": 3, "info": 4}


def _extract_ports(text: str) -> set:
    ports = set()
    for line in text.splitlines():
        # netstat-Stil:  TCP  0.0.0.0:445  0.0.0.0:0  LISTENING  4
        for m in re.finditer(r":(\d{1,5})\b", line):
            p = int(m.group(1))
            if 1 <= p <= 65535:
                ports.add(p)
        # Get-NetTCPConnection-Stil:  0.0.0.0  445  4   /   ::  445  4
        toks = line.split()
        if len(toks) >= 2 and re.match(r"^(\d{1,3}\.\d|::|\[?[0-9a-fA-F:]+\]?$)", toks[0]):
            if toks[1].isdigit():
                p = int(toks[1])
                if 1 <= p <= 65535:
                    ports.add(p)
    return ports


def _classify(port: int):
    if port in PORT_RULES:
        svc, risk, note = PORT_RULES[port]
    elif port >= 49152:
        svc, risk, note = ("dynamischer Windows-Dienst", "niedrig", "ephemerer RPC-Port – normal (Windows-Interna)")
    else:
        svc, risk, note = ("unbekannt", "info", "prüfen, welches Programm diesen Port nutzt")
    return {"port": port, "service": svc, "risk": risk, "note": note}


def analyze_ports(text: str) -> dict:
    ports = sorted(_extract_ports(text))
    findings = [_classify(p) for p in ports]

    low = text.lower()
    proc_findings = []
    for name, (desc, risk, note) in PROC_NOTES.items():
        if name in low:
            proc_findings.append({"process": name, "desc": desc, "risk": risk, "note": note})

    findings.sort(key=lambda f: (RISK_ORDER.get(f["risk"], 9), f["port"]))
    proc_findings.sort(key=lambda f: RISK_ORDER.get(f["risk"], 9))

    counts = {"kritisch": 0, "hoch": 0, "mittel": 0, "niedrig": 0, "info": 0}
    for f in findings:
        counts[f["risk"]] = counts.get(f["risk"], 0) + 1

    worst = "info"
    for f in findings + proc_findings:
        if RISK_ORDER.get(f["risk"], 9) < RISK_ORDER.get(worst, 9):
            worst = f["risk"]

    return {
        "port_count": len(findings),
        "worst_risk": worst,
        "counts": counts,
        "ports": findings,
        "processes": proc_findings,
    }
