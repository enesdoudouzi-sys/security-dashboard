"use client";
import { useState, useRef, useEffect } from "react";
import type { Scan } from "@/types";

const BACKEND = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "https://security-dashboard-irl5.onrender.com";

const PRESETS = [
  { label: "Eigenes Netzwerk", value: "192.168.178.0/24" },
  { label: "scanme.nmap.org",  value: "scanme.nmap.org"  },
  { label: "Localhost",        value: "127.0.0.1"         },
];

interface LiveResult { host: string; port: number; service: string; state: string; version: string; }
interface LiveJob {
  id: number; target: string; status: string;
  host_count: number; port_count: number; results: LiveResult[];
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string; label: string }> = {
    completed: { color: "#34d399", bg: "rgba(6,78,59,0.4)",   border: "rgba(16,185,129,0.3)", label: "ABGESCHLOSSEN" },
    running:   { color: "#fbbf24", bg: "rgba(120,53,15,0.4)", border: "rgba(245,158,11,0.3)", label: "LÄUFT" },
    scheduled: { color: "#60a5fa", bg: "rgba(30,58,138,0.4)", border: "rgba(59,130,246,0.3)", label: "GEPLANT" },
    failed:    { color: "#f87171", bg: "rgba(127,29,29,0.4)", border: "rgba(239,68,68,0.3)",  label: "FEHLER" },
  };
  const s = cfg[status] ?? { color: "#94a3b8", bg: "rgba(30,41,59,0.4)", border: "rgba(30,41,59,0.3)", label: status.toUpperCase() };
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold"
          style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {status === "running" && <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: s.color }} />}
      {s.label}
    </span>
  );
}

