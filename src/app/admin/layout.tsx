import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/auth/signin?callback=/admin");
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <AdminHeader user={session.user} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
