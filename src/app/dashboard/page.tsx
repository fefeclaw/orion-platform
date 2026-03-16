import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  const pillar = (session?.user as Record<string, unknown>)?.pillar as string | undefined;
  redirect(`/dashboard/${pillar ?? "maritime"}`);
}
