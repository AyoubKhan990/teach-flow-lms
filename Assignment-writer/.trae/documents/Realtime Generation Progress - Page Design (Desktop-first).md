# Page Design Spec (Desktop-first): Real-time Generation Progress

## Global Styles (Design Tokens)
- Layout: 12-col grid (max-width 1200px), 24px gutters, 16–24px spacing scale.
- Typography: Inter/system; H1 28/32, H2 20/28, body 14/20, mono 12/18.
- Colors: Background #0B1220, Surface #111B2E, Border #22304D, Text #E7EEF9, Muted #A8B3C7.
- Accents: Primary #4F8CFF (hover #3B78F0), Success #2AC769, Warning #F7B84B, Error #FF5C6C.
- Buttons: Primary/Secondary/Ghost; disabled 40% opacity; focus ring 2px primary.
- States: Skeleton loading (shimmer), inline error callouts, toast notifications.

## Page 1: Start Generation (Home)
### Meta Information
- Title: “Generate Images”
- Description: “Start an image generation job and track it live.”
- Open Graph: title/description + default app image.

### Layout
- Centered container with two-column desktop layout: left form (8 cols), right tips + recent jobs (4 cols).

### Page Structure
1. Top nav: app name (left), “Docs” link (right).
2. Prompt card: textarea + helpers.
3. Options row: size, steps, style (compact controls).
4. CTA row: Primary “Generate”, secondary “Clear”.
5. Recent jobs (optional): list last 5 job links (if available client-side).

### Sections & Components
- Prompt textarea
  - Placeholder example prompts; character count; validation message.
- Options controls
  - Dropdown for size; numeric for steps; text/select for style.
- Generate button
  - On submit: disable, show spinner, then redirect to `/jobs/:jobId`.
- Inline errors
  - Invalid prompt; server unavailable.

## Page 2: Generation Progress
### Meta Information
- Title: “Generation Progress”
- Description: “Live status updates and results for your job.”
- Open Graph: job status + preview (if available).

### Layout
- Desktop split view: left (status + timeline, 5 cols), right (preview/result, 7 cols).
- Sticky header for job summary + connection mode.

### Page Structure
1. Header bar
   - Job ID (short), status pill, attempt counter (e.g., “Attempt 1/3”), transport mode chip (WS/SSE/Poll).
   - Actions: Reconnect, Switch to Polling, Cancel.
2. Left column: Progress Timeline
   - Vertical stepper + event log table.
3. Right column: Preview / Result Panel
   - Large image area; below: thumbnails (if multiple), download/open/copy URL.
4. Footer: Support details
   - “Copy debug info” (last event seq, mode, timestamps) for reporting.

### Sections & Components
- Status pill
  - Values: Queued/Running/Uploading/Completed/Failed/Cancelled.
- Transport mode chip
  - Shows current mode; hover tooltip: “WS preferred; auto fallback enabled.”
- Progress timeline
  - Steps: Queued → Running → Uploading → Completed.
  - Each event row: time, stage, message, percent, preview icon.
- Preview panel
  - States:
    - No preview yet: skeleton with “Waiting for first preview…”
    - Preview streaming: image updates with subtle crossfade.
    - Completed: final image(s) + download.
- Retry controls (only when failed)
  - Primary: “Retry generation” (same prompt/settings).
  - Secondary: “Edit prompt & restart” (returns to Home with prefilled values).
  - Show reason + whether retryable.
- Cancel flow
  - Confirm dialog; after cancel: lock UI, show “Cancelled” banner.

### UI States (must be explicit)
- Initial loading: fetching job snapshot; skeletons.
- Connecting: “Connecting…” with mode preference (WS first).
- Live streaming: events append; last-updated indicator.
- Degraded mode: banner “Live updates unavailable, using polling every N seconds.”
- Reconnecting: exponential backoff counter + manual “Reconnect now.”
- Completed: success banner, results visible, actions enabled.
- Failed (retryable): error banner + retry options.
- Failed (non-retryable): guidance to change prompt/settings; disable retry.
- Cancelled: neutral banner; show last known progress.

### Error Handling (copy + behavior)
- Network disconnected
  - Copy: “Connection lost. Switching to polling.”
  - Behavior: auto fallback; keep last preview; show reconnect.
- Stream blocked/unavailable
  - Copy: “Real-time stream unavailable in this network.”
  - Behavior: offer “Switch to polling” and “Try SSE/WS again.”
- Provider rate limit/timeout
  - Copy: “Generation is throttled or timed out. You can retry.”
  - Behavior: enable retry; show attempt count; suggest waiting.
- Invalid prompt/provider rejection
  - Copy: “Your prompt was rejected. Please edit and retry.”
  - Behavior: disable retry; provide “Edit prompt & restart.”

### Interaction Notes
- Polling cadence: start at 2s, backoff to 10–15s; reset to 2s on new events.
- Accessibility: live region announces status changes; timeline keyboard navigable.
- Animations: 150–200ms fades for preview updates; no motion on reduced-motion.
