import type { ReactNode } from "react";
import { ImpersonationBanner } from "@/components/auth/impersonation-banner";
import { CapabilityProvider } from "@/lib/capabilities-service";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";

type WorkspaceProvidersProps = {
  children: ReactNode;
};

export function WorkspaceProviders({ children }: WorkspaceProvidersProps) {
  return (
    <QueryProvider>
      <CapabilityProvider>
        <ToastProvider>
          <ImpersonationBanner />
          {children}
        </ToastProvider>
      </CapabilityProvider>
    </QueryProvider>
  );
}
