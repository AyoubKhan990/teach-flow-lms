/* eslint-disable no-unused-vars */
// frontend/src/pages/Home/Home.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  FileText,
  BrainCircuit,
  ArrowRight,
  Clipboard,
  X,
  Youtube,
  Sparkles,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const BASE_URL = import.meta.env.VITE_API_URL || "";
const AUTH_ROUTE = "/profile";

function isYouTubeUrl(value) {
  if (!value) return false;
  const trimmed = value.trim();
  return /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/playlist\?list=)/i.test(
    trimmed
  );
}

// 3D Card Component (Light Theme)
const FeatureCard = ({ icon: Icon, title, desc, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10, rotateX: 5, rotateY: 5 }}
      className="group relative p-6 sm:p-8 rounded-3xl bg-[color:var(--tf-surface)] border border-[color:var(--tf-border)] shadow-[var(--tf-shadow-md)] hover:shadow-2xl transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-teal-50/80 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-[color:var(--tf-text)] mb-3">
          {title}
        </h3>
        <p className="text-[color:var(--tf-text-muted)] leading-relaxed">
          {desc}
        </p>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();
  const abortRef = useRef(null);
  const { scrollY } = useScroll();

  // Parallax effects
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (e) {
      console.warn("Clipboard unavailable", e);
    }
  };

  const handleAddAndGo = useCallback(
    async (e) => {
      if (e && e.preventDefault) e.preventDefault();
      setErr("");
      setInfo("");

      if (!url?.trim()) {
        setErr("Please paste a YouTube video or playlist URL.");
        return;
      }

      const trimmed = url.trim();
      if (!isYouTubeUrl(trimmed)) {
        setErr("Please paste a valid YouTube video or playlist URL.");
        return;
      }

      setLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${BASE_URL}/api/playlists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url: trimmed }),
          signal: controller.signal,
        });

        if (res.status === 401) {
          try {
            sessionStorage.setItem(
              "afterAuthRedirect",
              JSON.stringify({ type: "player", url: trimmed })
            );
          } catch (e) {
            console.warn("Could not save pending redirect", e);
          }

          navigate(AUTH_ROUTE, {
            replace: true,
            state: { redirectTo: "/player" },
          });
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        let data = {};
        if (contentType.includes("application/json")) {
          data = await res.json();
        }

        if (!res.ok) {
          throw new Error(
            data.message || `Server responded with ${res.status}`
          );
        }

        const id = data._id ?? data.id ?? data.playlistId;
        if (!id) throw new Error("Server did not return a valid resource id.");

        navigate(`/player/${id}`);
      } catch (err) {
        if (err.name === "AbortError") return;
        setErr(err.message || "Failed to add playlist.");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [url, navigate]
  );

  return (
    <div className="min-h-screen bg-[color:var(--tf-bg)] text-[color:var(--tf-text)] selection:bg-blue-100/70 overflow-x-hidden font-sans">
      {/* Background Gradients (Light) */}
      <Helmet>
        <title>TeachFlow LMS - Transform Video Into Knowledge</title>
        <meta
          name="description"
          content="Turn any YouTube video into an interactive learning experience with transcripts, summaries, and quizzes."
        />
        <link rel="canonical" href="https://learnstream.netlify.app/" />
      </Helmet>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[min(70vw,520px)] h-[min(70vw,520px)] bg-blue-200/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[min(70vw,520px)] h-[min(70vw,520px)] bg-teal-200/30 rounded-full blur-[140px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pt-28 lg:pb-28">
        <div className="tf-container text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-blue-100 shadow-sm mb-6 sm:mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-600">
                AI-Powered Learning Assistant
              </span>
            </div>

            <h1 className="text-[clamp(2.25rem,6vw,5.25rem)] font-bold tracking-tight mb-6 sm:mb-8 leading-tight text-[color:var(--tf-text)]">
              Transform Video <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-600">
                Into Knowledge
              </span>
            </h1>

            <p className="text-[clamp(1rem,2.2vw,1.25rem)] text-[color:var(--tf-text-muted)] mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop watching passively. Turn any YouTube video into an
              interactive learning experience with
              <span className="text-blue-600 font-semibold">
                {" "}
                transcripts
              </span>
              ,<span className="text-teal-600 font-semibold"> summaries</span>
              , and
              <span className="text-cyan-600 font-semibold"> quizzes</span>.
            </p>
          </motion.div>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-2xl mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
            <form
              onSubmit={handleAddAndGo}
              aria-label="Add a YouTube video or playlist"
              className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl p-2 shadow-xl border border-gray-100 gap-2 sm:gap-0"
            >
              <div className="flex-1 flex items-center w-full">
                <div className="pl-2 sm:pl-4 text-gray-400">
                  <Youtube className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube URL..."
                  aria-label="YouTube video or playlist URL"
                  className="flex-1 bg-transparent border-none text-[color:var(--tf-text)] placeholder:text-gray-400 focus:ring-0 px-3 sm:px-4 py-3 text-base sm:text-lg w-full min-w-0"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl("")}
                    aria-label="Clear URL"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 w-full sm:w-auto min-h-[48px]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <span>Start</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Helper Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-[color:var(--tf-text-muted)]"
          >
            <button
              onClick={handlePaste}
              aria-label="Paste from clipboard"
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <Clipboard className="w-4 h-4" />
              Paste from clipboard
            </button>
            <span>•</span>
            <button
              onClick={() =>
                setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
              }
              aria-label="Use sample video URL"
              className="hover:text-teal-600 transition-colors"
            >
              Try sample video
            </button>
          </motion.div>

          {/* Error/Info Messages */}
          <div className="mt-6 h-6">
            {err && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 font-medium"
              >
                {err}
              </motion.p>
            )}
          </div>
        </div>

        {/* 3D Floating Elements (Light Theme) */}
        <motion.div
          style={{ y: y1 }}
          className="absolute top-1/4 left-10 lg:left-20 hidden lg:block opacity-40 pointer-events-none"
        >
          <FileText className="w-32 h-32 text-blue-300 rotate-12" />
        </motion.div>
        <motion.div
          style={{ y: y2 }}
          className="absolute top-1/3 right-10 lg:right-20 hidden lg:block opacity-40 pointer-events-none"
        >
          <BrainCircuit className="w-40 h-40 text-teal-300 -rotate-12" />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20 lg:py-24 relative z-10" id="features">
        <div className="tf-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold mb-4 sm:mb-6 text-[color:var(--tf-text)]">
              Everything you need to <br />
              master any topic
            </h2>
            <p className="text-[color:var(--tf-text-muted)] max-w-2xl mx-auto text-base sm:text-lg">
              Our AI analyzes the video content to provide you with
              comprehensive learning tools instantly.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Play}
              title="Distraction Free"
              desc="Watch videos in a clean, focused environment designed purely for learning, with no sidebar distractions."
              delay={0}
            />
            <FeatureCard
              icon={FileText}
              title="Smart Transcripts"
              desc="Get accurate, time-synced transcripts. Search through the video content like a document."
              delay={0.2}
            />
            <FeatureCard
              icon={BrainCircuit}
              title="AI Quizzes"
              desc="Test your knowledge immediately with AI-generated quizzes based on the video's key concepts."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 relative z-10" id="tools">
        <div className="tf-container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold mb-4 text-[color:var(--tf-text)]">
              Work smarter with AI-powered tools
            </h2>
            <p className="text-[color:var(--tf-text-muted)] max-w-2xl mx-auto text-base sm:text-lg">
              Build standout resumes and generate polished assignments with guided workflows tailored for students.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative overflow-hidden rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-6 sm:p-8 shadow-[var(--tf-shadow-md)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-[color:var(--tf-text)]">
                      CV Maker
                    </div>
                    <div className="text-sm text-[color:var(--tf-text-muted)]">
                      Build a resume that stands out in minutes.
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-[color:var(--tf-text-muted)] leading-relaxed">
                  Choose modern templates, tailor sections fast, and export a clean, recruiter-friendly CV with zero
                  formatting hassle.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/cv-maker"
                    aria-label="Start building your CV"
                    className="inline-flex items-center justify-center rounded-xl bg-[color:var(--tf-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--tf-primary-600)] transition-colors min-h-[44px]"
                  >
                    Start CV Maker
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <div className="text-xs sm:text-sm text-[color:var(--tf-text-muted)] flex items-center">
                    Polished templates • One-click export
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] p-6 sm:p-8 shadow-[var(--tf-shadow-md)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/70 to-cyan-50/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-[color:var(--tf-text)]">
                      Assignment Writer
                    </div>
                    <div className="text-sm text-[color:var(--tf-text-muted)]">
                      Generate clean drafts with structure and citations.
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-[color:var(--tf-text-muted)] leading-relaxed">
                  Turn prompts into well-organized assignments with clear sections, editable outputs, and quick
                  iteration.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/assignment-writer"
                    aria-label="Open the Assignment Writer"
                    className="inline-flex items-center justify-center rounded-xl bg-[color:var(--tf-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--tf-primary-600)] transition-colors min-h-[44px]"
                  >
                    Start Assignment Writer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <div className="text-xs sm:text-sm text-[color:var(--tf-text-muted)] flex items-center">
                    Structured output • Fast regeneration
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Footer removed - using global footer */}
    </div>
  );
}
