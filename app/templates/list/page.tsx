import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ListTemplateDemo } from "./list-template-demo";

export default function ListTemplatePage() {
  return (
    <DashboardShell title="Assignments" activePath="/templates/list">
      <ListTemplateDemo />
    </DashboardShell>
  );
}
