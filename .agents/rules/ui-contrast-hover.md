# UI Contrast & Hover Visibility Rule

Always enforce high-contrast, accessible hover and interactive styles across all Svelte, CSS, and HTML components:

1. **No Zero Visibility on Hover**: Text and icons must never become dark on dark backgrounds or light on light backgrounds.
2. **No Global Button/Link Tag Overrides**: Never apply global `!important` text colors to raw `button` or `a` elements that override component-scoped designs.
3. **Contrast Compliance**: Muted text (`#b3b3b3` / `#a7a7a7`) must brighten to pure `#ffffff` on hover. Accents must use high-visibility tones (`#1ed760`, `#818cf8`).
