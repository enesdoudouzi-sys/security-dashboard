"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";
import { BACKEND } from "@/lib/backend";

// Lokaler Scan: wertet die Ausgabe von `netstat -ano` / `Get-NetTCPConnection`
// aus und bewertet die offenen Ports deines PCs nach Risiko.
// Primär über das Backend (/api/analyze-ports); fällt das Backend aus, rechnet
// der Browser dieselben Regeln lokal. Es werden KEINE Daten an Dritte gesendet.

type Finding = { port?: number; process?: string; service?: string; desc?: string; risk: string; note: string };
type Result = { port_count: number; worst_risk: string; counts: Record<string, number>; ports: Finding[]; processes: Finding[]; via: string };

const PORT_RULES: Record<number, [string, string, string]> = {
  21: ["FTP", "hoch", "unverschlüsselt – besser SFTP/FTPS"],
  22: ["SSH", "niedrig", "ok, aber mit Schlüssel statt Passwort absichern"],
  23: ["Telnet", "kritisch", "völlig unverschlüsselt – abschalten, SSH nutzen"],
  25: ["SMTP", "mittel", "Mailversand"],
  53: ["DNS", "niedrig", "Namensauflösung"],
  80: ["HTTP", "info", "Webserver unverschlüsselt – HTTPS bevorzugen"],
  110: ["POP3", "mittel", "unverschlüsselt"],
  135: ["RPC Endpoint Mapper", "mittel", "Windows-intern, nie ins Internet"],
  137: ["NetBIOS Name", "hoch", "nie ins Internet"],
  139: ["NetBIOS Session", "hoch", "nur im Heimnetz ok, extern gefährlich"],
  143: ["IMAP", "mittel", "unverschlüsselt"],
  443: ["HTTPS", "info", "Webserver verschlüsselt – ok"],
  445: ["SMB", "hoch", "Datei-/Druckerfreigabe – NIE ins Internet (WannaCry/EternalBlue)"],
  1433: ["MSSQL", "hoch", "Datenbank – nie ins Internet"],
  3306: ["MySQL", "hoch", "Datenbank – nie ins Internet"],
  3389: ["RDP", "hoch", "Remote Desktop – häufigstes Angriffsziel, nie offen ins Internet"],
  5432: ["PostgreSQL", "hoch", "Datenbank – nie ins Internet"],
  5900: ["VNC", "hoch", "Fernsteuerung – oft unsicher"],
  6379: ["Redis", "hoch", "Datenbank – oft ohne Passwort, nie ins Internet"],
  8080: ["HTTP-Alt", "info", "alternativer Webserver"],
  27017: ["MongoDB", "hoch", "Datenbank – nie ins Internet"],
  5040: ["Windows CDPSvc", "niedrig", "Connected Devices Platform – normal, lokal"],
  7680: ["Delivery Optimization", "niedrig", "Windows-Update P2P – normal"],
};
const PROC_NOTES: Record<string, [string, string, string]> = {
  spoolsv: ["Druckerwarteschlange", "mittel", "PrintNightmare-Risiko (CVE-2021-34527) – abschalten, falls kein Drucker nötig"],
  lsass: ["Windows-Anmeldedienst", "niedrig", "sensibel (Passwörter) – normal, aber Ziel für Credential-Dumping"],
  ninjarmmagent: ["Fernwartung (NinjaRMM)", "info", "verwalteter/Arbeits-PC – IT kann remote zugreifen"],
  teamviewer: ["Fernwartung (TeamViewer)", "mittel", "Fernzugriff – stark absichern (2FA)"],
  anydesk: ["Fernwartung (AnyDesk)", "mittel", "Fernzugriff – stark absichern"],
};
const RISK_ORDER: Record<string, number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3, info: 4 };
const RISK_COLOR: Record<string, string> = { kritisch: "#f87171", hoch: "#fb923c", mittel: "#fbbf24", niedrig: "#7df9ff", info: "#64748b" };

function analyzeLocal(text: string): Result {
  const ports = new Set<number>();
  for (const line of text.split("\n")) {
    for (const m of line.matchAll(/:(\d{1,5})\b/g)) { const p = +m[1]; if (p >= 1 && p <= 65535) ports.add(p); }
    const toks = line.trim().split(/\s+/);
    if (toks.length >= 2 && /^(\d{1,3}\.\d|::|\[?[0-9a-fA-F:]+\]?$)/.test(toks[0]) && /^\d+$/.test(toks[1])) {
      const p = +toks[1]; if (p >= 1 && p <= 65535) ports.add(p);
    }
  }
  const findings: Finding[] = [...ports].map((port) => {
    let svc: string, risk: string, note: string;
    if (PORT_RULES[port]) [svc, risk, note] = PORT_RULES[port];
    else if (port >= 49152) [svc, risk, note] = ["dynamischer Windows-Dienst", "niedrig", "ephemerer RPC-Port – normal (Windows-Interna)"];
    else [svc, risk, note] = ["unbekannt", "info", "prüfen, welches Programm diesen Port nutzt"];
    return { port, service: svc, risk, note };
  });
  const low = text.toLowerCase();
  const procs: Finding[] = [];
  for (const [name, [desc, risk, note]] of Object.entries(PROC_NOTES)) if (low.includes(name)) procs.push({ process: name, desc, risk, note });
  findings.sort((a, b) => (RISK_ORDER[a.risk] - RISK_ORDER[b.risk]) || ((a.port || 0) - (b.port || 0)));
  procs.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);
  const counts: Record<string, number> = { kritisch: 0, hoch: 0, mittel: 0, niedrig: 0, info: 0 };
  findings.forEach((f) => (counts[f.risk] = (counts[f.risk] || 0) + 1));
  let worst = "info";
  [...findings, ...procs].forEach((f) => { if (RISK_ORDER[f.risk] < RISK_ORDER[worst]) worst = f.risk; });
  return { port_count: findings.length, worst_risk: worst, counts, ports: findings, processes: procs, via: "Browser (lokal)" };
}

