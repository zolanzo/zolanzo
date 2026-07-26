import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { signOutFormAction } from "@/features/authentication/actions/sign-out-form";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/auth/sign-in?next=/app");
  }

  const active = ctx.user.memberships.find(
    (m) => m.organizationId === ctx.user.activeOrganizationId,
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <BrandLogo />
        <form action={signOutFormAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </header>

      <section className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Welcome
          {ctx.user.profile ? `, ${ctx.user.profile.displayName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Active workspace:{" "}
          <strong>{active?.organization.name ?? "None"}</strong>
        </p>
      </section>

      <nav className="flex flex-col gap-3 sm:flex-row">
        <Link href="/app/profile">
          <Button variant="secondary">Profile</Button>
        </Link>
        <Link href="/app/organizations">
          <Button variant="secondary">Organizations</Button>
        </Link>
        <Link href="/app/sessions">
          <Button variant="secondary">Sessions</Button>
        </Link>
      </nav>
    </main>
  );
}
