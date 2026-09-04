import { useUser } from "@clerk/react";
import { useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import type { Entry } from "../../shared/pixel";
import { ArtworkGrid, type ArtworkGridItem } from "../components/ArtworkGrid";
import { GlobalDrop } from "../components/GlobalDrop";
import { UploadNotice } from "../components/UploadNotice";
import { usePixelUpload } from "../hooks/usePixelUpload";
import { UploadScreen } from "./UploadScreen";

const SKELETON_CARDS = [
  { size: "wide", ratio: "2 / 1" },
  { size: "standard", ratio: "1 / 1" },
  { size: "portrait", ratio: "3 / 4" },
  { size: "standard", ratio: "1 / 1" },
  { size: "large", ratio: "4 / 3" },
  { size: "standard", ratio: "1 / 1" },
] as const;

function FeedSkeleton() {
  return (
    <div className="feed-board" aria-busy="true">
      <span className="visually-hidden">loading works</span>
      {SKELETON_CARDS.map((card, index) => (
        <article
          className={`feed-card feed-card-${card.size} feed-skeleton-card`}
          key={`${card.size}-${index}`}
          aria-hidden="true"
        >
          <div className="feed-skeleton-preview" style={{ aspectRatio: card.ratio }} />
          <div className="feed-skeleton-author">
            <span />
            <i />
          </div>
        </article>
      ))}
    </div>
  );
}

export function FeedScreen() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const works = useQuery(api.entries.feed);
  const mine = useQuery(api.entries.listMine, isSignedIn ? {} : "skip");
  const upload = usePixelUpload();
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<{ entryId: string; count: number }>();
  const openUpload = useCallback(
    (files: File[] = []) => {
      if (!isSignedIn) {
        void navigate("/sign-in");
        return;
      }
      setUploadFiles(files);
      setUploadOpen(true);
    },
    [isSignedIn, navigate],
  );

  return (
    <GlobalDrop onSelectFiles={openUpload}>
      <div className="app-shell feed-shell">
        <header className="site-header">
          <Link className="wordmark" to="/" aria-label="Pixel feed">
            <img src="/pixel.svg" alt="" /> Pixel
          </Link>
          <Link className="header-settings" to="/profile">
            my profile
          </Link>
        </header>
        <main className="page-shell feed-page">
          {works === undefined ? (
            <FeedSkeleton />
          ) : (
            <ArtworkGrid
              works={works as ArtworkGridItem[]}
              onOpen={(entry) =>
                void navigate(`/entries/${entry.id}`, { state: { returnTo: "/" } })
              }
              controls={false}
            />
          )}
        </main>
        {!uploadOpen && !uploadNotice && (
          <button
            className="feed-upload"
            type="button"
            onClick={() => openUpload()}
            aria-label="Upload new work"
          >
            +
          </button>
        )}
        {uploadOpen && (
          <UploadScreen
            initialFiles={uploadFiles}
            onUpload={upload}
            onClose={() => {
              setUploadFiles([]);
              setUploadOpen(false);
            }}
            onComplete={(entryIds) => {
              setUploadFiles([]);
              setUploadOpen(false);
              setUploadNotice({
                entryId: entryIds[entryIds.length - 1],
                count: entryIds.length,
              });
            }}
          />
        )}
        {uploadNotice && (
          <UploadNotice
            entry={(mine as Entry[] | undefined)?.find(
              (entry) => entry.id === uploadNotice.entryId,
            )}
            entryId={uploadNotice.entryId}
            count={uploadNotice.count}
            onClose={() => setUploadNotice(undefined)}
          />
        )}
      </div>
    </GlobalDrop>
  );
}
