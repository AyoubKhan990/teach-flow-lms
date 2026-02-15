// frontend/src/components/header/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import UserDropdown from "./UserDropdown.jsx";

import Logo from "../../../assets/LS_logo.png";

const TAGLINES = [
  "Your AI Companion for Smarter Learning",
  "From Watching to Understanding",
  "Learn, Summarize, Master",
  "Where Curiosity Meets Intelligence",
  "AI That Learns How You Learn",
  "AI Powered Ed-Tech Platform",
];

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/feed", label: "Feed" },
  { to: "/playlist", label: "Playlist" },
  { to: "/learning", label: "My Learning" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/cv-maker", label: "CV Maker" },
  { to: "/assignment-writer", label: "Assignment Writer" },
];

function randAnim() {
  const a = ["typing", "slide", "flip"];
  return a[Math.floor(Math.random() * a.length)];
}

function AnimatedTaglineInline({ taglines = TAGLINES, style, className }) {
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState(randAnim());
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState("enter");
  const timer = useRef(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const typingCharMs = 34;
  const holdFull = 1600;
  const slideHold = 2400;

  useEffect(() => {
    return () => timer.current && clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (reduced) {
      setDisplay(taglines[index]);
      timer.current = setTimeout(
        () => setIndex((s) => (s + 1) % taglines.length),
        3000
      );
      return;
    }

    const full = taglines[index];
    if (anim === "typing") {
      let i = 0;
      setDisplay("");
      setPhase("enter");
      function tick() {
        i++;
        setDisplay(full.slice(0, i));
        if (i >= full.length) {
          timer.current = setTimeout(() => {
            setPhase("exit");
            timer.current = setTimeout(() => {
              setIndex((s) => (s + 1) % taglines.length);
              setAnim(randAnim());
              setDisplay("");
              setPhase("enter");
            }, 420);
          }, holdFull);
          return;
        }
        timer.current = setTimeout(tick, typingCharMs);
      }
      timer.current = setTimeout(tick, 120);
      return;
    }

    setDisplay(full);
    setPhase("enter");
    timer.current = setTimeout(() => {
      setPhase("exit");
      timer.current = setTimeout(() => {
        setIndex((s) => (s + 1) % taglines.length);
        setAnim(randAnim());
        setPhase("enter");
      }, 420);
    }, slideHold);
  }, [index, anim, taglines, reduced]);

  const typingStyle = {
    transition: "opacity 550ms ease, transform 550ms ease",
    opacity: phase === "enter" ? 1 : 0,
    transform: phase === "enter" ? "translateY(0)" : "translateY(-4px)",
    display: "inline-block"
  };
  const slideStyle = {
    transition: "transform 550ms cubic-bezier(.2,.9,.2,1), opacity 550ms ease",
    transform: phase === "enter" ? "translateY(0)" : "translateY(-6px)",
    opacity: phase === "enter" ? 1 : 0,
    display: "inline-block"
  };
  const flipStyle = {
    transition: "transform 550ms cubic-bezier(.2,.9,.2,1), opacity 550ms ease",
    transformOrigin: "top",
    transform: phase === "enter" ? "rotateX(0deg)" : "rotateX(72deg)",
    opacity: phase === "enter" ? 1 : 0,
    display: "inline-block"
  };

  const combinedStyle =
    anim === "typing"
      ? { ...typingStyle, ...style }
      : anim === "slide"
      ? { ...slideStyle, ...style }
      : { ...flipStyle, ...style };

  return (
    <span
      aria-live="polite"
      className={className || "text-[color:var(--tf-text-muted)] font-medium text-sm sm:text-base leading-tight"}
      style={combinedStyle}
    >
      {display}
    </span>
  );
}

export default function Header() {
  const { isAuthenticated, user, startGoogleSignIn, signOut } = useAuth();
  const location = useLocation();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

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

  const alpha = 0.55 + scrollProgress * 0.4;
  const backgroundColor = isDark
    ? `rgba(15, 23, 42, ${alpha})`
    : `rgba(255, 255, 255, ${alpha})`;
  const scrolled = scrollProgress > 0.02;

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--tf-ring)] focus-visible:ring-offset-2 ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-[color:var(--tf-text)] hover:bg-white/40 hover:text-[color:var(--tf-text)]"
    }`;

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur transition-[background-color,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none ${
        scrolled
          ? "border-[color:var(--tf-border)] shadow-sm"
          : "border-transparent shadow-none"
      }`}
      style={{ backgroundColor }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow"
      >
        Skip to content
      </a>

      <div className="tf-container">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <img
                src={Logo}
                alt="TeachFlow LMS"
                className="h-10 w-10 shrink-0 rounded-xl object-contain bg-white/70 ring-1 ring-black/5 shadow-sm"
              />
              <div className="min-w-0">
                <div className="truncate text-base font-extrabold tracking-tight text-[color:var(--tf-text)] sm:text-lg">
                  TeachFlow
                </div>
                <div className="hidden sm:block truncate text-xs font-semibold text-[color:var(--tf-text-muted)] min-h-[16px] flex items-center">
                  <AnimatedTaglineInline className="text-[color:var(--tf-text-muted)] font-semibold text-xs leading-none" />
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--tf-text)] hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--tf-ring)] focus-visible:ring-offset-2"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <UserDropdown
              isAuthenticated={isAuthenticated}
              onSignIn={startGoogleSignIn}
              onSignOut={signOut}
              user={user}
            />
          </div>
        </div>

        <div className="border-t border-[color:var(--tf-border)]/70">
          <div className="hidden md:flex h-12 items-center justify-between gap-4">
            <nav aria-label="Primary" className="flex flex-1 items-center justify-center gap-2">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>


          </div>

          <div
            className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none ${
              mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <nav
              aria-label="Mobile primary"
              className={`grid gap-1 py-3 ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
            >
              {NAV_ITEMS.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--tf-ring)] focus-visible:ring-offset-2 ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-[color:var(--tf-text)] hover:bg-white/40"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