const CMD = "Get-NetTCPConnection -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess | Sort-Object LocalPort";

export function LocalScanTab() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function analyze() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`${BACKEND}/api/analyze-ports`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }), signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error();
      const j = await r.json();
      setRes({ ...j, via: "Backend (Server)" });
    } catch {
      setRes(analyzeLocal(text));   // Fallback: lokal im Browser
    } finally { setBusy(false); }
  }

  function copyCmd() { navigator.clipboard?.writeText(CMD).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Lokaler Scan · dein PC</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Finde heraus, welche Ports/Dienste auf <b>deinem eigenen Rechner</b> offen sind — und wie riskant sie sind.
          Kein Admin, keine Installation. Deine Eingabe wird nicht an Dritte gesendet.
        </p>
      </div>

      <div className="mb-4"><LearnNote title="So geht's (ohne Admin-Rechte)">
        Öffne <b>PowerShell</b> (Windows-Taste → „powershell") und führe diesen Befehl aus. Füge die Ausgabe dann hier ein.
        Das ist echte <b>Host-Enumeration</b> — der erste Schritt, um einen Rechner abzusichern.
      </LearnNote></div>

      <div className="rounded-xl p-3 mb-3 flex items-center gap-2 flex-wrap" style={{ background: "rgba(7,1,15,0.6)", border: "1px solid rgba(0,240,255,0.2)" }}>
        <code className="text-[12px] font-mono flex-1 min-w-0 break-all" style={{ color: "#7df9ff" }}>{CMD}</code>
        <button onClick={copyCmd} className="text-[12px] px-3 py-1.5 rounded-lg cursor-pointer font-bold flex-shrink-0"
          style={{ background: "rgba(0,240,255,0.12)", border: "1px solid rgba(0,240,255,0.3)", color: "#00f0ff" }}>
          {copied ? "✓ kopiert" : "📋 Befehl kopieren"}
        </button>
      </div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7}
        placeholder="Hier die Ausgabe von PowerShell einfügen…"
        className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none font-mono resize-y"
        style={{ background: "#07010f", border: "1px solid rgba(0,240,255,0.25)", color: "#e2e8f0", caretColor: "#00f0ff" }} />
      <button onClick={analyze} disabled={!text.trim() || busy}
        className="mt-2 px-5 py-2.5 rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }}>
        {busy ? "Analysiere…" : "Analysieren"}
      </button>

      {res && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
               style={{ background: "linear-gradient(145deg,#070f1f,#0a1326)", border: `1px solid ${RISK_COLOR[res.worst_risk]}55` }}>
            <div>
              <div className="text-[12px] uppercase tracking-wider" style={{ color: "#64748b" }}>Höchstes Risiko</div>
              <div className="text-xl font-bold" style={{ color: RISK_COLOR[res.worst_risk] }}>{res.worst_risk.toUpperCase()}</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(res.counts).filter(([, n]) => n > 0).map(([k, n]) => (
                <span key={k} className="text-[12px] px-2 py-1 rounded font-bold" style={{ background: `${RISK_COLOR[k]}22`, color: RISK_COLOR[k] }}>{n}× {k}</span>
              ))}
            </div>
            <span className="text-[11px]" style={{ color: "#475569" }}>analysiert von: {res.via}</span>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,240,255,0.15)" }}>
            {res.ports.map((f, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5" style={{ background: i % 2 ? "rgba(13,6,26,0.4)" : "rgba(7,1,15,0.4)", borderLeft: `3px solid ${RISK_COLOR[f.risk]}` }}>
                <span className="text-[14px] font-mono font-bold w-14 flex-shrink-0" style={{ color: "#e2e8f0" }}>{f.port}</span>
                <span className="text-[11px] uppercase px-2 py-0.5 rounded flex-shrink-0 font-bold" style={{ background: `${RISK_COLOR[f.risk]}22`, color: RISK_COLOR[f.risk] }}>{f.risk}</span>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold" style={{ color: "#e2e8f0" }}>{f.service}</div>
                  <div className="text-[12px]" style={{ color: "#94a3b8" }}>{f.note}</div>
                </div>
              </div>
            ))}
          </div>

          {res.processes.length > 0 && (
            <div>
              <div className="text-[12px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>Erkannte Programme</div>
              <div className="space-y-1.5">
                {res.processes.map((p, i) => (
                  <div key={i} className="rounded-lg px-3 py-2 flex items-start gap-3" style={{ background: "rgba(13,6,26,0.5)", border: `1px solid ${RISK_COLOR[p.risk]}33` }}>
                    <span className="text-[11px] uppercase px-2 py-0.5 rounded flex-shrink-0 font-bold" style={{ background: `${RISK_COLOR[p.risk]}22`, color: RISK_COLOR[p.risk] }}>{p.risk}</span>
                    <div><span className="text-[13px] font-bold" style={{ color: "#e2e8f0" }}>{p.process}</span> <span className="text-[12px]" style={{ color: "#94a3b8" }}>— {p.desc}: {p.note}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {res.ports.some((f) => f.port === 445 || f.port === 139 || f.port === 3389) && (
            <div className="rounded-xl p-3 text-[13px]" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.3)", color: "#fdba74" }}>
              💡 Du hast SMB/NetBIOS/RDP offen. Das ist im Heimnetz normal — <b>prüfe im Exposure-Check mit deiner IP</b>,
              ob diese Ports auch aus dem Internet sichtbar sind. Wenn nicht: alles gut.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
