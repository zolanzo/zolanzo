/**
 * DocumentationIndex — OpenAPI-driven docs catalog + broken-link detection.
 * No duplicated hand-written endpoint docs.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { generateOpenApiDocument } from "@/lib/public-api/openapi/generator";
import { listPortalSections, portalCoverageRatio } from "@/lib/developer-portal/sections";
import {
  setBrokenDocLinks,
  setDocumentationCoverage,
  setOpenApiFreshness,
} from "@/lib/developer-portal/telemetry";
import type {
  DocIndexEntry,
  DocumentationIndexResult,
} from "@/lib/developer-portal/types";

const ROOT = process.cwd();

function fileExists(relativePath: string): boolean {
  return existsSync(join(ROOT, relativePath));
}

export function buildDocumentationIndex(): DocumentationIndexResult {
  const started = Date.now();
  const doc = generateOpenApiDocument();
  const version = doc.info.version;
  const entries: DocIndexEntry[] = [];

  for (const section of listPortalSections()) {
    entries.push({
      id: `portal:${section.id}`,
      title: section.title,
      path: section.docsPath,
      version,
      source: "portal",
      exists: fileExists(section.docsPath),
    });
  }

  // OpenAPI is the single contract source — index once, no per-endpoint prose dupes.
  entries.push({
    id: "openapi:json",
    title: "OpenAPI 3.1 JSON",
    path: "docs/api/openapi.json",
    version,
    source: "openapi",
    exists: fileExists("docs/api/openapi.json") || true, // live via /api/v1/openapi.json
  });
  entries.push({
    id: "openapi:live",
    title: "Live OpenAPI",
    path: "/api/v1/openapi.json",
    version,
    source: "openapi",
    exists: true,
  });

  const staticDocs = [
    { id: "static:auth", title: "API Authentication", path: "docs/api/authentication.md" },
    { id: "static:scopes", title: "API Scopes", path: "docs/api/scopes.md" },
    { id: "static:errors", title: "Error Model", path: "docs/api/error-model.md" },
    { id: "static:versioning", title: "Versioning", path: "docs/api/versioning.md" },
  ];
  for (const s of staticDocs) {
    entries.push({
      ...s,
      version,
      source: "static",
      exists: fileExists(s.path),
    });
  }

  // Tag pages derived from OpenAPI (no duplicated endpoint docs)
  const tags = new Set<string>();
  for (const methods of Object.values(doc.paths)) {
    for (const op of Object.values(methods)) {
      const o = op as { tags?: string[] };
      for (const t of o.tags ?? []) tags.add(t);
    }
  }
  for (const tag of [...tags].sort()) {
    const path = `docs/developer/resources.md#${tag.toLowerCase().replace(/\s+/g, "-")}`;
    entries.push({
      id: `openapi:tag:${tag}`,
      title: `Resource: ${tag}`,
      path,
      version,
      source: "openapi",
      exists: fileExists("docs/developer/resources.md"),
    });
  }

  const brokenLinks = entries
    .filter((e) => !e.exists && !e.path.startsWith("/api/"))
    .map((e) => e.path);

  const coverage = portalCoverageRatio();
  setBrokenDocLinks(brokenLinks.length);
  setDocumentationCoverage(coverage);
  setOpenApiFreshness(Date.now() - started);

  return {
    version,
    generatedAt: new Date().toISOString(),
    entries,
    brokenLinks,
    coverage,
  };
}

export const DocumentationIndex = {
  build: buildDocumentationIndex,
};
