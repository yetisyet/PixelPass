---
name: PixelPass
description: A cozy Windows 7-style password vault with restrained paw-print personality.
colors:
  ink: "#18252e"
  muted-ink: "#526674"
  explorer-heading: "#1c4d6a"
  utility-blue: "#3c7ca5"
  paw-plum: "#8f5f9f"
  favorite-gold: "#b28018"
  desktop-teal: "#2c8db7"
  desktop-aqua: "#65c3cd"
  desktop-blue-deep: "#1b5e88"
  work-pane: "#ffffff"
  window-wash: "#f5f8fa"
  steel-border: "#aebcc7"
  active-blue: "rgba(194, 227, 246, 0.94)"
  error-ink: "#6c2020"
typography:
  display:
    fontFamily: '"Segoe UI", SegoeUI, Tahoma, sans-serif'
    fontSize: "clamp(25px, 5vw, 40px)"
    fontWeight: 300
    lineHeight: 1.08
  headline:
    fontFamily: '"Segoe UI", SegoeUI, Tahoma, sans-serif'
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: '"Segoe UI", SegoeUI, Tahoma, sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: '"Segoe UI", SegoeUI, Tahoma, sans-serif'
    fontSize: "9pt"
    fontWeight: 400
    lineHeight: "normal"
  micro:
    fontFamily: '"Segoe UI", SegoeUI, Tahoma, sans-serif'
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.35
  secret:
    fontFamily: 'Consolas, "Courier New", monospace'
    fontSize: "9pt"
    fontWeight: 400
    lineHeight: "normal"
rounded:
  none: "0"
  win7-control: "3px"
  art-pane: "5px"
  dialog-icon: "6px"
  brand-icon: "8px"
spacing:
  xxs: "2px"
  xs: "5px"
  sm: "8px"
  md: "13px"
  lg: "18px"
  xl: "24px"
  2xl: "32px"
components:
  button:
    typography: "{typography.body}"
    rounded: "{rounded.win7-control}"
    padding: "0 12px"
  search-field:
    backgroundColor: "{colors.work-pane}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "4px 30px 4px 28px"
    height: "30px"
  sidebar-item:
    textColor: "{colors.explorer-heading}"
    typography: "{typography.body}"
    rounded: "{rounded.win7-control}"
    padding: "4px 9px"
  table-row:
    backgroundColor: "{colors.work-pane}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "46px"
  brand-icon:
    textColor: "{colors.work-pane}"
    rounded: "{rounded.brand-icon}"
    size: "34px"
  dialog-icon:
    textColor: "{colors.work-pane}"
    rounded: "{rounded.dialog-icon}"
    size: "40px"
---

# Design System: PixelPass

## Overview

**Creative North Star: "The Cozy Aero Vault"**

PixelPass is an operating interface, not a marketing dashboard. It behaves like a purpose-built Windows 7 vault utility: an Aero-blue desktop holds one active glass window, with crisp explorer panes, compact native controls, and clear system state. The shipped foundation is `7.css` v0.21.1, scoped under `.win7`; PixelPass adds its own desktop, explorer layout, colors, and paw details without replacing that library's Windows 7 control grammar.

The visual contract explicitly rejects a generic modern card dashboard. Security actions stay literal and familiar; personality appears as purple paw punctuation and cozy supporting copy, never as ambiguity around reveal, copy, save, lock, or error states.

**Key Characteristics:**

- Aero glass outside, inset white utility panes inside.
- Compact Segoe-style type and information-dense explorer layouts.
- One purple paw accent; blue remains the operational color.
- Native-looking buttons, fields, tables, title bars, and status bars.
- Responsive compression that preserves the desktop-utility metaphor.

## Colors

The palette pairs a teal-blue desktop atmosphere with white work surfaces, blue-gray utility ink, and a single warm plum signature.

### Primary

- **Desktop Teal, Aqua, and Deep Blue:** the three-stop desktop gradient. White radial highlights and a soft turquoise glow create the wallpaper-like Aero atmosphere.
- **Utility Blue:** service icons and other operational emphasis inside the window.

### Secondary

- **Paw Plum:** brand badge, paws, eyebrow copy, search ornament, loading/empty icons, and status punctuation.
- **Favorite Gold:** favorite stars only; it is a data signal, not a general accent.
- **Error Ink:** error copy on the pale red Windows-style alert panel.

### Neutral

- **Ink:** default text on light surfaces.
- **Muted Ink:** helper copy, counts, and low-priority status.
- **Work Pane / Window Wash:** pure white list surfaces over a slightly cool window body.
- **Steel Border:** list frames and chrome separators; lighter blue-gray borders may be used for inset helper panels.
- **Explorer Heading:** section headings and active navigation text.

