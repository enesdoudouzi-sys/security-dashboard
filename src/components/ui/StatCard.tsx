export function StatCard({
  label,
  value,
  sub,
  color = "text-white",
  icon,
  accent = "#1f2937",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden"
         style={{ background: "linear-gradient(135deg, #0d1117 0%, #111827 100%)", border: "1px solid #1f2937" }}>
      <div style={{
        position: "absolute", top: 0, right: 0, width: 80, height: 80,
        background: accent, borderRadius: "0 12px 0 80px", opacity: 0.15
      }} />
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-[10px] uppercase tracking-[0.15em]">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <span className={`text-3xl font-bold tracking-tight ${color}`}
            style={{ textShadow: color.includes("red") ? "0 0 20px rgba(248,113,113,0.4)" :
                                  color.includes("green") ? "0 0 20px rgba(52,211,153,0.4)" :
                                  color.includes("orange") ? "0 0 20px rgba(251,146,60,0.4)" :
                                  color.includes("yellow") ? "0 0 20px rgba(250,204,21,0.4)" : "none" }}>
        {value}
      </span>
      {sub && <span className="text-gray-600 text-[10px]">{sub}</span>}
    </div>
  );
}
