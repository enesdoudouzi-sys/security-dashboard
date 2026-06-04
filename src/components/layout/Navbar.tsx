"use client";
import { useState, useEffect } from "react";

const tabs = [
  { id: "overview",        label: "Übersicht"      },
  { id: "vulnerabilities", label: "Schwachstellen" },
  { id: "threats",         label: "Bedrohungen"    },
  { id: "network",         label: "Netzwerk"       },
  { id: "scans",           label: "Scans"          },
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
    <nav className="bg-gray-900/95 backdrop-blur border-b border-gray-800 px-6 py-0 flex items-center gap-0 sticky top-0 z-50">
      <div className="flex items-center gap-3 pr-8 border-r border-gray-800 mr-2">
        <div className="w-7 h-7 rounded bg-green-500/20 border border-green-500/40 flex items-center justify-center">
          <span className="text-green-400 text-sm font-bold">⬡</span>
        </div>
        <div>
          <div className="text-green-400 text-sm font-bold tracking-tight">CyberShield</div>
          <div className="text-gray-600 text-[10px] uppercase tracking-wider">SOC Dashboard</div>
        </div>
      </div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={`px-4 py-4 text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            active === tab.id
              ? "border-green-400 text-green-400 bg-green-400/5"
              : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
          }`}
        >
          {tab.label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          LIVE
        </span>
        <span className="text-gray-600 text-xs font-mono">{timeStr}</span>
      </div>
    </nav>
  );
}
