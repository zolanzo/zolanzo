import type { ReactNode } from "react";
import { PageTransition } from "@/components/layout/page-transition";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils";

export type ProfileTemplateProps = {
  name: string;
  email?: string;
  role?: string;
  avatarSrc?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ProfileTemplate({
  name,
  email,
  role,
  avatarSrc,
  actions,
  children,
  className,
}: ProfileTemplateProps) {
  return (
    <PageTransition className={cn("flex flex-col gap-6", className)}>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            src={avatarSrc}
            alt={name}
            initials={name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
            size="lg"
          />
          <div>
            <h1 className="text-h2">{name}</h1>
            {email ? (
              <p className="text-small text-muted-foreground mt-1">{email}</p>
            ) : null}
            {role ? (
              <p className="text-caption text-muted-foreground mt-1">{role}</p>
            ) : null}
          </div>
        </div>
        {actions}
      </Card>
      {children}
    </PageTransition>
  );
}
