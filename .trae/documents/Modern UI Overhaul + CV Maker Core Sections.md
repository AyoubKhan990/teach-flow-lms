## Current State (What Exists Today)
- Styling is Tailwind-first with global CSS variables in [index.css](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/frontend/src/index.css) and a small in-house UI primitives set in [components/ui](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/frontend/src/components/ui).
- CV Maker is mounted at `/cv-maker`, but the module only has **Templates** + **Editor**; **My Resumes / Profile / Settings** are placeholders and there is **no resume persistence** (no backend model or API).
- Backend uses **Google OAuth + session cookies**; `/api/user/profile` currently only updates `{name, accountType}` and there are **no** settings/resume endpoints.

## Goal
- Deliver a cohesive, modern, professional UI across the whole app (typography, palette, spacing, layout, iconography, motion) with WCAG 2.1 AA accessibility and full responsiveness.
- Fully implement CV Maker’s **My Resumes**, **Profile**, **Settings** as real features backed by MongoDB, with robust loading/error states, validations, and smooth interactions.

## Phase 1 — Design System Foundation (Global)
1. **Tokens (single source of truth)**
   - Expand the existing `--tf-*` CSS variables into a complete token set: semantic colors (bg/surface/text/border/primary/success/warn/danger), elevation/shadows, radii, focus ring, and spacing scale based on an 8px grid.
   - Add explicit theme support: `light / dark / auto` using `data-theme` on `html` (auto follows `prefers-color-scheme`).
2. **Typography + layout scale**
   - Establish a typographic scale (h1–h6, body, caption) and consistent line heights.
   - Standardize containers/section spacing: keep `.tf-container` but define a consistent section rhythm (padding/margins) across all pages.
3. **Component library completion (maintainable + accessible)**
   - Extend `src/components/ui/` with missing primitives needed for the redesign and CV module: Input (text/textarea), Select, Checkbox/Switch, Radio, Tabs, Modal/Dialog, Dropdown/Menu, Tooltip, Avatar, Pagination/InfiniteScroll hook, Skeleton, EmptyState, DataTable/List.
   - Ensure keyboard navigation and visible focus states everywhere (using existing ring tokens).
4. **Motion system**
   - Define standard transitions (durations/easings) and use reduced-motion fallbacks.

## Phase 2 — App-Wide UI Overhaul
1. **Unify page layouts**
   - Apply the design system to Header/Footer + main layouts so all routes share the same spacing, typography, and surfaces.
2. **Refactor key screens to new components**
   - Update high-traffic pages (Home, Feed, Playlist, Player, Dashboard, Learning, Profile) to the new component library.
   - Replace ad-hoc Tailwind class clusters with reusable UI components where it improves consistency.
3. **Cross-browser + responsiveness**
   - Validate at breakpoints 320/768/1024+ and ensure Safari/Edge-safe CSS patterns.

## Phase 3 — Backend: Persist “Resumes”, “Profile”, and “Settings” in MongoDB
1. **New Mongoose models**
   - `Resume` collection: `{ userId, title, templateId, status(draft/completed), data(CV JSON), createdAt, updatedAt }`.
   - Expand `User` model with `profile` + `settings` subdocuments for:
     - Profile fields (name, email, phone, location, title, summary, socials, visibility)
     - Settings (theme, language, notifications, privacy, export prefs)
2. **New/expanded API routes (session-auth protected)**
   - Profile: `GET/PUT /api/user/profile` (expand beyond name/accountType)
   - Settings: `GET/PUT /api/user/settings`
   - Resumes:
     - `GET /api/resumes` (pagination + search + filters + sort)
     - `POST /api/resumes` (create)
     - `GET/PUT/DELETE /api/resumes/:id`
     - `POST /api/resumes/bulk` (bulk delete/duplicate)
3. **Security requirements mapping**
   - Active sessions management: store `userId` on session records and add endpoints to list/revoke sessions.
   - Password change + 2FA:
     - If account is Google-only, add a “Set password” flow (local credential attached to the same user) so password change is meaningful.
     - Implement TOTP 2FA (QR setup + verify + recovery codes) as an optional security feature.
4. **Account actions**
   - Deactivation + permanent deletion endpoints that also remove dependent data (playlists, resumes, etc.).

## Phase 4 — CV Maker Frontend: Fully Implement the 3 Core Sections
1. **My Resumes Dashboard (full feature set)**
   - Grid/list view toggle with transitions.
   - Real-time debounced search (min 3 chars), filter by created/modified date and status, multi-sort.
   - Bulk selection with delete/duplicate.
   - Empty states + guided onboarding (dismissible tips stored in settings).
   - Pagination or infinite scroll backed by server pagination.
   - Resume cards show: thumbnail preview, created/updated dates, quick edit, duplicate, delete.
2. **Profile Management (CV-aware + app-wide sync)**
   - Fields: name/email/phone/location/title, summary (500 words, counter), social links with URL validation.
   - Profile picture: drag/drop upload + crop (1:1) + file validation (<=5MB, JPEG/PNG). Persist to DB and reflect across app.
   - Auto-save every 30s with visible status, plus manual save.
   - Privacy controls for profile visibility.
3. **Settings Panel**
   - Theme (light/dark/auto), language (≥5), notifications (email/push/in-app), privacy/GDPR toggles.
   - Data export (PDF/JSON/XML) + download all data.
   - Security (password/2FA/sessions) + account deactivation/deletion with confirmation flows.
   - Toast notifications for success/failure and immediate application of preferences.

## Phase 5 — Quality Bar (Accessibility, Error Handling, Performance)
- WCAG 2.1 AA: semantic structure, ARIA where needed, focus management for dialogs/menus, skip links, contrast checks.
- Loading: skeletons for all async areas (dashboards, lists, profile/settings saves).
- Error handling: consistent friendly errors + retry actions.
- Performance: route-level code splitting for CV Maker + heavy pages, image optimization for thumbnails, server pagination.
- Verification: lint + manual test matrix across breakpoints and keyboard-only navigation.

## Deliverables (What You’ll See)
- A cohesive global design system implemented in code (tokens + components) and applied across the app.
- CV Maker: working **My Resumes**, **Profile**, **Settings** backed by MongoDB with autosave, filters/search, bulk actions, and security/account flows.

If you confirm this plan, I will start by implementing Phase 1–3 (tokens + component primitives + backend models/routes), then complete Phase 4 (CV Maker screens) and finally refactor the remaining pages to the new system.