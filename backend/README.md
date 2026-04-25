# Handoff: ApplicationDetail Page Redesign

## Overview
Redesign of the **ApplicationDetail** page in Resume Tailor — the page a user lands on after kicking off a resume-tailoring run. It shows the live progress of the agent's pipeline (JD parsing → skill match → project selection → skill selection → project rewrite), surfaces interactive review checkpoints (human-in-the-loop), and ends with a download CTA when the resume is ready.

The redesign focuses on three things:
1. **Visual polish** — bringing the page in line with the rest of the app's design language (Inter + Playfair Display, dark navy primary, airy whitespace, subtle shadows).
2. **Better data presentations** — JD parsing, skill match analysis, project selection, and skill selection panels were all redesigned for higher clarity (summary scores, tinted panels, numbered cards).
3. **A new multi-project review interaction** — replacing the previous stack of approve/reject cards with a **carousel** that lets the user step through each rewritten project and approve or request changes one at a time.

A two-column layout was added: a sticky **left sidebar timeline** for navigation, and the main content column on the right.

## About the Design Files
The HTML files in this bundle are **design references**, not production code to lift directly. They are React + Babel-in-the-browser prototypes built to demonstrate the intended look, layout, copy, and behavior. Your task is to **recreate these designs inside the existing Resume Tailor codebase** (`uploads/frontend/src/pages/ApplicationDetail.jsx`) using its established patterns:

- React + React Router
- Tailwind CSS v4 (see `src/index.css`)
- Existing UI primitives in `src/components/ui/` (`Card`, `Button`, `Textarea`, `Select`)
- `framer-motion` for animations
- `lucide-react` for icons

The original source file (`_original_source/ApplicationDetail.jsx`) is included for reference — it already has the polling logic, interrupt-handling, and feedback submission wired up. **Most of the data plumbing stays as-is**; this is a presentational refactor.

## Fidelity
**High-fidelity.** Pixel-perfect mockups with final colors, typography, spacing, interactions, and copy. Recreate as closely as possible using existing primitives.

## Files
- `ApplicationDetail.html` — **current/canonical design** (two-column layout with sticky sidebar)
- `ApplicationDetail v1.html` — earlier single-column version, kept as a fallback if the team prefers the simpler layout
- `_original_source/ApplicationDetail.jsx` — current production source to refactor
- `_original_source/index.css` — design tokens already defined in the project

---

## Layout

### Page Shell
```
┌────────────────────────────────────────────────────────────────┐
│  Navbar (existing — no changes)                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   [ Sidebar 260px ]   [ ──── Main column max 760px ──── ]      │
│                                                                │
│   - Sticky, top: 88px                                          │
│   - Container: max-width 1200px, padding 40px 32px 80px        │
│   - Grid: 260px 1fr, gap 48px, align-items: start              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Sidebar (left)
- Sticky position, `top: 88px` (clears the navbar)
- Tiny eyebrow label: `PROGRESS` — `10px / 800 weight / 0.12em letter-spacing / uppercase`, color `#94a3b8`, margin-bottom 14px
- Vertical list of stages, each row: a status indicator on the spine + clickable text label
- Spine: 1.5px wide vertical line connecting dots — green (`#a7f3d0`) for completed segments, gray (`#e2e8f0`) for pending
- Status dots:
  - **Done**: 8px solid `#10b981` filled circle
  - **Active**: 10px solid `hsl(220 20% 20%)` circle with `box-shadow: 0 0 0 4px hsl(220 20% 20% / .12)` halo
  - **Pending**: 8px transparent circle with `1.5px solid #cbd5e1` border
- Label text: 13px, weight 500 (700 if active), color `#0f172a` active / `#475569` done / `#94a3b8` pending
- Click → smooth-scrolls to corresponding section in the main column (use `scrollIntoView({behavior:"smooth", block:"start"})` on `id="step-<node>"` targets, with `scrollMarginTop: 88px` on each target so it lands below the navbar)

**Sidebar items, in order:**
1. Job description (`jd_parsing_node`)
2. Skill match (`skill_match_node`)
3. Project selection (`project_selection_node`)
4. Skill selection (`skill_selection_node`)
5. Project rewrites (`execute_project_rewrite_node`)
6. Your review (synthetic — corresponds to interrupt state)
7. Resume ready (synthetic — corresponds to complete state)

### Main column
Max-width 760px. Contains:
1. **Page header** (job title + company + status badge)
2. **Vertical timeline** of completed/active steps
3. **Review carousel** (when interrupted)
4. **Complete banner** (when done)

