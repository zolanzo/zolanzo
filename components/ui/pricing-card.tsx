import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type PricingCardProps = {
  name: string;
  price: ReactNode;
  period?: string;
  description?: string;
  features?: string[];
  highlighted?: boolean;
  badge?: string;
  cta?: ReactNode;
  className?: string;
};

export function PricingCard({
  name,
  price,
  period = "/month",
  description,
  features = [],
  highlighted = false,
  badge,
  cta,
  className,
}: PricingCardProps) {
  return (
    <Card
      padding="lg"
      className={cn(
        "relative flex h-full flex-col",
        highlighted && "border-primary/40 shadow-medium ring-primary/20 ring-1",
        className,
      )}
    >
      {badge ? (
        <Badge variant="gold" className="absolute top-5 right-5">
          {badge}
        </Badge>
      ) : null}
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-h2 text-foreground font-bold">{price}</span>
        {period ? (
          <span className="text-small text-muted-foreground">{period}</span>
        ) : null}
      </div>
      {features.length > 0 ? (
        <ul className="mb-8 flex-1 space-y-3">
          {features.map((feature) => (
            <li
              key={feature}
              className="text-small text-muted-foreground flex items-start gap-2"
            >
              <Check
                className="text-success mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1" />
      )}
      {cta ? <div className="mt-auto">{cta}</div> : null}
    </Card>
  );
}
