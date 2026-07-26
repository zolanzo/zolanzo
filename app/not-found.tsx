import { ErrorLayout } from "@/components/layout/error-layout";

export default function NotFound() {
  return (
    <ErrorLayout
      code="404"
      title="Page not found"
      description="This route is not part of the demo shell. Return home or browse templates."
    />
  );
}
