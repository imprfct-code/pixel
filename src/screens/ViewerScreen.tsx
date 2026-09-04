import { useUser } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { Check, Pencil, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Entry, UserSummary } from "../../shared/pixel";
import { EntryEditor } from "../components/EntryEditor";
import { ImageLightbox } from "../components/ImageLightbox";

export function ViewerScreen() {
  const { entryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const result = useQuery(
    api.entries.view,
    entryId ? { entryId: entryId as Id<"entries"> } : "skip",
  );
  const updateEntry = useMutation(api.entries.updateMine);
  const removeEntry = useMutation(api.entries.removeMine);
  const [editing, setEditing] = useState(location.state?.edit === true);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const requestedReturnTo = location.state?.returnTo;
  const returnTo =
    typeof requestedReturnTo === "string" &&
    requestedReturnTo.startsWith("/") &&
    !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : undefined;

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  if (result === undefined) return <p className="status-message full-page">loading</p>;
  if (result?.status === "private" && !isLoaded) {
    return <p className="status-message full-page">loading</p>;
  }
  if (result?.status === "private" && !isSignedIn) {
    const returnTo = `/entries/${entryId}`;
    return <Navigate to={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  if (!result || result.status === "private") {
    return (
      <section className="not-found">
        <h1>Work not found</h1>
        <Link className="button" to="/">
          back to works
        </Link>
      </section>
    );
  }
  const entry = result.entry as Entry;
  const author = result.author as UserSummary;
  const canShare = entry.visibility !== "private";

  return (
    <>
      <ImageLightbox
        entry={entry}
        details={
          <>
            <Link className="lightbox-author" to={`/${author.username}`}>
              <img src={author.avatarUrl ?? "/avatar.png"} alt="" />
              <span>
                <strong>@{author.username}</strong>
                {author.displayName && <small>{author.displayName}</small>}
              </span>
            </Link>
            {entry.note && <p>{entry.note}</p>}
            {canShare && (
              <button
                className="lightbox-mobile-share"
                type="button"
                data-copied={copied || undefined}
                onClick={() => void copyLink()}
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                <span aria-live="polite">{copied ? "copied" : "share"}</span>
              </button>
            )}
          </>
        }
        onClose={() => {
          if (editing) setEditing(false);
          else void navigate(returnTo ?? (result.canEdit ? "/profile" : "/"));
        }}
        toolbarActions={
          canShare || result.canEdit ? (
            <>
              {canShare && (
                <button
                  className="lightbox-share"
                  type="button"
                  data-copied={copied || undefined}
                  onClick={() => void copyLink()}
                  aria-label={copied ? "Link copied" : "Copy share link"}
                >
                  {copied ? <Check size={13} /> : <Share2 size={13} />}
                  <span aria-live="polite">{copied ? "copied" : "share"}</span>
                </button>
              )}
              {result.canEdit && (
                <button type="button" onClick={() => setEditing(true)} aria-label="Edit work">
                  <Pencil size={15} />
                </button>
              )}
            </>
          ) : undefined
        }
      />
      {editing && result.canEdit && (
        <EntryEditor
          entry={entry}
          onClose={() => setEditing(false)}
          onSave={async (input) => {
            await updateEntry({ entryId: entry.id as Id<"entries">, ...input });
          }}
          onDelete={async () => {
            await removeEntry({ entryId: entry.id as Id<"entries"> });
            void navigate("/profile");
          }}
        />
      )}
    </>
  );
}
