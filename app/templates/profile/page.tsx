import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfileTemplate } from "@/components/templates/profile-template";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function ProfileTemplatePage() {
  return (
    <DashboardShell title="Profile" activePath="/templates/profile">
      <ProfileTemplate
        name="Jordan Lee"
        email="jordan.lee@example.com"
        role="Workforce Operations Lead"
        actions={
          <Button variant="outline" size="sm">
            Edit profile
          </Button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Recent placeholder activity.</CardDescription>
            </CardHeader>
            <ul className="text-small text-muted-foreground space-y-2">
              <li>Approved QA batch #482 — 2 hours ago</li>
              <li>Updated contributor guidelines — yesterday</li>
              <li>Exported weekly report — 3 days ago</li>
            </ul>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Profile template child slot.</CardDescription>
            </CardHeader>
            <p className="text-small text-muted-foreground">
              Timezone: UTC−7 · Language: English · Notifications: enabled
            </p>
          </Card>
        </div>
      </ProfileTemplate>
    </DashboardShell>
  );
}
