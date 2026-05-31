export interface Vulnerability {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  cvss: number;
  host: string;
  service: string;
  port: number | null;
  status: "open" | "investigating" | "patched";
  discovered: string;
}

export interface Threat {
  id: string;
  name: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "monitoring" | "blocked" | "investigating";
  ioc: string;
  firstSeen: string;
  lastSeen: string;
  affectedSystems: number;
}

export interface NetworkEvent {
  id: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  dstPort: number | null;
  protocol: string;
  action: "blocked" | "allowed";
  category: string;
  bytes: number;
}

export interface Scan {
  id: string;
  target: string;
  type: string;
  status: "completed" | "running" | "scheduled" | "failed";
  startTime: string;
  endTime: string | null;
  findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DashboardData {
  vulnerabilities: Vulnerability[];
  threats: Threat[];
  networkEvents: NetworkEvent[];
  scans: Scan[];
}
