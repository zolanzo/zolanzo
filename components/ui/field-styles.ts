import { cn } from "@/utils";

/** Shared control surface — import from here; do not duplicate in features. */
export function controlClasses(options?: {
  error?: boolean;
  className?: string;
}): string {
  return cn(
    "w-full rounded-lg border bg-surface text-body text-foreground shadow-soft",
    "placeholder:text-muted-foreground transition-colors",
    "hover:border-primary/30",
    "focus-ring",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    options?.error
      ? "border-danger focus-visible:ring-danger"
      : "border-border",
    options?.className,
  );
}

export function fieldWrapperClasses(className?: string): string {
  return cn("flex flex-col gap-1.5", className);
}

export function hintClasses(): string {
  return "text-caption text-muted-foreground";
}

export function errorClasses(): string {
  return "text-caption text-danger";
}
