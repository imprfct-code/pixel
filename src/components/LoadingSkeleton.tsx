function ProfileSkeletonContent() {
  return (
    <div className="profile-loading" aria-busy="true">
      <span className="visually-hidden">Loading profile</span>
      <section className="profile-loading-head" aria-hidden="true">
        <span className="skeleton-block profile-loading-avatar" />
        <div className="profile-loading-copy">
          <span className="skeleton-block profile-loading-handle" />
          <span className="skeleton-block profile-loading-name" />
          <span className="skeleton-block profile-loading-bio" />
          <span className="skeleton-block profile-loading-link" />
        </div>
        <div className="profile-loading-stats">
          <span className="skeleton-block" />
          <span className="skeleton-block" />
          <span className="skeleton-block" />
        </div>
      </section>
      <section className="profile-loading-timeline" aria-hidden="true">
        <span className="skeleton-block" />
        <div />
      </section>
      <section className="profile-loading-gallery" aria-hidden="true">
        <span className="skeleton-block profile-loading-search" />
        <div className="profile-loading-cards">
          <span className="skeleton-block" />
          <span className="skeleton-block" />
          <span className="skeleton-block" />
        </div>
      </section>
    </div>
  );
}

export function ProfileLoadingSkeleton({ withShell = false }: { withShell?: boolean }) {
  if (!withShell) return <ProfileSkeletonContent />;

  return (
    <div className="app-shell">
      <header className="site-header loading-header" aria-hidden="true">
        <span className="wordmark">
          <img src="/pixel.svg" alt="" /> Pixel by imprfct
        </span>
        <span className="skeleton-block loading-header-avatar" />
      </header>
      <main className="page-shell">
        <ProfileSkeletonContent />
      </main>
    </div>
  );
}

export function ViewerLoadingSkeleton() {
  return (
    <main className="viewer-loading" aria-busy="true">
      <span className="visually-hidden">Loading work</span>
      <header aria-hidden="true">
        <span className="skeleton-block" />
        <span className="skeleton-block" />
      </header>
      <div className="skeleton-block viewer-loading-media" aria-hidden="true" />
      <footer aria-hidden="true">
        <span className="skeleton-block" />
        <span className="skeleton-block" />
      </footer>
    </main>
  );
}

export function AuthLoadingSkeleton() {
  return (
    <main className="auth-loading" aria-busy="true">
      <span className="visually-hidden">Signing in</span>
      <section aria-hidden="true">
        <span className="wordmark">
          <img src="/pixel.svg" alt="" /> Pixel by imprfct
        </span>
        <span className="skeleton-block" />
        <span className="skeleton-block" />
        <span className="skeleton-block" />
      </section>
    </main>
  );
}
