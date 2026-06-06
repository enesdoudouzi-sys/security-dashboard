export function StatCard({
  label, value, sub, color = "#e2e8f0", icon, accentColor = "#1e293b",
}: {
  label: string; value: string | number; sub?: string;
  color?: string; icon: React.ReactNode; accentColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl p-5 flex flex-col gap-3 group transition-all duration-300 hover:scale-[1.02]"
         style={{ background: "linear-gradient(135deg, #0f172a 0%, #0d1b2a 100%)", border: "1px solid rgba(30,41,59,0.8)" }}>
      {/* Accent blob */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-xl transition-opacity group-hover:opacity-30"
           style={{ background: accentColor }} />

      <div className="flex items-center justify-between relative">
        <span className="text-[10px] uppercase tracking-[0.18em] font-medium" style={{ color: "#64748b" }}>{label}</span>
        <div className="text-xl">{icon}</div>
      </div>

      <div className="relative">
        <span className="text-4xl font-bold tracking-tight" style={{ color, textShadow: `0 0 20px ${color}50` }}>
          {value}
        </span>
      </div>

      {sub && (
        <span className="text-[10px]" style={{ color: "#374151" }}>{sub}</span>
      )}

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
           style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
    </div>
  );
}
