import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Entry, UserSummary } from "../../shared/pixel";
import { ArtworkImage } from "./ArtworkImage";

export type ArtworkGridItem = {
  entry: Entry;
  author: UserSummary;
};

function cardSize(width: number, height: number, index: number) {
  const ratio = width / height;
  if (ratio >= 1.35) return "wide";
  if (index > 1 && index % 5 === 0) return "large";
  return ratio <= 0.72 ? "portrait" : "standard";
}

export function ArtworkGrid({
  works,
  onOpen,
}: {
  works: ArtworkGridItem[];
  onOpen: (entry: Entry) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const visibleWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return works
      .filter(({ entry, author }) => {
        if (!normalizedQuery) return true;
        return [
          entry.title,
          entry.originalFilename,
          entry.note,
          author.username,
          author.displayName,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => {
        const difference =
          new Date(right.entry.createdAt).getTime() - new Date(left.entry.createdAt).getTime();
        return sort === "newest" ? difference : -difference;
      });
  }, [query, sort, works]);

  return (
    <>
      <div className="work-grid-toolbar">
        <label className="work-search">
          <Search size={13} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search works"
            aria-label="Search works"
          />
        </label>
        <div className="work-sort" aria-label="Sort works">
          <button type="button" aria-pressed={sort === "newest"} onClick={() => setSort("newest")}>
            <ArrowDown size={11} /> newest
          </button>
          <button type="button" aria-pressed={sort === "oldest"} onClick={() => setSort("oldest")}>
            <ArrowUp size={11} /> oldest
          </button>
        </div>
      </div>
      {visibleWorks.length > 0 ? (
        <div className="feed-board">
          {visibleWorks.map(({ entry, author }, index) => (
            <article
              className={`feed-card feed-card-${cardSize(entry.width, entry.height, index)}`}
              key={entry.id}
            >
              <button
                className="feed-card-preview"
                type="button"
                style={{ aspectRatio: `${entry.width} / ${entry.height}` }}
                onClick={() => onOpen(entry)}
                aria-label={`Open ${entry.title ?? entry.originalFilename}`}
              >
                <ArtworkImage src={entry.imageUrl} alt={entry.title ?? entry.originalFilename} />
              </button>
              <Link className="feed-card-author" to={`/${author.username}`}>
                <img src={author.avatarUrl ?? "/avatar.png"} alt="" />
                <strong>@{author.username}</strong>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="work-grid-empty">No matching works</p>
      )}
    </>
  );
}
