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
      "bg-[#008744] hover:bg-[#00753b] text-white shadow-md shadow-emerald-950/20 hover:-translate-y-[1px]",
    secondary:
      "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700",
    outline:
      "bg-transparent border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-900/50",
    ghost:
      "bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white",
    danger:
      "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30",
    success:
      "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30",
    gold:
      "bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-md",
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
