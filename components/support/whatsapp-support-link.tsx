"use client";

import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { APP_CONFIG } from "@/config/app";
import { cn } from "@/utils";

type WhatsAppSupportLinkProps = {
  className?: string;
  variant?: "button" | "card" | "link";
  /** Override visible label. Defaults to WhatsApp Support. */
  label?: string;
};

export function WhatsAppSupportLink({
  className = "",
  variant = "button",
  label,
}: WhatsAppSupportLinkProps) {
  const { display, href } = APP_CONFIG.supportWhatsApp;
  const text = label ?? "WhatsApp Support";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Message ZOLANZO admin on WhatsApp at ${display}`}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 font-bold transition-colors",
        variant === "button" &&
          "min-h-11 rounded-xl bg-[#25D366] px-4 text-sm text-white hover:bg-[#1ebe5d]",
        variant === "card" &&
          "min-h-11 w-full justify-start rounded-xl border border-border bg-card px-3 py-3 text-xs text-foreground hover:bg-hover sm:text-sm",
        variant === "link" &&
          "min-h-11 text-sm text-primary hover:text-primary-hover hover:underline",
        className,
      )}
    >
      {variant !== "link" ? (
        <SocialBrandIcon platform="WhatsApp" size={18} />
      ) : null}
      <span>{text}</span>
    </a>
  );
}
