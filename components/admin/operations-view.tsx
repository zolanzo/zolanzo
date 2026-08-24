"use client";

import React from "react";
import Link from "next/link";
import { DataBoundaryBanner } from "@/components/workspace/data-boundary-banner";
import type { DataBoundary } from "@/lib/workspace/data-boundary";

export function AdminOperationsView({
  boundary,
  children,
}: {
  boundary: DataBoundary;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-black text-foreground">Operations</h1>
        <Link href="/lex/staff" className="text-xs font-bold text-primary">
          Staff workspace
        </Link>
      </div>
      <DataBoundaryBanner boundary={boundary} />
      {children}
    </main>
  );
}
