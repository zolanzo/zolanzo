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
          ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
          : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
      }`}
      aria-label="Bookmark Task"
    >
      <HugeiconsIcon icon={BookmarkIcon} size={16} className={isBookmarked ? "fill-amber-400" : ""} />
    </button>
  );
}
