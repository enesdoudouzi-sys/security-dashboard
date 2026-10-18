# Legales Hacking lernen – Roadmap

> **Die goldene Regel:** Teste nur Systeme, die **dir gehören** oder für die du
> eine **schriftliche Erlaubnis** hast. Ohne Erlaubnis ist jeder Zugriff
> strafbar (in Deutschland §§ 202a, 202b, 202c, 303a, 303b StGB –
> „Hackerparagraf“). Legales Hacking heißt: üben auf freigegebenen Zielen,
> in eigenen Laboren und auf dafür gemachten Plattformen.

Du hast nach eigener Aussage schon etwas Erfahrung (Linux, Netzwerk, Nmap).
Dieser Plan führt von dort zu solidem, einstellbarem Können.

---

## Übungsplattformen (alles legal, extra dafür gemacht)

| Plattform | Wofür | Kosten |
|-----------|-------|--------|
| [TryHackMe](https://tryhackme.com) | geführte Lernpfade für Einsteiger & Mittelstufe | teils gratis |
| [Hack The Box](https://www.hackthebox.com) / HTB Academy | realistische Maschinen, Theorie-Module | teils gratis |
| [PortSwigger Web Security Academy](https://portswigger.net/web-security) | Web-Angriffe (die Referenz, kostenlos) | gratis |
| [OverTheWire – Bandit](https://overthewire.org/wargames/bandit/) | Linux & Shell-Grundlagen als Spiel | gratis |
| [picoCTF](https://picoctf.org) | CTF-Aufgaben für Einsteiger | gratis |
| [VulnHub](https://www.vulnhub.com) | verwundbare VMs für das eigene Labor | gratis |
| [scanme.nmap.org](http://scanme.nmap.org) | offizielles Ziel zum Nmap-Üben | gratis |

---

## Lernpfad in 6 Stufen

### Stufe 1 – Fundament (2–4 Wochen)
- Linux sicher auf der Kommandozeile (Dateien, Rechte, Prozesse, Netzwerk).
- Netzwerk-Grundlagen: TCP/IP, Ports, DNS, HTTP(S).
- OverTheWire **Bandit** komplett durchspielen.

### Stufe 2 – Aufklärung (Reconnaissance)
- Nmap richtig: Host-Discovery, Portscans, `-sV`, `-sC`, NSE-Skripte.
- Dein Dashboard hier nutzen, um Scans auf `scanme.nmap.org` sichtbar zu machen.
- Passive Recon: `whois`, `dig`, Zertifikate, offene Quellen (OSINT).

### Stufe 3 – Web-Sicherheit (der größte Praxisbereich)
- OWASP Top 10 verstehen: Injection, XSS, Auth-Fehler, Zugriffskontrolle.
- **PortSwigger Academy** Labs durcharbeiten (SQL-Injection, XSS, CSRF, SSRF …).
- Werkzeug: Burp Suite (Community) zum Mitlesen und Verändern von Anfragen.

### Stufe 4 – Ausnutzung & Rechteausweitung (im eigenen Labor)
- TryHackMe-Pfade „Jr Penetration Tester“ / „Offensive Pentesting“.
- VulnHub-/HTB-Maschinen: Dienst finden → Schwachstelle → Zugang → Rechte erhöhen.
- Alles nur in der eigenen VM, siehe `docs/LABOR.md`.

### Stufe 5 – Berichte schreiben
- Ein guter Pentest endet mit einem **Bericht**: Fund, Risiko, Nachweis, Fix.
- Übe das: genau das macht aus einem „Hacker“ einen bezahlten Profi.

### Stufe 6 – Zertifikate (wenn du es beruflich willst)
| Zertifikat | Stufe | Anmerkung |
|-----------|-------|-----------|
| **eJPT** (INE) | Einstieg | günstig, praxisnah, guter erster Nachweis |
| **CompTIA Security+** | Grundlagen/Theorie | von Arbeitgebern oft verlangt |
| **PNPT** (TCM Security) | Mittelstufe | realistischer Pentest + Bericht |
| **OSCP** (OffSec) | fortgeschritten | der Klassiker, hart, hoch angesehen |

---

## Werkzeuge (die wichtigsten)
- **Kali Linux** oder **Parrot OS** – Linux mit allen Tools vorinstalliert (in einer VM).
- Nmap, Burp Suite, Wireshark, ffuf/gobuster, Hydra, Metasploit (nur im Labor).
- Für dein eigenes Lernen reicht am Anfang: Nmap + Burp + ein Browser.

## Haltung
- Immer erst fragen: **Darf ich das testen?** Wenn du unsicher bist: nicht tun.
- Gefundene Lücken verantwortungsvoll melden (Responsible Disclosure), nie ausnutzen.
- Schreib mit, was du lernst – ein eigenes Lern-Logbuch (z. B. in diesem Repo).

---

Nächster praktischer Schritt: `docs/LABOR.md` – ein sicheres Übungslabor auf
deinem eigenen Rechner einrichten.
