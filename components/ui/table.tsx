import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/utils";

export type TableProps = TableHTMLAttributes<HTMLTableElement>;

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
      <table
        className={cn("w-full caption-bottom text-body", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export type THeadProps = HTMLAttributes<HTMLTableSectionElement>;

export function THead({ className, children, ...props }: THeadProps) {
  return (
    <thead
      className={cn(
        "border-b border-border bg-surface text-left text-small font-semibold text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export type TBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export function TBody({ className, children, ...props }: TBodyProps) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>
      {children}
    </tbody>
  );
}

export type TRProps = HTMLAttributes<HTMLTableRowElement>;

export function TR({ className, children, ...props }: TRProps) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors hover:bg-foreground/[0.02]",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export type THProps = ThHTMLAttributes<HTMLTableCellElement>;

export function TH({ className, children, scope = "col", ...props }: THProps) {
  return (
    <th
      scope={scope}
      className={cn("h-11 px-4 align-middle font-semibold", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export type TDProps = TdHTMLAttributes<HTMLTableCellElement>;

export function TD({ className, children, ...props }: TDProps) {
  return (
    <td className={cn("px-4 py-3 align-middle text-foreground", className)} {...props}>
      {children}
    </td>
  );
}
