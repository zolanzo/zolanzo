import type { ReactNode } from "react";
import { buildNoIndexMetadata } from "@/components/seo/build-metadata";
import { WorkspaceProviders } from "@/providers/workspace-providers";

export const metadata = buildNoIndexMetadata("/profile", "Profile");

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WorkspaceProviders>{children}</WorkspaceProviders>;
}
