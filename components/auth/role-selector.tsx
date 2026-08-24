"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icons } from "@/lib/icon-registry";

export function RoleSelector({ mode = "login" }: { mode?: "login" | "register" }) {
  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground sm:p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <BrandLogo width={160} height={40} priority />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome to ZOLANZO</h1>
          <p className="text-xs text-muted-foreground">Select your path to continue on the platform</p>
        </div>

        <div className="space-y-4 pt-2">
          <Link
            href={isLogin ? "/login" : "/signup"}
            className="group flex min-h-[88px] cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/60 hover:bg-hover"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icons.profile size={24} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-base font-extrabold text-foreground">
                <span>Earner</span>
                <Icons.arrowRight
                  size={18}
                  className="text-muted-foreground transition-colors group-hover:text-primary"
                />
              </div>
              <p className="text-xs font-normal text-muted-foreground">
                Find opportunities, complete tasks and earn money.
              </p>
            </div>
          </Link>

          <Link
            href={isLogin ? "/login" : "/signup"}
            className="group flex min-h-[88px] cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/60 hover:bg-hover"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icons.organization size={24} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-base font-extrabold text-foreground">
                <span>Hirer / Campaign Manager</span>
                <Icons.arrowRight
                  size={18}
                  className="text-muted-foreground transition-colors group-hover:text-primary"
                />
              </div>
              <p className="text-xs font-normal text-muted-foreground">
                Create campaigns, hire earners and scale operations.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
