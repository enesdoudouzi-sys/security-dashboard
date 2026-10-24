"use client";
import { useState, useEffect, useRef } from "react";
import { BACKEND } from "@/lib/backend";

// Tab-Gruppen, damit die Leiste trotz vieler Tabs aufgeräumt bleibt.
type Tab = { id: string; label: string; icon: string };
const OVERVIEW: Tab = { id: "overview", label: "Übersicht", icon: "▣" };
const GROUPS: { group: string; tabs: Tab[] }[] = [
  { group: "Monitoring", tabs: [
    { id: "radar",           label: "Bedrohungsradar", icon: "📡" },
    { id: "vulnerabilities", label: "Schwachstellen", icon: "◈" },
    { id: "threats",         label: "Bedrohungen",    icon: "☣" },
    { id: "network",         label: "Netzwerk",       icon: "⬡" },
    { id: "scans",           label: "Scans",          icon: "⊕" },
  ]},
  { group: "Scannen", tabs: [
    { id: "exposure", label: "Exposure-Check (echt)", icon: "🛰" },
    { id: "localscan", label: "Lokaler Scan (dein PC)", icon: "💻" },
    { id: "dnsrecon", label: "DNS-Recon (echt)", icon: "🌐" },
    { id: "ipgeo", label: "IP-Geolocation (echt)", icon: "📍" },
    { id: "vulnscan", label: "Schwachstellen-Scan", icon: "◎" },
    { id: "cve",      label: "CVE-Suche",           icon: "🔎" },
    { id: "commands", label: "Befehle",             icon: "⌨" },
  ]},
  { group: "Analyse", tabs: [
    { id: "headercheck", label: "Header-Check (echt)", icon: "🔐" },
    { id: "certcheck",   label: "SSL-Zertifikat (echt)", icon: "📜" },
    { id: "attack",      label: "ATT&CK",       icon: "🎯" },
    { id: "loganalyzer", label: "Log-Analyse",  icon: "📑" },
    { id: "phishing",    label: "Phishing",     icon: "🎣" },
    { id: "encoder",     label: "Encoder",      icon: "🔄" },
    { id: "nettools",    label: "Netz & Hash",  icon: "🌐" },
  ]},
  { group: "Reaktion & Schutz", tabs: [
    { id: "playbooks", label: "Playbooks",   icon: "📋" },
    { id: "protect",   label: "PC-Schutz",   icon: "🛡" },
    { id: "hardening", label: "Härtung",     icon: "⚙" },
    { id: "seccheck",  label: "Security-Check", icon: "📊" },
    { id: "password",  label: "Passwörter",  icon: "🔑" },
    { id: "breach",    label: "Breach-Check (echt)", icon: "🔓" },
    { id: "tools",     label: "Werkzeuge",   icon: "🧰" },
    { id: "security",  label: "Sicherheits-Status", icon: "✅" },
  ]},
  { group: "Lernen", tabs: [
    { id: "progress", label: "Mein Fortschritt", icon: "📈" },
    { id: "challenges", label: "Challenges", icon: "🧩" },
    { id: "roadmap", label: "Lern-Roadmap", icon: "🧭" },
    { id: "quiz",    label: "Quiz",         icon: "❓" },
    { id: "journal", label: "Logbuch",      icon: "📓" },
    { id: "about",   label: "Über / Projekt", icon: "⭐" },
  ]},
];

