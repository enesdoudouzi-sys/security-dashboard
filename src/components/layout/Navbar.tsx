"use client";
import { useState, useEffect } from "react";

const tabs = [
  { id: "overview",        label: "Übersicht",      icon: "◈" },
  { id: "vulnerabilities", label: "Schwachstellen",  icon: "⬡" },
  { id: "threats",         label: "Bedrohungen",     icon: "☣" },
  { id: "network",         label: "Netzwerk",        icon: "⬡" },
  { id: "scans",           label: "Scans",           icon: "⊕" },
];

export function Navbar({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now ? now.toISOString().slice(0, 19).replace("T", " ") + " UTC" : "";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800/80"
         style={{ background: "linear-gradient(180deg, #0a0f1a 0%, #0d1117 100%)" }}>
      <div className="flex items-center px-4 gap-0">
        {/* Logo */}
        <div className="flex items-center gap-3 pr-6 border-r border-gray-800 mr-3 py-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center glow-green"
               style={{ background: "linear-gradient(135deg, #064e3b, #065f46)", border: "1px solid #10b981" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight" style={{ color: "#34d399" }}>CyberShield</div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500">SOC Dashboard</div>
          </div>
        </div>

        {/* Tabs */}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-4 text-[11px] uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              active === tab.id
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600"
            }`}
            style={active === tab.id ? { textShadow: "0 0 12px rgba(52,211,153,0.6)" } : {}}
          >
            {tab.label}
          </button>
        ))}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3 pl-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold"
               style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            LIVE
          </div>
          <span className="text-gray-600 text-[11px] font-mono hidden sm:block">{timeStr}</span>
        </div>
      </div>
    </nav>
  );
}