**The Aero Outside, White Inside Rule.** Saturated color belongs to the desktop and small accents. Task surfaces remain white or very pale blue-gray for legibility.

**The Paw Is Punctuation Rule.** Paw Plum accents recognition and friendly state; it never colors whole panels, primary actions, secrets, or error messages.

## Typography

**Display and UI Font:** `Segoe UI`, then `SegoeUI`, `Tahoma`, and sans-serif. `7.css` defines the base Windows UI size at 9pt. Although Geist is imported by the project scaffold, it is not the shipped PixelPass surface font.

**Secret Font:** `Consolas`, then `Courier New`, and monospace, used only for a revealed password field.

**Character:** thin, airy home-page display type sits above compact Windows utility type. Headings are blue and usually regular weight; bold is reserved for service names, small section labels, and state emphasis.

### Hierarchy

- **Display:** light and responsive; the home greeting only.
- **Headline:** regular 20px explorer section heading; 17px on compact screens.
- **Title:** regular 16px dialog or empty-state heading; dialog headings reduce to 14px on compact screens.
- **Body:** 9pt Windows UI copy, controls, table cells, and form labels.
- **Micro:** 10px metadata, helper text, counts, and brand subtitle.
- **Eyebrow:** 11px, semibold, uppercase, with 0.08em tracking; use sparingly on welcoming content.

### Voice

Keep functional labels explicit: `New item`, `Reveal`, `Copy password`, `Lock vault`, `Save login`, `Cancel`, and `Close`. Put furry voice in greetings, helper copy, progress, status, success, empty, and error states. Lowercase `ur`, `u`, `pwd`, `meow`, and `nyah` are intentional, not typos to normalize.

Use the faces exactly and consistently:

- `^w^` — happy, safe, ready, or reassuring.
- `>///<` — shy/cozy affection or gentle security caution.
- `>w<` — eager action, demo, or in-progress energy.
- `T~T` — errors, offline states, missing results, and not-found states.

**The Clear Action, Cozy Echo Rule.** The action itself stays plain-language; personality follows in nearby helper or status copy. Do not force a face into every sentence.

## Layout

The renderer begins with a 54px glass global navigation bar. Below it, each page centers one window in a viewport-filling desktop with 18px outer padding. The main vault window is at most 1180px wide and 720px tall, uses the available height minus 90px, and never drops below 490px in the desktop layout. The home window is at most 720px wide.

The vault window stacks title bar, 42px command bar, explorer, and status bar. The explorer uses a 210px sidebar plus a fluid work pane; content padding is 13px. The home body is a two-column 0.82/1.18 split with a 28px gap and 32px padding. Dialog forms use a 116px label column plus a fluid input column with 9px by 10px gaps.

Spacing is compact and functional: 2–8px within controls and metadata, 13–18px between regions, and 24–32px only for the welcoming home composition. Do not inflate this into a roomy web-app rhythm.

### Responsive behavior

- **At 720px and below:** page padding becomes 8px; the main window stretches to available width and height; the explorer sidebar narrows to 154px; content padding becomes 9px; content headings stack above the full-width search; the home illustration is removed and the copy becomes one column.
- **At 520px and below:** route buttons become icon-only visually, but retain their accessible names. The sidebar becomes a four-item horizontal icon strip; its heading and note disappear. The favorite table column and secondary status fields hide, while service, username, and action remain. Forms become single-column, dialogs tighten to 14px padding, and the home body uses 24px padding.
- **Minimum renderer width:** 320px. The page never scrolls horizontally; table cells ellipsize, and the compact table assigns 38% / 35% / 27% to service, username, and action.

**The Compress, Do Not Reimagine Rule.** Small screens collapse labels and secondary metadata, but keep the title bar, command bar, category strip, table, and status bar recognizably Windows 7.

## Elevation & Depth

Depth is structural and intentionally era-specific: multi-stop gradients, inset white highlights, crisp one-pixel borders, and strong window shadows. The desktop and global navigation use CSS gradients and blur rather than raster imagery.

### Shadow vocabulary

- **Primary window:** `0 17px 42px rgba(9, 37, 54, 0.5)`; use for the one active page window.
- **Dialog:** `0 16px 38px rgba(7, 30, 44, 0.56)`; use above a darkened, 2px-blurred overlay.
- **Global glass bar:** an inset white top highlight plus `0 2px 8px rgba(10, 42, 58, 0.3)`.
- **Inset list frame:** `inset 1px 1px 2px rgba(41, 65, 79, 0.16), 0 1px #fff`.

**The One Active Window Rule.** A page has one dominant elevated window. Dialogs temporarily outrank it; supporting panes stay inset and must not become floating cards.

## Shapes

