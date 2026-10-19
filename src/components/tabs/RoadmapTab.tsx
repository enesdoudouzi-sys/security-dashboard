"use client";
import { useState, useEffect } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Lern-Roadmap für den Einstieg in Cyber Security – abhakbar, Fortschritt lokal gespeichert.

type Stage = {
  id: string; title: string; weeks: string; goal: string;
  skills: string[];
  platforms: { name: string; url: string; note: string }[];
  cert?: { name: string; note: string };
};

const STAGES: Stage[] = [
  {
    id: "basics", title: "1 · Fundament", weeks: "Wochen 1–6",
    goal: "Verstehen, wie Netzwerke, Betriebssysteme und das Web funktionieren – darauf baut alles auf.",
    skills: [
      "Linux-Grundlagen (Terminal, Rechte, Prozesse, ssh)",
      "Netzwerk-Basics (IP, TCP/UDP, Ports, DNS, HTTP/HTTPS)",
      "Wie funktioniert das Web? (Request/Response, Cookies, Header)",
      "Eine Skriptsprache: Python oder Bash – Grundlagen",
    ],
    platforms: [
      { name: "TryHackMe – Pre Security", url: "https://tryhackme.com/path/outline/presecurity", note: "Perfekter, geführter Einstieg (Deutsch-freundlich, Browser)" },
      { name: "OverTheWire – Bandit", url: "https://overthewire.org/wargames/bandit/", note: "Linux/Terminal spielerisch lernen" },
    ],
  },
  {
    id: "security101", title: "2 · Security-Grundlagen", weeks: "Wochen 6–14",
    goal: "Angriffs- & Verteidigungs-Denkweise aufbauen, Werkzeuge kennenlernen.",
    skills: [
      "CIA-Triade, Bedrohungen, Schwachstellen vs. Exploits",
      "MITRE ATT&CK verstehen (ATT&CK-Tab im Dashboard nutzen!)",
      "Nmap, Wireshark, Burp Suite Basics",
      "Erste Übungen gegen scanme.nmap.org & eigenes Labor",
    ],
    platforms: [
      { name: "TryHackMe – Complete Beginner / Jr Pentester", url: "https://tryhackme.com/paths", note: "Geführte Lernpfade mit Übungs-Maschinen" },
      { name: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security", note: "Kostenlos, exzellent für Web-Schwachstellen (SQLi, XSS…)" },
    ],
    cert: { name: "CompTIA Security+", note: "Breit anerkannt für den Einstieg – gutes erstes Zertifikat für Bewerbungen." },
  },
  {
    id: "handson", title: "3 · Praxis & Hacking", weeks: "Monate 4–8",
    goal: "Echte (legale) Maschinen angreifen, Methodik verinnerlichen, Berichte schreiben.",
    skills: [
      "Enumeration → Exploitation → Privilege Escalation → Report",
      "Eigenes Labor: Kali + Metasploitable / DVWA / Juice Shop",
      "Write-ups schreiben (dokumentieren wie ein Profi)",
      "Blue-Team-Seite: Logs lesen, Alarme triagieren (Log-Analyse-Tab!)",
    ],
    platforms: [
      { name: "Hack The Box", url: "https://www.hackthebox.com/", note: "Realistische Maschinen, große Community" },
      { name: "picoCTF", url: "https://picoctf.org/", note: "Einsteiger-freundliche CTF-Challenges" },
    ],
    cert: { name: "eJPT (INE)", note: "Praktisches Einstiegs-Pentest-Zertifikat – sehr gutes Preis-/Leistungsverhältnis." },
  },
  {
    id: "specialize", title: "4 · Spezialisieren & Bewerben", weeks: "ab Monat 8",
    goal: "Eine Richtung wählen und gezielt vertiefen – dann bewerben.",
    skills: [
      "Richtung wählen: Pentest (Red), SOC/IR (Blue), DevSecOps, Cloud-Security",
      "Portfolio bauen: GitHub, Write-ups, dieses Dashboard zeigen!",
      "LinkedIn pflegen, Lebenslauf auf die Richtung zuschneiden",
      "Auf Junior-Stellen / Praktika / Werkstudent bewerben",
    ],
    platforms: [
      { name: "LetsDefend (Blue Team)", url: "https://letsdefend.io/", note: "SOC-Analyst-Simulation – echte Alarme bearbeiten" },
      { name: "TryHackMe – SOC Level 1", url: "https://tryhackme.com/paths", note: "Blue-Team-Lernpfad" },
    ],
    cert: { name: "Je nach Richtung: PNPT / OSCP (Red) oder BTL1 / CySA+ (Blue)", note: "Fortgeschritten – erst nach solider Praxis angehen." },
  },
];

export function RoadmapTab() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(STAGES[0].id);

  useEffect(() => {
    try { const s = localStorage.getItem("learn-roadmap"); if (s) setDone(JSON.parse(s)); } catch {}
  }, []);
  function toggle(key: string) {
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("learn-roadmap", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const allKeys = STAGES.flatMap((s, si) => s.skills.map((_, i) => `${s.id}-${i}`));
  const doneCount = allKeys.filter((k) => done[k]).length;
  const pct = Math.round((doneCount / allKeys.length) * 100);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Lern-Roadmap: Einstieg in Cyber Security</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Ein realistischer Weg vom Anfänger zum ersten Job. Hake ab, was du kannst – dein Fortschritt bleibt gespeichert.
        </p>
      </div>

      <div className="mb-4"><LearnNote title="So nutzt du das">
        Arbeite die Phasen <b>der Reihe nach</b> ab. Die meisten Plattformen haben kostenlose Inhalte – fang damit an,
        bevor du Geld für Zertifikate ausgibst. Wichtig: <b>Praxis schlägt Theorie</b>. Lieber Maschinen hacken &amp; Write-ups
        schreiben als nur Videos schauen. Dieses Dashboard ist schon ein Portfolio-Stück für deine Bewerbung!
      </LearnNote></div>

      <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] uppercase tracking-wider font-bold" style={{ color: "#94a3b8" }}>Gesamt-Fortschritt</span>
          <span className="text-[14px] font-bold" style={{ color: pct === 100 ? "#34d399" : "#94a3b8" }}>{doneCount}/{allKeys.length} · {pct}%</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: "rgba(30,41,59,0.8)" }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
        </div>
      </div>

      <div className="space-y-3">
        {STAGES.map((s) => {
          const isOpen = open === s.id;
          const stageKeys = s.skills.map((_, i) => `${s.id}-${i}`);
          const stageDone = stageKeys.filter((k) => done[k]).length;
          return (
            <div key={s.id} className="rounded-xl overflow-hidden" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
              <button onClick={() => setOpen(isOpen ? "" : s.id)} className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer text-left">
                <div>
                  <div className="text-[16px] font-bold" style={{ color: "#e2e8f0" }}>{s.title}</div>
                  <div className="text-[13px] mt-0.5" style={{ color: "#64748b" }}>{s.weeks} · {s.goal}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold" style={{ color: stageDone === stageKeys.length ? "#34d399" : "#64748b" }}>{stageDone}/{stageKeys.length}</span>
                  <span style={{ color: "#34d399" }}>{isOpen ? "▾" : "▸"}</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-4">
                  <div>
                    <div className="text-[12px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>Das solltest du können</div>
                    <div className="space-y-1.5">
                      {s.skills.map((skill, i) => {
                        const key = `${s.id}-${i}`; const checked = !!done[key];
                        return (
                          <button key={i} onClick={() => toggle(key)}
                            className="w-full flex items-start gap-3 text-left rounded-lg px-3 py-2 cursor-pointer"
                            style={{ background: checked ? "rgba(6,78,59,0.25)" : "rgba(2,8,23,0.5)", border: `1px solid ${checked ? "rgba(16,185,129,0.3)" : "rgba(30,41,59,0.5)"}` }}>
                            <span className="w-5 h-5 rounded flex items-center justify-center text-[13px] font-bold flex-shrink-0 mt-0.5"
                                  style={{ background: checked ? "#10b981" : "transparent", border: `1px solid ${checked ? "#10b981" : "#475569"}`, color: "#020817" }}>{checked ? "✓" : ""}</span>
                            <span className="text-[14.5px]" style={{ color: checked ? "#64748b" : "#cbd5e1", textDecoration: checked ? "line-through" : "none" }}>{skill}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>Übungs-Plattformen</div>
                    <div className="space-y-2">
                      {s.platforms.map((p, i) => (
                        <a key={i} href={p.url} target="_blank" rel="noreferrer"
                           className="block rounded-lg px-3 py-2" style={{ background: "#020817", border: "1px solid rgba(30,41,59,0.6)" }}>
                          <div className="text-[14px] font-semibold" style={{ color: "#67e8f9" }}>↗ {p.name}</div>
                          <div className="text-[13px]" style={{ color: "#64748b" }}>{p.note}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                  {s.cert && (
                    <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                      <div className="text-[13px] uppercase tracking-wider font-bold mb-0.5" style={{ color: "#34d399" }}>🎓 Passendes Zertifikat</div>
                      <div className="text-[14px] font-semibold" style={{ color: "#e2e8f0" }}>{s.cert.name}</div>
                      <div className="text-[13px]" style={{ color: "#94a3b8" }}>{s.cert.note}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
