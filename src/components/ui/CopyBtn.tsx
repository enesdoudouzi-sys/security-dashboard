"use client";
import { useState } from "react";

/** Kleiner Button, der einen Befehl in die Zwischenablage kopiert. */
export function CopyBtn({ text, label = "Kopieren" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      /* Zwischenablage nicht verfügbar */
    }
  }
  return (
    <button
      onClick={copy}
      className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
      style={{
        color: done ? "#34d399" : "#94a3b8",
        background: done ? "rgba(6,78,59,0.4)" : "rgba(30,41,59,0.5)",
        border: `1px solid ${done ? "rgba(16,185,129,0.4)" : "rgba(51,65,85,0.6)"}`,
      }}
    >
      {done ? "✓ Kopiert" : label}
    </button>
  );
}

/** Ein Befehl als Code-Zeile mit Kopier-Button. */
export function CommandRow({ cmd, note }: { cmd: string; note?: string }) {
  return (
    <div className="rounded-lg p-3 flex items-start gap-3"
         style={{ background: "#020817", border: "1px solid rgba(30,41,59,0.6)" }}>
      <div className="flex-1 min-w-0">
        <code className="block text-[12px] font-mono break-all" style={{ color: "#67e8f9" }}>
          <span style={{ color: "#4b5563" }}>$ </span>{cmd}
        </code>
        {note && <p className="mt-1.5 text-[11px]" style={{ color: "#64748b" }}>{note}</p>}
      </div>
      <CopyBtn text={cmd} />
    </div>
  );
}
