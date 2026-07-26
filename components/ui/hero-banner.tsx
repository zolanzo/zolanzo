import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

export type HeroBannerProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
  align?: "left" | "center";
};

export function HeroBanner({
  eyebrow,
  title,
  description,
  actions,
  media,
  align = "left",
  className,
  ...props
}: HeroBannerProps) {
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-background py-16 sm:py-20 lg:py-24",
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(22,198,198,0.12),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
            centered && "lg:grid-cols-1",
          )}
        >
          <div className={cn(centered && "mx-auto max-w-3xl text-center")}>
            {eyebrow ? (
              <p className="mb-4 text-caption font-semibold uppercase tracking-widest text-primary">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-display text-foreground">{title}</h1>
            {description ? (
              <div
                className={cn(
                  "mt-5 text-body-lg text-muted-foreground",
                  centered && "mx-auto max-w-2xl",
                )}
              >
                {description}
              </div>
            ) : null}
            {actions ? (
              <div
                className={cn(
                  "mt-8 flex flex-wrap gap-3",
                  centered && "justify-center",
                )}
              >
                {actions}
              </div>
            ) : null}
          </div>
          {media ? (
            <div className={cn(centered && "mx-auto w-full max-w-3xl")}>
              {media}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
