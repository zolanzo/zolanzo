import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

export type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  header?: ReactNode;
  as?: "section" | "div";
};

export function Section({
  children,
  header,
  as: Tag = "section",
  className,
  ...props
}: SectionProps) {
  return (
    <Tag className={cn("w-full", className)} {...props}>
      {header}
      {children}
    </Tag>
  );
}
