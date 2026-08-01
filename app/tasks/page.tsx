"use client";

import React, { useState, useMemo } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { SearchBar } from "@/components/marketplace/search-bar";
import { FilterChips, type FilterCategory } from "@/components/marketplace/filter-chips";
import { SortDropdown, type SortOption } from "@/components/marketplace/sort-dropdown";
import { FeaturedCarousel } from "@/components/marketplace/featured-carousel";
import { TaskGrid } from "@/components/marketplace/task-grid";
import { TaskPreviewDrawer } from "@/components/marketplace/task-preview-drawer";
import { TaskSkeleton } from "@/components/marketplace/task-skeleton";
import { EmptyMarketplace } from "@/components/marketplace/empty-marketplace";
import { MOCK_TASKS, type MarketplaceTask } from "@/lib/marketplace/mock-tasks";
import { PhoneGateModal } from "@/components/auth/phone-gate-modal";
import { usePhoneGate } from "@/hooks/use-phone-gate";

export default function MarketplacePage() {
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("All");
  const [sortOption, setSortOption] = useState<SortOption>("Recommended");
  const [previewTask, setPreviewTask] = useState<MarketplaceTask | null>(null);

  const { isOpen, actionName, triggerGate, handleVerified, handleClose } = usePhoneGate();

  // Filter & Sort Logic
  const filteredTasks = useMemo(() => {
    return MOCK_TASKS.filter((task) => {
      // Search match
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.employerName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category match
      if (selectedCategory === "All") return true;
      if (selectedCategory === "Recommended") return task.recommended;
      if (selectedCategory === "Quick Tasks") return parseInt(task.estimatedTime, 10) <= 10;
      if (selectedCategory === "High Paying") return task.rewardNumeric >= 5000;
      if (selectedCategory === "Newest") return true;
      if (selectedCategory === "Verified") return task.employerVerified;

      return task.category === selectedCategory;
    }).sort((a, b) => {
      if (sortOption === "Highest Paying") return b.rewardNumeric - a.rewardNumeric;
      if (sortOption === "Shortest Duration") {
        return parseInt(a.estimatedTime, 10) - parseInt(b.estimatedTime, 10);
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, sortOption]);

  const handleApply = (task: MarketplaceTask) => {
    triggerGate(`Apply for "${task.title}"`, () => {
      alert(`Application submitted for ${task.title}! Reward: ${task.reward}`);
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSortOption("Recommended");
  };

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      {/* Security Phone Verification Gate */}
      <PhoneGateModal
        isOpen={isOpen}
        actionName={actionName}
        onVerified={handleVerified}
        onClose={handleClose}
      />

      {/* Task Details Preview Drawer */}
      <TaskPreviewDrawer
        task={previewTask}
        isOpen={Boolean(previewTask)}
        onClose={() => setPreviewTask(null)}
        onApply={handleApply}
      />

      {/* Header */}
      <MarketplaceHeader />

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Filter Chips */}
      <FilterChips selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

      {/* Featured Opportunities Carousel */}
      <FeaturedCarousel tasks={MOCK_TASKS} onPreview={setPreviewTask} />

      {/* Main Opportunities Feed Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            All Opportunities
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-[#008744]/20 text-emerald-400 text-xs font-extrabold border border-[#008744]/40">
            {filteredTasks.length} Available
          </span>
        </div>

        <SortDropdown value={sortOption} onChange={setSortOption} />
      </div>

      {/* Main Grid Feed / Skeleton / Empty State */}
      {loading ? (
        <TaskSkeleton />
      ) : filteredTasks.length > 0 ? (
        <TaskGrid tasks={filteredTasks} onPreview={setPreviewTask} />
      ) : (
        <EmptyMarketplace searchQuery={searchQuery} onReset={handleResetFilters} />
      )}
    </AppShell>
  );
}
