import Link from "next/link";
import { BarChart3, ShieldCheck, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LandingTemplate } from "@/components/templates/landing-template";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionHeader } from "@/components/ui/section-header";
import { SITE_CONFIG } from "@/constants/site";
import { cn } from "@/utils";

const linkButtonClass = cn(
  "focus-ring inline-flex h-12 items-center justify-center rounded-lg px-6 text-button font-semibold transition-colors",
);

export default function HomePage() {
  return (
    <LandingTemplate
      title={SITE_CONFIG.name}
      description={SITE_CONFIG.tagline}
      media={
        <BrandLogo
          asset="logo"
          width={480}
          height={120}
          priority
          className="mx-auto w-full max-w-md"
        />
      }
      actions={
        <>
          <Link
            href="/templates/dashboard"
            className={cn(
              linkButtonClass,
              "bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover",
            )}
          >
            Explore templates
          </Link>
          <Link
            href="/design-system"
            className={cn(
              linkButtonClass,
              "border border-border bg-surface text-foreground shadow-soft hover:bg-card",
            )}
          >
            Design system
          </Link>
        </>
      }
    >
      <SectionHeader
        title="Built for workforce operations"
        description="Shell layouts and UI primitives — product features are placeholders only."
      />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          icon={<Users className="size-5" aria-hidden />}
          title="Contributor operations"
          description="Onboard, assign, and track distributed teams across testing, research, and data tasks."
        />
        <FeatureCard
          icon={<ShieldCheck className="size-5" aria-hidden />}
          title="Quality & compliance"
          description="Structured review flows, audit trails, and policy controls for regulated workloads."
        />
        <FeatureCard
          icon={<BarChart3 className="size-5" aria-hidden />}
          title="Operational analytics"
          description="Real-time throughput, SLA tracking, and workforce utilization in dashboard templates."
        />
      </div>
    </LandingTemplate>
  );
}
