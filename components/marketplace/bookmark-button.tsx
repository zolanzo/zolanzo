"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookmarkIcon } from "@hugeicons/core-free-icons";

interface BookmarkButtonProps {
  taskId: string;
  initialBookmarked?: boolean;
}

export function BookmarkButton({ taskId: _taskId, initialBookmarked = false }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      className={`p-2 rounded-xl border transition-all cursor-pointer ${
        isBookmarked
          ? "bg-warning/15 border-warning/40 text-warning"
          : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
      }`}
      aria-label="Bookmark Task"
    >
      <HugeiconsIcon icon={BookmarkIcon} size={16} className={isBookmarked ? "fill-warning" : ""} />
    </button>
  );
}
