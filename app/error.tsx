"use client";

import { useEffect } from "react";
import { ErrorLayout } from "@/components/layout/error-layout";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorLayout
      code="500"
      title="Something went wrong"
      description="An unexpected error occurred. You can try again or return home."
    >
      <Button type="button" variant="outline" onClick={reset}>
        Try again
      </Button>
    </ErrorLayout>
  );
}
