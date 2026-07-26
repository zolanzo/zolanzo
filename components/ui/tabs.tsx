"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/utils";

type TabsContextValue = {
  active: string;
  setActive: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within Tabs");
  return context;
}

export type TabsProps = HTMLAttributes<HTMLDivElement> & {
  defaultValue: string;
  children: ReactNode;
  onValueChange?: (value: string) => void;
};

export function Tabs({
  defaultValue,
  children,
  onValueChange,
  className,
  ...props
}: TabsProps) {
  const baseId = useId();
  const [active, setActiveState] = useState(defaultValue);

  const setActive = (value: string) => {
    setActiveState(value);
    onValueChange?.(value);
  };

  return (
    <TabsContext.Provider value={{ active, setActive, baseId }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export type TabsListProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type TabsTriggerProps = HTMLAttributes<HTMLButtonElement> & {
  value: string;
  children: ReactNode;
};

export function TabsTrigger({
  value,
  children,
  className,
  ...props
}: TabsTriggerProps) {
  const { active, setActive, baseId } = useTabsContext();
  const selected = active === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => setActive(value)}
      className={cn(
        "focus-ring rounded-lg px-4 py-2 text-small font-medium transition-colors",
        selected
          ? "bg-card text-foreground shadow-soft"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  children: ReactNode;
};

export function TabsContent({
  value,
  children,
  className,
  ...props
}: TabsContentProps) {
  const { active, baseId } = useTabsContext();
  if (active !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn("mt-4 focus:outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}
