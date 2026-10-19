"use client";
import { useState } from "react";
import { LearnNote } from "@/components/ui/LearnNote";

// E-Mail-Header analysieren: Absender-Fälschung und fehlende Authentifizierung
// (SPF/DKIM/DMARC) erkennen. Rein im Browser – es wird nichts gesendet.

const SAMPLE = `From: "PayPal Service" <service@paypa1-secure.com>
Return-Path: <bounce@mailer-xyz.ru>
Reply-To: support@paypa1-secure.com
To: kunde@example.com
Subject: Ihr Konto wurde eingeschraenkt - sofort handeln
Authentication-Results: mx.example.com;
 spf=fail smtp.mailfrom=mailer-xyz.ru;
 dkim=none;
 dmarc=fail (p=reject) header.from=paypa1-secure.com
Received: from unknown (185.220.101.45) by mx.example.com`;

type Check = { label: string; value: string; verdict: "pass" | "fail" | "warn" | "info"; hint: string };

const V_COLOR: Record<string, string> = { pass: "#34d399", fail: "#f87171", warn: "#fbbf24", info: "#94a3b8" };
const V_ICON: Record<string, string> = { pass: "✓", fail: "✗", warn: "!", info: "·" };

function header(text: string, name: string): string {
  // Header-Zeile finden und gefaltete Folgezeilen (beginnen mit Space/Tab) anhängen.
  const lines = text.split(/\r?\n/);
  const re = new RegExp(`^${name}:\\s*(.*)$`, "i");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (m) {
      let value = m[1];
      for (let j = i + 1; j < lines.length && /^\s/.test(lines[j]); j++) value += " " + lines[j].trim();
      return value.replace(/\s+/g, " ").trim();
    }
  }
  return "";
}
function domainOf(s: string): string {
  const m = s.match(/@([A-Za-z0-9.-]+)/);
  return m ? m[1].toLowerCase().replace(/>$/, "") : "";
}

function analyze(text: string) {
  const checks: Check[] = [];
  const from = header(text, "From");
  const returnPath = header(text, "Return-Path");
  const replyTo = header(text, "Reply-To");
  const auth = (header(text, "Authentication-Results") + " " + header(text, "Received-SPF")).toLowerCase();

  const fromDom = domainOf(from);
  const rpDom = domainOf(returnPath);

  if (from) checks.push({ label: "From (sichtbarer Absender)", value: from, verdict: "info", hint: "Das sieht der Nutzer – lässt sich leicht fälschen." });

  // SPF
  const spf = auth.match(/spf=(\w+)/)?.[1];
  if (spf) checks.push({ label: "SPF", value: spf, verdict: spf === "pass" ? "pass" : "fail",
    hint: spf === "pass" ? "Server darf für die Domain senden." : "Sendender Server ist NICHT erlaubt → Fälschung wahrscheinlich." });
  else checks.push({ label: "SPF", value: "nicht gefunden", verdict: "warn", hint: "Keine SPF-Prüfung im Header." });

  // DKIM
  const dkim = auth.match(/dkim=(\w+)/)?.[1];
  if (dkim) checks.push({ label: "DKIM", value: dkim, verdict: dkim === "pass" ? "pass" : "fail",
    hint: dkim === "pass" ? "Signatur gültig – Inhalt unverändert." : "Keine gültige Signatur." });
  else checks.push({ label: "DKIM", value: "nicht gefunden", verdict: "warn", hint: "Keine DKIM-Signatur." });

  // DMARC
  const dmarc = auth.match(/dmarc=(\w+)/)?.[1];
  if (dmarc) checks.push({ label: "DMARC", value: dmarc, verdict: dmarc === "pass" ? "pass" : "fail",
    hint: dmarc === "pass" ? "Absender-Richtlinie erfüllt." : "DMARC fehlgeschlagen → echter Betrug-Indikator." });
  else checks.push({ label: "DMARC", value: "nicht gefunden", verdict: "warn", hint: "Keine DMARC-Prüfung." });

  // From vs Return-Path mismatch
  if (fromDom && rpDom) checks.push({
    label: "From- vs. Return-Path-Domain", value: `${fromDom}  ↔  ${rpDom}`,
    verdict: fromDom === rpDom ? "pass" : "fail",
    hint: fromDom === rpDom ? "Domains passen zusammen." : "Unterschiedliche Domains – typisch für Spoofing.",
  });
  // Reply-To abweichend
  if (replyTo) {
    const rtDom = domainOf(replyTo);
    if (rtDom && fromDom && rtDom !== fromDom) checks.push({ label: "Reply-To weicht ab", value: replyTo, verdict: "warn", hint: "Antworten gehen an eine andere Domain – Vorsicht." });
  }
  // Look-alike-Domain (Zahl statt Buchstabe)
  if (/[a-z]\d|\d[a-z]/i.test(fromDom) && /(paypa|g00gle|micr0|amaz0n|app1e)/i.test(fromDom))
    checks.push({ label: "Tippfehler-Domain (Look-alike)", value: fromDom, verdict: "fail", hint: "Nachgeahmte Marke mit Zahl/Buchstaben-Trick (z. B. paypa1 statt paypal)." });

  const fails = checks.filter((c) => c.verdict === "fail").length;
  const warns = checks.filter((c) => c.verdict === "warn").length;
  let score: { label: string; color: string; text: string };
  if (fails >= 2) score = { label: "SEHR WAHRSCHEINLICH PHISHING", color: "#f87171", text: "Mehrere Authentifizierungen fehlgeschlagen. Nicht klicken, nicht antworten, an die IT/Abuse melden." };
  else if (fails === 1) score = { label: "VERDÄCHTIG", color: "#fbbf24", text: "Mindestens eine Prüfung fehlgeschlagen. Genau prüfen, im Zweifel melden." };
  else if (warns >= 2) score = { label: "UNKLAR", color: "#fbbf24", text: "Wichtige Prüfungen fehlen im Header. Mit Vorsicht behandeln." };
  else score = { label: "UNAUFFÄLLIG", color: "#34d399", text: "Keine klaren Fälschungs-Indikatoren. Trotzdem Inhalt & Links kritisch prüfen." };

  return { checks, score };
}

