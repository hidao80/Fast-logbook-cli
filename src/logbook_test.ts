import { assertEquals } from "@std/assert";
import { filterByDateRange, summarize } from "./logbook.ts";

const SAMPLE_LOG = [
  "2024-01-01 09:00Dev;task A",
  "2024-01-01 10:30Meeting;standup",
  "2024-01-01 11:00Dev;task B",
  "2024-01-01 18:00",
  "2024-01-02 09:00Dev;task C",
  "2024-01-02 17:00",
].join("\n");

Deno.test("filterByDateRange: keeps only lines within the range", () => {
  const lines = filterByDateRange(SAMPLE_LOG, "2024-01-01", "2024-01-01");
  assertEquals(lines.length, 4);
});

Deno.test("filterByDateRange: keeps all lines when the range covers everything", () => {
  const lines = filterByDateRange(SAMPLE_LOG, "2024-01-01", "2024-01-02");
  assertEquals(lines.length, 6);
});

Deno.test("filterByDateRange: keeps all lines when from/to are omitted (full range)", () => {
  assertEquals(filterByDateRange(SAMPLE_LOG).length, 6);
  assertEquals(filterByDateRange(SAMPLE_LOG, "2024-01-02").length, 2);
  assertEquals(
    filterByDateRange(SAMPLE_LOG, undefined, "2024-01-01").length,
    4,
  );
});

Deno.test("summarize: sums adjacent-punch diffs per category", () => {
  const lines = filterByDateRange(SAMPLE_LOG, "2024-01-01", "2024-01-01");
  const result = summarize(lines, 1);

  assertEquals(result, [
    { category: "Dev", detail: "task A, task B", minutes: 510, hours: 8.5 },
    { category: "Meeting", detail: "standup", minutes: 30, hours: 0.5 },
  ]);
});

Deno.test("summarize: the final punch adds no time (end-of-work marker)", () => {
  const lines = filterByDateRange(SAMPLE_LOG, "2024-01-02", "2024-01-02");
  const result = summarize(lines, 1);

  assertEquals(result, [
    { category: "Dev", detail: "task C", minutes: 480, hours: 8 },
  ]);
});

Deno.test("summarize: applies the rounding unit", () => {
  const lines = ["2024-01-01 09:00Dev", "2024-01-01 09:47Break"];
  const result = summarize(lines, 15);
  const dev = result.find((r) => r.category === "Dev");
  // 09:00-09:47 = 47min -> round(47/15)*15 = round(3.13)*15 = 3*15 = 45 -> 0 + 45/60 = 0.75
  assertEquals(dev?.minutes, 47);
  assertEquals(dev?.hours, 0.75);
});
