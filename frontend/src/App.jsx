// frontend/src/App.jsx
import React, { Suspense, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import CoreLayout from "./layouts/CoreLayout";
import ToolLayout from "./layouts/ToolLayout";
import { ToastProvider } from "./components/ui/Toast";

const BASE_URL = import.meta.env.VITE_API_URL || "";

const Home = React.lazy(() => import("./pages/Home/Home"));
const Feed = React.lazy(() => import("./pages/Feed/Feed"));
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const Playlist = React.lazy(() => import("./pages/Playlist/Playlist"));
const PlaylistView = React.lazy(() => import("./pages/Playlist/PlaylistView"));
const VideoPlayer = React.lazy(() => import("./pages/Playlist/VideoPlayer"));
const Player = React.lazy(() => import("./pages/VideoPlayer/Player"));
const Learning = React.lazy(() => import("./pages/MyLearning/Learning"));
const Profile = React.lazy(() => import("./pages/Profile/Profile"));
const Contact = React.lazy(() => import("./pages/Contact/Contact"));
const About = React.lazy(() => import("./pages/About/About"));
const CvMaker = React.lazy(() => import("./pages/CvMaker/CvMaker"));

const AssignmentWriterLayout = React.lazy(() =>
  import("./assignmentWriter/AssignmentWriterLayout")
);
const AssignmentWriterHome = React.lazy(() => import("./assignmentWriter/pages/Home"));
const AssignmentWriterForm = React.lazy(() => import("./assignmentWriter/pages/Form"));
const AssignmentWriterJobProgress = React.lazy(() =>
  import("./assignmentWriter/pages/JobProgress")
);
const AssignmentWriterResult = React.lazy(() => import("./assignmentWriter/pages/Result"));

function AppFallback() {
  return (
    <div className="min-h-[40vh] w-full bg-[color:var(--tf-bg)]">
      <div className="tf-container flex min-h-[40vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--tf-border)] bg-[color:var(--tf-surface)] px-5 py-3 text-sm font-semibold text-[color:var(--tf-text-muted)] shadow-[var(--tf-shadow-sm)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--tf-border)] border-t-[color:var(--tf-primary)]" />
          Loading…
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Handle post-login redirect
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = sessionStorage.getItem("afterAuthRedirect");
      if (redirectPath) {
        sessionStorage.removeItem("afterAuthRedirect");
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, navigate]);

  // Global App Tracking: Track app open time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${BASE_URL}/api/user/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appOpenTime: 60 }),
        credentials: "include",
      }).catch(() => {}); // Fail silently if not logged in
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ToastProvider>
      <Suspense fallback={<AppFallback />}>
        <Routes>
          <Route element={<CoreLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/playlist/:id" element={<PlaylistView />} />
            <Route path="/video/:id" element={<VideoPlayer />} />
            <Route path="/player/:id" element={<Player />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
          </Route>

          <Route element={<ToolLayout />}>
            <Route path="/cv-maker" element={<CvMaker />} />
            <Route path="/assignment-writer" element={<AssignmentWriterLayout />}>
              <Route index element={<AssignmentWriterHome />} />
              <Route path="form" element={<AssignmentWriterForm />} />
              <Route path="jobs/:jobId" element={<AssignmentWriterJobProgress />} />
              <Route path="result" element={<AssignmentWriterResult />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}