function formatDuration(start: string, end: string | null) {
  if (!end) return "Läuft…";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

export function ScansTab({ scans }: { scans: Scan[] }) {
  const [target, setTarget]   = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [liveJob, setLiveJob] = useState<LiveJob | null>(null);
  const [termLog, setTermLog] = useState<string[]>([]);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // auto-scroll terminal
  useEffect(() => { termRef.current?.scrollTo({ top: 9999, behavior: "smooth" }); }, [termLog]);

  // check backend
  useEffect(() => {
    async function ping() {
      try {
        const r = await fetch(`${BACKEND}/api/health`, { signal: AbortSignal.timeout(3000) });
        setBackendOk(r.ok);
      } catch { setBackendOk(false); }
    }
    ping();
  }, []);

  function log(line: string) { setTermLog((p) => [...p, line]); }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }

  async function startScan() {
    const t = target.trim();
    if (!t || scanning) return;
    setScanning(true);
    setError(null);
    setLiveJob(null);
    setTermLog([]);

    log(`Starte Nmap-Scan auf Ziel: ${t}`);
    log(`Backend: ${BACKEND}`);
    log(`Optionen: TCP SYN · Ports 1-1024 · Version-Erkennung`);
    log("───────────────────────────────────");

    try {
      const res = await fetch(`${BACKEND}/api/scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: t }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const job = await res.json();
      log(`Job #${job.job_id} erstellt — warte auf Ergebnisse…`);
      setTarget("");
      showToast(`Scan gestartet (Job #${job.job_id})`, true);
      pollJob(job.job_id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
      log(`FEHLER: ${msg}`);
      log("Stelle sicher dass das Backend läuft: cd backend && python main.py");
      setError("Backend nicht erreichbar. Starte: cd backend && uvicorn main:app --port 8000");
      setScanning(false);
    }
  }

  function pollJob(id: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${BACKEND}/api/scans/${id}`);
        const job: LiveJob = await res.json();
        setLiveJob(job);

        if (job.results.length > 0) {
          log(`[${new Date().toISOString().slice(11,19)}] ${job.host_count} Hosts · ${job.port_count} offene Ports gefunden`);
        }

        if (job.status === "completed") {
          clearInterval(intervalRef.current!);
          setScanning(false);
          log("───────────────────────────────────");
          log(`Scan abgeschlossen: ${job.port_count} offene Ports auf ${job.host_count} Hosts`);
          showToast(`Scan fertig — ${job.port_count} offene Ports auf ${job.host_count} Hosts`, true);
        } else if (job.status === "failed") {
          clearInterval(intervalRef.current!);
          setScanning(false);
          log("FEHLER: Scan fehlgeschlagen (nmap verfügbar?)");
          showToast("Scan fehlgeschlagen", false);
        }
      } catch {
        clearInterval(intervalRef.current!);
        setScanning(false);
        log("Verbindung zum Backend unterbrochen");
      }
    }, 3000);
  }

  return (
    <div className="p-5 space-y-5 max-w-screen-2xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in text-sm font-medium"
             style={{ background: toast.ok ? "rgba(6,78,59,0.95)" : "rgba(127,29,29,0.95)",
                      border: `1px solid ${toast.ok ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"}`,
                      color: toast.ok ? "#34d399" : "#f87171", backdropFilter: "blur(12px)" }}>
          <span>{toast.ok ? "✓" : "✗"}</span>
          {toast.msg}
        </div>
      )}

      {/* ── SCAN STARTEN ── */}
      <div className="rounded-xl overflow-hidden"
           style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: "1px solid rgba(16,185,129,0.25)" }}>
        {/* Header */}
        <div className="px-5 py-3 flex items-center gap-3"
             style={{ borderBottom: "1px solid rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.04)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: "#34d399" }}>
            Nmap-Scan starten
          </span>
          {/* Backend indicator */}
          <div className="ml-auto flex items-center gap-1.5 text-[10px]"
               style={{ color: backendOk ? "#34d399" : backendOk === false ? "#f87171" : "#4b5563" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: backendOk ? "#34d399" : backendOk === false ? "#f87171" : "#4b5563" }} />
            {backendOk ? "Backend bereit" : backendOk === false ? "Backend offline" : "Prüfe Backend…"}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Input row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span style={{ color: "#10b981" }}>⊕</span>
              </div>
              <input
                type="text"
                placeholder="Ziel — 192.168.1.0/24 · scanme.nmap.org · 10.0.0.1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && startScan()}
                disabled={scanning}
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-40"
                style={{
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(30,41,59,0.8)",
                  color: "#e2e8f0",
                  caretColor: "#10b981",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.5)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(30,41,59,0.8)")}
              />
            </div>

            <button
              onClick={startScan}
              disabled={scanning || !target.trim() || backendOk === false}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: scanning ? "rgba(6,78,59,0.5)" : "linear-gradient(135deg, #065f46, #10b981)",
                color: "#fff",
                boxShadow: scanning ? "none" : "0 0 20px rgba(16,185,129,0.3)",
                border: "1px solid rgba(16,185,129,0.4)",
              }}
            >
              {scanning ? (
                <>
                  <span className="w-4 h-4 rounded-full animate-spin"
                        style={{ border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff" }} />
                  Scannt…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                  Scan starten
                </>
              )}
            </button>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px]" style={{ color: "#374151" }}>Schnellauswahl:</span>
            {PRESETS.map((p) => (
              <button key={p.value} onClick={() => setTarget(p.value)} disabled={scanning}
                      className="text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                      style={{ background: "rgba(30,41,59,0.5)", color: "#64748b", border: "1px solid rgba(30,41,59,0.8)" }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#34d399"; (e.target as HTMLElement).style.borderColor = "rgba(16,185,129,0.3)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#64748b"; (e.target as HTMLElement).style.borderColor = "rgba(30,41,59,0.8)"; }}>
                {p.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-[11px]"
                 style={{ background: "rgba(127,29,29,0.3)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              <span className="shrink-0">✗</span>
              <span>{error}</span>
            </div>
          )}

          {/* Terminal */}
          {termLog.length > 0 && (
            <div ref={termRef} className="rounded-xl p-4 font-mono text-[11px] space-y-1 overflow-y-auto max-h-44"
                 style={{ background: "#020817", border: "1px solid rgba(16,185,129,0.15)" }}>
              {termLog.map((line, i) => (
                <div key={i} className={`leading-relaxed ${line.startsWith("FEHLER") ? "" : ""}`}
                     style={{ color: line.startsWith("FEHLER") ? "#f87171" : line.startsWith("Scan ") ? "#34d399" : "#64748b" }}>
                  <span style={{ color: "#10b981", marginRight: 6 }}>▸</span>{line}
                </div>
              ))}
              {scanning && (
                <div style={{ color: "#10b981" }}>
                  <span style={{ marginRight: 6 }}>▸</span>
                  Warte auf nmap-Ergebnisse<span className="animate-blink">█</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── LIVE ERGEBNIS ── */}
      {liveJob && (
        <div className="rounded-xl overflow-hidden animate-fade-in"
             style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)",
                      border: `1px solid ${liveJob.status === "completed" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}` }}>
          <div className="px-5 py-3 flex items-center gap-4"
               style={{ borderBottom: "1px solid rgba(30,41,59,0.6)", background: "rgba(15,23,42,0.5)" }}>
            <div className="flex-1">
              <div className="text-sm font-bold" style={{ color: "#e2e8f0" }}>
                Live-Scan: <span style={{ color: "#34d399" }}>{liveJob.target}</span>
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "#4b5563" }}>
                {liveJob.host_count} Hosts · {liveJob.port_count} offene Ports
              </div>
            </div>
            <StatusBadge status={liveJob.status} />
          </div>

          {liveJob.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.6)" }}>
                    {["Host", "Port", "Dienst", "Status", "Version"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-semibold uppercase tracking-[0.12em]"
                          style={{ color: "#374151" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liveJob.results.map((r, i) => (
                    <tr key={i} className="transition-colors"
                        style={{ borderBottom: "1px solid rgba(15,23,42,0.8)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,185,129,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                      <td className="px-5 py-3 font-mono" style={{ color: "#fb923c" }}>{r.host}</td>
                      <td className="px-5 py-3 font-bold" style={{ color: "#34d399" }}>{r.port}</td>
                      <td className="px-5 py-3" style={{ color: "#cbd5e1" }}>{r.service}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold"
                              style={{ background: "rgba(6,78,59,0.4)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>
                          {r.state.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3" style={{ color: "#4b5563" }}>{r.version || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-[11px]" style={{ color: "#374151" }}>
              {liveJob.status === "running" ? "Scanne… Ergebnisse erscheinen hier in Echtzeit" : "Keine offenen Ports gefunden"}
            </div>
          )}
        </div>
      )}

      {/* ── SCAN VERLAUF ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "#64748b" }}>Scan-Verlauf</span>
        </div>
        <div className="space-y-3">
          {scans.map((s) => (
            <div key={s.id} className="rounded-xl overflow-hidden transition-all"
                 style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: "1px solid rgba(30,41,59,0.8)" }}
                 onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(30,41,59,1)")}
                 onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(30,41,59,0.8)")}>
              <div className="px-5 py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{s.type}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: "#374151" }}>{s.target}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px]" style={{ color: "#374151" }}>
                    {new Date(s.startTime).toLocaleString("de-DE")}
                  </span>
                  <StatusBadge status={s.status} />
                </div>
              </div>

              {s.status !== "scheduled" && s.findings > 0 && (
                <div style={{ borderTop: "1px solid rgba(30,41,59,0.6)" }}>
                  {/* Severity bars */}
                  <div className="grid grid-cols-4 divide-x" style={{ borderColor: "rgba(30,41,59,0.6)" }}>
                    {[
                      { label: "Kritisch", count: s.critical, color: "#f87171" },
                      { label: "Hoch",     count: s.high,     color: "#fb923c" },
                      { label: "Mittel",   count: s.medium,   color: "#fbbf24" },
                      { label: "Niedrig",  count: s.low,      color: "#60a5fa" },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="px-4 py-3 text-center" style={{ borderRight: "1px solid rgba(30,41,59,0.6)" }}>
                        <div className="text-xl font-bold" style={{ color, textShadow: `0 0 10px ${color}60` }}>{count}</div>
                        <div className="text-[9px] mt-0.5" style={{ color: "#374151" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="flex h-1">
                    {[
                      { count: s.critical, grad: "linear-gradient(90deg,#7f1d1d,#ef4444)" },
                      { count: s.high,     grad: "linear-gradient(90deg,#7c2d12,#f97316)" },
                      { count: s.medium,   grad: "linear-gradient(90deg,#713f12,#eab308)" },
                      { count: s.low,      grad: "linear-gradient(90deg,#1e3a5f,#3b82f6)" },
                    ].map(({ count, grad }) =>
                      count > 0 ? (
                        <div key={grad} style={{ width: `${(count / s.findings) * 100}%`, background: grad }} />
                      ) : null
                    )}
                  </div>
                  <div className="px-5 py-2.5 text-[10px] flex gap-4" style={{ color: "#374151" }}>
                    <span>Dauer: <span style={{ color: "#64748b" }}>{formatDuration(s.startTime, s.endTime)}</span></span>
                    <span>Befunde: <span style={{ color: "#e2e8f0", fontWeight: "bold" }}>{s.findings}</span></span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
