// frontend/src/pages/Playlist/AddPlaylistForm.jsx
import { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function AddPlaylistForm({ onAdd }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const extractIds = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === "youtu.be" && urlObj.pathname.length > 1) {
        return { videoId: urlObj.pathname.slice(1) };
      } else if (["www.youtube.com", "youtube.com"].includes(urlObj.hostname)) {
        const v = urlObj.searchParams.get("v");
        const list = urlObj.searchParams.get("list");
        if (list && v) return { videoId: v, playlistId: list };
        if (list) return { playlistId: list };
        if (v) return { videoId: v };
      }
      return {};
    } catch {
      return {};
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const { videoId, playlistId } = extractIds(input);

    if (!videoId && !playlistId) {
      setError("Please enter a valid YouTube video or playlist link.");
      return;
    }
    onAdd({ videoId, playlistId });
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="w-full sm:flex-1">
        <Input
          id="playlistUrl"
          label="Add YouTube video or playlist link"
          placeholder="Paste a YouTube video or playlist URL"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          error={error}
          required
        />
      </div>
      <Button type="submit" className="h-11 self-start sm:self-auto">
        Add
      </Button>
    </form>
  );
}
