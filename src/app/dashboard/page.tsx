import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  const pillar = (session?.user as { pillar?: string } | undefined)?.pillar;
  redirect(`/dashboard/${pillar ?? "maritime"}`);
}
