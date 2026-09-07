import { ErrorLayout } from "@/components/layout/error-layout";

export default function NotFound() {
  return (
    <ErrorLayout
      code="404"
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
    />
  );
}