---

## Components

### 1. Page Header
- `<h1>` — Playfair Display, weight 900, 32px, letter-spacing -0.02em, color `#0f172a`, line-height 1.1
- Subtitle — 13px, weight 500, color `#64748b`, margin-top 4px
- Status badge (top-right): 11px / 800 weight / 0.1em tracking / uppercase, padding 5px 14px, border-radius 99px
  - **Tailoring** → bg `hsl(220 20% 96%)`, color `hsl(220 20% 40%)`, border `hsl(220 20% 85%)`
  - **Waiting for review** → bg `#fffbeb`, color `#b45309`, border `#fde68a`
  - **Complete** → bg `#f0fdf4`, color `#15803d`, border `#bbf7d0`
  - **Failed** → bg `#fff1f2`, color `#be123c`, border `#fecdd3`

### 2. StepRow
Each completed pipeline step renders as:
- Left spine: 36×36px rounded-square (`borderRadius: 12`) icon container, with a 1px gray vertical connector below it stretching to the next step
- Spine icon container:
  - **Done**: `background: #ecfdf5, border: 2px solid #6ee7b7`, contains a `CheckCircle2` icon in `#10b981`
  - **Active**: `background: hsl(220 20% 95%), border: 2px solid hsl(220 20% 78%)`, contains a spinning `Loader2` in `hsl(220 20% 40%)`
- Label row: 13px, weight 700, color `#1e293b`, `whiteSpace: nowrap` (important — labels were wrapping before)
  - When active, append a pulsing `RUNNING…` micro-label (10px, weight 800, 0.1em tracking, uppercase, color `hsl(220 20% 50%)`, opacity-pulse animation)
- Chevron toggle on the right (chevron-up/down, 15px, color `#94a3b8`) — opens the data panel
- Data panel (when open): white card, `border: 1px solid hsl(220 10% 91%)`, `borderRadius: 16`, padding `18px 20px`, shadow `0 1px 6px -2px rgba(0,0,0,.05)`

### 3. JD Parsing Panel (`JDContent`)
- **Location pill** (top): inline-flex pill with map-pin icon (13px, `#94a3b8`) + location text (12px, weight 500, `#475569`) on `#f8fafc` bg with `#e2e8f0` border, padding `5px 12px`, border-radius 99
- **Must-have section**:
  - Section label row: `MUST-HAVE` eyebrow (10px/800/0.1em/uppercase, `#94a3b8`) on left + count chip ("25 skills", 11px, weight 600, `#94a3b8`) on right
  - Skill tags (neutral variant): `bg #f8fafc, color #475569, border 1px solid #e2e8f0, padding 3px 10px, borderRadius 999, fontSize 12, fontWeight 600, lineHeight 18px, whiteSpace: nowrap`
- **Nice to have section** (separated by `borderTop: 1px solid #f1f5f9, paddingTop 16`):
  - Same structure but with **ghost variant** tags: `bg #f1f5f9, color #94a3b8, border #e2e8f0`

### 4. Skill Match Panel (`SkillMatchContent`)
Three sub-blocks:

**a) Summary card** (top, horizontal flex):
- Big colored pill on the left: `borderRadius: 14, padding: 10px 16px`
- Inside: huge percentage in Playfair (weight 900, 28px, letter-spacing 0, line-height 1) + caption "overall match" (12px, weight 600, opacity 0.7)
- Color thresholds:
  - ≥70: text `#15803d`, bg `#f0fdf4`, border `#bbf7d0`
  - 40–69: text `#b45309`, bg `#fffbeb`, border `#fde68a`
  - <40: text `#be123c`, bg `#fff1f2`, border `#fecdd3`
- Right of pill: two-line description — "X of Y must-have skills matched" (12px, with the count in weight 700 / `#0f172a`) and a sub-line "Z skills missing from your resume" (11px, `#94a3b8`)

