import type { Metadata } from "next";
import { ErrorLayout } from "@/components/layout/error-layout";

export const metadata: Metadata = {
  title: "Page not found | ZOLANZO",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ErrorLayout
      code="404"
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
    />
  );
}
