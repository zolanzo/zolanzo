import type { Metadata } from "next";
import Link from "next/link";
import { DocsLayout } from "@/components/layout/docs-layout";
import {
  DeveloperPortalService,
  isDeveloperPortalEnabled,
} from "@/lib/developer-portal";

export const metadata: Metadata = {
  title: "Developer Portal",
  description: "ZOLANZO Public API v1 developer experience",
};

export const dynamic = "force-dynamic";

export default function DeveloperPortalPage() {
  if (!isDeveloperPortalEnabled()) {
    return (
      <DocsLayout>
        <article className="prose-zolanzo space-y-6 pb-16">
          <h1 className="text-display">Developer Portal</h1>
          <p className="text-muted-foreground">
            Developer Portal is disabled. Enable{" "}
            <code>DEVELOPER_PORTAL</code> (requires <code>PUBLIC_API</code>).
          </p>
        </article>
      </DocsLayout>
    );
  }

  const home = DeveloperPortalService.home();
  const sections = home.ok ? home.sections : [];
  const quickStart = home.ok ? home.quickStart : [];
  const examples = DeveloperPortalService.examples();
  const changelog = DeveloperPortalService.changelog();

  return (
    <DocsLayout>
      <article className="prose-zolanzo space-y-12 pb-16">
        <header>
          <p className="text-caption text-primary mb-2 font-semibold uppercase tracking-widest">
            Public API v1
          </p>
          <h1 className="text-display">Developer Portal</h1>
          <p className="text-body-lg text-muted-foreground mt-3 max-w-2xl">
            Everything here consumes the Public API contract. SDKs are generated
            from OpenAPI — never hand-written endpoints.
          </p>
          {home.ok ? (
            <p className="text-small text-muted-foreground mt-2">
              {home.operationCount} operations · {home.exampleCount} examples ·{" "}
              {home.modelVersion}
            </p>
          ) : null}
        </header>

        <section id="sections" className="space-y-4">
          <h2 className="text-h2">Sections</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.id} className="border-b border-border/60 pb-3">
                <p className="font-medium">{s.title}</p>
                <p className="text-small text-muted-foreground">{s.summary}</p>
                <p className="text-caption text-muted-foreground mt-1">
                  {s.docsPath}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section id="quickstart" className="space-y-4">
          <h2 className="text-h2">Quick start</h2>
          <ol className="space-y-4">
            {quickStart.map((step) => (
              <li key={step.step} className="space-y-2">
                <p className="font-medium">
                  {step.step}. {step.title}
                </p>
                <p className="text-small text-muted-foreground">{step.body}</p>
                {step.code ? (
                  <pre className="text-small overflow-x-auto rounded-lg bg-surface p-4">
                    <code>{step.code}</code>
                  </pre>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section id="examples" className="space-y-4">
          <h2 className="text-h2">Examples</h2>
          <ul className="space-y-3">
            {examples.map((ex) => (
              <li key={ex.id} className="border-b border-border/60 pb-3">
                <p className="font-medium">
                  {ex.category}: {ex.title}
                </p>
                <p className="text-small text-muted-foreground">
                  {ex.description} · <code>{ex.operationId}</code>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section id="release-notes" className="space-y-4">
          <h2 className="text-h2">Release notes</h2>
          <ul className="space-y-3">
            {changelog.map((entry) => (
              <li key={entry.version} className="border-b border-border/60 pb-3">
                <p className="font-medium">
                  {entry.version} — {entry.title}
                </p>
                <p className="text-caption text-muted-foreground">{entry.date}</p>
                <ul className="text-small text-muted-foreground mt-1 list-disc pl-5">
                  {entry.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-h2">API resources</h2>
          <p className="text-small text-muted-foreground">
            OpenAPI:{" "}
            <Link href="/api/v1/openapi.json" className="text-primary underline">
              /api/v1/openapi.json
            </Link>
            {" · "}
            Portal API: <code>/api/v1/developer/*</code>
          </p>
        </section>
      </article>
    </DocsLayout>
  );
}
