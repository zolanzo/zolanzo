"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/utils";
import { MOTION } from "@/constants/design-tokens";

export type IconButtonProps = {
  children: ReactNode;
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "primary" | "surface";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  tabIndex?: number;
};

const sizeMap = {
  sm: "size-8 rounded-md",
  md: "size-10 rounded-lg",
  lg: "size-12 rounded-xl",
} as const;

const variantMap = {
  ghost: "bg-transparent hover:bg-foreground/5 text-foreground",
  outline: "border border-border bg-transparent hover:bg-foreground/5",
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  surface: "bg-surface border border-border hover:bg-card shadow-soft",
} as const;

export function IconButton({
  children,
  label,
  size = "md",
  variant = "ghost",
  className,
  disabled,
  onClick,
  type = "button",
  tabIndex,
}: IconButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      tabIndex={tabIndex}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.95 }}
      transition={{ duration: MOTION.fast }}
      className={cn(
        "focus-ring inline-flex items-center justify-center transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        sizeMap[size],
        variantMap[variant],
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
