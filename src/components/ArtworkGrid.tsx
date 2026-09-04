import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import type { Entry, UserSummary, Visibility } from "../../shared/pixel";
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

function ArtworkCard({
  item: { entry, author },
  index,
  onOpen,
}: {
  item: ArtworkGridItem;
  index: number;
  onOpen: (entry: Entry) => void;
}) {
  return (
    <article className={`feed-card feed-card-${cardSize(entry.width, entry.height, index)}`}>
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
  );
}

function columnCount(width: number, itemCount: number) {
  const maximum = width < 340 ? 2 : width < 760 ? 3 : 4;
  return Math.max(1, Math.min(itemCount, maximum));
}

function MasonryBoard({
  works,
  onOpen,
}: {
  works: ArtworkGridItem[];
  onOpen: (entry: Entry) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(() => Math.max(1, Math.min(works.length, 4)));

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const resize = () => setColumns(columnCount(board.clientWidth, works.length));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(board);
    return () => observer.disconnect();
  }, [works.length]);

  const groups = useMemo(() => {
    const next = Array.from({ length: columns }, () => [] as typeof works);
    const heights = Array.from({ length: columns }, () => 0);
    for (const item of works) {
      const shortest = heights.indexOf(Math.min(...heights));
      next[shortest].push(item);
      heights[shortest] += item.entry.height / item.entry.width + 0.1;
    }
    return next;
  }, [columns, works]);

  return (
    <div ref={boardRef} className="feed-board" data-layout="masonry" data-columns={columns}>
      {groups.map((group, column) => (
        <div className="masonry-column" key={column}>
          {group.map((item, index) => (
            <ArtworkCard item={item} index={index} onOpen={onOpen} key={item.entry.id} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ArtworkGrid({
  works,
  onOpen,
  controls = true,
  visibilityControls = false,
  layout = "grid",
}: {
  works: ArtworkGridItem[];
  onOpen: (entry: Entry) => void;
  controls?: boolean;
  visibilityControls?: boolean;
  layout?: "grid" | "masonry";
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [visibility, setVisibility] = useState<Visibility | "all">("all");
  const visibleWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return works
      .filter(({ entry, author }) => {
        if (visibility !== "all" && entry.visibility !== visibility) return false;
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
  }, [query, sort, visibility, works]);

  return (
    <>
      {controls && (
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
          {visibilityControls && (
            <div className="work-filter" aria-label="Filter by visibility">
              {(["all", "public", "private", "unlisted"] as const).map((value) => (
                <button
                  type="button"
                  aria-pressed={visibility === value}
                  onClick={() => setVisibility(value)}
                  key={value}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
          <div className="work-sort" aria-label="Sort works">
            <button
              type="button"
              aria-pressed={sort === "newest"}
              onClick={() => setSort("newest")}
            >
              <ArrowDown size={11} /> newest
            </button>
            <button
              type="button"
              aria-pressed={sort === "oldest"}
              onClick={() => setSort("oldest")}
            >
              <ArrowUp size={11} /> oldest
            </button>
          </div>
        </div>
      )}
      {visibleWorks.length > 0 ? (
        layout === "masonry" ? (
          <MasonryBoard works={visibleWorks} onOpen={onOpen} />
        ) : (
          <div className="feed-board">
            {visibleWorks.map((item, index) => (
              <ArtworkCard item={item} index={index} onOpen={onOpen} key={item.entry.id} />
            ))}
          </div>
        )
      ) : (
        <div className="work-grid-empty" role="status">
          <img src="/pixel.svg" alt="" />
          <strong>nothing found</strong>
          <span>try another search</span>
        </div>
      )}
    </>
  );
}
