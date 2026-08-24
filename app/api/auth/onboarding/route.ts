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
    const { userId: bodyUserId, role, country, state, city, language, companyName, industry, website } = body;

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

    if (!role || (role !== "worker" && role !== "employer")) {
      return NextResponse.json({ error: "Please select a valid account role." }, { status: 400 });
    }

    const result = await OnboardingService.completeOnboarding(targetUserId, {
      role,
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
