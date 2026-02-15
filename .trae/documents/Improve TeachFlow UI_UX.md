## Goals
- Make the whole app feel consistent (colors, typography, spacing, components).
- Improve usability (clear hierarchy, better empty/loading/error states, smoother forms).
- Keep functionality unchanged; focus on presentation, accessibility, and responsiveness.

## Current UI Findings (What’s Causing Inconsistency)
- Mixed styling approaches: core pages use raw Tailwind utilities, Assignment Writer uses CSS variables + its own component set, CV Maker uses separate CSS variables/CSS modules.
- One global shell (Header/Navbar/Footer) wraps everything, even “tool-like” sections (Assignment Writer/CV Maker), creating visual clashes.

## Plan
### 1) Establish a Single Design System
- Add a centralized token strategy (either Tailwind theme config or global CSS variables) to unify:
  - Primary/secondary colors, neutrals, borders
  - Typography scale (headings/body)
  - Radii, shadows, spacing
- Pick one icon style (already `lucide-react`) and standardize usage.

### 2) Create Shared UI Primitives (Reusable Components)
- Create/standardize shared primitives used across the whole app:
  - Button, Card, Input/Select/TextArea, Badge, Alert, Modal/Drawer, Toast
  - Loading states (Skeleton), EmptyState
- Migrate existing pages gradually to these primitives.

### 3) Route-Based Layouts (Reduce Visual Clashes)
- Introduce per-section layouts:
  - **Core layout**: Header/Navbar/Footer for main app pages.
  - **Tools layout**: Dedicated layouts for `/assignment-writer/*` and possibly `/cv-maker/*` (optional: keep Navbar but remove extra header/footer, unify background).

### 4) Page-Level UI Improvements (Highest Impact First)
- Playlist + Feed: consistent page headers, filters/search styling, cards, placeholders, and empty states.
- Video Player: consistent panel styling (transcript/summary/quiz), better error banners, improved spacing.
- Profile/Auth flows: remove jarring reload behavior, consistent form feedback and toasts.
- Dashboard: consistent cards/charts spacing and responsive layout.

### 5) Accessibility + Responsiveness
- Ensure:
  - Focus states on interactive elements
  - Better contrast (high-contrast friendly colors)
  - Keyboard navigation for menus/modals
  - Reduced-motion behavior consistency
  - Mobile navbar/menu usability and spacing

### 6) Verification
- Visual check at common breakpoints: 360px, 768px, 1024px, 1440px.
- Validate: no layout overlap with header/nav, consistent spacing, readable contrast.
- Smoke test key flows: login, playlist→player, transcript fetch UI, CV Maker export, Assignment Writer flow.
- Run `npm run lint` + `npm run build` for frontend.

## Deliverables
- A unified UI theme across core app + tools.
- Shared reusable UI components.
- Improved page layouts, states, and accessibility.

## Confirmation Needed (One Choice)
- Choose the approach to unify the UI:
  - **Option A (Recommended):** Global CSS variables + Tailwind utilities (lightweight, fits current code).
  - **Option B:** Add a Tailwind config theme (more structured if you want a full palette/scale).

Once you confirm Option A or B, I’ll implement the changes starting with layout + shared primitives, then migrate key pages.