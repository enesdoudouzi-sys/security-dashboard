"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Praktische Challenges, die fordern – Security + Full-Stack. Sofortige Prüfung im Browser.
// Typen: input (Textabgleich), mc (Multiple Choice), regex (eigene Regex gegen Testfälle).

type Base = { id: string; cat: string; diff: "Einsteiger" | "Fortgeschritten" | "Profi"; q: string; code?: string; hint?: string; explain: string };
type Ch =
  | (Base & { kind: "input"; answers: string[] })
  | (Base & { kind: "mc"; options: string[]; correct: number })
  | (Base & { kind: "regex"; must: string[]; mustNot: string[] });

const CHALLENGES: Ch[] = [
  { id: "c1", cat: "Encoding", diff: "Einsteiger", kind: "input",
    q: "Dekodiere diesen Base64-Text (ohne Werkzeug im Kopf oder mit dem Encoder-Tab):",
    code: "U2ljaGVyaGVpdA==", answers: ["sicherheit"],
    hint: "Base64 → Text. Nutze notfalls den Encoder-Tab (Dekodieren).",
    explain: "U2ljaGVyaGVpdA== ist Base64 für „Sicherheit“. Angreifer verstecken Payloads oft so." },
  { id: "c2", cat: "Netzwerk", diff: "Einsteiger", kind: "input",
    q: "Welcher Standard-Port gehört zu HTTPS?", answers: ["443"],
    explain: "443 = HTTPS, 80 = HTTP, 22 = SSH, 3389 = RDP." },
  { id: "c3", cat: "Krypto", diff: "Einsteiger", kind: "mc",
    q: "Welcher dieser Hash-Algorithmen gilt als UNSICHER?",
    options: ["SHA-256", "MD5", "SHA-3", "bcrypt"], correct: 1,
    explain: "MD5 ist gebrochen (Kollisionen) – nie für Sicherheit nutzen. SHA-256/3 & bcrypt sind ok." },
  { id: "c4", cat: "Code-Review", diff: "Fortgeschritten", kind: "mc",
    q: "Welche Schwachstelle steckt in diesem Code?",
    code: 'db.query("SELECT * FROM users WHERE name=\'" + input + "\'")',
    options: ["XSS", "SQL-Injection", "CSRF", "Pfad-Traversal"], correct: 1,
    explain: "Benutzereingabe wird direkt in den SQL-String gehängt → SQL-Injection. Angreifer kann die Abfrage manipulieren." },
  { id: "c5", cat: "Secure Coding", diff: "Fortgeschritten", kind: "mc",
    q: "Wie behebt man die Lücke aus der vorigen Aufgabe am besten?",
    options: ["Eingabe in Großbuchstaben umwandeln", "Prepared Statements / Parameter-Bindung", "Die Eingabe kürzen", "Das Passwort hashen"], correct: 1,
    explain: "Prepared Statements trennen Code von Daten – die Eingabe kann die Abfrage nicht mehr verändern." },
  { id: "c6", cat: "Krypto", diff: "Fortgeschritten", kind: "input",
    q: "Wie viele Hex-Zeichen hat ein SHA-256-Hash?", answers: ["64"],
    hint: "256 Bit, 4 Bit pro Hex-Zeichen.", explain: "256 / 4 = 64 Hex-Zeichen. SHA-1 = 40, MD5 = 32." },
  { id: "c7", cat: "Regex", diff: "Fortgeschritten", kind: "regex",
    q: "Schreibe eine Regex, die eine Hex-Farbe wie #1a2b3c matcht (genau 6 Hex-Ziffern nach #).",
    must: ["#1a2b3c", "#FFFFFF", "#000000", "#abc123"],
    mustNot: ["1a2b3c", "#12345", "#12345g", "#1234567", "rot"],
    hint: "Anker ^…$, Zeichenklasse [0-9a-fA-F], genaue Anzahl {6}.",
    explain: "Eine gute Lösung: ^#[0-9a-fA-F]{6}$ – Anker sorgen dafür, dass GENAU dieses Muster passt." },
  { id: "c8", cat: "Web-Security", diff: "Profi", kind: "mc",
    q: "Welches Risiko entsteht hier in einer React-App?",
    code: "<div dangerouslySetInnerHTML={{ __html: userInput }} />",
    options: ["SQL-Injection", "Cross-Site-Scripting (XSS)", "SSRF", "Clickjacking"], correct: 1,
    explain: "Ungefilterter userInput als HTML → XSS. Angreifer kann Skripte einschleusen. Niemals ungeprüft so rendern." },
  { id: "c9", cat: "HTTP-Security", diff: "Profi", kind: "input",
    q: "Nenne den HTTP-Header, der am klassischsten vor Clickjacking schützt (ein Wort/Headername).",
    answers: ["x-frame-options", "frame-ancestors", "content-security-policy"],
    hint: "Beginnt mit „X-Frame-…“ – oder die moderne CSP-Direktive.",
    explain: "X-Frame-Options (bzw. CSP frame-ancestors) verbietet, die Seite in fremde <iframe> einzubetten." },
  { id: "c10", cat: "JWT", diff: "Profi", kind: "input",
    q: "Dekodiere den Payload dieses JWT und nenne den Wert von „role“:",
    code: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZW5lcyIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTk5OTk5OTk5OX0.SIG",
    answers: ["admin"],
    hint: "Der mittlere Teil (zwischen den Punkten) ist Base64 – nutze den JWT-Decoder im Encoder-Tab.",
    explain: "Der Payload lautet {\"user\":\"enes\",\"role\":\"admin\",…}. Merke: ein JWT ist nur kodiert, NICHT verschlüsselt – niemals Geheimnisse hineinschreiben!" },
];

