import { NextResponse, type NextRequest } from "next/server";
import { OnboardingService } from "@/lib/auth/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    let authUserId: string | null = null;

    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        authUserId = data.user.id;
      }
    }

    const body = await request.json();
    const { userId: bodyUserId, country, state, city, language, companyName, industry, website } = body;

    if (!authUserId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing authenticated user session." },
        { status: 401 },
      );
    }

    if (typeof bodyUserId === "string" && bodyUserId.length > 0 && bodyUserId !== authUserId) {
      return NextResponse.json(
        { error: "Unauthorized: Session user does not match the requested account." },
        { status: 401 },
      );
    }

    const targetUserId = authUserId;

    const result = await OnboardingService.completeOnboarding(targetUserId, {
      country,
      state,
      city,
      language,
      companyName,
      industry,
      website,
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully.",
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Onboarding submission failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing authenticated user session." },
        { status: 401 },
      );
    }

    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing authenticated user session." },
        { status: 401 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error } = await (supabase.from("profiles") as any)
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile?.role) {
      return NextResponse.json({ error: "Profile could not be loaded." }, { status: 400 });
    }

    const role = profile.role === "employer" ? "employer" : "worker";
    return NextResponse.json({ success: true, data: { role } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Profile could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
