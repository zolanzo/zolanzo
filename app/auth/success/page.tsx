"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { SuccessCard } from "@/components/auth/success-card";

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "email-verified";

  let title = "Email Verified!";
  let message = "Your email address has been successfully verified. You can now explore tasks and campaigns on ZOLANZO.";
  let buttonLabel = "Browse Platform";
  let buttonHref = "/";

  if (type === "account-created") {
    title = "Account Created!";
    message = "Your ZOLANZO account has been created. Please check your email to complete verification.";
    buttonLabel = "Verify Email";
    buttonHref = "/verify-email";
  } else if (type === "pin-updated") {
    title = "PIN Updated!";
    message = "Your security PIN has been updated successfully. Use your new 6-digit PIN for future log-ins.";
    buttonLabel = "Log In Now";
    buttonHref = "/login";
  } else if (type === "phone-verified") {
    title = "Phone Verified!";
    message = "Your phone number has been verified. You now have full access to withdrawals and campaign creation.";
    buttonLabel = "Continue to Platform";
    buttonHref = "/";
  } else if (type === "login") {
    title = "Welcome Back!";
    message = "You have successfully authenticated into your ZOLANZO account.";
    buttonLabel = "Go to Platform";
    buttonHref = "/";
  }

  return (
    <AuthCard>
      <SuccessCard
        title={title}
        message={message}
        buttonLabel={buttonLabel}
        buttonHref={buttonHref}
      />
    </AuthCard>
  );
}

export default function AuthSuccessPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading success state...</div>}>
        <AuthSuccessContent />
      </Suspense>
    </AuthLayout>
  );
}
