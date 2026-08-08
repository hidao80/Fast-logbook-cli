# Fast-logbook-cli

A command-line tool that summarizes work time and activity logs from a Fast-logbook-PWA log file over a given date range.

It parses the same plain-text log format used by Fast-logbook-PWA (`YYYY-MM-DD HH:MM<category>;<detail>` per line), aggregates elapsed time per category, and outputs the result in your choice of six formats.

## Requirements

- [Deno](https://deno.com/) 2.x

## Installation

Compile a standalone executable named `flb`:

```sh
deno task build
```

This produces `flb` (or `flb.exe` on Windows) in the project root.

Alternatively, run directly without compiling:

```sh
deno task start -- [options] /path/to/file
```

## Usage

```
flb [-f|--from <YYYY-MM-DD|default: full range>] \
    [-t|--to <YYYY-MM-DD|default: full range>] \
    [-F|--format <json|markdown|tsv|csv|jsonl|xml|md|default:json>] \
    [--round <minutes|default:1>] \
    /path/to/file
```

| Option | Alias | Description | Default |
| --- | --- | --- | --- |
| `--from` | `-f` | Start date (`YYYY-MM-DD`), inclusive | entire file |
| `--to` | `-t` | End date (`YYYY-MM-DD`), inclusive | entire file |
| `--format` | `-F` | Output format: `json`, `markdown` (or `md`), `tsv`, `csv`, `jsonl`, `xml` | `json` |
| `--round` | | Rounding unit in minutes, applied to the `hours` field | `1` |

Omitting `--from`/`--to` summarizes the entire file.

### Examples

```sh
# Whole file, default JSON output
flb ./work.log

# Restrict to January 2024, output as a Markdown table
flb -f 2024-01-01 -t 2024-01-31 -F markdown ./work.log

# CSV, rounded to 15-minute increments
flb -f 2024-01-01 -t 2024-01-01 -F csv --round 15 ./work.log
```

### Sample output (JSON)

JSON output is minified (no indentation):

```json
[{"category":"Dev","detail":"task A, task B","minutes":510,"hours":8.5},{"category":"Meeting","detail":"standup","minutes":30,"hours":0.5}]
```

### Sample output (CSV)

Every field is always wrapped in double quotes, and embedded double quotes are escaped by doubling (`"` → `""`), so commas inside a field never break the layout:

```csv
"category","detail","hours","minutes"
"Dev","task A, task B","8.5","510"
"Meeting","standup","0.5","30"
```

## Log format

Each line represents a timestamped punch:

```
YYYY-MM-DD HH:MM<category>;<detail>
```

- The first 16 characters are the timestamp (`YYYY-MM-DD HH:MM`).
- Everything up to the next `;` is the category.
- Everything after `;` is an optional detail string.
- Work time per category is the elapsed time between consecutive punches; the final punch in the file marks the end of work and adds no time.

## Development

```sh
deno task test    # run tests
deno fmt           # format code
deno task build    # compile the flb binary
```

## License

MIT — see [LICENSE](./LICENSE).
