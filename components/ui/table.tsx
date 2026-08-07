"use client";

import React from "react";

export function Table({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <table className={`w-full text-left text-xs text-foreground ${className}`}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-border bg-muted text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TableRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tr className={`transition-colors hover:bg-muted/70 ${className}`}>{children}</tr>;
}

export function TableHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-3.5 font-bold ${className}`}>{children}</th>;
}

export function TableCell({
  children,
  colSpan,
  className = "",
}: {
  children: React.ReactNode;
  colSpan?: number;
  className?: string;
}) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3.5 font-medium ${className}`}>
      {children}
    </td>
  );
}

// Legacy Aliases for data-table compatibility
export const THead = TableHeader;
export const TBody = TableBody;
export const TR = TableRow;
export const TH = TableHead;
export const TD = TableCell;
