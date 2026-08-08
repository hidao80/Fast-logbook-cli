# Architecture Decision Records

Decisions recorded from the initial build-out of Fast-logbook-cli (this thread's conversation), not from git history.

---

## ADR-0001: Build a Deno/TypeScript CLI that ports Fast-logbook-PWA's time-calculation logic

**Status:** Accepted

**Context**

Fast-logbook-cli started as an empty Deno HTTP-server template. The goal was a CLI that reads a Fast-logbook-PWA log, sums work time per category over a date range, and prints it in several formats. Fast-logbook-PWA (`E:\project\Fast-logbook-PWA`) already has this logic in `src/lib/download.ts` (`parse()`) and `src/lib/utils.ts`.

**Decision**

Port the PWA's `parse()` algorithm as-is into `src/logbook.ts`: same timestamp slicing (`TIME_LENGTH = 16`), same adjacent-punch time-diff calculation (with day-rollover carry), same rounding formula. The original HTTP-server template in `main.ts` was discarded and replaced with a CLI entry point.

**Consequences**

- Behavior matches the PWA's category-time semantics exactly (last punch in a set adds no time — it's the "end of work" marker).
- The CLI has no HTTP server code; `main.ts` is now purely a CLI entry.

---

## ADR-0002: Consume the PWA's raw plain-text log format directly

**Status:** Accepted

**Context**

The PWA stores logs as newline-separated plain text in IndexedDB (`YYYY-MM-DD HH:MM<category>;<detail>` per line), not as JSON or any structured export.

**Decision**

The CLI takes a file path to that same raw text format as its only supported input — no IndexedDB access, no JSON schema, no separate export step required.

**Consequences**

- Users export/copy the PWA's log text to a file and point the CLI at it directly.
- No new input schema to design or maintain; parsing logic is a straight port.

---

## ADR-0003: Filter by date range using simple string comparison, not the PWA's roll-over time

**Status:** Accepted

**Context**

The PWA defines a configurable "roll-over time" (default `05:00`) that shifts where one calendar day ends and the next begins (`App.tsx: getDateBoundaries`). Reproducing it exactly would require carrying that setting into the CLI.

**Decision**

The CLI filters lines by comparing the first 10 characters (`YYYY-MM-DD`) of each line directly against `--from`/`--to`, with no roll-over adjustment.

**Consequences**

- Simpler, dependency-free filtering logic; correct for the common case of logs that don't span the roll-over boundary.
- Entries logged shortly after midnight but "before" the user's roll-over time are bucketed into the calendar day they were literally written on, which can differ from the PWA's own day grouping. Documented as a known simplification, not fixed unless a user hits it in practice.

---

## ADR-0004: Rounding unit is an explicit CLI flag, not read from PWA storage

**Status:** Accepted

**Context**

The PWA persists its rounding unit (`rounding_mins`) in IndexedDB and validates it via `getRoundingUnit` (only 1/5/10/15/30/60 allowed).

**Decision**

Expose rounding as a `--round <minutes>` CLI flag (default `1`, i.e. no rounding) instead of reading any PWA-specific storage. The CLI does not replicate the PWA's allow-list validation — any positive number is accepted.

**Consequences**

- The CLI has no dependency on IndexedDB or the PWA's storage keys.
- Rounding behavior is explicit per invocation rather than inherited from a stateful setting.

---

## ADR-0005: Support six output formats with format-specific escaping

**Status:** Accepted

**Context**

Output needed to serve different downstream consumers: machine parsing (JSON, JSONL, XML) and spreadsheet/tabular tools (Markdown, TSV, CSV).

**Decision**

- Implement `json`, `markdown` (alias `md`), `tsv`, `csv`, `jsonl`, `xml` in `src/formatters.ts`, dispatched by a single `format()` function.
- JSON output is minified (`JSON.stringify(data)`, no indentation) rather than pretty-printed.
- CSV always wraps every field in double quotes and escapes embedded quotes by doubling (`"` → `""`), regardless of whether the field contains a comma — chosen over TSV's conditional quoting because CSV fields (especially `detail`, a comma-joined list) are the ones most likely to contain commas and silently break column alignment if left unquoted.
- TSV keeps conditional quoting (only quotes a field if it contains the delimiter, a quote, or a newline).