const DIFF_COLOR: Record<string, string> = { "Einsteiger": "#34d399", "Fortgeschritten": "#fbbf24", "Profi": "#f87171" };

function check(ch: Ch, val: string, pick: number | null): boolean {
  if (ch.kind === "mc") return pick === ch.correct;
  if (ch.kind === "input") return ch.answers.includes(val.trim().toLowerCase());
  // regex
  let re: RegExp;
  try { re = new RegExp(val.trim()); } catch { return false; }
  if (!val.trim()) return false;
  return ch.must.every((s) => re.test(s)) && ch.mustNot.every((s) => !re.test(s));
}

export function ChallengesTab() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [tips, setTips] = useState<Record<string, boolean>>({});

  function submit(ch: Ch) {
    const ok = check(ch, vals[ch.id] || "", picks[ch.id] ?? null);
    setShown((s) => ({ ...s, [ch.id]: true }));
    setSolved((s) => ({ ...s, [ch.id]: ok }));
  }

  const solvedCount = Object.values(solved).filter(Boolean).length;
  const pct = Math.round((solvedCount / CHALLENGES.length) * 100);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Challenges</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Keine Theorie zum Zurücklehnen – <b style={{ color: "#94a3b8" }}>mach mit</b>. Dekodiere, finde Lücken,
          schreibe Regex, knacke ein JWT. Sofortige Prüfung im Browser.
        </p>
      </div>

      <div className="mb-5"><LearnNote title="Fordern wie im echten Job">
        Ein guter Security- oder Full-Stack-Entwickler <b>löst Probleme selbst</b>, statt nur zu lesen. Genau das übst du
        hier: Code lesen, Schwachstellen erkennen, mit Regex arbeiten, Tokens verstehen. Komm nicht weiter? Nutze die
        passenden Tabs (Encoder, CVE-Suche …) – so arbeitet man auch in der Praxis.
      </LearnNote></div>

      {/* Fortschritt */}
      <div className="rounded-xl p-4 mb-5 flex items-center gap-4"
           style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="text-3xl font-bold" style={{ color: pct === 100 ? "#34d399" : "#94a3b8" }}>{solvedCount}/{CHALLENGES.length}</div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>gelöste Challenges</div>
          <div className="w-full rounded-full h-1.5 mt-1.5" style={{ background: "rgba(30,41,59,0.8)" }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {CHALLENGES.map((ch, i) => {
          const isShown = shown[ch.id];
          const ok = solved[ch.id];
          return (
            <div key={ch.id} className="rounded-xl p-4"
                 style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${isShown ? (ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.35)") : "rgba(30,41,59,0.6)"}` }}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[11px] font-bold" style={{ color: "#64748b" }}>#{i + 1}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold"
                      style={{ background: `${DIFF_COLOR[ch.diff]}22`, color: DIFF_COLOR[ch.diff] }}>{ch.diff}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: "rgba(30,41,59,0.8)", color: "#94a3b8" }}>{ch.cat}</span>
                {ok && <span className="ml-auto text-[12px] font-bold" style={{ color: "#34d399" }}>✓ Gelöst</span>}
              </div>
              <div className="text-[14px] font-semibold mb-2" style={{ color: "#e2e8f0" }}>{ch.q}</div>
              {ch.code && <pre className="text-[12px] font-mono p-3 rounded-lg mb-2 overflow-x-auto" style={{ background: "#020817", color: "#67e8f9", border: "1px solid rgba(30,41,59,0.6)" }}>{ch.code}</pre>}

              {ch.kind === "mc" ? (
                <div className="space-y-1.5">
                  {ch.options.map((opt, idx) => {
                    const chosen = picks[ch.id] === idx;
                    let col = "#cbd5e1", bg = "rgba(2,8,23,0.5)", bd = "rgba(30,41,59,0.6)";
                    if (isShown) {
                      if (idx === ch.correct) { col = "#34d399"; bg = "rgba(6,78,59,0.3)"; bd = "rgba(16,185,129,0.5)"; }
                      else if (chosen) { col = "#fca5a5"; bg = "rgba(127,29,29,0.25)"; bd = "rgba(239,68,68,0.5)"; }
                    } else if (chosen) { col = "#34d399"; bd = "rgba(52,211,153,0.5)"; }
                    return (
                      <button key={idx} disabled={isShown} onClick={() => setPicks((p) => ({ ...p, [ch.id]: idx }))}
                        className="w-full text-left px-3 py-2 rounded-lg text-[13px] cursor-pointer disabled:cursor-default"
                        style={{ background: bg, border: `1px solid ${bd}`, color: col }}>{opt}</button>
                    );
                  })}
                </div>
              ) : (
                <input value={vals[ch.id] || ""} onChange={(e) => setVals((v) => ({ ...v, [ch.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && submit(ch)} disabled={ok}
                  placeholder={ch.kind === "regex" ? "deine Regex, z. B. ^...$" : "deine Antwort…"}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] font-mono outline-none"
                  style={{ background: "#020817", border: "1px solid rgba(30,41,59,0.8)", color: "#e2e8f0", caretColor: "#10b981" }} />
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {!ok && (
                  <button onClick={() => submit(ch)}
                    className="px-4 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer"
                    style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399" }}>Prüfen</button>
                )}
                {ch.hint && !ok && (
                  <button onClick={() => setTips((t) => ({ ...t, [ch.id]: !t[ch.id] }))}
                    className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer"
                    style={{ color: "#64748b", border: "1px solid rgba(51,65,85,0.6)" }}>💡 Tipp</button>
                )}
              </div>
              {tips[ch.id] && !ok && ch.hint && (
                <div className="mt-2 text-[12px] p-2.5 rounded-lg" style={{ background: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.25)", color: "#7dd3fc" }}>💡 {ch.hint}</div>
              )}

              {isShown && (
                <div className="mt-3 text-[12px] p-3 rounded-lg"
                     style={{ background: ok ? "rgba(6,78,59,0.3)" : "rgba(127,29,29,0.2)", border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, color: ok ? "#a7f3d0" : "#fca5a5" }}>
                  {ok ? "✓ Richtig! " : "✗ Noch nicht. "}
                  <span style={{ color: "#cbd5e1" }}>{ch.explain}</span>
                  {!ok && ch.hint && <div className="mt-1" style={{ color: "#94a3b8" }}>💡 {ch.hint}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pct === 100 && (
        <div className="mt-5 rounded-xl p-4 text-center text-[14px] font-bold"
             style={{ background: "rgba(6,78,59,0.3)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399" }}>
          🏆 Alle Challenges gelöst – stark! Bereit für die nächste Stufe (TryHackMe, Hack The Box – siehe Lern-Roadmap).
        </div>
      )}
    </div>
  );
}
