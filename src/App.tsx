import { Check, Plus, Share2, X } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import type {
  Entry,
  EntryUpdateInput,
  ProfileInput,
  UploadInput,
  UserSummary,
} from "../shared/pixel";
import { GlobalDrop } from "./components/GlobalDrop";
import { HomeScreen } from "./screens/HomeScreen";
import { UploadScreen } from "./screens/UploadScreen";
import { ViewerScreen } from "./screens/ViewerScreen";

export function PixelApp({
  user,
  entries,
  loading = false,
  onUpload,
  onSaveProfile,
  onAvatarUpload,
  onUpdateEntry,
  onDeleteEntry,
  account,
}: {
  user: UserSummary;
  entries: Entry[];
  loading?: boolean;
  onUpload: (input: UploadInput) => Promise<string>;
  onSaveProfile: (input: ProfileInput) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onUpdateEntry: (entryId: string, input: EntryUpdateInput) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  account?: ReactNode;
}) {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadNotice, setUploadNotice] = useState<{ entryId: string; count: number }>();
  const openUpload = useCallback(
    (files: File[] = []) => {
      setUploadFiles(files);
      void navigate("/upload");
    },
    [navigate],
  );
  const closeUpload = useCallback(() => {
    setUploadFiles([]);
    void navigate("/profile");
  }, [navigate]);

  return (
    <GlobalDrop onSelectFiles={openUpload}>
      <div className="app-shell">
        <header className="site-header">
          <Link className="wordmark" to="/" aria-label="Pixel feed">
            <img src="/pixel.svg" alt="" /> Pixel
          </Link>
          <nav>
            <button className="header-upload" type="button" onClick={() => openUpload()}>
              <Plus size={14} /> new entry
            </button>
            {account}
          </nav>
        </header>
        <main className="page-shell">
          {pathname === "/profile" &&
            (loading ? (
              <p className="status-message">loading</p>
            ) : (
              <HomeScreen
                user={user}
                entries={entries}
                onSaveProfile={onSaveProfile}
                onAvatarUpload={onAvatarUpload}
              />
            ))}
          {pathname === "/upload" && (
            <>
              <HomeScreen
                user={user}
                entries={entries}
                onSaveProfile={onSaveProfile}
                onAvatarUpload={onAvatarUpload}
              />
              <UploadRoute
                initialFiles={
                  uploadFiles.length > 0
                    ? uploadFiles
                    : Array.isArray(state?.uploadFiles)
                      ? state.uploadFiles
                      : []
                }
                onUpload={onUpload}
                onClose={closeUpload}
                onComplete={(entryIds) => {
                  closeUpload();
                  setUploadNotice({
                    entryId: entryIds[entryIds.length - 1],
                    count: entryIds.length,
                  });
                }}
              />
            </>
          )}
          {pathname.startsWith("/entries/") && (
            <ViewerScreen
              entries={entries}
              loading={loading}
              onUpdate={onUpdateEntry}
              onDelete={onDeleteEntry}
            />
          )}
        </main>
        {uploadNotice && (
          <UploadNotice
            entry={entries.find((entry) => entry.id === uploadNotice.entryId)}
            entryId={uploadNotice.entryId}
            count={uploadNotice.count}
            onClose={() => setUploadNotice(undefined)}
          />
        )}
      </div>
    </GlobalDrop>
  );
}

function UploadRoute({
  initialFiles,
  onUpload,
  onClose,
  onComplete,
}: {
  initialFiles: File[];
  onUpload: (input: UploadInput) => Promise<string>;
  onClose: () => void;
  onComplete: (entryIds: string[]) => void;
}) {
  return (
    <UploadScreen
      initialFiles={initialFiles}
      onClose={onClose}
      onUpload={onUpload}
      onComplete={onComplete}
    />
  );
}

function UploadNotice({
  entry,
  entryId,
  count,
  onClose,
}: {
  entry?: Entry;
  entryId: string;
  count: number;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(
      new URL(`/entries/${entryId}`, window.location.origin).href,
    );
    setCopied(true);
  }

  return (
    <aside className="upload-notice" role="status">
      <div className="upload-notice-preview">{entry && <img src={entry.imageUrl} alt="" />}</div>
      <strong>{count > 1 ? `${count} uploaded` : "uploaded"}</strong>
      <button className="upload-notice-share" type="button" onClick={() => void copyLink()}>
        {copied ? <Check size={13} /> : <Share2 size={13} />}
        {copied ? "copied" : "share"}
      </button>
      <button className="upload-notice-close" type="button" onClick={onClose} aria-label="Close">
        <X size={14} />
      </button>
    </aside>
  );
}
