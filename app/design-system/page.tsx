import type { Metadata } from "next";
import Link from "next/link";
import { DocsLayout } from "@/components/layout/docs-layout";
import { COLOR, RADIUS, SPACE, TYPE } from "@/constants/design-tokens";
import { DesignSystemSamples } from "./design-system-samples";

export const metadata: Metadata = {
  title: "Design System",
  description: "ZOLANZO tokens, components, and layout shells.",
};

export default function DesignSystemPage() {
  return (
    <DocsLayout>
      <article className="prose-zolanzo space-y-10 pb-16">
        <header>
          <p className="text-caption text-primary mb-2 font-semibold uppercase tracking-widest">
            Foundation
          </p>
          <h1 className="text-display">Design system</h1>
          <p className="text-body-lg text-muted-foreground mt-3 max-w-2xl">
            Tokens, UI primitives, and shell templates for enterprise workforce
            surfaces. Marketplace features are intentionally omitted.
          </p>
        </header>

        <section id="tokens">
          <h2 className="text-h2 mb-4">Tokens</h2>
          <p className="text-body text-muted-foreground mb-6 max-w-2xl">
            TypeScript constants in{" "}
            <code className="text-small rounded bg-surface px-1.5 py-0.5">
              constants/design-tokens.ts
            </code>{" "}
            mirror CSS variables in{" "}
            <code className="text-small rounded bg-surface px-1.5 py-0.5">
              styles/tokens.css
            </code>
            .
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-h3 mb-3">Color</h3>
              <ul className="text-small text-muted-foreground space-y-1">
                <li>
                  Primary —{" "}
                  <span className="font-mono text-foreground">{COLOR.primary}</span>
                </li>
                <li>
                  Navy —{" "}
                  <span className="font-mono text-foreground">{COLOR.navy}</span>
                </li>
                <li>
                  Gold accent —{" "}
                  <span className="font-mono text-foreground">{COLOR.gold}</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-h3 mb-3">Spacing & radius</h3>
              <ul className="text-small text-muted-foreground space-y-1">
                <li>
                  Base unit — 8px ({SPACE[2]}px scale step)
                </li>
                <li>
                  Card radius — {RADIUS["2xl"]}
                </li>
                <li>
                  Pill — {RADIUS.pill}
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 sm:col-span-2">
              <h3 className="text-h3 mb-3">Typography</h3>
              <ul className="text-small text-muted-foreground space-y-1">
                <li>
                  Display — {TYPE.display.size} / weight {TYPE.display.weight}
                </li>
                <li>
                  Body — {TYPE.body.size} / line-height {TYPE.body.lineHeight}
                </li>
                <li>
                  Caption — {TYPE.caption.size} for labels and meta
                </li>
              </ul>
            </div>
          </div>
        </section>

        <DesignSystemSamples />

        <section id="layouts">
          <h2 className="text-h2 mb-4">Layouts & templates</h2>
          <ul className="text-body space-y-2">
            <li>
              <Link href="/templates/dashboard" className="text-primary hover:underline">
                Dashboard template
              </Link>
            </li>
            <li>
              <Link href="/templates/list" className="text-primary hover:underline">
                List template
              </Link>
            </li>
            <li>
              <Link href="/templates/auth" className="text-primary hover:underline">
                Auth template
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </DocsLayout>
  );
}
