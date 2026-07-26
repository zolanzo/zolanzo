import type { HTMLAttributes, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/utils";

export type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this content. Please try again.",
  action,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-danger/30 bg-danger/5 text-danger">
        <AlertCircle className="size-7" aria-hidden />
      </div>
      <h3 className="text-h3 text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-small text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
