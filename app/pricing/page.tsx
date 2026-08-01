import React from "react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 space-y-4 text-center">
      <h1 className="text-2xl font-bold">Pricing Plans</h1>
      <p className="text-sm text-zinc-400 max-w-sm">
        Placeholder for Pricing page.
      </p>
      <Link href="/" className="text-sm text-emerald-400 hover:underline">
        Back to Home
      </Link>
    </div>
  );
}
