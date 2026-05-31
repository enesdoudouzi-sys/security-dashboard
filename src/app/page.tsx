import { loadDashboardData } from "@/lib/data";
import { Dashboard } from "@/components/layout/Dashboard";

export default function Home() {
  const data = loadDashboardData();
  return <Dashboard data={data} />;
}
