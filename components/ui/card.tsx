"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/utils";
import { MOTION } from "@/constants/design-tokens";

export type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
  role?: string;
};

const paddingMap = {
  none: "p-0",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
  onClick,
  role,
}: CardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      role={role}
      onClick={onClick}
      whileHover={
        hover && !reduceMotion
          ? { y: -2, transition: { duration: MOTION.fast } }
          : undefined
      }
      className={cn(
        "rounded-2xl border border-border bg-card text-foreground shadow-soft",
        hover && "transition-shadow hover:shadow-medium",
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mb-4 flex flex-col gap-1", className)}>{children}</div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <h3 className={cn("text-h3", className)}>{children}</h3>;
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn("text-small text-muted-foreground", className)}>
      {children}
    </p>
  );
}
