"use client";
import { useState, useEffect } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Lern-Zentrale: bündelt den Fortschritt aus allen Lern-Tabs (localStorage).
// Rein im Browser, nichts wird gesendet.

function readObj(key: string): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}
function countTrue(o: Record<string, unknown>): number {
  return Object.values(o).filter(Boolean).length;
}

type Row = { id: string; icon: string; label: string; value: number; max?: number; tab: string; hint: string };

export function ProgressTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const roadmap = countTrue(readObj("learn-roadmap"));
    const playbooks = countTrue(readObj("ir-playbooks"));
    const hardening = countTrue(readObj("hardening-done"));
    let journal = 0, quizBest = 0;
    try { journal = (JSON.parse(localStorage.getItem("learning-journal") || "[]") as unknown[]).length; } catch {}
    try { quizBest = Number(localStorage.getItem("quiz-best") || "0"); } catch {}

    const r: Row[] = [
      { id: "roadmap", icon: "🧭", label: "Lern-Roadmap", value: roadmap, max: 16, tab: "roadmap", hint: "abgehakte Skills" },
      { id: "quiz", icon: "❓", label: "Quiz-Bestscore", value: quizBest, max: 10, tab: "quiz", hint: "beste Runde" },
      { id: "playbooks", icon: "📋", label: "IR-Playbooks", value: playbooks, tab: "playbooks", hint: "erledigte Schritte" },
      { id: "hardening", icon: "⚙", label: "System-Härtung", value: hardening, tab: "hardening", hint: "umgesetzte Punkte" },
      { id: "journal", icon: "📓", label: "Logbuch", value: journal, tab: "journal", hint: "Einträge" },
    ];
    setRows(r);
    setTotal(roadmap + playbooks + hardening + journal + quizBest);
  }, []);

  // Level aus Gesamtpunkten
  const level = Math.floor(total / 10) + 1;
  const inLevel = total % 10;
  const titles = ["Neuling", "Lehrling", "Analyst", "Spezialist", "Experte", "Profi", "Meister"];
  const title = titles[Math.min(level - 1, titles.length - 1)];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Mein Fortschritt</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Dein Lernstand aus allen Bereichen auf einen Blick. Je mehr du abhakst, lernst und übst, desto höher dein Level.
        </p>
      </div>

      <div className="mb-5"><LearnNote title="Warum Fortschritt messen?">
        Cyber Security lernt man in kleinen, regelmäßigen Schritten. Diese Übersicht hält dich motiviert und zeigt,
        wo du dranbleiben solltest. Genau so führt man auch im Job ein <b>Lern-/Kompetenz-Logbuch</b> für Bewerbungen.
      </LearnNote></div>

      {/* Level-Karte */}
      <div className="rounded-2xl p-5 mb-6 flex items-center gap-5"
           style={{ background: "linear-gradient(145deg,#070f1f,#0a1326)", border: "1px solid rgba(0,240,255,0.3)" }}>
        <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
             style={{ background: "linear-gradient(135deg,#0e3a4d,#00b8d4)", color: "#fff" }}>
          <span className="text-[10px] uppercase tracking-wider opacity-80">Level</span>
          <span className="text-3xl font-bold leading-none">{level}</span>
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold" style={{ color: "#00f0ff" }}>{title}</div>
          <div className="text-[12px] mb-2" style={{ color: "#64748b" }}>{total} Punkte gesamt · noch {10 - inLevel} bis Level {level + 1}</div>
          <div className="w-full rounded-full h-2" style={{ background: "rgba(30,41,59,0.8)" }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${inLevel * 10}%`, background: "linear-gradient(90deg,#00b8d4,#00f0ff)" }} />
          </div>
        </div>
      </div>

      {/* Bereiche */}
      <div className="space-y-2.5">
        {rows.map((r) => {
          const pct = r.max ? Math.min(100, Math.round((r.value / r.max) * 100)) : (r.value > 0 ? 100 : 0);
          return (
            <button key={r.id} onClick={() => onNavigate?.(r.tab)}
              className="w-full flex items-center gap-4 rounded-xl px-4 py-3 text-left cursor-pointer transition-all"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
              <span className="text-2xl w-9 text-center flex-shrink-0">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-semibold" style={{ color: "#e2e8f0" }}>{r.label}</span>
                  <span className="text-[13px] font-bold" style={{ color: "#00f0ff" }}>
                    {r.value}{r.max ? ` / ${r.max}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 rounded-full h-1.5" style={{ background: "rgba(30,41,59,0.8)" }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: r.value > 0 ? "linear-gradient(90deg,#00b8d4,#00f0ff)" : "transparent" }} />
                  </div>
                  <span className="text-[10px]" style={{ color: "#64748b" }}>{r.hint}</span>
                </div>
              </div>
              <span style={{ color: "#475569" }}>›</span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] mt-5" style={{ color: "#475569" }}>
        Tipp: Tippe auf einen Bereich, um direkt dorthin zu springen. Dein Fortschritt wird lokal im Browser gespeichert.
      </p>
    </div>
  );
}
