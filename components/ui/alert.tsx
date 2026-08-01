"use client";

import { useState, type HTMLAttributes, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/utils";
import { IconButton } from "@/components/ui/icon-button";

export type AlertVariant = "default" | "primary" | "success" | "warning" | "danger";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  icon?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
};

const variantClasses: Record<AlertVariant, string> = {
  default: "border-border bg-card text-foreground",
  primary: "border-primary/30 bg-primary/5 text-foreground",
  success: "border-success/30 bg-success/5 text-foreground",
  warning: "border-warning/30 bg-warning/5 text-foreground",
  danger: "border-danger/30 bg-danger/5 text-foreground",
};

const accentClasses: Record<AlertVariant, string> = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const defaultIcons: Record<AlertVariant, ReactNode> = {
  default: <Info className="size-5 shrink-0" aria-hidden />,
  primary: <Info className="size-5 shrink-0" aria-hidden />,
  success: <CheckCircle2 className="size-5 shrink-0" aria-hidden />,
  warning: <TriangleAlert className="size-5 shrink-0" aria-hidden />,
  danger: <AlertCircle className="size-5 shrink-0" aria-hidden />,
};

export function Alert({
  children,
  variant = "default",
  title,
  icon,
  dismissible = false,
  onDismiss,
  className,
  role = "alert",
  ...props
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const displayIcon = icon ?? defaultIcons[variant];

  return (
    <div
      role={role}
      className={cn(
        "relative flex gap-3 rounded-xl border p-4 shadow-soft",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <span className={cn("mt-0.5", accentClasses[variant])}>{displayIcon}</span>
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="mb-1 text-small font-semibold text-foreground">{title}</p>
        ) : null}
        <div className="text-small text-foreground/90">{children}</div>
      </div>
      {dismissible ? (
        <IconButton
          label="Dismiss alert"
          size="sm"
          variant="ghost"
          className="absolute right-2 top-2 shrink-0"
          onClick={handleDismiss}
        >
          <X className="size-4" aria-hidden />
        </IconButton>
      ) : null}
    </div>
  );
}
