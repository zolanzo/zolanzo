"use client";

import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

export type DropdownItem = {
  id: string;
  label: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

export type DropdownProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  label?: string;
  className?: string;
  menuClassName?: string;
};

export function Dropdown({
  trigger,
  items,
  align = "start",
  label,
  className,
  menuClassName,
}: DropdownProps) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const enabledIndexes = items
    .map((item, index) => (item.disabled ? -1 : index))
    .filter((index) => index >= 0);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [close]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [open, activeIndex]);

  function moveActive(direction: 1 | -1) {
    if (enabledIndexes.length === 0) return;
    setActiveIndex((prev) => {
      const currentPos = enabledIndexes.indexOf(prev);
      if (currentPos === -1) {
        return enabledIndexes[direction === 1 ? 0 : enabledIndexes.length - 1]!;
      }
      const nextPos =
        (currentPos + direction + enabledIndexes.length) %
        enabledIndexes.length;
      return enabledIndexes[nextPos]!;
    });
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(enabledIndexes[0] ?? -1);
      return;
    }

    if (event.key === "Escape") {
      close();
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(enabledIndexes[0] ?? -1);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const item = items[activeIndex];
      if (item && !item.disabled) {
        item.onSelect?.();
        close();
      }
    }
  }

  function handleItemSelect(item: DropdownItem, index: number) {
    if (item.disabled) return;
    setActiveIndex(index);
    item.onSelect?.();
    close();
  }

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      <Button
        type="button"
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) setActiveIndex(enabledIndexes[0] ?? -1);
        }}
        onKeyDown={handleTriggerKeyDown}
        className="gap-2"
      >
        {trigger}
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute top-[calc(100%+0.25rem)] z-50 min-w-[12rem] rounded-lg border border-border bg-card py-1 shadow-floating outline-none",
            align === "end" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              tabIndex={activeIndex === index ? 0 : -1}
              disabled={item.disabled}
              onClick={() => handleItemSelect(item, index)}
              className={cn(
                "focus-ring flex w-full items-center px-3 py-2 text-left text-small text-foreground transition-colors hover:bg-foreground/5",
                activeIndex === index && "bg-foreground/5",
                item.destructive && "text-danger hover:bg-danger/10",
                item.disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
