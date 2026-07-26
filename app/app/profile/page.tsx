import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthContext } from "@/lib/auth/session";
import {
  getPrivateProfile,
  getPublicProfile,
} from "@/features/users/services/profile-service";
import { Button } from "@/components/ui/button";
import { ProfileForms } from "./profile-forms";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/auth/sign-in?next=/app/profile");

  const [publicProfile, privateProfile] = await Promise.all([
    getPublicProfile(ctx.user.id),
    getPrivateProfile(ctx.user.id),
  ]);

  if (!publicProfile || !privateProfile) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Profile</h1>
        <Link href="/app">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
      </div>
      <ProfileForms
        publicProfile={publicProfile}
        privateProfile={{
          legalName: privateProfile.legalName,
          marketingOptIn: privateProfile.marketingOptIn,
        }}
      />
    </main>
  );
}
