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
  return (
    <div className="feed-board">
      {works.map(({ entry, author }, index) => (
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
  );
}
