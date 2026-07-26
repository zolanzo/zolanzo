import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils";

export type ListTemplateProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  className?: string;
};

export function ListTemplate({
  title,
  description,
  actions,
  filters,
  toolbar,
  children,
  pagination,
  className,
}: ListTemplateProps) {
  return (
    <PageTransition className={cn("flex flex-col gap-6", className)}>
      <PageHeader title={title} description={description} actions={actions} />
      {filters}
      <Card padding="none" className="overflow-hidden">
        {toolbar ? (
          <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
            {toolbar}
          </div>
        ) : null}
        {children}
        {pagination ? (
          <div className="border-border border-t px-4 py-3">{pagination}</div>
        ) : null}
      </Card>
    </PageTransition>
  );
}