**b) Score bars panel**: `bg #f8fafc, border 1px solid #f1f5f9, borderRadius 14, padding 14px 16px`. Three bars stacked:
- Each bar: label row (12px, weight 600, `#64748b`) + percentage on right (13px, weight 800, in the bar's color, letter-spacing -0.01em)
- Bar: 7px tall, border-radius 99, with a tinted track:
  - ≥70: track `#dcfce7`, fill `#10b981`
  - 40–69: track `#fef9c3`, fill `#f59e0b`
  - <40: track `#fff1f2`, fill `#f43f5e`
- Fill animates with `transition: width .9s cubic-bezier(.4,0,.2,1)` from 0% to target

**c) Matched / Missing grid** (2 columns, gap 12):
- **Matched** card: `bg #f0fdf4, border 1px solid #bbf7d0, borderRadius 14, padding 12px 14px`. Header: `MATCHED` eyebrow (10px/800/uppercase, `#15803d`) + count badge (11px, weight 700, color `#15803d`, bg `#dcfce7`, padding 1px 7px, border-radius 99). Tags use **matched variant**: `bg #ecfdf5, color #047857, border #a7f3d0`
- **Missing** card: `bg #fff1f2, border 1px solid #fecdd3, borderRadius 14, padding 12px 14px`. Header: `MISSING` eyebrow color `#be123c` + count badge `color #be123c, bg #ffe4e6`. Tags use **missing variant**: `bg #fff1f2, color #be123c, border #fecdd3`

### 5. Project Selection Panel (`ProjectSelectionContent`)
- Subtitle row: "X projects selected for tailoring" (12px, weight 500, `#64748b`)
- Each project card: `bg #f8fafc, border 1px solid hsl(220 10% 91%), borderRadius 14, padding 13px 16px, display: flex, gap: 12`
  - Left: 28×28 dark navy numbered pill (`bg hsl(220 20% 18%), color #fff, borderRadius 8, fontSize 11, fontWeight 800`)
  - Right: project title in **Playfair Display, 13px, weight 700, `#0f172a`** + tech tags (neutral variant) below

### 6. Skill Selection Panel (`SkillSelectionContent`)
- Subtitle row: "X skills selected across Y categories" (12px, weight 500, `#64748b`, with count in weight 700 / `#0f172a`)
- Each category: section eyebrow (`category` name, 10px/800/uppercase, `#94a3b8`) + tags in **dark variant**: `bg hsl(220 20% 18%), color #f8fafc, border hsl(220 20% 18%)`

### 7. Project Review Carousel (`ProjectCarousel`) — the core new interaction
Triggered when `status === "interrupted"` and `current_node === "project_rewrite_review_node"`. Renders inside the timeline (shares the spine offset).

**Layout:**
- Same left spine as a StepRow, with an `AlertCircle` icon in the icon container (`bg hsl(220 20% 95%), border hsl(220 20% 78%)`)
- Right column contains 4 stacked sections with gap 14:
  1. **Header row**: title "Review rewritten projects" + subtitle "Approve each or request changes" on the left; **stepper dots** on the right
  2. **The card**
  3. **(Implicit gap)**
  4. **Submit-all button** with optional pending count

**Stepper dots** (top-right of header row):
- One dot per project, gap 5
- Inactive: 8×8 circle, `#cbd5e1`
- Active: 20×8 pill, color `hsl(220 20% 20%)`
- Approved: 8×8 circle, `#10b981` (or 20×8 if active)
- Rejected: 8×8 circle, `#f43f5e` (or 20×8 if active)
- Transition: `all .25s ease`
- Click → jumps to that project (with slide animation)

**The card**: white, `border 1px solid hsl(220 10% 90%), borderRadius 20, boxShadow 0 1px 8px -2px rgba(0,0,0,.06)`. Internal layout:

a) **Card header** (padding 18 20 16, borderBottom `1px solid hsl(220 10% 95%)`):
   - Left: project title in **Playfair, 17px, weight 700, `#0f172a`, line-height 1.25** + subtitle "Project N of M" (11px, weight 500, `#94a3b8`)
   - Right: optional status pill (Approved = green, Changes requested = red) + two ghost nav buttons (28×28, `borderRadius 8, border #e2e8f0, bg #f8fafc`) with chevron-left / chevron-right icons. Disabled state: `opacity 0.3`

b) **Compare toggle** (subtle text button): "Compare with original" / "Hide original", 11px / 600 / `#94a3b8` (or `#0f172a` when active), with a small file/x icon. No chrome — just a text link with `cursor: pointer`.

c) **Bullets section** (padding 16 20):
   - Default view: list of green-tinted boxes, gap 5: `bg #f0fdf4, border 1px solid #bbf7d0, borderRadius 11, padding 10px 14px, fontSize 13, color #1e293b, lineHeight 1.65`
   - Compare view: 2-column grid, gap 12. Left column: original bullets in `bg #f8fafc, border #f1f5f9, color #64748b` boxes with `ORIGINAL` eyebrow. Right column: rewritten bullets in green-tinted boxes with `REWRITTEN` eyebrow (color `#059669`).

