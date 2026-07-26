"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils";

type AccordionContextValue = {
  openItems: string[];
  toggle: (value: string) => void;
  type: "single" | "multiple";
  baseId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within Accordion");
  }
  return context;
}

export type AccordionProps = HTMLAttributes<HTMLDivElement> & {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  children: ReactNode;
};

export function Accordion({
  type = "single",
  defaultValue,
  children,
  className,
  ...props
}: AccordionProps) {
  const baseId = useId();
  const initial = Array.isArray(defaultValue)
    ? defaultValue
    : defaultValue
      ? [defaultValue]
      : [];
  const [openItems, setOpenItems] = useState<string[]>(initial);

  const toggle = (value: string) => {
    setOpenItems((prev) => {
      const isOpen = prev.includes(value);
      if (type === "single") return isOpen ? [] : [value];
      return isOpen ? prev.filter((item) => item !== value) : [...prev, value];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type, baseId }}>
      <div className={cn("divide-y divide-border rounded-xl border border-border", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  children: ReactNode;
};

export function AccordionItem({
  children,
  className,
  ...props
}: AccordionItemProps) {
  return (
    <div className={cn("bg-card first:rounded-t-xl last:rounded-b-xl", className)} {...props}>
      {children}
    </div>
  );
}

export type AccordionTriggerProps = HTMLAttributes<HTMLButtonElement> & {
  value: string;
  children: ReactNode;
};

export function AccordionTrigger({
  value,
  children,
  className,
  ...props
}: AccordionTriggerProps) {
  const { openItems, toggle, baseId } = useAccordionContext();
  const open = openItems.includes(value);
  const panelId = `${baseId}-panel-${value}`;

  return (
    <h3 className="m-0">
      <button
        type="button"
        id={`${baseId}-trigger-${value}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => toggle(value)}
        className={cn(
          "focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-small font-semibold text-foreground transition-colors hover:bg-surface/60",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
    </h3>
  );
}

export type AccordionContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  children: ReactNode;
};

export function AccordionContent({
  value,
  children,
  className,
  ...props
}: AccordionContentProps) {
  const { openItems, baseId } = useAccordionContext();
  const open = openItems.includes(value);
  const panelId = `${baseId}-panel-${value}`;

  if (!open) return null;

  return (
    <div
      id={panelId}
      role="region"
      aria-labelledby={`${baseId}-trigger-${value}`}
      className={cn("px-5 pb-4 text-small text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  );
}
