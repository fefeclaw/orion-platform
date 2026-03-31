import { StatsCards } from "@/components/admin/StatsCards";
import { QuickActions } from "@/components/admin/QuickActions";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { SystemStatus } from "@/components/admin/SystemStatus";

export const metadata = {
  title: "Admin Dashboard | ORION",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
        <span className="text-sm text-white/50">
          Accès 1-clic aux actions prioritaires
        </span>
      </div>

      <StatsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div>
          <SystemStatus />
        </div>
      </div>

      <RecentActivity />
    </div>
  );
}
