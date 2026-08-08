import type { WorkSummary } from "./logbook.ts";

export const FORMATS = [
  "json",
  "markdown",
  "tsv",
  "csv",
  "jsonl",
  "xml",
] as const;
export type Format = (typeof FORMATS)[number];

export function toJson(data: WorkSummary[]): string {
  return JSON.stringify(data);
}

export function toMarkdown(data: WorkSummary[]): string {
  const header =
    "| category | detail | hours | minutes |\n| --- | --- | --: | --: |";
  const rows = data.map(
    (d) => `| ${d.category} | ${d.detail} | ${d.hours} | ${d.minutes} |`,
  );
  return [header, ...rows].join("\n");
}

function escapeDelimited(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) || value.includes('"') || value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toDelimited(data: WorkSummary[], delimiter: string): string {
  const header = ["category", "detail", "hours", "minutes"].join(delimiter);
  const rows = data.map((d) =>
    [
      escapeDelimited(d.category, delimiter),
      escapeDelimited(d.detail, delimiter),
      d.hours,
      d.minutes,
    ].join(delimiter)
  );
  return [header, ...rows].join("\n");
}

export function toTsv(data: WorkSummary[]): string {
  return toDelimited(data, "\t");
}

function quoteCsvField(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function toCsv(data: WorkSummary[]): string {
  const header = ["category", "detail", "hours", "minutes"].map(
    quoteCsvField,
  ).join(",");
  const rows = data.map((d) =>
    [d.category, d.detail, d.hours, d.minutes].map(quoteCsvField).join(",")
  );
  return [header, ...rows].join("\n");
}

export function toJsonl(data: WorkSummary[]): string {
  return data.map((d) => JSON.stringify(d)).join("\n");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function toXml(data: WorkSummary[]): string {
  const items = data.map((d) =>
    `  <entry>\n` +
    `    <category>${escapeXml(d.category)}</category>\n` +
    `    <detail>${escapeXml(d.detail)}</detail>\n` +
    `    <hours>${d.hours}</hours>\n` +
    `    <minutes>${d.minutes}</minutes>\n` +
    `  </entry>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<work>\n${
    items.join("\n")
  }\n</work>`;
}

export function format(data: WorkSummary[], fmt: Format): string {
  switch (fmt) {
    case "json":
      return toJson(data);
    case "markdown":
      return toMarkdown(data);
    case "tsv":
      return toTsv(data);
    case "csv":
      return toCsv(data);
    case "jsonl":
      return toJsonl(data);
    case "xml":
      return toXml(data);
  }
}
