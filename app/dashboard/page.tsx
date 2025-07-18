// app/dashboard/page.tsx
import Dashboard from "@/components/dashboard";
import { getTranslation } from "@/lib/utils-ssr";

export default async function DashboardPage() {
  return <Dashboard />;
}
