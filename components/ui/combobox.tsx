"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Label } from "@/components/ui/label";
import {
  controlClasses,
  errorClasses,
  fieldWrapperClasses,
  hintClasses,
} from "@/components/ui/field-styles";
import { cn } from "@/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ComboboxProps = {
  id?: string;
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
};

export function Combobox({
  id,
  options,
  value,
  onValueChange,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  placeholder = "Select an option…",
  emptyMessage = "No results found",
  className,
}: ComboboxProps) {
  const fallbackId = useId();
  const comboboxId = id ?? fallbackId;
  const listboxId = `${comboboxId}-listbox`;
  const hintId = hint && !error ? `${comboboxId}-hint` : undefined;
  const errorId = error ? `${comboboxId}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
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

  function selectOption(option: ComboboxOption) {
    if (option.disabled) return;
    onValueChange?.(option.value);
    close();
    inputRef.current?.focus();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => {
        const next = prev + 1;
        return next >= filtered.length ? 0 : next;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => {
        if (prev <= 0) return filtered.length - 1;
        return prev - 1;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const option = filtered[activeIndex];
      if (option) selectOption(option);
      return;
    }

    if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End" && open) {
      event.preventDefault();
      setActiveIndex(filtered.length - 1);
    }
  }

  const activeOptionId =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className={fieldWrapperClasses(className)}>
      {label ? (
        <Label htmlFor={comboboxId} required={required}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            id={comboboxId}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
            disabled={disabled}
            placeholder={selected?.label ?? placeholder}
            value={open ? query : (selected?.label ?? "")}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleInputKeyDown}
            className={cn(
              controlClasses({ error: Boolean(error), className: "h-10" }),
              "pr-10",
            )}
          />
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? comboboxId : undefined}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-floating"
          >
            {filtered.length === 0 ? (
              <li
                role="option"
                aria-selected={false}
                aria-disabled
                className="px-3 py-2 text-small text-muted-foreground"
              >
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={option.value}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-3 py-2 text-small text-foreground transition-colors",
                      isActive && "bg-foreground/5",
                      isSelected && "font-medium text-primary",
                      option.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <Check className="size-4 shrink-0" aria-hidden />
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
      {hint && !error ? (
        <p id={hintId} className={hintClasses()}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={errorClasses()} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
