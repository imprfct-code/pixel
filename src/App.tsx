import { Plus, Settings } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import type {
  Entry,
  EntryUpdateInput,
  ProfileInput,
  UploadInput,
  UserSummary,
} from "../shared/pixel";
import { GlobalDrop } from "./components/GlobalDrop";
import { HomeScreen } from "./screens/HomeScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
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
  const { pathname } = useLocation();
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
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
          <Link className="wordmark" to="/profile" aria-label="Pixel home">
            <img src="/pixel.svg" alt="" /> Pixel
          </Link>
          <nav>
            <button className="header-upload" type="button" onClick={() => openUpload()}>
              <Plus size={14} /> new entry
            </button>
            <Link className="header-settings" to="/settings" aria-label="Settings">
              <Settings size={14} /> settings
            </Link>
            {account}
          </nav>
        </header>
        <main className="page-shell">
          {pathname === "/" && <Navigate to="/profile" replace />}
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
              <UploadRoute initialFiles={uploadFiles} onUpload={onUpload} onClose={closeUpload} />
            </>
          )}
          {pathname === "/settings" && (
            <SettingsScreen user={user} onSave={onSaveProfile} onAvatarUpload={onAvatarUpload} />
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
        <footer>Pixel</footer>
      </div>
    </GlobalDrop>
  );
}

function UploadRoute({
  initialFiles,
  onUpload,
  onClose,
}: {
  initialFiles: File[];
  onUpload: (input: UploadInput) => Promise<string>;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  return (
    <UploadScreen
      initialFiles={initialFiles}
      onClose={onClose}
      onUpload={onUpload}
      onComplete={(entryIds) => {
        if (entryIds.length === 1) void navigate(`/entries/${entryIds[0]}`);
        else void navigate("/profile");
      }}
    />
  );
}
