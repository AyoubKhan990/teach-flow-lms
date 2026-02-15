# TeachFlow LMS Style Guide

## Color Palette
- Background: `--tf-bg` (#f8fafc)
- Surface: `--tf-surface` (#ffffff)
- Surface Muted: `--tf-surface-muted` (rgba(255, 255, 255, 0.8))
- Text Primary: `--tf-text` (#0f172a)
- Text Muted: `--tf-text-muted` (#475569)
- Border: `--tf-border` (rgba(15, 23, 42, 0.12))
- Primary: `--tf-primary` (#2563eb)
- Primary Hover: `--tf-primary-600` (#1d4ed8)
- Focus Ring: `--tf-ring` (rgba(37, 99, 235, 0.35))

## Typography Scale
- Display: `clamp(2.25rem, 6vw, 5.25rem)`
- H2: `clamp(1.75rem, 4vw, 3rem)`
- Body Large: `clamp(1rem, 2.2vw, 1.25rem)`
- Body Base: `1rem`
- Body Small: `0.875rem`
- Labels: `0.75rem`

## Spacing Scale
- XS: 8px
- SM: 12px
- MD: 16px
- LG: 24px
- XL: 32px
- 2XL: 48px
- 3XL: 64px

## Layout
- Container max width: 1440px
- Container padding: `clamp(16px, 4vw, 40px)`
- Section padding: `py-16` (mobile), `py-20` (tablet), `py-24` (desktop)

## Components
- Cards: `bg-[color:var(--tf-surface)]`, `border-[color:var(--tf-border)]`, rounded `24px`
- Buttons: min height `44px`, use `--tf-primary` and `--tf-primary-600`
- Focus states: `outline` or `ring` using `--tf-ring`

## Header & Navigation
- Sticky: `sticky top-0 z-40` with backdrop blur and scroll-based background alpha
- Breakpoints:
  - Base (≥320px): brand + user menu, hamburger nav
  - `md` (≥768px): inline primary navigation row
  - `lg` (≥1024px): desktop spacing rules apply; primary nav stays visible
  - `xl` (≥1280px): show animated tagline in the header nav row
- Width: use `.tf-container` (max width 1440px) for consistent alignment
