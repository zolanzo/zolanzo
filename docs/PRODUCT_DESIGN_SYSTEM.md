# ZOLANZO — Product Design System 2.0 Specification

**Date:** 2026-07-31  
**Version:** 2.0.0  
**Target Quality:** TaskletPay + Linear + Stripe + Notion + Mercury + Airbnb Host Dashboard  
**Supported Themes:** Light Mode, Dark Mode, High Contrast Mode  

---

## 1. Design Philosophy & Core Principles

1. **Premium & Enterprise-Grade**: Craft visual polish that immediately inspires trust and confidence for high-volume transactions and governance.
2. **Minimal & Focused**: Eliminate unnecessary decorative noise. Interfaces prioritize content density, legibility, and swift user task execution.
3. **Consistent & Systemized**: Every UI element consumes standardized design tokens (`styles/tokens.css`) across spacing, radius, color, and elevation.
4. **Accessible & Responsive**: Full WCAG 2.1 AA compliance (min 4.5:1 text contrast) with fluid responsive behavior across mobile, tablet, and desktop breakpoints.

---

## 2. Design Tokens & Theme Primitives

### 2.1 Color Palette & Semantic System

- **Brand Colors**:
  - Primary Cyan: `#16c6c6` (`--z-primary`)
  - Deep Navy: `#071b34` (`--z-navy`)
  - Accent Gold: `#f6b81a` (`--z-gold`)
- **Semantic Status Primitives**:
  - Success Green: `#22c55e` (`--z-success`)
  - Warning Amber: `#f59e0b` (`--z-warning`)
  - Danger Red: `#ef4444` (`--z-danger`)
  - Info Blue: `#3b82f6` (`--z-info`)
- **Themes**:
  - **Light Mode**: Background `#f8fafc`, Surface `#ffffff`, Text `#071b34`.
  - **Dark Mode**: Background `#081320`, Surface `#0f1e33`, Text `#f1f5f9`.
  - **High Contrast Mode**: Background `#000000`, Surface `#0a0a0a`, Borders `#ffffff`, Accents `#00ffff` (Contrast > 7:1).

### 2.2 Typography Scale

| Token | Size | Line Height | Weight | Usage |
| --- | --- | --- | --- | --- |
| `--text-display` | 3.5rem (56px) | 1.1 | Bold (700) | Landing hero headlines |
| `--text-h1` | 2.5rem (40px) | 1.2 | SemiBold (600) | Main page titles |
| `--text-h2` | 2.0rem (32px) | 1.25 | SemiBold (600) | Section headers |
| `--text-h3` | 1.5rem (24px) | 1.3 | Medium (500) | Card & widget headers |
| `--text-h4` | 1.25rem (20px) | 1.4 | Medium (500) | Sub-section titles |
| `--text-body-lg` | 1.125rem (18px) | 1.5 | Regular (400) | Lead paragraphs |
| `--text-body` | 1.0rem (16px) | 1.5 | Regular (400) | Default body text |
| `--text-small` | 0.875rem (14px) | 1.4 | Regular (400) | Form labels, table cells |
| `--text-caption` | 0.75rem (12px) | 1.4 | Medium (500) | Badges, metadata |
| `--text-tiny` | 0.625rem (10px) | 1.3 | SemiBold (600) | Status chips, micro-labels |

### 2.3 8-pt Spacing Grid

- `var(--space-1)`: 4px
- `var(--space-2)`: 8px
- `var(--space-3)`: 12px
- `var(--space-4)`: 16px
- `var(--space-5)`: 20px
- `var(--space-6)`: 24px
- `var(--space-8)`: 32px
- `var(--space-10)`: 40px
- `var(--space-12)`: 48px
- `var(--space-16)`: 64px

### 2.4 Elevation & Shadows

- `--shadow-xs`: Micro-elevation for inputs & badges (`0 1px 2px rgba(...)`).
- `--shadow-soft`: Subdued elevation for default cards.
- `--shadow-medium`: Floating cards, dropdown menus, and popovers.
- `--shadow-floating`: Sticky headers, floating toolbars.
- `--shadow-dialog`: Modal overlays and full-screen dialogs.
- `--shadow-hero`: Hero banners & featured dashboard widgets.

### 2.5 Radius & Border System

- `--radius-xs`: 4px (Chips, micro-badges)
- `--radius-sm`: 6px (Inputs, buttons)
- `--radius-md`: 8px (Cards, alerts)
- `--radius-lg`: 12px (Modals, container cards)
- `--radius-xl`: 16px (Hero containers)
- `--radius-pill`: 9999px (Pill buttons, avatars)

---

## 3. Motion & Micro-Animation Library

- **Timing Functions**:
  - Spring Curve: `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-spring`)
  - Smooth Transition: `cubic-bezier(0.4, 0, 0.2, 1)` (`--ease-smooth`)
- **Durations**:
  - Fast: 150ms (Button hovers, focus rings)
  - Normal: 250ms (Dropdown reveals, accordion expands)
  - Slow: 400ms (Modal slide-ins, page transitions)

---

## 4. Component Primitive Specifications (24 Primitives)

1. **Loading Skeletons**: Shimmer animated pulse boxes (`animate-pulse bg-muted/60`).
2. **Empty States**: Centered illustration icon + title + description + primary action CTA.
3. **Error States**: Alert container with danger border, icon, descriptive help text, and retry CTA.
4. **Success States**: Success banner with checkmark, confirmation ID, and action link.
5. **Cards**: Surface background with soft border, hover elevation lift (`hover:shadow-medium transition-all`).
6. **Tables**: Styled headers, zebra striping on hover, sticky headers, cell truncation, and sorting controls.
7. **Forms**: Form item layout, label pairing, hint text, validation message anchoring (`aria-invalid`).
8. **Buttons**: Primary Cyan, Secondary Muted, Outline, Ghost, Danger, and Loading Spinner states.
9. **Inputs**: Text, Number, Password, Search, Date, File, with prefix/suffix icons and clear buttons.
10. **Dropdowns**: Keyboard-navigable popovers with search filter and section dividers.
11. **Modals**: Backdrop blur overlay, focus trap, sticky header/footer, `Escape` key handler.
12. **Toasts**: Fixed bottom-right notification stack with auto-dismiss progress bar.
13. **Charts**: Standardized color palette for line, bar, area, and donut charts.
14. **Navigation**: Sidebar with active indicator bar, topbar search, breadcrumb navigation.
15. **Badges**: Solid, Soft, and Outline variants in Primary, Success, Warning, Danger, Info.
16. **Progress Bars**: Track bar with animated primary indicator and percentage label.
17. **Timeline**: Vertical step activity feed with icon nodes, status lines, and relative timestamps.
18. **Avatars**: Circular images with fallback initials, online presence indicators, and user stacks.
19. **Icons**: Lucide icon integration with consistent 16px, 20px, and 24px sizing.
20. **Status Chips**: Micro pill labels (`wf.pass`, `wf.fail`, `wf.warn`, `wf.blocked`).
21. **Tabs**: Segmented controls and underline active indicators.
22. **Tooltips**: Instant hover popover with dark background and arrow pointer.
23. **Accordions**: Expandable collapsible containers with smooth height transition.
24. **Dividers**: Subdued horizontal/vertical separator lines (`border-muted`).
