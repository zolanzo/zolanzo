import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { cn } from "@/utils";

export type DetailTemplateProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DetailTemplate({
  title,
  description,
  actions,
  breadcrumbs,
  sidebar,
  children,
  className,
}: DetailTemplateProps) {
  return (
    <PageTransition className={cn("flex flex-col gap-6", className)}>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        breadcrumbs={breadcrumbs}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">{children}</div>
        {sidebar ? <aside className="space-y-4">{sidebar}</aside> : null}
      </div>
    </PageTransition>
  );
}
