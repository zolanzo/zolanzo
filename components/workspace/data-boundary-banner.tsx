"use client";

import React from "react";
import Link from "next/link";
import { dataBoundaryDescription, type DataBoundary } from "@/lib/workspace/data-boundary";

export function DataBoundaryBanner({
  boundary,
  className = "",
}: {
  boundary: DataBoundary;
  className?: string;
}) {
  if (boundary.kind === "live" || boundary.kind === "loading") return null;

  const tone =
    boundary.kind === "unavailable"
      ? "border-warning/30 bg-warning/10 text-warning"
      : boundary.kind === "fixture"
        ? "border-info/30 bg-info/10 text-info"
        : "border-border bg-muted text-foreground";

  const label =
    boundary.kind === "unavailable"
      ? "UNAVAILABLE"
      : boundary.kind === "fixture"
        ? "FIXTURE"
        : "EMPTY";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${tone} ${className}`}
      data-boundary={boundary.kind}
      role="status"
    >
      <p className="text-xs font-bold min-w-0 leading-snug">
        <span className="uppercase tracking-wide">{label}</span>
        <span className="font-medium"> · {dataBoundaryDescription(boundary)}</span>
      </p>
      {boundary.kind === "unauthenticated" ? (
        <Link
          href="/login"
          className="shrink-0 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold inline-flex items-center"
        >
          Sign in
        </Link>
      ) : null}
    </div>
  );
}
