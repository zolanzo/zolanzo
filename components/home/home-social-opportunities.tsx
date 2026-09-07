import Link from "next/link";
import { BrandIcon } from "@/components/ui/brand-icons";
import { HOME_SOCIAL_PLATFORMS } from "@/components/home/home-content";

export function HomeSocialOpportunities() {
  return (
    <div className="mx-auto max-w-[720px]">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {HOME_SOCIAL_PLATFORMS.map((platform) => (
          <li key={platform.brand}>
            <div className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-3 transition-colors hover:border-primary/30 hover:bg-hover">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white text-black">
                <BrandIcon brand={platform.brand} size={18} aria-hidden />
              </span>
              <span className="truncate text-[13px] font-semibold text-foreground">
                {platform.label}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex justify-center border-t border-border pt-4">
        <Link
          href="/tasks"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          Browse Social Media Tasks →
        </Link>
      </div>
    </div>
  );
}
