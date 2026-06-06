export function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: "rgba(127,29,29,0.5)",  text: "#fca5a5", border: "#991b1b" },
    high:     { bg: "rgba(124,45,18,0.5)",  text: "#fdba74", border: "#9a3412" },
    medium:   { bg: "rgba(113,63,18,0.5)",  text: "#fde047", border: "#854d0e" },
    low:      { bg: "rgba(23,37,84,0.5)",   text: "#93c5fd", border: "#1e40af" },
  };
  const s = styles[severity] ?? { bg: "rgba(31,41,55,0.5)", text: "#9ca3af", border: "#374151" };
  return (
    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider"
          style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {severity}
    </span>
  );
}
