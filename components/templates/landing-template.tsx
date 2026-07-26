import type { ReactNode } from "react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { HeroBanner } from "@/components/ui/hero-banner";
import { PageTransition } from "@/components/layout/page-transition";
import { Container } from "@/components/layout/container";
import { cn } from "@/utils";

export type LandingTemplateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  media?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/**
 * Marketing landing template — brand-first hero, then content sections.
 */
export function LandingTemplate({
  eyebrow,
  title,
  description,
  actions,
  media,
  children,
  className,
}: LandingTemplateProps) {
  return (
    <MarketingLayout>
      <PageTransition className={cn(className)}>
        <HeroBanner
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={actions}
          media={media}
        />
        {children ? (
          <Container className="py-16 sm:py-24">{children}</Container>
        ) : null}
      </PageTransition>
    </MarketingLayout>
  );
}
