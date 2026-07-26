"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils";
import { IconButton } from "@/components/ui/icon-button";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  "aria-label"?: string;
};

type PageItem = number | "ellipsis";

function buildPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): PageItem[] {
  if (totalPages <= 1) return [1];

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ]);

  for (let i = 1; i <= siblingCount; i += 1) {
    pages.add(Math.max(1, currentPage - i));
    pages.add(Math.min(totalPages, currentPage + i));
  }

  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: PageItem[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i];
    const prev = sorted[i - 1];
    if (page !== undefined && prev !== undefined && page - prev > 1) {
      result.push("ellipsis");
    }
    if (page !== undefined) {
      result.push(page);
    }
  }

  return result;
}

function PageButton({
  page,
  isActive,
  onSelect,
}: {
  page: number;
  isActive: boolean;
  onSelect: (page: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(page)}
      aria-label={`Page ${page}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "focus-ring inline-flex size-10 items-center justify-center rounded-lg text-button transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-soft"
          : "text-foreground hover:bg-foreground/5",
      )}
    >
      {page}
    </button>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
  "aria-label": ariaLabel = "Pagination",
}: PaginationProps) {
  const pages = buildPageRange(currentPage, totalPages, siblingCount);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrev = () => {
    if (canGoPrev) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (canGoNext) onPageChange(currentPage + 1);
  };

  if (totalPages <= 0) return null;

  return (
    <nav aria-label={ariaLabel} className={cn("flex items-center justify-center gap-1", className)}>
      <IconButton
        label="Previous page"
        size="sm"
        variant="outline"
        disabled={!canGoPrev}
        onClick={handlePrev}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </IconButton>

      <div className="flex items-center gap-1 px-1">
        {pages.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex size-10 items-center justify-center text-muted-foreground"
                aria-hidden
              >
                …
              </span>
            );
          }

          return (
            <PageButton
              key={item}
              page={item}
              isActive={item === currentPage}
              onSelect={onPageChange}
            />
          );
        })}
      </div>

      <IconButton
        label="Next page"
        size="sm"
        variant="outline"
        disabled={!canGoNext}
        onClick={handleNext}
      >
        <ChevronRight className="size-4" aria-hidden />
      </IconButton>
    </nav>
  );
}

export type PaginationSummaryProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  className?: string;
};

export function PaginationSummary({
  currentPage,
  pageSize,
  totalItems,
  className,
}: PaginationSummaryProps): ReactNode {
  if (totalItems === 0) {
    return (
      <p className={cn("text-small text-muted-foreground", className)}>No results</p>
    );
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <p className={cn("text-small text-muted-foreground", className)}>
      Showing {start}–{end} of {totalItems}
    </p>
  );
}
