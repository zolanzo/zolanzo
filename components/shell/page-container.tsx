"use client";

import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: "default" | "full" | "narrow";
}

export function PageContainer({ children, maxWidth = "default" }: PageContainerProps) {
  const maxWidthClass =
    maxWidth === "full"
      ? "max-w-full"
      : maxWidth === "narrow"
        ? "max-w-[1000px]"
        : "max-w-[1440px]";

  return (
    <div className={`w-full mx-auto px-0 sm:px-6 py-2 lg:py-4 pb-20 ${maxWidthClass}`}>
      {children}
    </div>
  );
}
