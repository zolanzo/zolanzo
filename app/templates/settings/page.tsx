import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  SettingsTemplate,
  type SettingsSection,
} from "@/components/templates/settings-template";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const sections: SettingsSection[] = [
  {
    id: "general",
    label: "General",
    content: (
      <Card className="space-y-5">
        <Input
          id="org-name"
          label="Organization name"
          name="orgName"
          defaultValue="Acme Workforce Ops"
          hint="Displayed in reports and dashboard headers."
        />
        <Input
          id="support-email"
          label="Support email"
          name="supportEmail"
          type="email"
          defaultValue="ops@example.com"
        />
      </Card>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    content: (
      <Card className="space-y-5">
        <Switch
          id="email-digest"
          label="Weekly digest"
          hint="Summary of assignment throughput and quality metrics."
          defaultChecked
        />
        <Switch
          id="sla-alerts"
          label="SLA alerts"
          hint="Notify when assignments approach due dates."
          defaultChecked
        />
        <Switch
          id="contributor-updates"
          label="Contributor updates"
          hint="Real-time notifications for status changes."
        />
      </Card>
    ),
  },
  {
    id: "security",
    label: "Security",
    content: (
      <Card className="space-y-5">
        <Switch
          id="mfa-required"
          label="Require MFA for admins"
          defaultChecked
        />
        <Input
          id="session-timeout"
          label="Session timeout (minutes)"
          name="sessionTimeout"
          type="number"
          defaultValue="60"
          hint="Placeholder — no auth backend wired."
        />
      </Card>
    ),
  },
];

export default function SettingsTemplatePage() {
  return (
    <DashboardShell title="Settings" activePath="/templates/settings">
      <SettingsTemplate
        title="Workspace settings"
        description="Tabbed settings template with form placeholders."
        sections={sections}
      />
    </DashboardShell>
  );
}