d) **Feedback textarea** (only shown when "Request changes" is clicked): 80px min-height, `bg #fafafa, border 1px solid hsl(220 10% 88%), borderRadius 12, padding 10px 14px, fontSize 13, color #0f172a, lineHeight 1.55, resize: none, outline: none`. Border focuses to `hsl(220 20% 50%)`. Above it: `DESCRIBE WHAT TO CHANGE` eyebrow.

e) **Action row** (padding 14 20 18, borderTop `1px solid hsl(220 10% 96%)`):
   - **Approve** button (flex: 1): solid `bg hsl(220 20% 18%), color #fff, height 42, borderRadius 12, fontWeight 700, fontSize 13`, with `CheckCircle2` icon (14px) and label "Approve" (or "Approved" once selected). When the OTHER state is active (rejected), opacity 0.5.
   - **Request changes** button (flex: 1): outline `bg #fff, color #475569, border 1.5px solid hsl(220 10% 88%), height 42, borderRadius 12, fontWeight 600`, with `X` icon. When active, switches to `bg #fff1f2, color #be123c, border #fecdd3`.

**Submit-all button** (below the card):
- Width 100%, height 44, `borderRadius 13`
- Active: `bg hsl(220 20% 18%), color #fff, fontWeight 700, fontSize 13, boxShadow 0 4px 14px -3px hsl(220 20% 18% / .3)`
- Disabled: `bg hsl(220 10% 90%), color #94a3b8`
- Below: pending count helper text — "N projects still need review", 11px, weight 500, `#94a3b8`, centered

**Behavior:**
- Carousel direction is tracked: `setDir(newIdx > idx ? 1 : -1)`. Card `key={idx-bump}` swap animates with `slideLeft .22s` (forward) or `slideRight .22s` (back).
- Approving auto-advances to the next undecided project after 300ms.
- Clicking "Request changes" sets that project's `approved=false` and reveals the textarea (autofocus).
- Switching projects via dots/arrows hides the compare view (resets per project).
- Submit is locked until `every(p => decisions[p].approved !== null)`.

### 8. Complete Banner (`CompleteBanner`)
Renders below the timeline when `status` is in the post-tailor set (`tailored, applied, interviewing, rejected`).

- `bg #f0fdf4, border 1px solid #bbf7d0, borderRadius 20, padding 16px 20px, display: flex, justifyContent: space-between, alignItems: center`
- Left side: 40×40 sparkles icon (`bg #dcfce7, color #16a34a, borderRadius 12`) + "Resume tailored successfully" (13px, weight 700, `#166534`) + "Your tailored resume is ready to download" (12px, `#16a34a`)
- Right: green CTA button — `bg #16a34a, color #fff, height 38, padding 0 16, borderRadius 12, fontWeight 700, fontSize 13`, with download icon, label "Download PDF"

---

## Interactions & Behavior

- **Sidebar nav**: clicking an item smooth-scrolls the main column to `#step-<node>`. Each section in the main column has `scroll-margin-top: 88px`.
- **Step row chevron**: toggles the data panel open/closed.
- **Carousel arrows**: prev/next, disabled at bounds.
- **Carousel dots**: jump to index.
- **Compare toggle**: switches between full-width rewritten view and 2-column compare view.
- **Approve button**: marks decision, auto-advances to next undecided project (300ms delay).
- **Request changes button**: marks decision, reveals feedback textarea (autofocus).
- **Submit all reviews**: only enabled when every project has a decision; submits as a single payload.
- **Polling**: keep the existing `startPolling()` logic in `ApplicationDetail.jsx` — it polls every 2s until the application reaches a terminal status.

### Animations
- Use `framer-motion` (already in the codebase) for all transitions
- Card slide on carousel index change: 220ms ease, X-axis 20px in either direction
- Step rows fade-up on mount: `from {opacity:0, y:12}` to `{opacity:1, y:0}`, 350ms
- Score bar growth: `from {width:0}` to `{width: <pct>%}`, 900ms `cubic-bezier(.4, 0, .2, 1)`
- Sidebar dot active state: `box-shadow` halo transitions in 250ms

---

## State Management
Most state stays in `ApplicationDetail.jsx`:
- `application` — fetched from API, polled every 2s
- `loading`, `isSubmitting` — request flags
- `pendingSkillSelection` — used when interrupted at skill_selection_node (existing)

