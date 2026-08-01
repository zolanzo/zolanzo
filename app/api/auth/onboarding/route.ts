import { NextResponse, type NextRequest } from "next/server";
import { OnboardingService } from "@/lib/auth/onboarding";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = "current_session_user", role, country, state, city, language, companyName, industry, website } = body;

    if (!role || (role !== "worker" && role !== "employer")) {
      return NextResponse.json({ error: "Please select a valid account role." }, { status: 400 });
    }

    const result = await OnboardingService.completeOnboarding(userId, {
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
