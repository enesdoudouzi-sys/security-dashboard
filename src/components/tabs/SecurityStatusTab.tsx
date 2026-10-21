"use client";
import { useState, useEffect } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// Zeigt, welche Schutzmaßnahmen für diese Seite aktiv sind – teils live geprüft,
// teils erklärt. Ehrlich: was geht auf einer statischen Seite, was braucht einen Server.

type Item = { label: string; state: "ok" | "info" | "warn"; detail: string };

export function SecurityStatusTab() {
  const [checks, setChecks] = useState<Item[]>([]);

  useEffect(() => {
    const items: Item[] = [];
    // HTTPS
    const https = typeof window !== "undefined" && window.location.protocol === "https:";
    items.push({ label: "HTTPS (verschlüsselte Verbindung)", state: https ? "ok" : "info",
      detail: https ? "Die Seite wird verschlüsselt übertragen." : "Lokal (http) – im Web läuft die Seite über HTTPS." });
    // CSP
    const csp = typeof document !== "undefined" && !!document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    items.push({ label: "Content-Security-Policy (CSP) aktiv", state: csp ? "ok" : "warn",
      detail: csp ? "Skripte/Styles nur von der eigenen Seite, Verbindungen nur zu bekannten Hosts – dämmt XSS ein." : "Keine CSP gefunden." });
    // nosniff
    const nosniff = typeof document !== "undefined" && !!document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
    items.push({ label: "X-Content-Type-Options: nosniff", state: nosniff ? "ok" : "info",
      detail: nosniff ? "Verhindert MIME-Type-Tricks." : "Nicht gesetzt." });
    // Statische Architektur
    items.push({ label: "Statische Seite – kein Server/Datenbank/Login", state: "ok",
      detail: "Es gibt nichts zu hacken: keine Serverlogik, keine Nutzerdaten, keine Anmeldung auf der Webseite." });
    items.push({ label: "Analyse-Werkzeuge laufen nur im Browser", state: "ok",
      detail: "Log-Analyse, Phishing-Check, Encoder, Passwort-Generator senden nichts ins Netz." });
    items.push({ label: "Keine Geheimnisse im Frontend-Code", state: "ok",
      detail: "Scan-API-Schlüssel wird nur lokal im Browser gespeichert, nicht im Quellcode." });
    items.push({ label: "Backend abgesichert (wenn deployed)", state: "info",
      detail: "Der Scanner erlaubt nur freigegebene Ziele (Allowlist), hat ein Ratenlimit und optional einen API-Schlüssel." });
    // Grenzen
    items.push({ label: "Clickjacking-Schutz / HSTS", state: "warn",
      detail: "Braucht echte HTTP-Header – auf GitHub Pages nicht möglich. Kommt automatisch mit eigenem Server / Cloudflare davor." });

    setChecks(items);
  }, []);

  const okCount = checks.filter((c) => c.state === "ok").length;
  const COLOR = { ok: "#00f0ff", info: "#60a5fa", warn: "#fbbf24" };
  const ICON = { ok: "✓", info: "i", warn: "!" };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gradient-green">Sicherheits-Status dieser Seite</h2>
        <p className="text-[14px] mt-1" style={{ color: "#64748b" }}>
          Welche Schutzmaßnahmen sind aktiv? Teils live in deinem Browser geprüft, teils erklärt – ehrlich,
          inklusive der Grenzen einer statischen Seite.
        </p>
      </div>

      <div className="mb-4"><LearnNote>
        &bdquo;Sicher&ldquo; heißt nicht &bdquo;unangreifbar&ldquo;, sondern <b>Angriffsfläche klein halten</b>. Diese Seite hat kaum Angriffsfläche,
        weil sie statisch ist. Im Job lernst du, zwischen <b>was HTTP-Header leisten</b> (CSP, HSTS, Frame-Schutz)
        und <b>was die Architektur schon verhindert</b> zu unterscheiden. Genau das zeigt diese Seite.
      </LearnNote></div>

      <div className="rounded-xl p-4 mb-4 flex items-center gap-4"
           style={{ background: "rgba(10,26,46,0.2)", border: "1px solid rgba(0,240,255,0.3)" }}>
        <div className="text-3xl font-bold" style={{ color: "#00f0ff" }}>{okCount}</div>
        <div>
          <div className="text-[14px] font-bold" style={{ color: "#e2e8f0" }}>aktive Schutzmaßnahmen</div>
          <div className="text-[12px]" style={{ color: "#64748b" }}>Live in deinem Browser geprüft &amp; dokumentiert</div>
        </div>
      </div>

      <div className="space-y-2">
        {checks.map((c, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg px-4 py-3"
               style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(30,41,59,0.6)" }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-0.5"
                  style={{ background: `${COLOR[c.state]}22`, color: COLOR[c.state] }}>{ICON[c.state]}</span>
            <div>
              <div className="text-[13.5px] font-semibold" style={{ color: "#e2e8f0" }}>{c.label}</div>
              <div className="text-[12px] mt-0.5" style={{ color: "#64748b" }}>{c.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