**New** local state inside `ProjectCarousel`:
- `idx` — current project index
- `dir` — 1 or -1, drives slide direction
- `decisions` — `{[interrupt_id]: { approved: null | true | false, feedback: string, showFeedback: bool }}`
- `showCompare` — toggles compare view (resets on idx change)

---

## Design Tokens

Already defined in `src/index.css`:
- `--background: hsl(210 20% 98%)`
- `--foreground: hsl(220 20% 15%)`
- `--primary: hsl(220 20% 20%)` (the redesign uses `hsl(220 20% 18%)` in a couple of spots for action buttons — pick one and standardize, suggest sticking with the existing `--primary`)
- `--muted-foreground: hsl(220 10% 45%)`
- `--border: hsl(220 10% 90%)`
- Fonts: `Inter` (sans), `Playfair Display` (display)

Additional colors used (semantic):
| Purpose | Color |
|---|---|
| Success text / icon | `#10b981` / `#15803d` / `#047857` |
| Success bg | `#f0fdf4` / `#ecfdf5` / `#dcfce7` |
| Success border | `#bbf7d0` / `#a7f3d0` |
| Danger text | `#be123c` / `#e11d48` |
| Danger bg | `#fff1f2` / `#ffe4e6` |
| Danger border | `#fecdd3` |
| Warning text | `#b45309` |
| Warning bg | `#fffbeb` |
| Warning border | `#fde68a` |
| Body text | `#0f172a` (strong) / `#1e293b` (body) / `#475569` (secondary) / `#64748b` (tertiary) / `#94a3b8` (quaternary) |
| Backgrounds | `#fff` / `#f8fafc` / `#fafafa` |
| Borders | `hsl(220 10% 90%)` / `hsl(220 10% 91%)` / `hsl(220 10% 95%)` / `hsl(220 10% 96%)` / `#e2e8f0` / `#f1f5f9` |

Spacing scale (from observed values): 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32, 36, 40, 48, 80 px.

Border radius scale: 8, 10, 11, 12, 13, 14, 16, 20, 99 px.

Shadows:
- Subtle card: `0 1px 6px -2px rgba(0,0,0,.05)`
- Carousel card: `0 1px 8px -2px rgba(0,0,0,.06)`
- Submit CTA: `0 4px 14px -3px hsl(220 20% 18% / .3)`
- Approve CTA: `0 1px 4px -1px hsl(220 20% 18% / .2)`
- Active sidebar dot halo: `0 0 0 4px hsl(220 20% 20% / .12)`

---

## Assets / Icons
All icons are from `lucide-react` (already used in the project):
- `CheckCircle2`, `Loader2`, `MapPin`, `Sparkles`, `AlertCircle`, `ChevronDown`, `ChevronUp`, `ChevronLeft`, `ChevronRight`, `FileDown`, `Copy`, `Check`, `X`, `FileText`, `Home`, `User`, `LogOut`

No new image assets are introduced.

---

## Implementation Notes for Claude Code
1. **Refactor incrementally** — the existing `ApplicationDetail.jsx` has working data flow. Start by extracting the existing inline components (`StepRow`, `InterruptPanel`, `CompleteBanner`, etc.) into separate files under `src/pages/ApplicationDetail/` and then re-style them.
2. **Replace `InterruptPanel` with a new `ProjectCarousel`** when `node === "project_rewrite_review_node"` and there are multiple `interrupt_payloads`. Keep the existing single-decision branch for the other interrupt nodes for now.
3. **Add the sidebar** as a sibling of the main content inside a CSS grid (`grid-template-columns: 260px 1fr; gap: 48px`). Don't apply this on screens narrower than ~1024px — fall back to single-column.
4. **Animation fill-mode bug**: avoid bare `animation: fadeUp .35s ease both` on structural containers. Pair with inline `opacity: 1` so content stays visible if the animation glitches in some rendering paths. (Bit us during prototyping — a real-browser audit would still be wise.)
5. **`whiteSpace: nowrap` on tags and step labels** — both were wrapping mid-word in the previous design. Important.
6. **The `original_bullets` field** isn't in the current backend response. Either add it to the interrupt payload, or hide the "Compare with original" toggle when not present.

---

## Open Questions for the Developer
- The original_bullets field for the compare view — is the backend able to include it in the interrupt payload, or should we fetch it separately?
- Mobile/responsive behavior wasn't designed — confirm with the design team whether the sidebar collapses to a hamburger or stacks above the content.
- The "Your review" and "Resume ready" sidebar items are synthetic (no corresponding `step.node`). Confirm this naming is OK with PM.
