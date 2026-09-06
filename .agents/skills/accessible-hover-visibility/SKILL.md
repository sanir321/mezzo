---
name: accessible-hover-visibility
description: >-
  Use this skill when developing UI components, styling buttons, links, tables, cards,
  or interactive elements in Svelte, CSS, SCSS, or Tailwind to prevent zero-contrast,
  invisible text, or destructive global hover overrides.
---

# Accessible High-Contrast Hover & Interactive Styling Guidelines

This skill enforces strict UI/UX contrast and visibility rules across all components and pages.

## Core Rules & Invariants

### 1. Zero-Contrast & Inverted Hover Prevention
- **Never allow text or icons to become dark on dark backgrounds** (e.g. `#0f0f0f` on `#121212` or `#181818`).
- **Never allow white text on white/light backgrounds** without explicit background contrast.
- On hover, interactive text must either brighten (e.g. `#b3b3b3` -> `#ffffff`) or adopt high-contrast accent colors (e.g. Spotify Green `#1ed760`, Brand Indigo `#818cf8`).

### 2. No Destructive Global Tag Styling
- **Do not apply global `!important` color/background rules** to generic tags (`button`, `a`, `input`) in global stylesheets (e.g. SCSS/CSS).
- Generic tags must inherit typography and allow component-level CSS to control their appearance cleanly.

### 3. Progressive Visibility for Action Controls
- Do not make icon buttons completely invisible (`opacity: 0`) in resting states if users need them for accessibility; provide a baseline subtle opacity (`opacity: 0.4` - `0.5`) that elevates to `opacity: 1` with crisp white/accent colors on hover.
- Ensure focus and active states maintain a minimum 4.5:1 contrast ratio against the surrounding background.

### 4. Color Palette Standard for Dark Themes
- **Primary Text**: `#ffffff`
- **Muted / Subtitle Text**: `#a7a7a7` to `#b3b3b3`
- **Hover Highlights**: `#ffffff` (text/icons), `rgba(255, 255, 255, 0.1)` to `rgba(255, 255, 255, 0.2)` (card backgrounds)
- **Active / Accent**: `#1ed760` (Spotify Green) / `#6366f1` / `#818cf8`
- **Danger**: `#f87171` (text), `rgba(239, 68, 68, 0.15)` (hover background)

## Verification Checklist
1. Inspect all `:hover`, `:focus`, and `:active` CSS states in Svelte components.
2. Verify text remains readable under both dark and light modes.
3. Test hover transitions on buttons, navigation tabs, cards, dropdowns, and track rows.
