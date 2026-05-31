export function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-900/60 text-red-300 border border-red-700",
    high:     "bg-orange-900/60 text-orange-300 border border-orange-700",
    medium:   "bg-yellow-900/60 text-yellow-300 border border-yellow-700",
    low:      "bg-blue-900/60 text-blue-300 border border-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider ${styles[severity] ?? "bg-gray-800 text-gray-400"}`}>
      {severity}
    </span>
  );
}
