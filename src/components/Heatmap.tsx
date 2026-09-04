import { useCallback, useEffect, useMemo, useRef, type MouseEvent } from "react";
import type { Entry } from "../../shared/pixel";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function Heatmap({ entries }: { entries: Entry[] }) {
  const { weeks, total, activeDays, year } = useMemo(() => buildYear(entries), [entries]);
  const { showCell, resetCells, moveToCell } = useHeatmapLens();

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
        className="heatmap-lens"
        onMouseMove={(event) => moveToCell(event)}
        onMouseLeave={(event) => resetCells(event.currentTarget)}
        onFocus={(event) => showCell(event.target)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) resetCells(event.currentTarget);
        }}
      >
        <div
          className="heatmap-grid"
          role="img"
          aria-label={`${activeDays} practice days in ${year}`}
        >
          {weeks.map((week, weekIndex) => (
            <div className="heatmap-week" key={weekIndex}>
              {week.map((cell, dayIndex) => {
                const label = cell && !cell.future ? cellLabel(cell) : undefined;
                return (
                  <span
                    key={cell?.date ?? `padding-${weekIndex}-${dayIndex}`}
                    className="heatmap-cell"
                    data-heatmap={label ? `${weekIndex},${dayIndex}` : undefined}
                    data-level={cell?.level ?? 0}
                    data-padding={!cell || undefined}
                    data-future={cell?.future || undefined}
                    data-milestone={cell?.milestone || undefined}
                    data-label={label}
                    aria-label={label}
                    tabIndex={label ? 0 : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="heatmap-tooltip" role="tooltip" />
      </div>
    </section>
  );
}

function cellLabel(cell: { date: string; count: number; milestone: boolean }) {
  const date = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${cell.date}T00:00:00Z`));
  const activity =
    cell.count === 0 ? "no pieces" : `${cell.count} ${cell.count === 1 ? "piece" : "pieces"}`;
  return `${date}\n${activity}${cell.milestone ? "\nmilestone" : ""}`;
}

function useHeatmapLens() {
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const resetCells = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    const lens = target.matches(".heatmap-lens") ? target : target.closest(".heatmap-lens");
    if (!lens) return;
    for (const cell of lens.querySelectorAll<HTMLElement>("[data-heatmap]")) {
      cell.style.transform = "";
      cell.style.zIndex = "";
    }
    const tooltip = lens.querySelector<HTMLElement>(".heatmap-tooltip");
    if (tooltip) tooltip.dataset.visible = "false";
  }, []);

  const showCell = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    const active = target.closest<HTMLSpanElement>("[data-heatmap]");
    const grid = active?.closest<HTMLElement>(".heatmap-lens");
    const tooltip = grid?.querySelector<HTMLElement>(".heatmap-tooltip");
    if (!active || !grid || !tooltip) return;

    const [activeWeek, activeDay] = active.dataset.heatmap!.split(",").map(Number);
    for (const cell of grid.querySelectorAll<HTMLElement>("[data-heatmap]")) {
      const [week, day] = cell.dataset.heatmap!.split(",").map(Number);
      const distance = Math.abs(activeWeek - week) + Math.abs(activeDay - day);
      cell.style.transform = `scale(${distance === 0 ? 1.18 : distance === 1 ? 0.86 : distance === 2 ? 0.94 : 1})`;
      cell.style.zIndex = distance === 0 ? "2" : "";
    }

    const gridBox = grid.getBoundingClientRect();
    const cellBox = active.getBoundingClientRect();
    tooltip.textContent = active.dataset.label ?? "";
    tooltip.style.left = `${cellBox.left - gridBox.left + cellBox.width / 2}px`;
    tooltip.style.top = `${cellBox.top - gridBox.top - 8}px`;
    tooltip.dataset.visible = "true";
  }, []);

  const moveToCell = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => showCell(target));
    },
    [showCell],
  );

  return { showCell, resetCells, moveToCell };
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
