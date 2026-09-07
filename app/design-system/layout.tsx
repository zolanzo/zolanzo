import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isDevOnlyRoutePublic } from "@/lib/dev/dev-surfaces";

export default function DesignSystemLayout({ children }: { children: ReactNode }) {
  if (!isDevOnlyRoutePublic()) {
    notFound();
  }

  return children;
}
