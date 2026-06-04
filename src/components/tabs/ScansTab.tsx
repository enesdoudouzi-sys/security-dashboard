"use client";
import { useState } from "react";
import type { Scan } from "@/types";

const BACKEND = "https://security-dashboard-irl5.onrender.com";

const STATUS_STYLES: Record<string, string> = {
  completed: "text-green-400 border-green-800 bg-green-900/30",
  running:   "text-yellow-400 border-yellow-800 bg-yellow-900/30",
  scheduled: "text-blue-400 border-blue-800 bg-blue-900/30",
  failed:    "text-red-400 border-red-800 bg-red-900/30",
};

const STATUS_DE: Record<string, string> = {
  completed: "ABGESCHLOSSEN",
  running:   "LÄUFT",
  scheduled: "GEPLANT",
  failed:    "FEHLGESCHLAGEN",
};

function formatDuration(start: string, end: string | null) {
  if (!end) return "Läuft...";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

interface LiveResult {
  host: string;
  port: number;
  service: string;
  state: string;
  version: string;
}

interface LiveJob {
  id: number;
  target: string;
  status: string;
  host_count: number;
  port_count: number;
  results: LiveResult[];
}

export function ScansTab({ scans }: { scans: Scan[] }) {
  const [target, setTarget] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveJob, setLiveJob] = useState<LiveJob | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function startScan() {
    const t = target.trim();
    if (!t) return;
    setScanning(true);
    setError(null);
    setLiveJob(null);

    try {
      const res = await fetch(`${BACKEND}/api/scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: t }),
      });
      if (!res.ok) throw new Error("Backend-Fehler");
      const job = await res.json();
      setTarget("");
      setToast(`Scan gestartet (Job #${job.job_id}) für ${t}`);
      setTimeout(() => setToast(null), 4000);
      pollJob(job.job_id);
    } catch {
      setError("Backend nicht erreichbar — stelle sicher dass der Render-Service läuft.");
      setScanning(false);
    }
  }

  async function pollJob(id: number) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND}/api/scans/${id}`);
        const job: LiveJob = await res.json();
        setLiveJob(job);
        if (job.status === "completed" || job.status === "failed") {
          clearInterval(interval);
          setScanning(false);
          setToast(job.status === "completed" ? `Scan abgeschlossen — ${job.port_count} offene Ports auf ${job.host_count} Hosts` : "Scan fehlgeschlagen");
          setTimeout(() => setToast(null), 5000);
        }
      } catch {
        clearInterval(interval);
        setScanning(false);
      }
    }, 4000);
  }

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className="fixed top-16 right-6 z-50 bg-gray-800 border border-green-700 text-green-300 text-xs px-4 py-2.5 rounded-lg shadow-xl">
          {toast}
        </div>
      )}

      {/* Scan starten */}
      <div className="bg-gray-900 border border-green-900/50 rounded-xl p-5">
        <h2 className="text-xs uppercase tracking-widest text-green-400 font-semibold mb-4">Neuen Scan starten</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ziel eingeben — z.B. 192.168.1.0/24 oder scanme.nmap.org"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !scanning && startScan()}
            disabled={scanning}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500 disabled:opacity-50"
          />
          <button
            onClick={startScan}
            disabled={scanning || !target.trim()}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {scanning ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scannt...
              </span>
            ) : "▶ Starten"}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        <p className="text-gray-600 text-xs mt-2">Nmap-basierter Port-Scan · Ports 1–1024 · Version-Erkennung aktiviert</p>
      </div>

      {/* Live Scan Ergebnisse */}
      {liveJob && (
        <div className="bg-gray-900 border border-yellow-900/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Live-Scan: {liveJob.target}</h2>
              <p className="text-gray-500 text-xs mt-0.5">{liveJob.host_count} Hosts · {liveJob.port_count} offene Ports</p>
            </div>
            <span className={`px-2 py-0.5 rounded border text-xs font-bold ${STATUS_STYLES[liveJob.status] ?? "text-gray-400"}`}>
              {liveJob.status === "running" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse mr-1" />}
              {STATUS_DE[liveJob.status] ?? liveJob.status}
            </span>
          </div>
          {liveJob.results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-widest border-b border-gray-800">
                    <th className="text-left py-2 pr-4">Host</th>
                    <th className="text-left py-2 pr-4">Port</th>
                    <th className="text-left py-2 pr-4">Dienst</th>
                    <th className="text-left py-2">Version</th>
                  </tr>
                </thead>
                <tbody>
                  {liveJob.results.map((r, i) => (
                    <tr key={i} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                      <td className="py-2 pr-4 font-mono text-orange-300">{r.host}</td>
                      <td className="py-2 pr-4 text-green-400 font-bold">{r.port}</td>
                      <td className="py-2 pr-4 text-gray-300">{r.service}</td>
                      <td className="py-2 text-gray-500">{r.version || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Scan-Verlauf */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Scan-Verlauf</h2>
        <div className="space-y-4">
          {scans.map((s) => (
            <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div>
                  <div className="text-white font-bold text-sm">{s.type}</div>
                  <div className="text-gray-500 text-xs font-mono mt-0.5">{s.target}</div>
                </div>
                <span className={`ml-auto px-2.5 py-0.5 rounded border text-xs font-bold ${STATUS_STYLES[s.status] ?? "text-gray-400"}`}>
                  {s.status === "running" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse mr-1" />}
                  {STATUS_DE[s.status] ?? s.status}
                </span>
              </div>

              {s.status !== "scheduled" && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Kritisch", count: s.critical, color: "text-red-400",    bg: "bg-red-900/20"    },
                      { label: "Hoch",     count: s.high,     color: "text-orange-400", bg: "bg-orange-900/20" },
                      { label: "Mittel",   count: s.medium,   color: "text-yellow-400", bg: "bg-yellow-900/20" },
                      { label: "Niedrig",  count: s.low,      color: "text-blue-400",   bg: "bg-blue-900/20"   },
                    ].map(({ label, count, color, bg }) => (
                      <div key={label} className={`${bg} border border-gray-800 rounded-lg p-3 text-center`}>
                        <div className={`text-2xl font-bold ${color}`}>{count}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                  {s.findings > 0 && (
                    <div className="w-full h-2 flex rounded overflow-hidden gap-0.5">
                      {[
                        { count: s.critical, color: "bg-red-500"    },
                        { count: s.high,     color: "bg-orange-500" },
                        { count: s.medium,   color: "bg-yellow-500" },
                        { count: s.low,      color: "bg-blue-500"   },
                      ].map(({ count, color }) =>
                        count > 0 ? <div key={color} className={`${color} h-full`} style={{ width: `${(count / s.findings) * 100}%` }} /> : null
                      )}
                    </div>
                  )}
                </>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                <span>Gestartet: <span className="text-gray-300">{new Date(s.startTime).toLocaleString("de-DE")}</span></span>
                <span>Dauer: <span className="text-gray-300">{formatDuration(s.startTime, s.endTime)}</span></span>
                {s.findings > 0 && <span>Befunde gesamt: <span className="text-white font-bold">{s.findings}</span></span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
