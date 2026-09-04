import { Plus } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import type { Entry, ProfileInput, UploadInput, UserSummary } from "../shared/pixel";
import { GlobalDrop } from "./components/GlobalDrop";
import { ProfileLoadingSkeleton } from "./components/LoadingSkeleton";
import { UploadNotice } from "./components/UploadNotice";
import { HomeScreen } from "./screens/HomeScreen";
import { UploadScreen } from "./screens/UploadScreen";

export function PixelApp({
  user,
  entries,
  loading = false,
  onUpload,
  onSaveProfile,
  onAvatarUpload,
  account,
}: {
  user: UserSummary;
  entries: Entry[];
  loading?: boolean;
  onUpload: (input: UploadInput) => Promise<string>;
  onSaveProfile: (input: ProfileInput) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  account?: ReactNode;
}) {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const [uploadFile, setUploadFile] = useState<File>();
  const [uploadNotice, setUploadNotice] = useState<string>();
  const openUpload = useCallback(
    (file?: File) => {
      setUploadFile(file);
      void navigate("/upload");
    },
    [navigate],
  );
  const closeUpload = useCallback(() => {
    setUploadFile(undefined);
    void navigate("/profile");
  }, [navigate]);

  return (
    <GlobalDrop onSelectFile={openUpload}>
      <div className="app-shell">
        <header className="site-header">
          <Link className="wordmark" to="/" aria-label="Pixel feed">
            <img src="/pixel.svg" alt="" /> Pixel
          </Link>
          <nav>
            <button className="header-upload" type="button" onClick={() => openUpload()}>
              <Plus size={14} /> new work
            </button>
            {account}
          </nav>
        </header>
        <main className="page-shell">
          {pathname === "/profile" &&
            (loading ? (
              <ProfileLoadingSkeleton />
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
                initialFile={
                  uploadFile ?? (state?.uploadFile instanceof File ? state.uploadFile : undefined)
                }
                onUpload={onUpload}
                onClose={closeUpload}
                onComplete={(entryId) => {
                  closeUpload();
                  setUploadNotice(entryId);
                }}
              />
            </>
          )}
        </main>
        {uploadNotice && (
          <UploadNotice
            entry={entries.find((entry) => entry.id === uploadNotice)}
            entryId={uploadNotice}
            onClose={() => setUploadNotice(undefined)}
          />
        )}
      </div>
    </GlobalDrop>
  );
}

function UploadRoute({
  initialFile,
  onUpload,
  onClose,
  onComplete,
}: {
  initialFile?: File;
  onUpload: (input: UploadInput) => Promise<string>;
  onClose: () => void;
  onComplete: (entryId: string) => void;
}) {
  return (
    <UploadScreen
      initialFile={initialFile}
      onClose={onClose}
      onUpload={onUpload}
      onComplete={onComplete}
    />
  );
}
