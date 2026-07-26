import { ClipboardList, Clock, TrendingUp, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardTemplate } from "@/components/templates/dashboard-template";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricCard,
} from "@/components/ui";

export default function DashboardTemplatePage() {
  return (
    <DashboardLayout title="Overview" activePath="/templates/dashboard">
      <DashboardTemplate
        title="Workforce overview"
        description="Placeholder metrics and activity — no marketplace data wired."
        actions={
          <Button variant="primary" size="sm">
            Export report
          </Button>
        }
        metrics={
          <>
            <MetricCard
              label="Active contributors"
              value="1,248"
              delta={6.4}
              icon={<Users className="size-5" aria-hidden />}
            />
            <MetricCard
              label="Open assignments"
              value="342"
              delta={12.1}
              icon={<ClipboardList className="size-5" aria-hidden />}
            />
            <MetricCard
              label="Avg. completion time"
              value="4.2h"
              delta={-3.5}
              icon={<Clock className="size-5" aria-hidden />}
            />
            <MetricCard
              label="Quality score"
              value="96%"
              delta={1.8}
              icon={<TrendingUp className="size-5" aria-hidden />}
            />
          </>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>
              Stub list — replace with repository data when features ship.
            </CardDescription>
          </CardHeader>
          <ul className="divide-border divide-y">
            {[
              { task: "QA regression batch #482", status: "In review" },
              { task: "Survey panel — EMEA wave 3", status: "Active" },
              { task: "AI labeling — image set 12", status: "Completed" },
              { task: "Community moderation shift", status: "Scheduled" },
            ].map((item) => (
              <li
                key={item.task}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-small text-foreground">{item.task}</span>
                <Badge variant="outline">{item.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </DashboardTemplate>
    </DashboardLayout>
  );
}
