// frontend/src/pages/Feed/ErrorMessage.jsx
export default function ErrorMessage({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-[color:var(--tf-bg)] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="text-6xl mb-4">⚠️</div>

        <h2 className="text-2xl font-extrabold text-[color:var(--tf-text)] mb-2">
          Oops! Something went wrong
        </h2>

        <p className="text-[color:var(--tf-text-muted)] mb-6">
          {error || "We couldn't load your video feed. Please try again."}
        </p>

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Try Again
          </button>

          <button
            onClick={() => (window.location.href = "/playlist")}
            className="w-full px-6 py-3 bg-[color:var(--tf-surface)] text-[color:var(--tf-text)] border border-[color:var(--tf-border)] rounded-lg hover:bg-[color:var(--tf-surface-muted)] transition-colors font-semibold"
          >
            Go to Playlists
          </button>
        </div>
      </div>
    </div>
  );
}
