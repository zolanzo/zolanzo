import type { ReactNode } from "react";
import { cn } from "@/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type FeatureCardProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <Card hover className={cn("h-full", className)}>
      {icon ? (
        <div className="border-border bg-surface text-primary mb-4 flex size-11 items-center justify-center rounded-xl border">
          {icon}
        </div>
      ) : null}
      <CardHeader className="mb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
