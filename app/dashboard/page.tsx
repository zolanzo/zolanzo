import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/auth/proxy-access";
import { chromeRoleFromPlatformRoles } from "@/lib/workspace/shell-nav";

export const dynamic = "force-dynamic";

export default async function DashboardRedirectPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login?next=/dashboard");
  }

  const role = chromeRoleFromPlatformRoles(ctx.user.platformRoles);
  redirect(getRoleHomePath(role));
}
