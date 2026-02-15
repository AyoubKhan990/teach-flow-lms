import VideoItem from "./VideoItem";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Trash2 } from "lucide-react";

export default function PlaylistList({ playlists, onSelect, onRemove }) {
  if (!playlists || playlists.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          title="No playlists yet"
          description="Add a YouTube link above to start building your learning list."
        />
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {playlists.map((item) => {
        const key = item._id || item.playlistId || item.videoId;

        return (
          <Card
            key={key}
            className="group relative overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--tf-shadow-md)]"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(item);
              }}
              className="cursor-pointer outline-none"
              aria-label="Open item"
            >
              <VideoItem video={item} />
            </div>
            <Button
              variant="danger"
              className="absolute right-3 top-3 h-9 w-9 rounded-full px-0"
              onClick={() => onRemove(item)}
              aria-label="Remove"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