export function PhishingTab() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<ReturnType<typeof analyze> | null>(null);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gradient-green">Phishing- &amp; E-Mail-Header-Analyse</h2>
        <p className="text-[12px] mt-1" style={{ color: "#64748b" }}>
          Rohe E-Mail-Header einfügen → SPF/DKIM/DMARC und Absender-Fälschung werden geprüft.
          Header findest du im Mailprogramm unter &bdquo;Original anzeigen&ldquo; / &bdquo;Quelltext&ldquo;. Nichts verlässt den Browser.
        </p>
      </div>

      <div className="mb-4"><LearnNote>
        Phishing ist der <b>häufigste</b> Angriffsweg (ATT&amp;CK T1566). Im SOC landen gemeldete Mails bei dir:
        Du liest die Header, prüfst ob <b>SPF/DKIM/DMARC</b> bestehen und ob der Absender gefälscht ist.
        Das Prinzip: Die sichtbare &bdquo;From&ldquo;-Zeile kann jeder fälschen – die Authentifizierungs-Ergebnisse nicht.
      </LearnNote></div>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9}
        placeholder="E-Mail-Header hier einfügen…"
        className="w-full px-3 py-3 rounded-xl text-[12px] font-mono outline-none resize-y"
        style={{ background: "#020817", border: "1px solid rgba(30,41,59,0.8)", color: "#cbd5e1", caretColor: "#10b981" }} />

      <div className="flex gap-2 mt-3">
        <button onClick={() => setRes(analyze(text))} disabled={!text.trim()}
          className="px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399" }}>
          Prüfen
        </button>
        <button onClick={() => { setText(SAMPLE); setRes(analyze(SAMPLE)); }}
          className="px-4 py-2 rounded-xl text-[12px] font-medium cursor-pointer"
          style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(51,65,85,0.6)", color: "#94a3b8" }}>
          Beispiel laden
        </button>
      </div>

      {res && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl p-4" style={{ background: `${res.score.color}14`, border: `1px solid ${res.score.color}55` }}>
            <div className="text-[14px] font-bold" style={{ color: res.score.color }}>{res.score.label}</div>
            <div className="text-[12px] mt-1" style={{ color: "#cbd5e1" }}>{res.score.text}</div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(30,41,59,0.6)" }}>
            {res.checks.map((c, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3"
                   style={{ background: i % 2 ? "rgba(15,23,42,0.4)" : "transparent", borderTop: i ? "1px solid rgba(30,41,59,0.4)" : "none" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: `${V_COLOR[c.verdict]}22`, color: V_COLOR[c.verdict] }}>{V_ICON[c.verdict]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-semibold" style={{ color: "#e2e8f0" }}>{c.label}</span>
                    <span className="text-[11px] font-mono break-all" style={{ color: V_COLOR[c.verdict] }}>{c.value}</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>{c.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
