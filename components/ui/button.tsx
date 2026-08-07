"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "gold";
  size?: "sm" | "md" | "lg";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl";

  const variantStyles = {
    primary:
      "primary-action",
    secondary:
      "secondary-action",
    outline:
      "bg-transparent border border-border hover:border-primary/40 text-foreground hover:bg-muted",
    ghost:
      "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
    danger:
      "bg-danger/10 hover:bg-danger/15 text-danger border border-danger/30",
    success:
      "bg-success/10 hover:bg-success/15 text-success border border-success/30",
    gold:
      "bg-accent hover:bg-accent/90 text-accent-foreground font-extrabold shadow-md",
  };

  const sizeStyles = {
    sm: "h-[36px] px-3 text-xs gap-1.5",
    md: "h-[44px] px-4 text-xs sm:text-sm gap-2",
    lg: "h-[52px] px-6 text-sm gap-2.5",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
}