The form language comes from Windows 7: square window bodies, one-pixel borders, and gently rounded controls. The library's 3px control radius is the default. Custom art and icon tiles may use 5–8px radii, but no pills or large modern card radii belong in the renderer.

Brand and dialog paw tiles use compact rounded squares with purple vertical gradients, inner highlights, dark lower edges, and one-pixel borders. Main work panes clip cleanly inside the window; dialog content removes the modern Base UI radius and ring so only the 7.css frame is visible.

## Components

### Global navigation

Use a translucent, blurred Aero bar with the 34px paw badge and two right-aligned route buttons. The active route receives the 7.css `.default` treatment and `aria-current="page"`. At compact widths, hide labels visually by reducing text to zero; never remove the accessible text or icon meaning.

### Windows and dialogs

Use the 7.css structure exactly: `.window.active.glass` → `.title-bar` → `.window-body`, with `.status-bar` where needed. Main content adds an inset bordered body inside the glass frame. Dialogs use the same active glass frame, a semantic Base UI title and description hidden visually, one real close button, and a right-aligned gray footer. Default footer buttons are at least 92px wide. The add form auto-focuses its first field; the reveal dialog clears secret state when closed.

### Buttons and fields

Use native `button` and `input` elements inside `.win7` so 7.css owns gradients, borders, hover, press, disabled, and keyboard focus. Add `.default` only to the single recommended action in a group; its cyan animated edge is emphasis, not decoration. Search is a 30px white field with a search icon inset left and a non-interactive paw inset right. Inputs stay crisp and rectangular; revealed secrets switch to the secret monospace role.

### Sidebar

The sidebar is a pale explorer navigation pane with a bottom note. Links are transparent at rest and fill with a pale blue two-stop selection when active. Icons are 16px, labels are left-aligned, and active state always pairs visual selection with `aria-current`.

### Credential table

The table owns the work pane; do not wrap rows in cards. It uses a sticky Windows header, fixed columns of 30% / 38% / 12% / 20%, and 46px body rows. Service and username truncate with ellipses. Service names combine a blue key icon and bold text; favorite uses a labeled gold star or an em dash; each row ends with an explicit `Reveal` button. Hover is a very pale blue wash.

### Status, loading, empty, and error states

The bottom status bar carries a paw-prefixed human message, item count, and lock/demo/offline state. Loading and empty states occupy the list frame rather than opening a new card. Use a paw, concise text, and the native marquee progress treatment. Errors use a pale red inset panel with `role="alert"`; never communicate failure with color alone.

### Paw motif

Use the Lucide outline `PawPrint`, not mixed paw styles. It is the brand mark and a supporting motif in search, status, empty/loading states, and the home illustration. Decorative instances are `aria-hidden="true"`. Never replace functional icons—key, eye, star, lock, plus, search, shield, note, or demo flask—with a paw.

### Accessibility contract

Keep semantic landmarks, labeled navigation and toolbars, real form labels, scoped table headers, `aria-current`, `aria-busy`, labeled progress bars, and `role="alert"`. Copy feedback remains `aria-live="polite"`. Meaningful icons need an accessible name; decorative icons are hidden. Preserve 7.css's visible keyboard focus. The implemented reduced-motion rule disables pulsing default/focused buttons; any future animation must also honor `prefers-reduced-motion`.

## Do's and Don'ts

### Do

- **Do** import `7.css/dist/7.scoped.css` and keep every Windows-style primitive inside a `.win7` scope.
- **Do** preserve the Electron/native outer frame while letting the renderer own the inner desktop and utility window.
- **Do** use semantic HTML controls and Lucide outline icons; let 7.css provide the authentic interaction states.
- **Do** keep secrets absent from tables and persistent renderer UI; reveal only after an explicit action and clear the reveal state on close.
- **Do** keep demo content visibly labeled in the title bar, status bar, and supporting state.
- **Do** author `>///<` and `>w<` so they render literally in JSX (entities or string literals are acceptable).

### Don't

- **Don't** introduce generic rounded cards, pill buttons, oversized type, dark mode, gradients unrelated to Aero chrome, or a modern SaaS dashboard shell.
- **Don't** use the imported Geist/shadcn visual defaults for shipped PixelPass surfaces; they are scaffolding, not the visual authority.
- **Don't** use Paw Plum as a primary action color or scatter paws where a functional icon is clearer.
- **Don't** hide essential actions or states at compact widths; remove labels and secondary metadata only where the responsive contract specifies.
- **Don't** add stock imagery or rasterized chrome. The shipped backdrop, glass, and icons are CSS/vector; any future raster asset must have documented provenance.
- **Don't** “correct” the established informal voice, exact faces, or lowercase phrasing into generic product copy.
