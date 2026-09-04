import type { Entry } from "../../shared/pixel";

const DAYS = 84;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function Heatmap({ entries }: { entries: Entry[] }) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const key = entry.createdAt.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date();
  const days = Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (DAYS - index - 1));
    const key = dateKey(date);
    return { key, count: counts.get(key) ?? 0 };
  });

  return (
    <section className="heatmap-section" aria-labelledby="practice-heading">
      <div className="section-heading">
        <h2 id="practice-heading">practice rhythm</h2>
        <span>last 12 weeks</span>
      </div>
      <div className="heatmap" role="img" aria-label="Practice activity over the last 12 weeks">
        {days.map(({ key, count }) => (
          <span
            key={key}
            className="heatmap-cell"
            data-level={Math.min(count, 4)}
            title={`${key} · ${count} ${count === 1 ? "piece" : "pieces"}`}
          />
        ))}
      </div>
    </section>
  );
}
