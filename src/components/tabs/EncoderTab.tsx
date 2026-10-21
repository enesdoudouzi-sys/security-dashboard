"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";
import { CopyBtn } from "@/components/ui/CopyBtn";

// Kodieren/Dekodieren – rein im Browser. Tägliches Werkzeug im Pentest & SOC:
// Payloads lesbar machen, Tokens untersuchen, Hashes verstehen.

function toHex(s: string) {
  return Array.from(new TextEncoder().encode(s)).map((b) => b.toString(16).padStart(2, "0")).join(" ");
}
function fromHex(s: string) {
  const bytes = s.trim().split(/\s+|(?<=..)(?=..)/).filter(Boolean).map((h) => parseInt(h, 16));
  if (bytes.some((b) => isNaN(b))) throw new Error("kein gültiges Hex");
  return new TextDecoder().decode(new Uint8Array(bytes));
}
function rot13(s: string) {
  return s.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}
function b64decode(s: string) {
  // URL-safe Base64 ebenfalls zulassen
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(norm)));
}
function b64encode(s: string) {
  return btoa(unescape(encodeURIComponent(s)));
}

type Op = { id: string; label: string; enc: (s: string) => string; dec?: (s: string) => string };
const OPS: Op[] = [
  { id: "base64", label: "Base64", enc: b64encode, dec: b64decode },
  { id: "url", label: "URL", enc: encodeURIComponent, dec: decodeURIComponent },
  { id: "hex", label: "Hex", enc: toHex, dec: fromHex },
  { id: "rot13", label: "ROT13", enc: rot13, dec: rot13 },
];

function JwtDecoder() {
  const [tok, setTok] = useState("");
  let header = "", payload = "", err = "";
  if (tok.trim()) {
    try {
      const parts = tok.trim().split(".");
      if (parts.length < 2) throw new Error();
      header = JSON.stringify(JSON.parse(b64decode(parts[0])), null, 2);
      payload = JSON.stringify(JSON.parse(b64decode(parts[1])), null, 2);
    } catch { err = "Kein gültiges JWT (erwartet: header.payload.signature)."; }
  }
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
      <div className="text-[15px] font-bold mb-1" style={{ color: "#e2e8f0" }}>JWT-Decoder</div>
      <p className="text-[13px] mb-2" style={{ color: "#64748b" }}>Zeigt Inhalt eines JSON Web Tokens (z. B. aus einem Login). Die Signatur wird NICHT geprüft – nur gelesen.</p>
      <textarea value={tok} onChange={(e) => setTok(e.target.value)} rows={3}
        placeholder="eyJhbGci... . eyJzdWIi... . signature"
        className="w-full px-3 py-2 rounded-lg text-[13px] font-mono outline-none resize-y break-all"
        style={{ background: "#07010f", border: "1px solid rgba(30,41,59,0.8)", color: "#cbd5e1" }} />
      {err && <p className="text-[13px] mt-2" style={{ color: "#f87171" }}>{err}</p>}
      {header && (
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <div><div className="text-[12px] uppercase tracking-wider mb-1" style={{ color: "#94a3b8" }}>Header</div>
            <pre className="text-[13px] p-2 rounded-lg overflow-auto" style={{ background: "#07010f", color: "#67e8f9" }}>{header}</pre></div>
          <div><div className="text-[12px] uppercase tracking-wider mb-1" style={{ color: "#94a3b8" }}>Payload</div>
            <pre className="text-[13px] p-2 rounded-lg overflow-auto" style={{ background: "#07010f", color: "#a5f3ff" }}>{payload}</pre></div>
        </div>
      )}
    </div>
  );
}

export function EncoderTab() {
  const [op, setOp] = useState(OPS[0]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"enc" | "dec">("enc");

  let output = "", error = "";
  if (input) {
    try {
      output = mode === "enc" ? op.enc(input) : (op.dec ? op.dec(input) : op.enc(input));
    } catch { error = "Eingabe passt nicht zu dieser Operation."; }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Encoder / Decoder</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Base64, URL, Hex, ROT13 und JWT – kodieren und dekodieren. Alles rein im Browser, nichts wird gesendet.
        </p>
      </div>

      <div className="mb-4"><LearnNote>
        Im Pentest &amp; SOC ständig gebraucht: Angreifer verschleiern Payloads oft mit <b>Base64</b> oder <b>URL-Encoding</b>.
        Zum Verstehen eines Alarms musst du das zurückübersetzen können. <b>JWT</b>-Tokens (Logins) liest du,
        um zu sehen, welche Rechte drinstehen. Das ist der Mini-&bdquo;CyberChef&ldquo; für den Alltag.
      </LearnNote></div>

      <div className="flex flex-wrap gap-2 mb-3">
        {OPS.map((o) => (
          <button key={o.id} onClick={() => setOp(o)}
            className="px-3.5 py-1.5 rounded-lg text-[14px] font-semibold cursor-pointer transition-all"
            style={op.id === o.id
              ? { background: "rgba(0,240,255,0.18)", border: "1px solid rgba(0,240,255,0.5)", color: "#00f0ff" }
              : { background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.6)", color: "#94a3b8" }}>
            {o.label}
          </button>
        ))}
        <div className="flex rounded-lg overflow-hidden ml-auto" style={{ border: "1px solid rgba(51,65,85,0.6)" }}>
          {(["enc", "dec"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="px-3 py-1.5 text-[13px] font-bold uppercase tracking-wider cursor-pointer"
              style={mode === m ? { background: "rgba(0,240,255,0.2)", color: "#00f0ff" } : { color: "#64748b" }}>
              {m === "enc" ? "Kodieren" : "Dekodieren"}
            </button>
          ))}
        </div>
      </div>

      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5}
        placeholder="Text / Payload hier eingeben…"
        className="w-full px-3 py-3 rounded-xl text-[14px] font-mono outline-none resize-y"
        style={{ background: "#07010f", border: "1px solid rgba(30,41,59,0.8)", color: "#cbd5e1", caretColor: "#00b8d4" }} />

      <div className="mt-3 rounded-xl p-4" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] uppercase tracking-wider font-bold" style={{ color: "#94a3b8" }}>Ergebnis</span>
          {output && <CopyBtn text={output} />}
        </div>
        {error
          ? <p className="text-[14px]" style={{ color: "#f87171" }}>{error}</p>
          : <pre className="text-[14px] font-mono break-all whitespace-pre-wrap" style={{ color: "#67e8f9" }}>{output || "…"}</pre>}
      </div>

      <div className="mt-5"><JwtDecoder /></div>
    </div>
  );
}