export function Navbar({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  const [now, setNow] = useState<Date | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function ping() {
      try {
        const res = await fetch(`${BACKEND}/api/health`, { signal: AbortSignal.timeout(2000) });
        setBackendOk(res.ok);
      } catch {
        setBackendOk(false);
      }
    }
    ping();
    const id = setInterval(ping, 10000);
    return () => clearInterval(id);
  }, []);

  // Dropdown schließen bei Klick außerhalb oder Escape.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(null); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  function pick(id: string) { setActive(id); setOpen(null); }

  const timeStr = now ? now.toISOString().slice(0, 19).replace("T", " ") : "";
  const activeLabel = active === OVERVIEW.id
    ? OVERVIEW.label
    : GROUPS.flatMap((g) => g.tabs).find((t) => t.id === active)?.label ?? "";

  return (
    <nav ref={navRef} className="sticky top-0 z-50"
         style={{ background: "rgba(7,1,15,0.95)", borderBottom: "1px solid rgba(0,240,255,0.15)", backdropFilter: "blur(20px)" }}>
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #00f0ff, #ff2bd6, #00f0ff, transparent)", boxShadow: "0 0 12px rgba(0,240,255,0.6)" }} />

      <div className="flex flex-wrap items-center px-3 sm:px-5 gap-x-0 gap-y-1 py-1.5 lg:py-0 lg:flex-nowrap lg:h-14">
        {/* Logo */}
        <div className="flex items-center gap-3 pr-5 mr-2" style={{ borderRight: "1px solid rgba(30,41,59,0.8)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-ring flex-shrink-0"
               style={{ background: "linear-gradient(135deg, #0a2838 0%, #0e3a4d 100%)", border: "1px solid rgba(0,240,255,0.5)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold tracking-tight text-gradient-green">CyberShield</div>
            <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#4b5563" }}>SOC Platform</div>
          </div>
        </div>

        {/* Übersicht (direkt) */}
        <button onClick={() => pick(OVERVIEW.id)}
          className="relative flex items-center h-11 lg:h-14 px-3 sm:px-3.5 text-[12px] sm:text-[13px] uppercase tracking-[0.1em] font-medium cursor-pointer whitespace-nowrap transition-all"
          style={active === OVERVIEW.id ? { color: "#00f0ff", textShadow: "0 0 15px rgba(0,240,255,0.6)" } : { color: "#64748b" }}>
          {OVERVIEW.label}
          {active === OVERVIEW.id && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #00f0ff, transparent)" }} />}
        </button>

        {/* Gruppen als Dropdowns */}
        {GROUPS.map((g) => {
          const hasActive = g.tabs.some((t) => t.id === active);
          const isOpen = open === g.group;
          return (
            <div key={g.group} className="relative h-11 lg:h-14">
              <button onClick={() => setOpen(isOpen ? null : g.group)}
                className="relative flex items-center gap-1 h-11 lg:h-14 px-3 sm:px-3.5 text-[12px] sm:text-[13px] uppercase tracking-[0.1em] font-medium cursor-pointer whitespace-nowrap transition-all"
                style={hasActive || isOpen ? { color: "#00f0ff", textShadow: hasActive ? "0 0 15px rgba(0,240,255,0.6)" : "none" } : { color: "#64748b" }}>
                {g.group}
                <span className="text-[9px]" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▼</span>
                {hasActive && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #00f0ff, transparent)" }} />}
              </button>
              {isOpen && (
                <div className="absolute top-full left-0 rounded-xl overflow-hidden py-1 animate-fade-in z-50"
                     style={{ minWidth: 200, background: "rgba(7,1,15,0.98)", border: "1px solid rgba(0,240,255,0.25)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}>
                  {g.tabs.map((t) => (
                    <button key={t.id} onClick={() => pick(t.id)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-left cursor-pointer transition-all"
                      style={active === t.id
                        ? { background: "rgba(0,240,255,0.15)", color: "#00f0ff" }
                        : { color: "#94a3b8" }}
                      onMouseEnter={(e) => { if (active !== t.id) e.currentTarget.style.background = "rgba(30,41,59,0.5)"; }}
                      onMouseLeave={(e) => { if (active !== t.id) e.currentTarget.style.background = "transparent"; }}>
                      <span className="text-[15px] w-5 text-center">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Right (auf kleinen Bildschirmen ausgeblendet, um Platz zu sparen) */}
        <div className="ml-auto hidden md:flex items-center gap-4">
          {/* aktiver Tab-Name (klein, zur Orientierung) */}
          <span className="text-[12px] uppercase tracking-[0.15em] hidden lg:block" style={{ color: "#334155" }}>{activeLabel}</span>

          <div className="flex items-center gap-1.5 text-[12px]"
               title={backendOk
                 ? "Scanner-Backend verbunden – Live-Nmap-Scans sind möglich."
                 : "Scanner-Backend ist optional. Alle Analyse-Tabs laufen ohne Backend im Browser. Für Live-Scans Backend lokal starten oder auf Render deployen."}
               style={{ color: backendOk ? "#00f0ff" : "#64748b" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: backendOk ? "#00f0ff" : "#475569" }} />
            <span className="hidden md:inline">{backendOk ? "SCANNER VERBUNDEN" : backendOk === false ? "SCANNER OPTIONAL" : "..."}</span>
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(30,41,59,0.8)" }} className="hidden md:block" />

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-bold"
               style={{ background: "rgba(255,43,214,0.12)", border: "1px solid rgba(255,43,214,0.45)", color: "#ff2bd6", boxShadow: "0 0 14px rgba(255,43,214,0.35)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "#ff2bd6" }} />
            LIVE
          </div>

          <span className="text-[12px] font-mono hidden xl:block" style={{ color: "#374151" }}>{timeStr} UTC</span>
        </div>
      </div>
    </nav>
  );
}
