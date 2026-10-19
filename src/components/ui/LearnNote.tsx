// Kleiner Lern-Kasten: erklärt, was ein Feature im echten Security-Job bedeutet.
export function LearnNote({ title = "Was heißt das im Job?", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 text-[12px] leading-relaxed"
         style={{ background: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.25)", color: "#a5f3fc" }}>
      <div className="flex items-center gap-2 mb-1.5 font-bold" style={{ color: "#67e8f9" }}>
        <span>🎓</span><span>{title}</span>
      </div>
      <div style={{ color: "#7dd3fc" }}>{children}</div>
    </div>
  );
}
