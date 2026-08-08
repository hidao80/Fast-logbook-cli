/**
 * Log-line parsing and aggregation logic, compatible with Fast-logbook-PWA.
 * Line format: "YYYY-MM-DD HH:MM<category>;<detail>" (;detail is optional)
 */

const TIME_LENGTH = 16;
const FIELD_SEPARATOR = ";";

export interface WorkSummary {
  category: string;
  detail: string;
  minutes: number;
  hours: number;
}

function fetchHour(time: string): number {
  return parseInt(time.slice(11, 13), 10);
}

function fetchMin(time: string): number {
  return parseInt(time.slice(14, 16), 10);
}

/**
 * Keep only lines whose leading YYYY-MM-DD falls within [from, to] (simple
 * string comparison). Omitting from/to ignores that bound (full range).
 */
export function filterByDateRange(
  text: string,
  from?: string,
  to?: string,
): string[] {
  return text.split("\n").filter((line) => {
    const date = line.slice(0, 10);
    return (!from || date >= from) && (!to || date <= to);
  });
}

/** Aggregate work time and details per category. */
export function summarize(lines: string[], roundMins = 1): WorkSummary[] {
  const timeStamps: { time: string; category: string }[] = [];
  const detailLists: Record<string, string[]> = {};
  const minutesByCategory: Record<string, number> = {};

  for (const line of lines) {
    if (line.length < TIME_LENGTH) continue;

    const time = line.slice(0, TIME_LENGTH);
    const junction = line.indexOf(FIELD_SEPARATOR);
    const category = junction < 0
      ? line.slice(TIME_LENGTH)
      : line.slice(TIME_LENGTH, junction);
    const detail = junction < 0 ? "" : line.slice(junction + 1);

    timeStamps.push({ time, category });
    if (!detailLists[category]) {
      detailLists[category] = [];
      minutesByCategory[category] = 0;
    }
    detailLists[category].push(detail);
  }

  for (let i = 1; i < timeStamps.length; i++) {
    const after = timeStamps[i].time;
    const before = timeStamps[i - 1].time;
    let hour = fetchHour(after) - fetchHour(before);
    if (hour < 0) hour += 24;
    let min = fetchMin(after) - fetchMin(before);
    if (min < 0) {
      hour -= 1;
      min += 60;
    }
    minutesByCategory[timeStamps[i - 1].category] += hour * 60 + min;
  }

  return Object.keys(minutesByCategory).filter((category) => category !== "")
    .sort().map((category) => {
      const minutes = minutesByCategory[category];
      const hours = Math.floor(minutes / 60) +
        Number(
          ((Math.round((minutes % 60) / roundMins) * roundMins) / 60).toFixed(
            2,
          ),
        );
      return {
        category,
        detail: Array.from(new Set(detailLists[category])).join(", "),
        minutes,
        hours,
      };
    });
}
