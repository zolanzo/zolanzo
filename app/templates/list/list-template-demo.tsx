"use client";

import { useState } from "react";
import { ListTemplate } from "@/components/templates/list-template";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import {
  Pagination,
  PaginationSummary,
} from "@/components/ui/pagination";

type AssignmentRow = {
  id: string;
  title: string;
  team: string;
  status: "Active" | "Review" | "Completed";
  due: string;
};

const ALL_ROWS: AssignmentRow[] = [
  {
    id: "1",
    title: "Mobile app smoke test — iOS 18",
    team: "QA East",
    status: "Active",
    due: "Jul 28",
  },
  {
    id: "2",
    title: "Survey localization — FR/DE",
    team: "Research",
    status: "Review",
    due: "Jul 30",
  },
  {
    id: "3",
    title: "Image annotation batch 47",
    team: "AI Ops",
    status: "Active",
    due: "Aug 1",
  },
  {
    id: "4",
    title: "Community onboarding playbook",
    team: "Growth",
    status: "Completed",
    due: "Jul 22",
  },
  {
    id: "5",
    title: "Website signup funnel audit",
    team: "QA West",
    status: "Review",
    due: "Aug 3",
  },
];

const PAGE_SIZE = 3;

const statusVariant = {
  Active: "primary",
  Review: "warning",
  Completed: "success",
} as const;

const columns: DataTableColumn<AssignmentRow>[] = [
  {
    id: "title",
    header: "Assignment",
    cell: (row) => row.title,
  },
  {
    id: "team",
    header: "Team",
    cell: (row) => row.team,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
    ),
  },
  {
    id: "due",
    header: "Due",
    cell: (row) => row.due,
    headerClassName: "text-right",
    cellClassName: "text-right text-muted-foreground",
  },
];

export function ListTemplateDemo() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(ALL_ROWS.length / PAGE_SIZE);
  const pageRows = ALL_ROWS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ListTemplate
      title="Work assignments"
      description="DataTable stub with pagination — placeholder rows only."
      actions={
        <Button variant="primary" size="sm">
          New assignment
        </Button>
      }
      pagination={
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <PaginationSummary
            currentPage={page}
            pageSize={PAGE_SIZE}
            totalItems={ALL_ROWS.length}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={pageRows}
        getRowKey={(row) => row.id}
        caption="Workforce assignments"
      />
    </ListTemplate>
  );
}
