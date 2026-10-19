"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Kuratierter Auszug der MITRE ATT&CK Enterprise-Matrix.
// Taktiken = das WARUM (Ziel des Angreifers), Techniken = das WIE.
type Technique = { id: string; name: string; desc: string; detect: string };
type Tactic = { id: string; name: string; goal: string; techniques: Technique[] };

const TACTICS: Tactic[] = [
  {
    id: "TA0001", name: "Initial Access", goal: "In das Netzwerk hineinkommen",
    techniques: [
      { id: "T1566", name: "Phishing", desc: "Gefälschte E-Mails mit Anhang oder Link, um Zugangsdaten oder Code einzuschleusen.", detect: "E-Mail-Gateway-Logs, Klicks auf verdächtige Links, Makro-Ausführung in Office." },
      { id: "T1190", name: "Exploit Public-Facing App", desc: "Schwachstelle in einer erreichbaren Web-/VPN-Anwendung ausnutzen (z. B. Fortinet, Citrix).", detect: "WAF-Alarme, ungewöhnliche Requests, neue Prozesse auf dem Webserver." },
      { id: "T1133", name: "External Remote Services", desc: "Gültige Zugänge über RDP/VPN missbrauchen.", detect: "Logins zu ungewöhnlichen Zeiten / aus fremden Ländern." },
    ],
  },
  {
    id: "TA0002", name: "Execution", goal: "Schadcode ausführen",
    techniques: [
      { id: "T1059", name: "Command & Scripting", desc: "PowerShell, Bash, cmd oder Python zum Ausführen von Befehlen.", detect: "PowerShell-ScriptBlock-Logging, verdächtige Eltern-Kind-Prozesse (Word → cmd)." },
      { id: "T1204", name: "User Execution", desc: "Opfer öffnet schädliche Datei/Link selbst.", detect: "Downloads aus Mail-Anhängen, die zu Prozessstart führen." },
    ],
  },
  {
    id: "TA0003", name: "Persistence", goal: "Dauerhaft im System bleiben",
    techniques: [
      { id: "T1053", name: "Scheduled Task/Job", desc: "Geplante Aufgabe/Cronjob, die den Schadcode immer wieder startet.", detect: "Neue Tasks in Taskplaner / neue Cron-Einträge." },
      { id: "T1543", name: "Create/Modify Service", desc: "Neuen Systemdienst anlegen, der automatisch startet.", detect: "Neue Windows-Dienste, Änderungen an systemd-Units." },
    ],
  },
  {
    id: "TA0004", name: "Privilege Escalation", goal: "Mehr Rechte bekommen",
    techniques: [
      { id: "T1068", name: "Exploit for Priv-Esc", desc: "Kernel-/Software-Lücke nutzen, um Admin/Root zu werden.", detect: "Abstürze, ungewöhnliche Rechteerhöhung, bekannte CVE-Exploits." },
      { id: "T1548", name: "Abuse Elevation Control", desc: "UAC-Bypass, sudo-Missbrauch.", detect: "sudo-Logs, UAC-Umgehungs-Muster." },
    ],
  },
  {
    id: "TA0005", name: "Defense Evasion", goal: "Entdeckung vermeiden",
    techniques: [
      { id: "T1070", name: "Indicator Removal", desc: "Logs löschen, Spuren verwischen.", detect: "Event-Log-Clear (Event ID 1102), gelöschte Verlaufsdateien." },
      { id: "T1027", name: "Obfuscated Files", desc: "Code verschleiern/verschlüsseln, um Scanner zu täuschen.", detect: "Base64-/XOR-codierte Payloads, Entropie-Analyse." },
    ],
  },
  {
    id: "TA0006", name: "Credential Access", goal: "Passwörter stehlen",
    techniques: [
      { id: "T1110", name: "Brute Force", desc: "Passwörter durchprobieren.", detect: "Viele fehlgeschlagene Logins von einer IP (siehe Log-Analyse-Tab!)." },
      { id: "T1003", name: "OS Credential Dumping", desc: "Passwort-Hashes aus LSASS/SAM auslesen (z. B. Mimikatz).", detect: "Zugriff auf lsass.exe, verdächtige Tools." },
    ],
  },
  {
    id: "TA0007", name: "Discovery", goal: "Umgebung erkunden",
    techniques: [
      { id: "T1046", name: "Network Service Scanning", desc: "Ports/Dienste im Netz scannen (Nmap).", detect: "Viele Verbindungen zu vielen Ports in kurzer Zeit." },
      { id: "T1087", name: "Account Discovery", desc: "Benutzerkonten auflisten.", detect: "net user / LDAP-Abfragen in Serie." },
    ],
  },
  {
    id: "TA0008", name: "Lateral Movement", goal: "Sich im Netz ausbreiten",
    techniques: [
      { id: "T1021", name: "Remote Services", desc: "Von System zu System springen (RDP, SMB, SSH).", detect: "Ungewöhnliche interne RDP/SMB-Verbindungen." },
      { id: "T1570", name: "Lateral Tool Transfer", desc: "Werkzeuge auf andere Hosts kopieren.", detect: "Dateikopien über Admin-Shares (C$)." },
    ],
  },
  {
    id: "TA0009", name: "Collection", goal: "Daten sammeln",
    techniques: [
      { id: "T1005", name: "Data from Local System", desc: "Dateien auf dem Rechner einsammeln.", detect: "Massen-Dateizugriffe, Archiv-Erstellung (zip/rar)." },
    ],
  },
  {
    id: "TA0011", name: "Command & Control", goal: "Fernsteuerung",
    techniques: [
      { id: "T1071", name: "Application Layer Protocol", desc: "Steuerung über HTTPS/DNS, versteckt im normalen Traffic.", detect: "Beaconing (regelmäßige kleine Verbindungen), seltene Domains." },
      { id: "T1572", name: "Protocol Tunneling", desc: "Traffic in anderem Protokoll tunneln (DNS-Tunnel).", detect: "Auffällig viele/große DNS-Abfragen." },
    ],
  },
  {
    id: "TA0010", name: "Exfiltration", goal: "Daten herausschleusen",
    techniques: [
      { id: "T1041", name: "Exfil over C2 Channel", desc: "Daten über denselben Kanal wie die Steuerung abziehen.", detect: "Großer ausgehender Upload zu C2-IP." },
    ],
  },
  {
    id: "TA0040", name: "Impact", goal: "Schaden anrichten",
    techniques: [
      { id: "T1486", name: "Data Encrypted (Ransomware)", desc: "Dateien verschlüsseln und Lösegeld fordern.", detect: "Massenhafte Dateiänderungen, neue Dateiendungen, Lösegeld-Notiz." },
      { id: "T1498", name: "Network DoS", desc: "Dienste durch Überlastung lahmlegen.", detect: "Traffic-Spitzen, Dienstausfälle." },
    ],
  },
];

