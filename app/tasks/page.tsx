import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { TasksBrowseView } from "@/components/marketplace/tasks-browse-view";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const workspace = await requireEarnerWorkspace();
  return <TasksBrowseView workspace={workspace} />;
}
