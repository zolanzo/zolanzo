"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { MOTION } from "@/constants/design-tokens";
import { cn } from "@/utils";

export type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Subtle page enter transition. Honors prefers-reduced-motion.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.base, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
