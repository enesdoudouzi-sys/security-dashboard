"use client";
import { useState, useEffect, useCallback } from "react";
import { LearnNote } from "@/components/ui/LearnNote";
import { CopyBtn } from "@/components/ui/CopyBtn";

// Sichere Passwörter & Passphrasen – erzeugt mit crypto.getRandomValues (echter Zufall),
// rein im Browser. Nichts wird gesendet oder gespeichert.

const LOWER = "abcdefghijkmnpqrstuvwxyz";      // ohne l,o (Verwechslung)
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";      // ohne I,O
const DIGITS = "23456789";                      // ohne 0,1
const SYMBOLS = "!@#$%&*?-_=+";

// Kurze, einprägsame deutsche Wortliste für Passphrasen.
const WORDS = ("apfel baum blume brief dach feder fisch gabel garten hafen hund insel kabel "
  + "kerze kette kiste klee kran kugel lampe licht meer mond nebel ofen pferd pilz regen ring "
  + "rose segel stern stein tanne tiger turm vogel wald welle wind wolke wurzel zebra zweig "
  + "anker bach berg blatt brot donner erde funke geist glanz hammer honig jäger könig löwe").split(/\s+/);

function rand(max: number) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % max;
}
function pick<T>(arr: T[] | string): T | string {
  return (arr as never[])[rand(arr.length)];
}

function entropyBits(poolSize: number, length: number) {
  return Math.round(length * Math.log2(poolSize));
}
function strength(bits: number) {
  if (bits < 40) return { label: "schwach", color: "#f87171", pct: 25 };
  if (bits < 60) return { label: "okay", color: "#fbbf24", pct: 50 };
  if (bits < 80) return { label: "stark", color: "#00f0ff", pct: 75 };
  return { label: "sehr stark", color: "#00b8d4", pct: 100 };
}

export function PasswordTab() {
  const [mode, setMode] = useState<"pw" | "phrase">("pw");
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, digits: true, symbols: true });
  const [words, setWords] = useState(4);
  const [out, setOut] = useState("");
  const [bits, setBits] = useState(0);

  const generate = useCallback(() => {
    if (mode === "pw") {
      let pool = "";
      if (opts.lower) pool += LOWER;
      if (opts.upper) pool += UPPER;
      if (opts.digits) pool += DIGITS;
      if (opts.symbols) pool += SYMBOLS;
      if (!pool) { setOut(""); setBits(0); return; }
      let pw = "";
      for (let i = 0; i < length; i++) pw += pool[rand(pool.length)];
      setOut(pw);
      setBits(entropyBits(pool.length, length));
    } else {
      const parts: string[] = [];
      for (let i = 0; i < words; i++) {
        const w = pick(WORDS) as string;
        parts.push(w.charAt(0).toUpperCase() + w.slice(1));
      }
      const num = 10 + rand(90);
      const phrase = parts.join("-") + "-" + num;
      setOut(phrase);
      // Entropie: words aus Liste + 2-stellige Zahl
      setBits(entropyBits(WORDS.length, words) + entropyBits(90, 1));
    }
  }, [mode, length, opts, words]);

  useEffect(() => { generate(); }, [generate]);

  const s = strength(bits);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Passwort-Generator</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Sichere Passwörter &amp; Passphrasen mit echtem Zufall (WebCrypto). Läuft komplett im Browser –
          nichts wird gesendet oder gespeichert.
        </p>
      </div>

      <div className="mb-4"><LearnNote>
        Gute Passwörter sind lang und zufällig. <b>Passphrasen</b> (mehrere zufällige Wörter) sind oft leichter zu merken
        und trotzdem stark. Die wichtigste Kennzahl ist die <b>Entropie</b> (in Bit): Ab ~70&nbsp;Bit ist ein Passwort
        gegen Rateangriffe sehr widerstandsfähig. Nutze für jeden Dienst ein eigenes Passwort und einen Passwort-Manager.
      </LearnNote></div>

      <div className="flex rounded-xl overflow-hidden mb-4 w-fit" style={{ border: "1px solid rgba(51,65,85,0.6)" }}>
        {([["pw", "Passwort"], ["phrase", "Passphrase"]] as const).map(([m, lbl]) => (
          <button key={m} onClick={() => setMode(m)}
            className="px-5 py-2 text-[13px] font-bold cursor-pointer"
            style={mode === m ? { background: "rgba(0,240,255,0.2)", color: "#00f0ff" } : { color: "#64748b" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Ergebnis */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(0,240,255,0.25)" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <code className="text-[18px] font-mono flex-1 break-all" style={{ color: "#67e8f9", minWidth: 200 }}>{out || "—"}</code>
          <div className="flex gap-2">
            <button onClick={generate} className="px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider cursor-pointer"
              style={{ background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }}>↻ Neu</button>
            {out && <CopyBtn text={out} />}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 rounded-full h-2" style={{ background: "rgba(30,41,59,0.8)" }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
          </div>
          <span className="text-[12px] font-bold" style={{ color: s.color }}>{s.label}</span>
          <span className="text-[11px]" style={{ color: "#64748b" }}>~{bits} Bit</span>
        </div>
      </div>

      {/* Optionen */}
      {mode === "pw" ? (
        <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(30,41,59,0.6)" }}>
          <div>
            <div className="flex justify-between text-[13px] mb-2" style={{ color: "#cbd5e1" }}>
              <span>Länge</span><span className="font-bold" style={{ color: "#00f0ff" }}>{length} Zeichen</span>
            </div>
            <input type="range" min={8} max={48} value={length} onChange={(e) => setLength(+e.target.value)}
              className="w-full" style={{ accentColor: "#00b8d4" }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {([["lower", "Kleinbuchstaben"], ["upper", "Großbuchstaben"], ["digits", "Zahlen"], ["symbols", "Sonderzeichen"]] as const).map(([k, lbl]) => (
              <button key={k} onClick={() => setOpts((o) => ({ ...o, [k]: !o[k] }))}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                style={opts[k]
                  ? { background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }
                  : { background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.6)", color: "#64748b" }}>
                {opts[k] ? "✓ " : ""}{lbl}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-5" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(30,41,59,0.6)" }}>
          <div className="flex justify-between text-[13px] mb-2" style={{ color: "#cbd5e1" }}>
            <span>Anzahl Wörter</span><span className="font-bold" style={{ color: "#00f0ff" }}>{words}</span>
          </div>
          <input type="range" min={3} max={8} value={words} onChange={(e) => setWords(+e.target.value)}
            className="w-full" style={{ accentColor: "#00b8d4" }} />
          <p className="text-[11px] mt-2" style={{ color: "#64748b" }}>Beispiel-Stil: <code style={{ color: "#67e8f9" }}>Apfel-Mond-Segel-Tiger-42</code></p>
        </div>
      )}
    </div>
  );
}
