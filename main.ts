import { parseArgs } from "@std/cli/parse-args";
import { filterByDateRange, summarize } from "./src/logbook.ts";
import { type Format, format, FORMATS } from "./src/formatters.ts";

const FORMAT_ALIASES: Record<string, Format> = { md: "markdown" };

const USAGE = "Usage: flb [-f|--from <YYYY-MM-DD|default:full range>] " +
  "[-t|--to <YYYY-MM-DD|default:full range>] " +
  `[-F|--format <${FORMATS.join("|")}|md|default:json>] /path/to/file`;

export async function run(args: string[]): Promise<string> {
  const flags = parseArgs(args, {
    string: ["from", "to", "format", "round"],
    alias: { f: "from", t: "to", F: "format" },
    default: { format: "json", round: "1" },
  });

  const file = flags._[0] as string | undefined;
  if (!file) {
    throw new Error(USAGE);
  }

  const from = flags.from || undefined;
  const to = flags.to || undefined;
  const fmt = FORMAT_ALIASES[flags.format] ?? flags.format as Format;
  if (!(FORMATS as readonly string[]).includes(fmt)) {
    throw new Error(`Unknown format: ${flags.format}\n${USAGE}`);
  }

  const text = await Deno.readTextFile(file);
  const lines = filterByDateRange(text, from, to);
  const roundMins = Number(flags.round) || 1;
  const data = summarize(lines, roundMins);

  return format(data, fmt);
}

if (import.meta.main) {
  try {
    console.log(await run(Deno.args));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}
