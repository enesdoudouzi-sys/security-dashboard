"use client";
import { useState } from "react";
import { CommandRow } from "@/components/ui/CopyBtn";

const BACKEND = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "https://security-dashboard-irl5.onrender.com";

const SEV: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#f87171", bg: "rgba(127,29,29,0.4)", label: "KRITISCH" },
  high:     { color: "#fb923c", bg: "rgba(124,45,18,0.4)", label: "HOCH" },
  medium:   { color: "#fbbf24", bg: "rgba(120,53,15,0.4)", label: "MITTEL" },
  low:      { color: "#60a5fa", bg: "rgba(30,58,138,0.4)", label: "NIEDRIG" },
  info:     { color: "#34d399", bg: "rgba(6,78,59,0.4)",  label: "INFO" },
};

interface Finding { severity: string; title: string; host: string; port: number; service: string; version: string; recommendation: string; }
interface Result { risk_score: number; open_ports: number; target: string; findings: Finding[]; }

export function VulnScanTab() {
  const [target, setTarget] = useState("scanme.nmap.org");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    const t = target.trim();
    if (!t || busy) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const apiKey = typeof window !== "undefined" ? (localStorage.getItem("scan-api-key") || "") : "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["X-API-Key"] = apiKey;
      const res = await fetch(`${BACKEND}/api/vulnscan`, {
        method: "POST", headers, body: JSON.stringify({ target: t }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(120000) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backend nicht erreichbar.");
    } finally {
      setBusy(false);
    }
  }

  const riskColor = (r: number) => r >= 50 ? "#f87171" : r >= 25 ? "#fbbf24" : "#34d399";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gradient-green">Schwachstellen-Scan</h2>
        <p className="text-[12px] mt-1" style={{ color: "#64748b" }}>
          Prüft freigegebene Ziele auf offene, riskante Dienste und leitet einen Risikowert ab.
          Läuft über den Scanner-Server (Backend). Nur erlaubte Ziele.
        </p>
      </div>

      <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="flex gap-2 flex-wrap">
          <input value={target} onChange={(e) => setTarget(e.target.value)}
            placeholder="Freigegebenes Ziel, z. B. scanme.nmap.org"
            className="flex-1 min-w-[220px] rounded-lg px-3 py-2 text-[13px] font-mono outline-none"
            style={{ background: "#020817", border: "1px solid rgba(51,65,85,0.6)", color: "#e2e8f0" }} />
          <button onClick={run} disabled={busy}
            className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider cursor-pointer"
            style={{ color: "#34d399", background: "rgba(6,78,59,0.4)", border: "1px solid rgba(16,185,129,0.4)", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Scannt…" : "▶ Scan starten"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-[12px]" style={{ color: "#f87171" }}>
            {error} — ist das Backend online? Du kannst stattdessen den Befehl unten lokal ausführen.
          </p>
        )}
      </div>

      {result && (
        <div className="mb-6">
          <div className="flex items-center gap-5 rounded-xl p-5 mb-4"
               style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: riskColor(result.risk_score) }}>{result.risk_score}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>von 100</div>
            </div>
            <div style={{ width: 1, height: 44, background: "rgba(30,41,59,0.8)" }} />
            <div className="text-[12px]" style={{ color: "#94a3b8" }}>
              Risikowert für <b style={{ color: "#e2e8f0" }}>{result.target}</b><br />
              {result.open_ports} offene Ports · {result.findings.length} Befunde
            </div>
          </div>

          <div className="space-y-2">
            {result.findings.map((f, i) => {
              const s = SEV[f.severity] || SEV.info;
              return (
                <div key={i} className="rounded-lg p-4 flex items-start gap-3"
                     style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold flex-none mt-0.5"
                        style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}40` }}>{s.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold" style={{ color: "#e2e8f0" }}>
                      {f.title}{f.port ? <span style={{ color: "#64748b" }}> · Port {f.port}{f.version ? ` · ${f.version}` : ""}</span> : null}
                    </div>
                    <p className="text-[12px] mt-1" style={{ color: "#94a3b8" }}>{f.recommendation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(30,41,59,0.5)" }}>
        <div className="text-[12px] font-bold mb-2" style={{ color: "#94a3b8" }}>Lieber lokal im Terminal? Diese Befehle machen dasselbe:</div>
        <div className="space-y-2">
          <CommandRow cmd={`nmap -sV --script vuln ${target.trim() || "scanme.nmap.org"}`} note="voller Schwachstellen-Scan mit Nmap-Skripten" />
          <CommandRow cmd={`nmap -sV --open ${target.trim() || "scanme.nmap.org"}`} note="offene Dienste und Versionen" />
        </div>
      </div>
    </div>
  );
}
