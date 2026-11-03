# CyberShield Sentinel Design System

The Sentinel system gives CyberShield an instrumented Android identity without turning it into a terminal, game UI, or generic dashboard. Tokens are defined in `src/design/tokens.ts`; the values below document the implementation rather than a future proposal.

## Brand

The Signal Mark is a custom aperture: a bounded square field, rotated inspection frame, horizontal beam, and two anchor points. It is rendered as scalable native views in `src/brand/SignalMark.tsx`. The matching vector master is `src/brand/assets/signal-mark.svg`.

Module symbols are purpose-built native geometry rather than text abbreviations:

| Module | Symbol grammar |
| --- | --- |
| Phishing Protection | Inspection lens with interrupted core |
| File Security | Folded file with a scan line |
| Application Security | Permission grid |
| Wi-Fi Security | Layered connection arcs |
| Network Monitor | Connected graph nodes |
| Bluetooth Security | Constructed Bluetooth transmission mark |

## Exact colour tokens

### Dark Sentinel — default

| Role | Value | Use |
| --- | --- | --- |
| Canvas | `#0A0E11` | App background |
| Surface | `#12191D` | Primary panel |
| Muted surface | `#172126` | Supporting panel |
| Raised surface | `#1B252A` | Dense controls and technical rows |
| Border | `#2A393E` | Structural separators |
| Text | `#F1F4EF` | Primary text |
| Muted text | `#9BA9A9` | Technical context |
| Protection | `#C7F36B` | Ready/positive state and primary action |
| Signal | `#4BD6B4` | Technical movement and navigation emphasis |
| Caution | `#F0B451` | Permission and review state |
| Threat | `#F06B69` | Concrete high-risk finding |

### Light mode

Light mode is intentionally not a white conversion. It uses `#EEF1ED` canvas, `#FAFBF8` surfaces, forest `#2E6B42`, and signal teal `#137D69` while keeping amber and danger semantic.

## Typography

- Display: Android `sans-serif-medium` / iOS `Avenir Next Demi Bold`
- Body: Android `sans-serif` / iOS `Avenir Next`
- Technical labels: Android `monospace` / iOS `Menlo`

Large display text is used only for posture and task entry. Mono labels identify sources, module states, and actual boundaries; they are not decorative filler.

## Layout and components

- Spacing: 4, 8, 12, 16, 24, 32, 44, 60 points.
- Corners: 7, 12, 18, 26 points. Key technical boards use square edges deliberately.
- Sentinel Core: dashboard visual; its six nodes correspond to the real module capability records.
- Threat Constellation: local alert events or visibly labelled demo events only.
- Scan Trace: stage-driven trace for URL structural analysis, file metadata inspection, and labelled demo diagnostics.
- Security Timeline: local saved assessments and alerts in chronological order.

## Accessibility

- Status always has text and colour.
- Controls use Android-friendly touch areas and accessibility roles for tabs/buttons.
- Reduced Motion persists as a user setting and removes non-essential movement.
- Long subjects are line-limited in dense technical rows to protect layout on small screens.
