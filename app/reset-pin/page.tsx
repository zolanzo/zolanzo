"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { PINInput } from "@/components/auth/pin-input";
import { ValidationMessage } from "@/components/auth/validation-message";

function ResetPinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPin.length !== 6) {
      setError("Your new PIN must contain exactly 6 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setError("PINs do not match. Please verify your new PIN entry.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPin }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "PIN reset failed.");
        return;
      }

      router.push("/auth/success?type=pin-updated");
    } catch {
      setLoading(false);
      setError("An unexpected network error occurred. Please try again.");
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        badge="Set New PIN"
        title="Reset your PIN"
        subtitle="Create a new 6-digit security PIN for your ZOLANZO account."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <ValidationMessage message={error} />

        {/* New 6-Digit PIN */}
        <PINInput
          id="newPin"
          label="New 6-Digit PIN"
          value={newPin}
          onChange={setNewPin}
          placeholder="••••••"
        />

        {/* Confirm 6-Digit PIN */}
        <PINInput
          id="confirmPin"
          label="Confirm New PIN"
          value={confirmPin}
          onChange={setConfirmPin}
          placeholder="••••••"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Update PIN</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </>
          )}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPinPage() {
  return (
    <AuthLayout showBackLink backLinkHref="/login" backLinkLabel="Back to login">
      <Suspense fallback={<div className="text-white text-sm">Loading reset form...</div>}>
        <ResetPinForm />
      </Suspense>
    </AuthLayout>
  );
}
