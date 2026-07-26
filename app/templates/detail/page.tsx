import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DetailTemplate } from "@/components/templates/detail-template";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function DetailTemplatePage() {
  return (
    <DashboardShell title="Assignment detail" activePath="/templates/detail">
      <DetailTemplate
        title="Mobile app smoke test — iOS 18"
        description="Detail template with main content and sidebar metadata."
        actions={
          <Button variant="outline" size="sm">
            Edit assignment
          </Button>
        }
        sidebar={
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Placeholder sidebar card.</CardDescription>
            </CardHeader>
            <dl className="text-small space-y-3">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant="primary">Active</Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Team</dt>
                <dd className="text-foreground">QA East</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Due date</dt>
                <dd className="text-foreground">Jul 28, 2026</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Contributors</dt>
                <dd className="text-foreground">24 assigned</dd>
              </div>
            </dl>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Main detail content area — replace with feature modules later.
            </CardDescription>
          </CardHeader>
          <p className="text-body text-muted-foreground">
            This assignment covers regression smoke tests across iOS 18 devices.
            Contributors verify core flows, log defects, and submit structured
            reports. No marketplace checkout or payment flows are included in
            this demo.
          </p>
        </Card>
      </DetailTemplate>
    </DashboardShell>
  );
}
