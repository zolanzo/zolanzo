"use client";

import { motion, useReducedMotion } from "motion/react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/utils";
import { MOTION } from "@/constants/design-tokens";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "gold";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  "aria-label"?: string;
  "aria-haspopup"?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  form?: string;
  name?: string;
  value?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-card shadow-soft",
  ghost: "bg-transparent text-foreground hover:bg-foreground/5",
  outline:
    "bg-transparent text-foreground border border-border hover:border-primary/40 hover:bg-primary/5",
  danger: "bg-danger text-white hover:bg-danger/90 shadow-soft",
  gold: "bg-accent text-accent-foreground hover:brightness-95 shadow-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-button gap-1.5 rounded-md",
  md: "h-10 px-4 text-button gap-2 rounded-lg",
  lg: "h-12 px-6 text-button gap-2 rounded-lg text-[0.9375rem]",
};

/**
 * Primary interactive control — extend variants here; do not duplicate.
 */
export function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  onKeyDown,
  "aria-label": ariaLabel,
  "aria-haspopup": ariaHaspopup,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
  form,
  name,
  value,
}: ButtonProps) {
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      form={form}
      name={name}
      value={value}
      whileTap={reduceMotion || isDisabled ? undefined : { scale: 0.98 }}
      transition={{ duration: MOTION.fast }}
      className={cn(
        "focus-ring inline-flex items-center justify-center font-semibold transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </motion.button>
  );
}
