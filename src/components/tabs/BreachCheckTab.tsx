"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Breach-Check: prüft ein Passwort gegen die ECHTE "Have I Been Pwned"-Datenbank
// (Pwned Passwords API) per k-Anonymity. Dabei verlässt NUR der SHA-1-Präfix
// (erste 5 Zeichen) den Browser – das Passwort selbst niemals.
// https://api.pwnedpasswords.com/range/<5-hex>  – kostenlos, kein Key, CORS.

async function sha1Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// grobe Stärke-Einschätzung (nur Hinweis, lokal)
function strength(pw: string): { label: string; color: string; pct: number } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  const map = [
    { label: "sehr schwach", color: "#f87171", pct: 20 },
    { label: "schwach", color: "#fb923c", pct: 40 },
    { label: "okay", color: "#fbbf24", pct: 60 },
    { label: "gut", color: "#00f0ff", pct: 80 },
    { label: "stark", color: "#00ffa3", pct: 100 },
  ];
  return map[Math.min(s, 4)];
}

export function BreachCheckTab() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "safe" | "pwned" | "error">("idle");
  const [count, setCount] = useState(0);

  async function check() {
    if (!pw) return;
    setState("loading");
    try {
      const hash = await sha1Hex(pw);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(String(res.status));
      const text = await res.text();
      let found = 0;
      for (const line of text.split("\n")) {
        const [suf, cnt] = line.trim().split(":");
        if (suf === suffix) { found = parseInt(cnt || "0", 10); break; }
      }
      setCount(found);
      setState(found > 0 ? "pwned" : "safe");
    } catch { setState("error"); }
  }

  const st = strength(pw);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Breach-Check · Passwort-Leak</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Prüfe, ob ein Passwort in echten Datenlecks aufgetaucht ist — gegen die „Have I Been Pwned"-Datenbank
          (über 10 Milliarden geleakte Passwörter). <b style={{ color: "#00ffa3" }}>Dein Passwort verlässt dabei nie den Browser.</b>
        </p>
      </div>

      <div className="mb-4"><LearnNote title="Wie bleibt das sicher? (k-Anonymity)">
        Dein Passwort wird <b>lokal</b> zu einem SHA-1-Hash berechnet. An den Server gehen nur die <b>ersten 5 Zeichen</b>
        dieses Hashes – der Server schickt dann <i>alle</i> passenden Hashes zurück, und der Abgleich passiert wieder bei dir.
        So erfährt der Server nie, welches Passwort du prüfst. Diese Technik heißt <b>k-Anonymity</b> und ist ein echtes
        Security-Konzept, das du im Job kennen solltest.
      </LearnNote></div>

      <div className="rounded-xl p-5" style={{ background: "rgba(13,6,26,0.6)", border: "1px solid rgba(0,240,255,0.18)" }}>
        <label className="text-[13px] font-semibold" style={{ color: "#94a3b8" }}>Passwort eingeben</label>
        <div className="flex gap-2 mt-2">
          <input type={show ? "text" : "password"} value={pw} onChange={(e) => { setPw(e.target.value); setState("idle"); }}
            onKeyDown={(e) => e.key === "Enter" && check()} autoComplete="off"
            placeholder="z. B. dein übliches Passwort testen…"
            className="flex-1 px-3 py-2.5 rounded-xl text-[15px] outline-none font-mono"
            style={{ background: "#07010f", border: "1px solid rgba(0,240,255,0.25)", color: "#e2e8f0", caretColor: "#00f0ff" }} />
          <button onClick={() => setShow((s) => !s)} title="anzeigen/verbergen"
            className="px-3 rounded-xl cursor-pointer" style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)", color: "#7df9ff" }}>
            {show ? "🙈" : "👁"}
          </button>
          <button onClick={check} disabled={!pw || state === "loading"}
            className="px-5 py-2.5 rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }}>
            {state === "loading" ? "Prüfe…" : "Prüfen"}
          </button>
        </div>

        {pw && (
          <div className="mt-3">
            <div className="flex justify-between text-[12px] mb-1">
              <span style={{ color: "#64748b" }}>Stärke (lokal geschätzt)</span>
              <span style={{ color: st.color }}>{st.label}</span>
            </div>
            <div className="w-full rounded-full h-1.5" style={{ background: "rgba(30,41,59,0.8)" }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${st.pct}%`, background: st.color }} />
            </div>
          </div>
        )}
      </div>

      {state === "pwned" && (
        <div className="mt-5 rounded-2xl p-5 text-center" style={{ background: "rgba(127,29,29,0.22)", border: "1px solid rgba(239,68,68,0.5)" }}>
          <div className="text-4xl mb-1">🚨</div>
          <div className="text-xl font-bold" style={{ color: "#f87171" }}>Geleakt!</div>
          <div className="text-[15px] mt-2" style={{ color: "#e2e8f0" }}>
            Dieses Passwort wurde <b style={{ color: "#f87171" }}>{count.toLocaleString("de-DE")}×</b> in bekannten Datenlecks gefunden.
          </div>
          <div className="text-[13px] mt-2" style={{ color: "#fca5a5" }}>
            Nutze es nirgendwo mehr! Ändere es überall, wo du es verwendest, und schalte 2-Faktor-Authentifizierung ein.
          </div>
        </div>
      )}

      {state === "safe" && (
        <div className="mt-5 rounded-2xl p-5 text-center" style={{ background: "rgba(6,78,59,0.25)", border: "1px solid rgba(0,255,163,0.4)" }}>
          <div className="text-4xl mb-1">✅</div>
          <div className="text-xl font-bold" style={{ color: "#00ffa3" }}>Nicht in Leaks gefunden</div>
          <div className="text-[13px] mt-2" style={{ color: "#7df9ff" }}>
            Dieses Passwort taucht in keinem bekannten Datenleck auf. Trotzdem gilt: für jeden Dienst ein eigenes,
            langes Passwort — am besten mit einem Passwort-Manager.
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="mt-5 rounded-xl p-4 text-[14px]" style={{ background: "rgba(127,29,29,0.18)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
          Die Abfrage war nicht möglich (Netzwerkproblem oder API-Limit). Bitte versuche es erneut.
        </div>
      )}

      <p className="text-center text-[11px] mt-4" style={{ color: "#475569" }}>
        Quelle: Have I Been Pwned – Pwned Passwords (k-Anonymity). Es wird nur ein 5-stelliger Hash-Präfix gesendet.
      </p>
    </div>
  );
}
