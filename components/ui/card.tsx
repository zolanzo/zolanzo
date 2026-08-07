"use client";

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
  loading?: boolean;
  padding?: string;
}

export function Card({
  children,
  variant = "default",
  loading = false,
  className = "",
  ...props
}: CardProps) {
  const baseStyles =
    "surface-panel p-5 sm:p-6 relative overflow-hidden";

  const variantStyles = {
    default: "",
    elevated: "shadow-floating",
    interactive: "interactive-surface cursor-pointer",
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded-lg w-1/3" />
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-4 bg-muted rounded-lg w-2/3" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between border-b border-border pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h3 className={`text-base font-bold text-foreground tracking-tight ${className}`}>{children}</h3>;
}

export function CardDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`text-xs text-muted-foreground leading-relaxed ${className}`}>{children}</p>;
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`space-y-3 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`pt-4 border-t border-border flex items-center justify-between mt-4 ${className}`}>
      {children}
    </div>
  );
}
