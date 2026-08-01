"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  className = "",
  overscan = 5,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = items.length * itemHeight;

  const { startIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    const slice = items.slice(start, end);
    return { startIndex: start, visibleItems: slice };
  }, [scrollTop, itemHeight, containerHeight, overscan, items]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onNativeScroll = () => {
      setScrollTop(el.scrollTop);
    };
    el.addEventListener("scroll", onNativeScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onNativeScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflowY: "auto", position: "relative" }}
      className={`no-scrollbar ${className}`}
    >
      <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
        {visibleItems.map((item, idx) => {
          const actualIndex = startIndex + idx;
          const top = actualIndex * itemHeight;
          return (
            <div
              key={keyExtractor(item, actualIndex)}
              style={{
                position: "absolute",
                top,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
