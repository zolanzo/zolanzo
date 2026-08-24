"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BrandIcon } from "@/components/ui/brand-icons";
import { Icons } from "@/lib/icon-registry";

export function LoginForm({
  portalType,
}: {
  portalType: "worker" | "employer";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isWorker = portalType === "worker";
  const registerRoute = isWorker ? "/register/worker" : "/register/employer";
  const forgotRoute = isWorker ? "/forgot-password/worker" : "/forgot-password/employer";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = isWorker ? "/worker/dashboard" : "/organization/dashboard";
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground sm:p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <BrandLogo width={160} height={40} priority />
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome Back</h1>
          <p className="text-xs font-medium text-muted-foreground">
            Sign in to your ZOLANZO account
          </p>
        </div>

        {/* Primary Form (Top) */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left pt-2">
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-[46px] w-full rounded-xl border border-border bg-input-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Password</label>
              <Link href={forgotRoute} className="text-xs font-semibold text-primary hover:text-primary-hover">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="min-h-[46px] w-full rounded-xl border border-border bg-input-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="primary-action mt-2 flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-xs font-bold"
          >
            {isLoading ? (
              <Icons.refresh className="animate-spin size-4" />
            ) : (
              <>Sign In <Icons.arrowRight size={16} /></>
            )}
          </button>

        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-background px-3 font-semibold tracking-wider text-muted-foreground">
              OR CONTINUE WITH
            </span>
          </div>
        </div>

        {/* Social Buttons (Bottom) */}
        <div className="space-y-3">
          
          <button
            type="button"
            className="flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground transition-all hover:bg-hover"
          >
            <BrandIcon brand="google" size={18} />
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            className="flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground transition-all hover:bg-hover"
          >
            <BrandIcon brand="facebook" size={18} />
            <span>Continue with Facebook</span>
          </button>

          <button
            type="button"
            className="flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground transition-all hover:bg-hover"
          >
            <BrandIcon brand="apple" size={18} />
            <span>Continue with Apple</span>
          </button>

        </div>

        {/* Footer Link */}
        <div className="pt-2 text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={registerRoute} className="font-bold text-primary hover:text-primary-hover">
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}
