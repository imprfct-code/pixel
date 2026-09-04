import { useMemo } from "react";
import type { Entry } from "../../shared/pixel";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function Heatmap({ entries }: { entries: Entry[] }) {
  const { weeks, total, activeDays, year } = useMemo(() => buildYear(entries), [entries]);

  return (
    <section className="heatmap-section" aria-labelledby="practice-heading">
      <div className="heatmap-heading">
        <span id="practice-heading">
          {total} pieces / {activeDays} days / {year}
        </span>
        <div className="heatmap-legend" aria-label="Activity intensity">
          <span>less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i key={level} data-level={level} />
          ))}
          <span>more</span>
          <i className="milestone-key" />
          <span>milestone</span>
        </div>
      </div>
      <div
        className="heatmap-grid"
        role="img"
        aria-label={`${activeDays} practice days in ${year}`}
      >
        {weeks.map((week, weekIndex) => (
          <div className="heatmap-week" key={weekIndex}>
            {week.map((cell, dayIndex) => (
              <span
                key={cell?.date ?? `padding-${weekIndex}-${dayIndex}`}
                className="heatmap-cell"
                data-level={cell?.level ?? 0}
                data-padding={!cell || undefined}
                data-future={cell?.future || undefined}
                data-milestone={cell?.milestone || undefined}
                data-label={
                  cell && !cell.future
                    ? `${cell.date} / ${cell.count} ${cell.count === 1 ? "piece" : "pieces"}${cell.milestone ? " / milestone" : ""}`
                    : undefined
                }
                tabIndex={cell && !cell.future ? 0 : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function buildYear(entries: Entry[]) {
  const now = new Date();
  const today = dateKey(now);
  const year = now.getUTCFullYear();
  const counts = new Map<string, { count: number; milestone: boolean }>();

  for (const entry of entries) {
    const date = entry.createdAt.slice(0, 10);
    if (!date.startsWith(String(year))) continue;
    const current = counts.get(date) ?? { count: 0, milestone: false };
    counts.set(date, {
      count: current.count + 1,
      milestone: current.milestone || entry.milestone,
    });
  }

  const first = new Date(Date.UTC(year, 0, 1));
  const last = new Date(Date.UTC(year, 11, 31));
  const days = [];
  for (const date = new Date(first); date <= last; date.setUTCDate(date.getUTCDate() + 1)) {
    const key = dateKey(date);
    const activity = counts.get(key) ?? { count: 0, milestone: false };
    days.push({
      date: key,
      count: activity.count,
      milestone: activity.milestone,
      future: key > today,
      level:
        activity.count === 0
          ? 0
          : activity.count === 1
            ? 1
            : activity.count === 2
              ? 2
              : activity.count <= 4
                ? 3
                : 4,
    });
  }

  const mondayOffset = first.getUTCDay() === 0 ? 6 : first.getUTCDay() - 1;
  const padded: Array<(typeof days)[number] | null> = [
    ...Array.from({ length: mondayOffset }, () => null),
    ...days,
  ];
  while (padded.length % 7 !== 0) padded.push(null);

  return {
    weeks: Array.from({ length: padded.length / 7 }, (_, index) =>
      padded.slice(index * 7, index * 7 + 7),
    ),
    total: Array.from(counts.values()).reduce((sum, item) => sum + item.count, 0),
    activeDays: counts.size,
    year,
  };
}
