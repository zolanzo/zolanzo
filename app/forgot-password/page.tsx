"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-xs">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Icons.lock size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Account Recovery</h1>
          <p className="text-zinc-400">Enter your registered email address to receive password reset instructions.</p>
        </div>

        {sent ? (
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-3">
            <div className="text-sm font-bold text-emerald-400">Recovery Link Sent!</div>
            <p className="text-zinc-400">Please check your email inbox for password reset link.</p>
            <Link href="/login" className="inline-block pt-2 text-emerald-400 font-bold hover:underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1 text-zinc-300">Email Address</label>
              <input
                required
                type="email"
                placeholder="kwame@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all min-h-[44px]"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
