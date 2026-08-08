import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { run } from "./main.ts";

const SAMPLE_LOG = [
  "2024-01-01 09:00Dev;task A",
  "2024-01-01 10:30Meeting;standup",
  "2024-01-01 11:00Dev;task B",
  "2024-01-01 18:00",
].join("\n");

async function withSampleFile(fn: (path: string) => Promise<void>) {
  const path = await Deno.makeTempFile({ suffix: ".log" });
  try {
    await Deno.writeTextFile(path, SAMPLE_LOG);
    await fn(path);
  } finally {
    await Deno.remove(path);
  }
}

Deno.test("run: defaults to JSON output, file path is positional", async () => {
  await withSampleFile(async (path) => {
    const output = await run([
      "--from",
      "2024-01-01",
      "--to",
      "2024-01-01",
      path,
    ]);
    const data = JSON.parse(output);
    assertEquals(data[0].category, "Dev");
    assertEquals(data[0].minutes, 510);
  });
});

Deno.test("run: -f/-t/-F short options work", async () => {
  await withSampleFile(async (path) => {
    const output = await run([
      "-f",
      "2024-01-01",
      "-t",
      "2024-01-01",
      "-F",
      "markdown",
      path,
    ]);
    assertStringIncludes(output, "| category | detail | hours | minutes |");
  });
});

Deno.test("run: --format md is an alias for markdown", async () => {
  await withSampleFile(async (path) => {
    const output = await run([
      "--from",
      "2024-01-01",
      "--to",
      "2024-01-01",
      "--format",
      "md",
      path,
    ]);
    assertStringIncludes(output, "| category | detail | hours | minutes |");
  });
});

Deno.test("run: covers the full range when from/to are omitted", async () => {
  await withSampleFile(async (path) => {
    const output = await run([path]);
    const data = JSON.parse(output);
    assertEquals(data[0].category, "Dev");
    assertEquals(data[0].minutes, 510);
  });
});

Deno.test("run: throws when the file path is missing", async () => {
  await assertRejects(() => run(["--from", "2024-01-01"]));
});

Deno.test("run: throws on an unknown format name", async () => {
  await withSampleFile(async (path) => {
    await assertRejects(() =>
      run([
        "--from",
        "2024-01-01",
        "--to",
        "2024-01-01",
        "--format",
        "yaml",
        path,
      ])
    );
  });
});