**Consequences**

- CSV output is always safe to open in a spreadsheet even when `detail` contains commas.
- CSV and TSV intentionally use different quoting strategies; this asymmetry is a deliberate tradeoff, not an oversight.

---

## ADR-0006: CLI argument shape — positional file path, `-f/-t/-F` flags, full range by default

**Status:** Accepted

**Context**

Initial versions required `--file`, `--from`, and `--to` all as named flags, with `--from`/`--to` defaulting to today's date. The user later requested (1) the file path be a positional argument instead of `--file`, (2) short aliases `-f/-t/-F`, and (3) omitting `--from`/`--to` should summarize the entire file rather than defaulting to "today."

**Decision**

Final shape:
```
flb [-f|--from <YYYY-MM-DD>] [-t|--to <YYYY-MM-DD>] [-F|--format <json|markdown|tsv|csv|jsonl|xml|md>] /path/to/file
```
`filterByDateRange(text, from?, to?)` treats a missing bound as "no constraint on that side," so omitting both flags returns the full file.

**Consequences**

- Matches common CLI conventions (positional required argument, optional flags with short aliases).
- Behavior changed twice during development (today-default → full-range-default); the full-range default is final based on explicit user correction.

---

## ADR-0007: Ship as a standalone binary via `deno compile`

**Status:** Accepted

**Context**

The tool needed to be distributable as a runnable executable named `flb`, not just invoked via `deno run`.

**Decision**

Add a `build` task to `deno.json`: `deno compile --allow-read --output flb main.ts`. Add `flb`/`flb.exe` to `.gitignore` since it's a large (~76 MB) generated artifact.

**Consequences**

- `deno task build` is the single entry point for producing the distributable binary.
- The binary is never committed; anyone building from source needs the Deno toolchain.

---

## ADR-0008: License as MIT

**Status:** Accepted

**Context**

The project needed an explicit license before being shared.

**Decision**

Add `LICENSE` (standard MIT text) and reference it from `README.md`.

**Consequences**

- Permissive reuse; no additional obligations beyond attribution.

---

## ADR-0009: Write project documentation (README, ADR) in English

**Status:** Accepted

**Context**

The working conversation with the assistant is conducted in Japanese, but the project itself (source code, comments, docs) needed to be consumable by an English-speaking audience.

**Decision**

- `README.md` is written entirely in standard English, covering installation, usage, options, examples, log format, and development commands.
- This ADR document (`docs/ADR.md`) is also written in English and records decisions from the conversation history — not generated from `git log`, since the repository had zero commits at the time of writing (all files were untracked).

**Consequences**

- Documentation language is decoupled from the conversation language used to produce it.
- Because there is no commit history yet, this ADR must be manually kept in sync with future decisions rather than regenerated from `git log`; a git-log-based regeneration (via the `hidao:update-adr` skill) was attempted once and skipped for lack of commits.

---

## ADR-0010: Standardize all CLI usage text and source-derived English on en-US

**Status:** Accepted

**Context**

Early iterations mixed Japanese into user-facing and developer-facing strings: the `USAGE` message in `main.ts` used the Japanese word for "full range" (`全期間`), and all JSDoc comments plus `Deno.test()` names in `src/logbook.ts`, `src/logbook_test.ts`, `src/formatters_test.ts`, and `main_test.ts` were written in Japanese.

**Decision**

Translate every source-code comment, JSDoc block, and test description to English (en-US). The CLI's `--help`-equivalent `USAGE` string is English-only (e.g., `default:full range` instead of `default:全期間`).

**Consequences**

- Source code, comments, and test names are now uniformly in English, independent of the conversation language.
- No functional change — this was a text-only translation pass; all 20 tests continued to pass after the rename.
