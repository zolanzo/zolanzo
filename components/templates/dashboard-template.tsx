import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { cn } from "@/utils";

export type DashboardTemplateProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  metrics?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DashboardTemplate({
  title,
  description,
  actions,
  breadcrumbs,
  metrics,
  children,
  className,
}: DashboardTemplateProps) {
  return (
    <PageTransition className={cn("flex flex-col gap-6", className)}>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        breadcrumbs={breadcrumbs}
      />
      {metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics}</div>
      ) : null}
      {children}
    </PageTransition>
  );
}
