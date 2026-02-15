// frontend/src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--tf-ring)] focus-visible:ring-offset-2 ${
    isActive
      ? "bg-blue-600 text-white"
      : "text-[color:var(--tf-text)] hover:bg-white/40 hover:text-[color:var(--tf-text)]"
  }`;

export default function Navbar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setIsDark(mq.matches);
    update();

    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  useEffect(() => {
    const clamp01 = (n) => Math.min(1, Math.max(0, n));
    const compute = () => {
      const y = window.scrollY || 0;
      setScrollProgress(clamp01(y / 120));
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        compute();
      });
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, []);

  const alpha = 0.45 + scrollProgress * 0.5;
  const backgroundColor = isDark
    ? `rgba(15, 23, 42, ${alpha})`
    : `rgba(248, 250, 252, ${alpha})`;
  const scrolled = scrollProgress > 0.02;

  return (
    <nav
      className={`sticky top-16 z-30 border-b backdrop-blur transition-[background-color,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none ${
        scrolled
          ? "border-[color:var(--tf-border)] shadow-sm"
          : "border-transparent shadow-none"
      }`}
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 whitespace-nowrap mx-auto md:mx-0">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/feed" className={navLinkClass}>
              Feed
            </NavLink>
            <NavLink to="/playlist" className={navLinkClass}>
              Playlist
            </NavLink>
            <NavLink to="/learning" className={navLinkClass}>
              My Learning
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/cv-maker" className={navLinkClass}>
              CV Maker
            </NavLink>
            <NavLink to="/assignment-writer" className={navLinkClass}>
              Assignment Writer
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
