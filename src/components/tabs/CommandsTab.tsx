"use client";
import { useState } from "react";
import { CommandRow } from "@/components/ui/CopyBtn";

// Legale Übungsbefehle. Immer nur gegen scanme.nmap.org oder das EIGENE Labor.
const GROUPS = [
  {
    phase: "1 · Aufklärung (Recon)",
    desc: "Informationen über ein Ziel sammeln – ohne es anzugreifen.",
    cmds: [
      { cmd: "whois scanme.nmap.org", note: "Wem gehört die Domain?" },
      { cmd: "dig scanme.nmap.org +short", note: "IP-Adresse auflösen" },
      { cmd: "host scanme.nmap.org", note: "DNS-Einträge anzeigen" },
      { cmd: "curl -sI https://scanme.nmap.org", note: "HTTP-Header ansehen" },
    ],
  },
  {
    phase: "2 · Portscan (Nmap)",
    desc: "Welche Ports sind offen, welche Dienste laufen?",
    cmds: [
      { cmd: "nmap scanme.nmap.org", note: "Standard-Scan der häufigsten Ports" },
      { cmd: "nmap -sV scanme.nmap.org", note: "Dienst- und Versionserkennung" },
      { cmd: "nmap -sC -sV -T4 scanme.nmap.org", note: "mit Standard-Skripten, schneller" },
      { cmd: "nmap -p- scanme.nmap.org", note: "alle 65535 Ports (dauert länger)" },
      { cmd: "sudo nmap -sS -O scanme.nmap.org", note: "SYN-Scan + Betriebssystem-Erkennung (Root nötig)" },
    ],
  },
  {
    phase: "3 · Schwachstellen suchen",
    desc: "Nmap-Skripte prüfen bekannte Lücken.",
    cmds: [
      { cmd: "nmap --script vuln scanme.nmap.org", note: "bekannte Schwachstellen prüfen" },
      { cmd: "nmap --script ssl-enum-ciphers -p 443 scanme.nmap.org", note: "TLS/SSL-Konfiguration bewerten" },
      { cmd: "nmap --script http-headers -p 80,443 scanme.nmap.org", note: "HTTP-Sicherheitsheader" },
    ],
  },
  {
    phase: "4 · Web (nur eigenes Labor!)",
    desc: "Diese Werkzeuge nur gegen DVWA / Juice Shop in deinem Labor einsetzen.",
    cmds: [
      { cmd: "nikto -h http://127.0.0.1:8080", note: "Webserver auf bekannte Probleme prüfen" },
      { cmd: "gobuster dir -u http://127.0.0.1:8080 -w /usr/share/wordlists/dirb/common.txt", note: "versteckte Verzeichnisse finden" },
      { cmd: "whatweb http://127.0.0.1:8080", note: "eingesetzte Technologien erkennen" },
    ],
  },
  {
    phase: "5 · Mitschneiden & Analyse",
    desc: "Netzwerkverkehr verstehen (im eigenen Netz).",
    cmds: [
      { cmd: "sudo tcpdump -i any -c 20", note: "20 Pakete mitschneiden" },
      { cmd: "ip a && ip route", note: "eigene Netzwerk-Konfiguration ansehen" },
      { cmd: "ss -tulpn", note: "offene Ports des eigenen Rechners" },
    ],
  },
];

export function CommandsTab() {
  const [open, setOpen] = useState(0);
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Übungs-Befehle</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Legale Befehle zum Lernen, nach den Phasen eines Pentests sortiert. Kopieren,
          im Terminal ausführen, die Ausgabe verstehen.
        </p>
      </div>

      <div className="rounded-xl p-4 mb-5 text-[14px]"
           style={{ background: "rgba(127,29,29,0.25)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}>
        ⚠️ Nur gegen <b>scanme.nmap.org</b> (offiziell zum Üben freigegeben) oder dein
        <b> eigenes Labor</b>. Fremde Systeme ohne schriftliche Erlaubnis zu scannen ist strafbar (§ 202 StGB).
      </div>

      <div className="space-y-3">
        {GROUPS.map((g, i) => (
          <div key={g.phase} className="rounded-xl overflow-hidden"
               style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
            <button onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer text-left">
              <div>
                <div className="text-[16px] font-bold" style={{ color: "#e2e8f0" }}>{g.phase}</div>
                <div className="text-[13px] mt-0.5" style={{ color: "#64748b" }}>{g.desc}</div>
              </div>
              <span style={{ color: "#34d399" }}>{open === i ? "▾" : "▸"}</span>
            </button>
            {open === i && (
              <div className="px-5 pb-5 space-y-2">
                {g.cmds.map((c) => <CommandRow key={c.cmd} cmd={c.cmd} note={c.note} />)}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-5 text-[13px]" style={{ color: "#475569" }}>
        Werkzeuge installieren (Ubuntu): <code style={{ color: "#67e8f9" }}>sudo apt install -y nmap nikto gobuster whatweb tcpdump</code>.
        Noch mehr in <code style={{ color: "#67e8f9" }}>docs/LERNEN.md</code>.
      </p>
    </div>
  );
}
