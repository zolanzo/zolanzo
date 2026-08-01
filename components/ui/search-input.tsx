"use client";

import { Search, X } from "lucide-react";
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Input, type InputProps } from "@/components/ui/input";

export type SearchInputProps = Omit<
  InputProps,
  "type" | "leftIcon" | "rightIcon" | "rightSlot" | "role"
> & {
  onClear?: () => void;
  clearLabel?: string;
};

export function SearchInput({
  value,
  defaultValue,
  onChange,
  onClear,
  clearLabel = "Clear search",
  placeholder = "Search…",
  ...props
}: SearchInputProps) {
  const fallbackId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    defaultValue !== undefined ? String(defaultValue) : "",
  );

  const currentValue = isControlled ? String(value ?? "") : internalValue;
  const showClear = currentValue.length > 0;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setInternalValue(event.target.value);
    }
    onChange?.(event);
  }

  function handleClear() {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      inputRef.current.focus();
    }
    if (!isControlled) {
      setInternalValue("");
    }
    onClear?.();
  }

  return (
    <Input
      {...props}
      ref={inputRef}
      id={props.id ?? fallbackId}
      type="search"
      role="searchbox"
      placeholder={placeholder}
      value={isControlled ? value : undefined}
      defaultValue={isControlled ? undefined : defaultValue}
      onChange={handleChange}
      leftIcon={<Search aria-hidden />}
      rightSlot={
        showClear ? (
          <IconButton
            label={clearLabel}
            size="sm"
            variant="ghost"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X className="size-4" aria-hidden />
          </IconButton>
        ) : undefined
      }
    />
  );
}
