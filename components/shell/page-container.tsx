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
    <div className={`w-full mx-auto px-0 sm:px-8 py-0 lg:py-8 pb-20 lg:pb-12 ${maxWidthClass}`}>
      {children}
    </div>
  );
}
