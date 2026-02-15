// frontend/src/pages/Playlist/Playlist.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AddPlaylistForm from "./AddPlaylistForm";
import PlaylistList from "./PlaylistList";
import { useAuth } from "../../hooks/useAuth";
import { PageHeader } from "../../components/ui/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Spinner } from "../../components/ui/Spinner";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export default function Playlist() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { isAuthenticated, loading: authLoading, startGoogleSignIn } =
    useAuth();

  const fetchMyPlaylists = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/playlists`, {
        credentials: "include",
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server did not return JSON! Check backend.");
      }
      if (!res.ok) throw new Error(data.message || "Failed to fetch playlists");
      setPlaylists(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startGoogleSignIn]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      startGoogleSignIn();
      return;
    }
    fetchMyPlaylists();
  }, [authLoading, isAuthenticated, startGoogleSignIn, fetchMyPlaylists]);

  const handleAdd = async ({ videoId, playlistId }) => {
    setError("");
    setLoading(true);

    const body = { videoId, playlistId };

    try {
      const res = await fetch(`${BASE_URL}/api/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      let newPlaylist;
      try {
        newPlaylist = await res.json();
      } catch {
        throw new Error("Server did not return JSON! Check backend.");
      }
      if (!res.ok)
        throw new Error(newPlaylist.message || "Failed to add playlist/video");
      setPlaylists((prev) => [...prev, newPlaylist]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to remove this item?"))
      return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/playlists/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        startGoogleSignIn();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove playlist");
      }
      setPlaylists((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    const entryId = item?._id;
    const firstVideoId =
      item?.videos?.[0]?.videoId ||
      (item?.isSingleVideo ? item?.playlistId : null);

    if (item?.isSingleVideo && firstVideoId) {
      navigate(`/player/${firstVideoId}`, {
        state: {
          video: {
            videoId: firstVideoId,
            title: item?.videos?.[0]?.title || item?.title || "YouTube Video",
            thumbnailUrl: `https://img.youtube.com/vi/${firstVideoId}/hqdefault.jpg`,
          },
        },
      });
      return;
    }

    if (entryId) {
      navigate(`/playlist/${entryId}`);
      return;
    }

    if (firstVideoId) {
      navigate(`/player/${firstVideoId}`);
      return;
    }
  };

  if (authLoading) {
    return (
      <div className="tf-container py-10">
        <div className="flex items-center justify-center gap-3 text-[color:var(--tf-text-muted)]">
          <Spinner />
          <span className="text-sm font-semibold">Checking login…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tf-container py-8">
      <PageHeader
        title="Your Playlists"
        subtitle="Save videos or playlists and continue learning where you left off."
      />

      <AddPlaylistForm onAdd={handleAdd} />

      {loading ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-[color:var(--tf-text-muted)]">
          <Spinner />
          <span className="text-sm font-semibold">Loading…</span>
        </div>
      ) : null}

      {error ? <Alert className="mt-4" variant="danger" title="Couldn’t load playlists">{error}</Alert> : null}

      <PlaylistList
        playlists={playlists}
        onSelect={handleSelect}
        onRemove={(item) => handleRemove(item?._id)}
      />
    </div>
  );
}
