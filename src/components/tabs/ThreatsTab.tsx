"use client";
import { useState } from "react";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import type { Threat } from "@/types";

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active:        { color: "#f87171", bg: "rgba(127,29,29,0.4)",  border: "rgba(239,68,68,0.3)",   label: "AKTIV"        },
  monitoring:    { color: "#fbbf24", bg: "rgba(120,53,15,0.4)",  border: "rgba(245,158,11,0.3)",  label: "BEOBACHTUNG"  },
  blocked:       { color: "#34d399", bg: "rgba(6,78,59,0.4)",    border: "rgba(16,185,129,0.3)",  label: "BLOCKIERT"    },
  investigating: { color: "#fb923c", bg: "rgba(124,45,18,0.4)",  border: "rgba(249,115,22,0.3)",  label: "UNTERSUCHT"   },
};

const TYPE_ICONS: Record<string, string> = {
  Ransomware: "💀", APT: "🎯", Trojan: "🐴", Botnet: "🤖", "C2 Framework": "📡",
};

type ThreatStatus = Threat["status"];

export function ThreatsTab({ threats }: { threats: Threat[] }) {
  const [statuses, setStatuses] = useState<Record<string, ThreatStatus>>(
    () => Object.fromEntries(threats.map((t) => [t.id, t.status]))
  );
  const [toast, setToast] = useState<string | null>(null);

  function update(id: string, status: ThreatStatus, msg: string) {
    setStatuses((p) => ({ ...p, [id]: status }));
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const active   = threats.filter((t) => statuses[t.id] === "active").length;
  const blocked  = threats.filter((t) => statuses[t.id] === "blocked").length;
  const invst    = threats.filter((t) => statuses[t.id] === "investigating").length;

  return (
    <div className="p-5 space-y-5 max-w-screen-2xl mx-auto">
      {toast && (
        <div className="fixed top-16 right-5 z-50 px-4 py-3 rounded-xl text-[12px] font-medium animate-fade-in"
             style={{ background: "rgba(6,78,59,0.9)", border: "1px solid rgba(16,185,129,0.4)", color: "#34d399", backdropFilter: "blur(12px)" }}>
          ✓ {toast}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Aktiv",        value: active,  color: "#f87171" },
          { label: "Untersucht",   value: invst,   color: "#fb923c" },
          { label: "Blockiert",    value: blocked, color: "#34d399" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 flex items-center gap-4"
               style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: "1px solid rgba(30,41,59,0.8)" }}>
            <span className="text-3xl font-bold" style={{ color, textShadow: `0 0 15px ${color}50` }}>{value}</span>
            <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "#4b5563" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {threats.map((t) => {
          const status = statuses[t.id];
          const sc = STATUS_CFG[status] ?? STATUS_CFG.monitoring;
          return (
            <div key={t.id} className="rounded-xl overflow-hidden flex flex-col transition-all hover:scale-[1.01]"
                 style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: `1px solid rgba(30,41,59,0.8)` }}>
              {/* Top accent */}
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${sc.color}60, transparent)` }} />

              <div className="p-5 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{TYPE_ICONS[t.type] ?? "⚠️"}</div>
                    <div>
                      <div className="text-[13px] font-bold" style={{ color: "#e2e8f0" }}>{t.name}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: "#4b5563" }}>{t.type}</div>
                    </div>
                  </div>
                  <SeverityBadge severity={t.severity} />
                </div>

                {/* Status badge */}
                <div className="mb-4">
                  <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-[10px] font-bold"
                        style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                    {status === "active" && <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: sc.color }} />}
                    {sc.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                    <span style={{ color: "#374151" }}>Indicator of Compromise</span>
                    <span className="font-mono" style={{ color: "#f87171" }}>{t.ioc}</span>
                  </div>
                  <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                    <span style={{ color: "#374151" }}>Betroffene Systeme</span>
                    <span className="font-bold" style={{ color: t.affectedSystems > 0 ? "#fb923c" : "#34d399" }}>
                      {t.affectedSystems}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                    <span style={{ color: "#374151" }}>Erstmals gesehen</span>
                    <span style={{ color: "#64748b" }}>{t.firstSeen}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span style={{ color: "#374151" }}>Zuletzt gesehen</span>
                    <span style={{ color: "#64748b" }}>{t.lastSeen}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 flex gap-2" style={{ borderTop: "1px solid rgba(30,41,59,0.6)", background: "rgba(15,23,42,0.5)" }}>
                <ActionBtn
                  label="Blockieren"
                  active={status === "blocked"}
                  color="#f87171"
                  onClick={() => update(t.id, "blocked", `IOC ${t.ioc} blockiert`)}
                />
                <ActionBtn
                  label="Untersuchen"
                  active={status === "investigating"}
                  color="#fbbf24"
                  onClick={() => update(t.id, "investigating", `${t.name} zur Untersuchung vorgemerkt`)}
                />
                <ActionBtn
                  label="Gelöst"
                  active={status === "monitoring"}
                  color="#34d399"
                  onClick={() => update(t.id, "monitoring", `${t.name} als gelöst markiert`)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick} disabled={active}
      className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={active
        ? { background: `${color}15`, color, border: `1px solid ${color}40` }
        : { background: "transparent", color: "#374151", border: "1px solid rgba(30,41,59,0.6)" }}
      onMouseEnter={(e) => { if (!active) { (e.target as HTMLElement).style.color = color; (e.target as HTMLElement).style.borderColor = `${color}40`; }}}
      onMouseLeave={(e) => { if (!active) { (e.target as HTMLElement).style.color = "#374151"; (e.target as HTMLElement).style.borderColor = "rgba(30,41,59,0.6)"; }}}
    >
      {label}
    </button>
  );
}
