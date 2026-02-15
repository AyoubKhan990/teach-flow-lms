import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  const linkClass =
    "text-sm text-[color:var(--tf-text-muted)] hover:text-[color:var(--tf-text)] transition-colors";

  return (
    <footer className="mt-10 border-t border-[color:var(--tf-border)] bg-[color:var(--tf-surface-muted)] backdrop-blur supports-[backdrop-filter]:bg-white/35">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-base font-extrabold tracking-tight text-[color:var(--tf-text)]"
            >
              TeachFlow
            </Link>
            <div className="mt-2 max-w-md text-sm text-[color:var(--tf-text-muted)]">
              A clean learning workspace for YouTube: save playlists, track progress, and study with AI tools.
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--tf-text)]">
              Learn
            </div>
            <div className="mt-3 grid gap-2">
              <Link to="/feed" className={linkClass}>
                Feed
              </Link>
              <Link to="/playlist" className={linkClass}>
                Playlists
              </Link>
              <Link to="/learning" className={linkClass}>
                My Learning
              </Link>
              <Link to="/dashboard" className={linkClass}>
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--tf-text)]">
              Tools
            </div>
            <div className="mt-3 grid gap-2">
              <Link to="/cv-maker" className={linkClass}>
                CV Maker
              </Link>
              <Link to="/assignment-writer" className={linkClass}>
                Assignment Writer
              </Link>
              <Link to="/about" className={linkClass}>
                About
              </Link>
              <Link to="/contact" className={linkClass}>
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[color:var(--tf-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[color:var(--tf-text-muted)]">
            © {year} TeachFlow LMS
          </div>
          <div className="text-xs text-[color:var(--tf-text-muted)]">
            Built for focused learning
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
