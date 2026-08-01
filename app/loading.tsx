import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="bg-background text-foreground flex min-h-dvh items-center justify-center px-4">
      <Spinner size="lg" label="Loading" />
    </div>
  );
}
