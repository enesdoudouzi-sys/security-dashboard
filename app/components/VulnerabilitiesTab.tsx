"use client";
import { useState } from "react";
import { SeverityBadge } from "./SeverityBadge";
import type { Vulnerability } from "../types";

const STATUS_COLORS: Record<string, string> = {
  open:          "text-red-400",
  investigating: "text-yellow-400",
  patched:       "text-green-400",
};

type SortKey = "cvss" | "severity" | "discovered" | "host" | "status";
type SortDir = "asc" | "desc";

const SEVERITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const STATUS_RANK:   Record<string, number> = { open: 3, investigating: 2, patched: 1 };

export function VulnerabilitiesTab({ vulnerabilities }: { vulnerabilities: Vulnerability[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("cvss");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = vulnerabilities
    .filter((v) => filter === "all" || v.severity === filter || v.status === filter)
    .filter(
      (v) =>
        search === "" ||
        v.id.toLowerCase().includes(search.toLowerCase()) ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.host.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "cvss")      cmp = a.cvss - b.cvss;
      if (sortKey === "severity")  cmp = (SEVERITY_RANK[a.severity] ?? 0) - (SEVERITY_RANK[b.severity] ?? 0);
      if (sortKey === "status")    cmp = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
      if (sortKey === "host")      cmp = a.host.localeCompare(b.host);
      if (sortKey === "discovered") cmp = a.discovered.localeCompare(b.discovered);
      return sortDir === "desc" ? -cmp : cmp;
    });

  const filters = [
    { label: "All",          value: "all"          },
    { label: "Critical",     value: "critical"      },
    { label: "High",         value: "high"          },
    { label: "Open",         value: "open"          },
    { label: "Investigating",value: "investigating"  },
    { label: "Patched",      value: "patched"       },
  ];

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-gray-700 ml-1">⇅</span>;
    return <span className="text-green-400 ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="text-left py-2 pr-4 cursor-pointer hover:text-gray-300 select-none"
        onClick={() => handleSort(col)}
      >
        {label}<SortIcon col={col} />
      </th>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search CVE, name, host..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500 w-64"
        />
        <div className="flex gap-1 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 text-xs rounded border cursor-pointer transition-colors ${
                filter === f.value
                  ? "bg-green-900/40 border-green-600 text-green-400"
                  : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-gray-600 text-xs ml-auto">{filtered.length} results</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 uppercase tracking-widest border-b border-gray-800">
              <th className="text-left py-2 pr-4">CVE ID</th>
              <th className="text-left py-2 pr-4">Name</th>
              <Th col="severity" label="Severity" />
              <Th col="cvss"     label="CVSS"     />
              <Th col="host"     label="Host"     />
              <th className="text-left py-2 pr-4">Service / Port</th>
              <Th col="status"    label="Status"    />
              <Th col="discovered" label="Discovered" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                <td className="py-2.5 pr-4 text-red-400 font-bold">{v.id}</td>
                <td className="py-2.5 pr-4 text-gray-200 max-w-[220px]">
                  <span title={v.name}>{v.name}</span>
                </td>
                <td className="py-2.5 pr-4"><SeverityBadge severity={v.severity} /></td>
                <td className="py-2.5 pr-4">
                  <span className={`font-bold ${v.cvss >= 9 ? "text-red-400" : v.cvss >= 7 ? "text-orange-400" : "text-yellow-400"}`}>
                    {v.cvss.toFixed(1)}
                  </span>
                </td>
                <td className="py-2.5 pr-4 font-mono text-gray-300">{v.host}</td>
                <td className="py-2.5 pr-4 text-gray-400">
                  {v.service}{v.port ? ` :${v.port}` : ""}
                </td>
                <td className="py-2.5 pr-4">
                  <span className={`uppercase font-bold ${STATUS_COLORS[v.status] ?? "text-gray-400"}`}>
                    {v.status}
                  </span>
                </td>
                <td className="py-2.5 text-gray-500">{v.discovered}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center text-gray-600 py-12 text-sm">No vulnerabilities match your filter.</div>
        )}
      </div>
    </div>
  );
}
