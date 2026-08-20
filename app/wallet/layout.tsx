import type { ReactNode } from "react";
import { WorkspaceProviders } from "@/providers/workspace-providers";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WorkspaceProviders>{children}</WorkspaceProviders>;
}
