"use client";
import { useState, useEffect } from "react";

interface Entry {
  id: string;
  date: string;
  platform: string;
  title: string;
  notes: string;
}

const STORE_KEY = "learning-journal";
const PLATFORMS = ["TryHackMe", "Hack The Box", "PortSwigger", "picoCTF", "OverTheWire", "Eigenes Labor", "Sonstiges"];

export function JournalTab() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORE_KEY) || "[]")); } catch { /* ignore */ }
  }, []);

  function save(next: Entry[]) {
    setEntries(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function add() {
    if (!title.trim()) return;
    const entry: Entry = {
      id: Date.now().toString(36),
      date: new Date().toISOString().slice(0, 10),
      platform, title: title.trim(), notes: notes.trim(),
    };
    save([entry, ...entries]);
    setTitle(""); setNotes("");
  }
  function remove(id: string) { save(entries.filter((e) => e.id !== id)); }

  function exportMd() {
    const md = "# Mein Hacking-Lernlogbuch\n\n" + entries.map((e) =>
      `## ${e.date} · ${e.platform}\n**${e.title}**\n\n${e.notes || "_(keine Notizen)_"}\n`).join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lernlogbuch.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const inputStyle = { background: "#07010f", border: "1px solid rgba(51,65,85,0.6)", color: "#e2e8f0" };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gradient-green">Lern-Logbuch</h2>
          <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
            Halte fest, was du gelernt hast. Alles bleibt lokal in deinem Browser. {entries.length} Einträge.
          </p>
        </div>
        {entries.length > 0 && (
          <button onClick={exportMd}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-bold uppercase tracking-wider cursor-pointer"
            style={{ color: "#94a3b8", background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.6)" }}>
            ↓ Als Markdown
          </button>
        )}
      </div>

      {/* Neuer Eintrag */}
      <div className="rounded-xl p-5 mb-6" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}
            className="rounded-lg px-3 py-2 text-[15px] outline-none" style={inputStyle}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Was hast du gemacht? (z. B. SQL-Injection Lab gelöst)"
            className="rounded-lg px-3 py-2 text-[15px] outline-none" style={inputStyle} />
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="Notizen: Vorgehen, Befehle, was du gelernt hast…"
          className="w-full mt-3 rounded-lg px-3 py-2 text-[15px] outline-none resize-y" style={inputStyle} />
        <button onClick={add}
          className="mt-3 px-4 py-2 rounded-lg text-[14px] font-bold uppercase tracking-wider cursor-pointer"
          style={{ color: "#00f0ff", background: "rgba(10,26,46,0.4)", border: "1px solid rgba(0,240,255,0.4)" }}>
          + Eintrag speichern
        </button>
      </div>

      {/* Einträge */}
      {entries.length === 0 ? (
        <div className="rounded-xl p-10 text-center text-[15px]" style={{ background: "rgba(15,23,42,0.4)", border: "1px dashed rgba(51,65,85,0.6)", color: "#64748b" }}>
          Noch keine Einträge. Trag deinen ersten Lernfortschritt ein! 🚀
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="px-2 py-0.5 rounded font-bold" style={{ background: "rgba(10,26,46,0.4)", color: "#00f0ff", border: "1px solid rgba(0,240,255,0.3)" }}>{e.platform}</span>
                  <span style={{ color: "#475569" }}>{e.date}</span>
                </div>
                <button onClick={() => remove(e.id)} aria-label="Löschen"
                  className="text-[16px] cursor-pointer" style={{ color: "#475569" }}>✕</button>
              </div>
              <h4 className="mt-2 text-[16px] font-bold" style={{ color: "#e2e8f0" }}>{e.title}</h4>
              {e.notes && <p className="mt-1 text-[14px] whitespace-pre-wrap" style={{ color: "#94a3b8" }}>{e.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
