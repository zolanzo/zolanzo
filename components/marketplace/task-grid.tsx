"use client";

import React from "react";
import { type MarketplaceTask } from "@/lib/marketplace/mock-tasks";
import { TaskCard } from "@/components/marketplace/task-card";

interface TaskGridProps {
  tasks: MarketplaceTask[];
  onPreview: (task: MarketplaceTask) => void;
}

export function TaskGrid({ tasks, onPreview }: TaskGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onPreview={onPreview} />
      ))}
    </div>
  );
}
