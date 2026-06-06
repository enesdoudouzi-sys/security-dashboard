"use client";
import { useState, useEffect } from "react";

const tabs = [
  { id: "overview",        label: "Übersicht",     icon: "▣" },
  { id: "vulnerabilities", label: "Schwachstellen", icon: "◈" },
  { id: "threats",         label: "Bedrohungen",    icon: "☣" },
  { id: "network",         label: "Netzwerk",       icon: "⬡" },
  { id: "scans",           label: "Scans",          icon: "⊕" },
];

export function Navbar({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  const [now, setNow] = useState<Date | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function ping() {
      try {
        const res = await fetch("http://localhost:8000/api/health", { signal: AbortSignal.timeout(2000) });
        setBackendOk(res.ok);
      } catch {
        setBackendOk(false);
      }
    }
    ping();
    const id = setInterval(ping, 10000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now ? now.toISOString().slice(0, 19).replace("T", " ") : "";

  return (
    <nav className="sticky top-0 z-50"
         style={{ background: "rgba(2,8,23,0.95)", borderBottom: "1px solid rgba(16,185,129,0.15)", backdropFilter: "blur(20px)" }}>
      {/* Top accent line */}
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #10b981, #34d399, #10b981, transparent)" }} />

      <div className="flex items-center px-5 gap-0 h-14">
        {/* Logo */}
        <div className="flex items-center gap-3 pr-6 mr-2" style={{ borderRight: "1px solid rgba(30,41,59,0.8)" }}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-ring"
                 style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)", border: "1px solid rgba(16,185,129,0.5)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-gradient-green">CyberShield</div>
            <div className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "#4b5563" }}>SOC Platform</div>
          </div>
        </div>

        {/* Tabs */}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className="relative flex items-center gap-1.5 px-4 h-14 text-[11px] uppercase tracking-[0.12em] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap"
            style={active === tab.id
              ? { color: "#34d399", textShadow: "0 0 15px rgba(52,211,153,0.7)" }
              : { color: "#4b5563" }}
          >
            {tab.label}
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                    style={{ background: "linear-gradient(90deg, transparent, #10b981, #34d399, #10b981, transparent)" }} />
            )}
          </button>
        ))}

        {/* Right */}
        <div className="ml-auto flex items-center gap-4">
          {/* Backend status */}
          <div className="flex items-center gap-1.5 text-[10px]"
               style={{ color: backendOk ? "#34d399" : backendOk === false ? "#f87171" : "#4b5563" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                  style={{ background: backendOk ? "#34d399" : backendOk === false ? "#f87171" : "#4b5563" }} />
            {backendOk ? "BACKEND ONLINE" : backendOk === false ? "BACKEND OFFLINE" : "..."}
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(30,41,59,0.8)" }} />

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold"
               style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            LIVE
          </div>

          <span className="text-[10px] font-mono hidden md:block" style={{ color: "#374151" }}>{timeStr} UTC</span>
        </div>
      </div>
    </nav>
  );
}
