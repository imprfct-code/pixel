import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router";
import type { Entry, UploadInput, UserSummary } from "../shared/pixel";
import { GlobalDrop } from "./components/GlobalDrop";
import { HomeScreen } from "./screens/HomeScreen";
import { UploadScreen } from "./screens/UploadScreen";
import { ViewerScreen } from "./screens/ViewerScreen";

export function PixelApp({
  user,
  entries,
  loading = false,
  onUpload,
  account,
  mode,
}: {
  user: UserSummary;
  entries: Entry[];
  loading?: boolean;
  onUpload: (input: UploadInput) => Promise<string>;
  account?: ReactNode;
  mode?: "demo";
}) {
  return (
    <BrowserRouter>
      <GlobalDrop onUpload={onUpload}>
        <div className="app-shell">
          <header className="site-header">
            <Link className="wordmark" to="/" aria-label="Pixel home">
              <img src="/pixel.svg" alt="" /> Pixel
            </Link>
            <nav>
              {mode === "demo" && <span className="demo-badge">local demo</span>}
              <Link className="header-upload" to="/upload">
                <Plus size={14} /> new entry
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
              <Route path="/upload" element={<UploadRoute onUpload={onUpload} />} />
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
    </BrowserRouter>
  );
}

function UploadRoute({ onUpload }: { onUpload: (input: UploadInput) => Promise<string> }) {
  const navigate = useNavigate();
  return (
    <UploadScreen
      onUpload={async (input) => {
        const entryId = await onUpload(input);
        void navigate(`/entries/${entryId}`);
        return entryId;
      }}
    />
  );
}
