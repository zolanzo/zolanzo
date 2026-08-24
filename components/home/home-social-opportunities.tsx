import Link from "next/link";
import { BrandIcon } from "@/components/ui/brand-icons";
import { HOME_SOCIAL_PLATFORMS } from "@/components/home/home-content";

export function HomeSocialOpportunities() {
  return (
    <div className="mx-auto max-w-[960px]">
      <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Social Media Tasks
      </p>

      <ul className="flex flex-wrap items-center justify-center gap-2">
        {HOME_SOCIAL_PLATFORMS.map((platform) => (
          <li
            key={platform.brand}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-2.5 text-sm font-semibold text-foreground"
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white text-black">
              <BrandIcon brand={platform.brand} size={18} aria-hidden />
            </span>
            {platform.label}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-center">
        <Link
          href="/tasks"
          className="flex h-[42px] items-center gap-2 rounded-xl border border-border bg-card px-6 text-xs font-bold text-foreground shadow-xs transition-all duration-200 hover:-translate-y-[1px] hover:border-primary/40 hover:bg-hover"
        >
          Browse Social Media Tasks →
        </Link>
      </div>
    </div>
  );
}
