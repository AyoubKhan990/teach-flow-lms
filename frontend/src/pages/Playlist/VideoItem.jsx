// frontend/src/pages/Playlist/VideoItem.jsx
export default function VideoItem({ video }) {
  if (
    !video ||
    !video.title ||
    /^private video$/i.test(video.title) ||
    /^deleted video$/i.test(video.title)
  ) {
    return null; // skip invalid entries
  }

  const getThumbnailUrl = () => {
    const placeholder =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#e2e8f0"/><stop offset="1" stop-color="#c7d2fe"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="40" y="60" width="560" height="240" rx="18" fill="rgba(255,255,255,0.65)"/><circle cx="320" cy="180" r="46" fill="rgba(15,23,42,0.12)"/><path d="M308 160l38 20-38 20z" fill="rgba(15,23,42,0.35)"/></svg>`
      );

    // Single video entries: actual video lives in videos[0]
    if (video.isSingleVideo && video.videos?.[0]?.videoId) {
      return `https://img.youtube.com/vi/${video.videos[0].videoId}/hqdefault.jpg`;
    }

    // Playlist: use first item's thumbnail
    if (!video.isSingleVideo && video.videos?.length > 0) {
      return `https://img.youtube.com/vi/${video.videos[0].videoId}/hqdefault.jpg`;
    }

    return placeholder;
  };

  const getDisplayInfo = () => {
    if (video.isSingleVideo) {
      const v = video.videos?.[0];
      return {
        duration: v?.duration || null,
        isPlaylist: false,
      };
    }

    if (!video.isSingleVideo && video.videos?.length > 0) {
      return {
        duration: video.totalRuntime || "0m",
        isPlaylist: true,
        count: video.videos.length,
      };
    }

    return { duration: null, isPlaylist: false };
  };

  const thumbnail = getThumbnailUrl();
  const title = video.title || "Untitled";
  const displayInfo = getDisplayInfo();

  return (
    <div className="relative group">
      <div className="relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-44 object-cover rounded-[var(--tf-radius-sm)] mb-3 shadow-[var(--tf-shadow-sm)]"
          onError={(e) => {
            if (e.currentTarget.src.includes("hqdefault")) {
              e.currentTarget.src = e.currentTarget.src.replace(
                "hqdefault",
                "mqdefault"
              );
            } else if (e.currentTarget.src.includes("mqdefault")) {
              e.currentTarget.src = getThumbnailUrl();
            }
          }}
        />

        {/* Duration overlay (single videos only) */}
        {displayInfo.duration && !displayInfo.isPlaylist && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {displayInfo.duration}
          </div>
        )}

        {/* Playlist badge (count) */}
        {displayInfo.isPlaylist && displayInfo.count > 0 && (
          <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-white/70" />
            {displayInfo.count}
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-base font-semibold text-[color:var(--tf-text)] truncate"
        title={title}
      >
        {title}
      </h3>

      {/* Playlist extra info */}
      {displayInfo.isPlaylist && (
        <p className="text-xs text-[color:var(--tf-text-muted)] mt-1">
          {displayInfo.count || 0} videos • {displayInfo.duration || "0m"} total
        </p>
      )}
    </div>
  );
}
