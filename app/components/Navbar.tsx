"use client";
import { useState, useEffect } from "react";

const tabs = [
  { id: "overview",        label: "Overview"        },
  { id: "vulnerabilities", label: "Vulnerabilities" },
  { id: "threats",         label: "Threat Intel"    },
  { id: "network",         label: "Network Events"  },
  { id: "scans",           label: "Scan History"    },
];

export function Navbar({
  active,
  setActive,
}: {
  active: string;
  setActive: (id: string) => void;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now
    ? now.toISOString().slice(0, 19).replace("T", " ") + " UTC"
    : "";

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-0 flex items-center gap-0">
      <div className="flex items-center gap-3 pr-8 border-r border-gray-800 mr-4">
        <span className="text-green-400 text-lg font-bold tracking-tight">⬡ CyberShield</span>
        <span className="text-gray-600 text-xs">SOC Dashboard</span>
      </div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={`px-4 py-4 text-xs uppercase tracking-widest border-b-2 transition-colors cursor-pointer ${
            active === tab.id
              ? "border-green-400 text-green-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          LIVE
        </span>
        <span className="text-gray-600 text-xs font-mono">{timeStr}</span>
      </div>
    </nav>
  );
}
