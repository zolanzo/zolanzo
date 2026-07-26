"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export type SortDirection = "asc" | "desc";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  emptyDescription?: string;
  sortColumnId?: string;
  sortDirection?: SortDirection;
  onSort?: (columnId: string) => void;
  className?: string;
  caption?: string;
};

function SortIndicator({
  columnId,
  sortColumnId,
  sortDirection,
}: {
  columnId: string;
  sortColumnId?: string;
  sortDirection?: SortDirection;
}) {
  if (sortColumnId !== columnId) {
    return <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />;
  }

  if (sortDirection === "asc") {
    return <ArrowUp className="size-3.5" aria-hidden />;
  }

  return <ArrowDown className="size-3.5" aria-hidden />;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No data yet",
  emptyDescription = "Results will appear here when available.",
  sortColumnId,
  sortDirection,
  onSort,
  className,
  caption,
}: DataTableProps<T>) {
  const isEmpty = data.length === 0;

  return (
    <div className={cn("w-full", className)}>
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <THead>
          <TR className="hover:bg-transparent">
            {columns.map((column) => {
              const isSortable = column.sortable && onSort;
              const sortLabel =
                sortColumnId === column.id && sortDirection
                  ? `, sorted ${sortDirection === "asc" ? "ascending" : "descending"}`
                  : "";

              return (
                <TH key={column.id} className={column.headerClassName}>
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.id)}
                      className="focus-ring -mx-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:text-foreground"
                      aria-label={`Sort by ${column.header}${sortLabel}`}
                    >
                      <span>{column.header}</span>
                      <SortIndicator
                        columnId={column.id}
                        sortColumnId={sortColumnId}
                        sortDirection={sortDirection}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </TH>
              );
            })}
          </TR>
        </THead>
        <TBody>
          {isEmpty ? (
            <TR className="hover:bg-transparent">
              <TD colSpan={columns.length} className="py-16 text-center">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                  <p className="text-h3 text-foreground">{emptyMessage}</p>
                  <p className="text-small text-muted-foreground">{emptyDescription}</p>
                </div>
              </TD>
            </TR>
          ) : (
            data.map((row) => (
              <TR key={getRowKey(row)}>
                {columns.map((column) => (
                  <TD key={column.id} className={column.cellClassName}>
                    {column.cell(row)}
                  </TD>
                ))}
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}
