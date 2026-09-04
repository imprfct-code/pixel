import { Link } from "react-router";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav aria-label="Legal">
        <Link to="/privacy">privacy</Link>
        <Link to="/terms">terms</Link>
      </nav>
    </footer>
  );
}
