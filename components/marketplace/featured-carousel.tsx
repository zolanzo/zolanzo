"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { type MarketplaceTask } from "@/lib/marketplace/mock-tasks";

interface FeaturedCarouselProps {
  tasks: MarketplaceTask[];
  onPreview: (task: MarketplaceTask) => void;
}

export function FeaturedCarousel({ tasks, onPreview }: FeaturedCarouselProps) {
  const featured = tasks.filter((t) => t.featured);
  if (featured.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <HugeiconsIcon icon={StarIcon} size={14} className="fill-amber-400" />
          </div>
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Featured Opportunities
          </h2>
        </div>
        <span className="text-xs font-semibold text-emerald-400">{featured.length} Pinned</span>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-4 py-1">
        {featured.map((task) => (
          <div
            key={task.id}
            onClick={() => onPreview(task)}
            className="w-[300px] sm:w-[340px] shrink-0 bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-2xl p-5 hover:border-emerald-500/60 transition-all duration-200 cursor-pointer space-y-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 uppercase tracking-wider">
                ★ Featured
              </span>
              <span className="text-xs font-semibold text-zinc-400">{task.category}</span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">{task.title}</h3>
              <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                {task.shortDescription}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Payout</span>
                <span className="text-xl font-black text-emerald-400">{task.reward}</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(task);
                }}
                className="h-[36px] px-3.5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
              >
                <span>Preview</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
