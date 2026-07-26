"use client";

import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MOTION, Z_INDEX } from "@/constants/design-tokens";
import { cn } from "@/utils";

export type FloatingActionButtonProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  useBrandIcon?: boolean;
  icon?: LucideIcon;
  className?: string;
  children?: ReactNode;
};

const baseClasses =
  "focus-ring inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-floating transition-colors hover:bg-primary-hover";

export function FloatingActionButton({
  label,
  href,
  onClick,
  useBrandIcon = false,
  icon: Icon = Plus,
  className,
  children,
}: FloatingActionButtonProps) {
  const reduceMotion = useReducedMotion();

  const content = children ?? (
    useBrandIcon ? (
      <BrandLogo asset="icon" width={28} height={28} />
    ) : (
      <Icon className="size-6" aria-hidden />
    )
  );

  const motionProps = {
    whileHover: reduceMotion ? undefined : { scale: 1.05 },
    whileTap: reduceMotion ? undefined : { scale: 0.95 },
    transition: { duration: MOTION.fast },
  };

  const sharedClassName = cn(baseClasses, className);

  if (href) {
    return (
      <motion.div
        className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6"
        style={{ zIndex: Z_INDEX.dropdown }}
        {...motionProps}
      >
        <Link href={href} aria-label={label} className={sharedClassName}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn("fixed right-4 bottom-4 sm:right-6 sm:bottom-6", sharedClassName)}
      style={{ zIndex: Z_INDEX.dropdown }}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}
