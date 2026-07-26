import type { ReactNode } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { PageTransition } from "@/components/layout/page-transition";

export type AuthTemplateProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthTemplate({ title, subtitle, children }: AuthTemplateProps) {
  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <PageTransition>{children}</PageTransition>
    </AuthLayout>
  );
}
