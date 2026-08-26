import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthContext } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { OrganizationsClient } from "./organizations-client";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login?next=/app/organizations");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Organizations</h1>
        <Link href="/app">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
      </div>
      <OrganizationsClient
        activeOrganizationId={ctx.user.activeOrganizationId}
        memberships={ctx.user.memberships.map((m) => ({
          organizationId: m.organizationId,
          orgRole: m.orgRole,
          name: m.organization.name,
          kind: m.organization.kind,
          publicId: m.organization.publicId,
        }))}
        canInvite={ctx.activeOrgRole === "owner" || ctx.activeOrgRole === "admin"}
      />
    </main>
  );
}
