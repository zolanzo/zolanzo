/**
 * Export renderers — format-agnostic ReportDocument → bytes.
 * No heavy native deps; formats are replaceable via RendererRegistry.
 */

import type {
  ExportFormat,
  ExportArtifact,
  ReportDocument,
} from "@/lib/analytics/reports/types";

export type ReportRenderer = {
  format: ExportFormat;
  mimeType: string;
  extension: string;
  render: (doc: ReportDocument) => { body: string; encoding: "utf8" | "base64" };
};

function safeFilename(doc: ReportDocument, ext: string): string {
  const stamp = doc.generatedAt.slice(0, 10);
  return `${doc.type}-report-${doc.publicId}-${stamp}.${ext}`;
}

function flattenRows(doc: ReportDocument): Array<{
  section: string;
  label: string;
  value: string;
  unit: string;
}> {
  const rows: Array<{
    section: string;
    label: string;
    value: string;
    unit: string;
  }> = [];
  for (const section of doc.sections) {
    for (const r of section.rows) {
      rows.push({
        section: section.title,
        label: r.label,
        value: r.value == null ? "" : String(r.value),
        unit: r.unit ?? "",
      });
    }
  }
  return rows;
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

const jsonRenderer: ReportRenderer = {
  format: "json",
  mimeType: "application/json",
  extension: "json",
  render: (doc) => ({
    body: JSON.stringify(doc, null, 2),
    encoding: "utf8",
  }),
};

const csvRenderer: ReportRenderer = {
  format: "csv",
  mimeType: "text/csv",
  extension: "csv",
  render: (doc) => {
    const lines = ["section,label,value,unit"];
    for (const r of flattenRows(doc)) {
      lines.push(
        [r.section, r.label, r.value, r.unit].map(csvEscape).join(","),
      );
    }
    return { body: lines.join("\n"), encoding: "utf8" };
  },
};

/** SpreadsheetML (Excel-compatible XML) without native deps. */
const xlsxRenderer: ReportRenderer = {
  format: "xlsx",
  mimeType: "application/vnd.ms-excel",
  extension: "xls",
  render: (doc) => {
    const rows = flattenRows(doc)
      .map(
        (r) =>
          `<Row><Cell><Data ss:Type="String">${escapeXml(r.section)}</Data></Cell>` +
          `<Cell><Data ss:Type="String">${escapeXml(r.label)}</Data></Cell>` +
          `<Cell><Data ss:Type="String">${escapeXml(r.value)}</Data></Cell>` +
          `<Cell><Data ss:Type="String">${escapeXml(r.unit)}</Data></Cell></Row>`,
      )
      .join("");
    const xml =
      `<?xml version="1.0"?>` +
      `<?mso-application progid="Excel.Sheet"?>` +
      `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
      `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
      `<Worksheet ss:Name="${escapeXml(doc.type)}">` +
      `<Table>` +
      `<Row><Cell><Data ss:Type="String">Section</Data></Cell>` +
      `<Cell><Data ss:Type="String">Label</Data></Cell>` +
      `<Cell><Data ss:Type="String">Value</Data></Cell>` +
      `<Cell><Data ss:Type="String">Unit</Data></Cell></Row>` +
      rows +
      `</Table></Worksheet></Workbook>`;
    return { body: xml, encoding: "utf8" };
  },
};

/** Minimal text PDF (no native deps). Falls back to text body if binary build fails. */
const pdfRenderer: ReportRenderer = {
  format: "pdf",
  mimeType: "application/pdf",
  extension: "pdf",
  render: (doc) => {
    const lines: string[] = [
      doc.title,
      doc.description,
      `Generated: ${doc.generatedAt}`,
      `Model: ${doc.modelVersion}`,
      "Advisory only: true",
      "",
    ];
    for (const section of doc.sections) {
      lines.push(`## ${section.title}`);
      for (const r of section.rows.slice(0, 40)) {
        const value = r.value == null ? "n/a" : String(r.value);
        lines.push(`- ${r.label}: ${value}${r.unit ? ` ${r.unit}` : ""}`);
      }
      lines.push("");
    }
    const content = lines
      .join("\n")
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?")
      .slice(0, 3000);
    try {
      const pdf = buildSimplePdf(content);
      return {
        body: Buffer.from(pdf, "latin1").toString("base64"),
        encoding: "base64",
      };
    } catch {
      // Still deliver a printable artifact if PDF assembly fails.
      return {
        body: content,
        encoding: "utf8",
      };
    }
  },
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSimplePdf(text: string): string {
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .split("\n")
    .slice(0, 50)
    .map((line) => line.slice(0, 90));
  const ops = ["BT", "/F1 10 Tf", "40 780 Td", "12 TL"];
  for (let i = 0; i < escaped.length; i++) {
    if (i === 0) ops.push(`(${escaped[i]}) Tj`);
    else ops.push(`T* (${escaped[i]}) Tj`);
  }
  ops.push("ET");
  const stream = ops.join("\n");
  const encoder = (s: string) => Buffer.from(s, "latin1");

  const objs = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${encoder(stream).length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objs) {
    offsets.push(encoder(pdf).length);
    pdf += obj;
  }
  const xrefStart = encoder(pdf).length;
  let xref = `xref\n0 ${objs.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += xref;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;
  return pdf;
}

const RENDERERS: ReportRenderer[] = [
  jsonRenderer,
  csvRenderer,
  xlsxRenderer,
  pdfRenderer,
];

const byFormat = new Map(RENDERERS.map((r) => [r.format, r]));

export function getRenderer(format: ExportFormat): ReportRenderer | undefined {
  return byFormat.get(format);
}

export function listRenderers(): ReportRenderer[] {
  return [...byFormat.values()];
}

export function registerRenderer(renderer: ReportRenderer): void {
  byFormat.set(renderer.format, renderer);
}

export function renderReport(
  doc: ReportDocument,
  format: ExportFormat,
): ExportArtifact {
  const started = Date.now();
  const renderer = getRenderer(format);
  if (!renderer) {
    throw new Error(`No renderer registered for format: ${format}`);
  }
  const { body, encoding } = renderer.render(doc);
  const byteLength =
    encoding === "base64"
      ? Buffer.from(body, "base64").byteLength
      : Buffer.byteLength(body, "utf8");
  return {
    format,
    mimeType: renderer.mimeType,
    filename: safeFilename(doc, renderer.extension),
    encoding,
    body,
    byteLength,
    durationMs: Date.now() - started,
    reportId: doc.id,
    generatedAt: new Date().toISOString(),
  };
}

export const RendererRegistry = {
  get: getRenderer,
  list: listRenderers,
  register: registerRenderer,
  render: renderReport,
};
