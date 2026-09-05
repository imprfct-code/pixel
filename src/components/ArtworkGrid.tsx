import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  MoreHorizontal,
  Pencil,
  Search,
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import type { Entry, UserSummary, Visibility } from "../../shared/pixel";
import { entryDate, calendarDateLabel } from "../lib/calendar";
import { downloadImage } from "../lib/image";
import { ArtworkImage } from "./ArtworkImage";

export type ArtworkGridItem = {
  entry: Entry;
  author: UserSummary;
  canEdit?: boolean;
};

function ArtworkCard({
  item: { entry, author, canEdit },
  onOpen,
  onEdit,
}: {
  item: ArtworkGridItem;
  onOpen: (entry: Entry) => void;
  onEdit?: (entry: Entry) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent | FocusEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("focusin", closeOutside, true);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("focusin", closeOutside, true);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [menuOpen]);

  async function copyLink() {
    setActionError("");
    try {
      await navigator.clipboard.writeText(
        new URL(`/entries/${entry.id}`, window.location.origin).href,
      );
    } catch {
      setActionError("Could not copy link. Try again.");
      return;
    }
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article className="feed-card">
      <button
        className="feed-card-preview"
        type="button"
        style={{ aspectRatio: String(Math.max(0.75, Math.min(2.5, entry.width / entry.height))) }}
        onClick={() => onOpen(entry)}
        aria-label={`Open ${entry.title ?? entry.originalFilename}`}
      >
        <ArtworkImage
          src={entry.imageUrl}
          alt={entry.title ?? entry.originalFilename}
          loading="lazy"
        />
        {entry.animation && (
          <span className="feed-card-frames">{entry.animation.frameDurations.length} frames</span>
        )}
      </button>
      <div className="feed-card-actions">
        {entry.visibility !== "private" && (
          <button
            type="button"
            data-copied={copied || undefined}
            onClick={() => void copyLink()}
            aria-label={copied ? "Link copied" : "Copy share link"}
            title={copied ? "Copied" : "Share"}
          >
            {copied ? <Check size={13} /> : <Share2 size={13} />}
          </button>
        )}
        <div ref={menuRef} className="feed-card-more" data-open={menuOpen || undefined}>
          <button
            className="feed-card-more-trigger"
            type="button"
            aria-label="More actions"
            aria-expanded={menuOpen}
            title="More actions"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <div>
              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(entry);
                  }}
                >
                  <Pencil size={12} /> edit
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setActionError("");
                  void downloadImage(entry.imageUrl, entry.originalFilename).catch(() => {
                    setActionError("Download failed. Try again.");
                  });
                }}
              >
                <Download size={12} /> download
              </button>
            </div>
          )}
        </div>
      </div>
      {actionError && (
        <p className="feed-card-error" role="alert">
          {actionError}
        </p>
      )}
      <Link className="feed-card-author" to={`/${author.username}`}>
        <img src={author.avatarUrl ?? "/avatar.png"} alt="" />
        <strong>@{author.username}</strong>
      </Link>
    </article>
  );
}

function columnCount(width: number) {
  return Math.max(1, Math.min(4, Math.floor((width + 10) / 250)));
}

function MasonryBoard({
  works,
  onOpen,
  onEdit,
}: {
  works: ArtworkGridItem[];
  onOpen: (entry: Entry) => void;
  onEdit?: (entry: Entry) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const resize = () => setColumns(columnCount(board.clientWidth));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  const groups = useMemo(() => {
    const next = Array.from({ length: columns }, () => [] as typeof works);
    const heights = Array.from({ length: columns }, () => 0);
    for (const item of works) {
      const shortest = heights.indexOf(Math.min(...heights));
      next[shortest].push(item);
      heights[shortest] +=
        1 / Math.max(0.75, Math.min(2.5, item.entry.width / item.entry.height)) + 0.1;
    }
    return next;
  }, [columns, works]);

  return (
    <div ref={boardRef} className="feed-board" data-layout="masonry" data-columns={columns}>
      {groups.map((group, column) => (
        <div className="masonry-column" key={column}>
          {group.map((item) => (
            <ArtworkCard item={item} onOpen={onOpen} onEdit={onEdit} key={item.entry.id} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ArtworkBoard({
  works,
  layout,
  onOpen,
  onEdit,
}: {
  works: ArtworkGridItem[];
  layout: "grid" | "masonry";
  onOpen: (entry: Entry) => void;
  onEdit?: (entry: Entry) => void;
}) {
  if (layout === "masonry") {
    return <MasonryBoard works={works} onOpen={onOpen} onEdit={onEdit} />;
  }

  return (
    <div className="feed-board">
      {works.map((item) => (
        <ArtworkCard item={item} onOpen={onOpen} onEdit={onEdit} key={item.entry.id} />
      ))}
    </div>
  );
}

export function ArtworkGrid({
  works,
  onOpen,
  onEdit,
  controls = true,
  visibilityControls = false,
  layout = "grid",
}: {
  works: ArtworkGridItem[];
  onOpen: (entry: Entry) => void;
  onEdit?: (entry: Entry) => void;
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
          entryDate(right.entry).localeCompare(entryDate(left.entry)) ||
          new Date(right.entry.createdAt).getTime() - new Date(left.entry.createdAt).getTime();
        return sort === "newest" ? difference : -difference;
      });
  }, [query, sort, visibility, works]);
  const dateGroups = useMemo(() => {
    const groups: Array<{
      key: string;
      label: string;
      works: ArtworkGridItem[];
    }> = [];

    for (const work of visibleWorks) {
      const key = entryDate(work.entry);
      const current = groups.at(-1);
      if (current?.key === key) current.works.push(work);
      else groups.push({ key, label: calendarDateLabel(key), works: [work] });
    }

    return groups;
  }, [visibleWorks]);

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
        <div className="work-date-groups">
          {dateGroups.map((group) => (
            <section className="work-date-group" key={group.key}>
              <h2 className="work-date-divider">{group.label}</h2>
              <ArtworkBoard works={group.works} layout={layout} onOpen={onOpen} onEdit={onEdit} />
            </section>
          ))}
        </div>
      ) : (
        <div className="work-grid-empty" role="status">
          <img src="/pixel.svg" alt="" />
          <strong>{works.length === 0 ? "No public works yet" : "No matching works"}</strong>
          <span>
            {works.length === 0
              ? "Public works will appear here"
              : "Try another search or clear your filters"}
          </span>
          {works.length > 0 && (
            <button
              className="button"
              type="button"
              onClick={() => {
                setQuery("");
                setVisibility("all");
              }}
            >
              clear filters
            </button>
          )}
        </div>
      )}
    </>
  );
}
