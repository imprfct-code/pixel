import { Plus, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Route, Routes, useNavigate } from "react-router";
import type { Entry, ProfileInput, UploadInput, UserSummary } from "../shared/pixel";
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
  return (
    <GlobalDrop onUpload={onUpload}>
      <div className="app-shell">
        <header className="site-header">
          <Link className="wordmark" to="/" aria-label="Pixel home">
            <img src="/pixel.svg" alt="" /> Pixel
          </Link>
          <nav>
            <Link className="header-upload" to="/upload">
              <Plus size={14} /> new entry
            </Link>
            <Link className="header-settings" to="/settings" aria-label="Settings">
              <Settings size={14} /> settings
            </Link>
            {account}
          </nav>
        </header>
        <main className="page-shell">
          <Routes>
            <Route
              path="/"
              element={
                loading ? (
                  <p className="status-message">loading</p>
                ) : (
                  <HomeScreen user={user} entries={entries} />
                )
              }
            />
            <Route
              path="/upload"
              element={
                <>
                  <HomeScreen user={user} entries={entries} />
                  <UploadRoute onUpload={onUpload} />
                </>
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsScreen
                  user={user}
                  onSave={onSaveProfile}
                  onAvatarUpload={onAvatarUpload}
                />
              }
            />
            <Route
              path="/entries/:entryId"
              element={<ViewerScreen entries={entries} loading={loading} />}
            />
            <Route path="*" element={<HomeScreen user={user} entries={entries} />} />
          </Routes>
        </main>
        <footer>Pixel</footer>
      </div>
    </GlobalDrop>
  );
}

function UploadRoute({ onUpload }: { onUpload: (input: UploadInput) => Promise<string> }) {
  const navigate = useNavigate();
  return (
    <UploadScreen
      onClose={() => void navigate("/")}
      onUpload={async (input) => {
        const entryId = await onUpload(input);
        void navigate(`/entries/${entryId}`);
        return entryId;
      }}
    />
  );
}
