import { assertEquals, assertStringIncludes } from "@std/assert";
import type { WorkSummary } from "./logbook.ts";
import {
  format,
  toCsv,
  toJson,
  toJsonl,
  toMarkdown,
  toTsv,
  toXml,
} from "./formatters.ts";

const DATA: WorkSummary[] = [
  { category: "Dev", detail: "task A, task B", minutes: 510, hours: 8.5 },
  { category: "Meeting", detail: "standup", minutes: 30, hours: 0.5 },
];

Deno.test("toJson: outputs a JSON array", () => {
  const result = JSON.parse(toJson(DATA));
  assertEquals(result, DATA);
});

Deno.test("toMarkdown: includes a table header and rows", () => {
  const result = toMarkdown(DATA);
  assertStringIncludes(result, "| category | detail | hours | minutes |");
  assertStringIncludes(result, "| Dev | task A, task B | 8.5 | 510 |");
});

Deno.test("toTsv: outputs tab-separated values", () => {
  const result = toTsv(DATA);
  const lines = result.split("\n");
  assertEquals(lines[0], "category\tdetail\thours\tminutes");
  assertEquals(lines[1], "Dev\ttask A, task B\t8.5\t510");
});

Deno.test("toCsv: always wraps every field in double quotes", () => {
  const result = toCsv(DATA);
  const lines = result.split("\n");
  assertEquals(lines[0], '"category","detail","hours","minutes"');
  assertEquals(lines[1], '"Dev","task A, task B","8.5","510"');
});

Deno.test("toCsv: escapes embedded double quotes by doubling them", () => {
  const withQuote: WorkSummary[] = [
    { category: 'Say "hi"', detail: "a, b", minutes: 1, hours: 0.1 },
  ];
  const result = toCsv(withQuote);
  const lines = result.split("\n");
  assertEquals(lines[1], '"Say ""hi""","a, b","0.1","1"');
});

Deno.test("toJsonl: outputs one object per line", () => {
  const result = toJsonl(DATA);
  const lines = result.split("\n");
  assertEquals(lines.length, 2);
  assertEquals(JSON.parse(lines[0]), DATA[0]);
});

Deno.test("toXml: outputs entry elements", () => {
  const result = toXml(DATA);
  assertStringIncludes(result, "<category>Dev</category>");
  assertStringIncludes(result, "<minutes>510</minutes>");
});

Deno.test("format: dispatches by format name", () => {
  assertEquals(format(DATA, "json"), toJson(DATA));
  assertEquals(format(DATA, "csv"), toCsv(DATA));
});