const SEV = "#34d399";

export function AttackTab() {
  const [sel, setSel] = useState<{ tactic: Tactic; tech: Technique } | null>(null);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">MITRE ATT&amp;CK Matrix</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Die Landkarte der Angreifer-Methoden. <b style={{ color: "#94a3b8" }}>Spalten = Taktiken</b> (das Ziel),
          <b style={{ color: "#94a3b8" }}> Kacheln = Techniken</b> (die Methode). Kachel anklicken für Details & Erkennung.
        </p>
      </div>

      <div className="mb-5">
        <LearnNote>
          ATT&amp;CK ist <b>der</b> Standard im Blue Team. Ein SOC-Analyst ordnet jeden Alarm einer Technik zu
          (&bdquo;das ist T1110 Brute Force&ldquo;) und erkennt so, in welcher Angriffsphase man steckt.
          In Bewerbungsgesprächen für SOC-Jobs wird ATT&amp;CK fast immer abgefragt – lerne die 12 Taktiken auswendig.
        </LearnNote>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2.5" style={{ minWidth: "min-content" }}>
          {TACTICS.map((t) => (
            <div key={t.id} className="flex-shrink-0" style={{ width: 160 }}>
              <div className="rounded-lg px-2.5 py-2 mb-2"
                   style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="text-[13px] font-bold leading-tight" style={{ color: "#e2e8f0" }}>{t.name}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>{t.goal}</div>
              </div>
              <div className="space-y-1.5">
                {t.techniques.map((tech) => {
                  const active = sel?.tech.id === tech.id;
                  return (
                    <button key={tech.id} onClick={() => setSel({ tactic: t, tech })}
                      className="w-full text-left rounded-lg px-2.5 py-2 cursor-pointer transition-all"
                      style={{
                        background: active ? "rgba(16,185,129,0.18)" : "rgba(15,23,42,0.6)",
                        border: `1px solid ${active ? "rgba(52,211,153,0.5)" : "rgba(30,41,59,0.6)"}`,
                      }}>
                      <div className="text-[12px] font-mono" style={{ color: SEV }}>{tech.id}</div>
                      <div className="text-[13px] leading-tight mt-0.5" style={{ color: "#cbd5e1" }}>{tech.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {sel && (
        <div className="mt-5 rounded-xl p-5"
             style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(52,211,153,0.3)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-mono px-2 py-0.5 rounded"
                      style={{ background: "rgba(16,185,129,0.15)", color: SEV }}>{sel.tech.id}</span>
                <span className="text-[17px] font-bold" style={{ color: "#f1f5f9" }}>{sel.tech.name}</span>
              </div>
              <div className="text-[13px] mt-1" style={{ color: "#64748b" }}>
                Taktik: <span style={{ color: "#94a3b8" }}>{sel.tactic.name}</span> — {sel.tactic.goal}
              </div>
            </div>
            <button onClick={() => setSel(null)} className="text-[20px] cursor-pointer" style={{ color: "#475569" }}>×</button>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="rounded-lg p-3" style={{ background: "#020817", border: "1px solid rgba(30,41,59,0.6)" }}>
              <div className="text-[12px] uppercase tracking-wider font-bold mb-1" style={{ color: "#94a3b8" }}>Was macht der Angreifer?</div>
              <p className="text-[14px]" style={{ color: "#cbd5e1" }}>{sel.tech.desc}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "#020817", border: "1px solid rgba(16,185,129,0.25)" }}>
              <div className="text-[12px] uppercase tracking-wider font-bold mb-1" style={{ color: SEV }}>🔍 So erkennst du es</div>
              <p className="text-[14px]" style={{ color: "#a7f3d0" }}>{sel.tech.detect}</p>
            </div>
          </div>
          <a href={`https://attack.mitre.org/techniques/${sel.tech.id}/`} target="_blank" rel="noreferrer"
             className="inline-block mt-3 text-[13px]" style={{ color: "#67e8f9" }}>
            → Vollständige Doku auf attack.mitre.org
          </a>
        </div>
      )}
    </div>
  );
}
