# CyberShield Design System — Quiet Signal

CyberShield 0.3.0 uses Quiet Signal: a calm, human security product language designed to explain real checks without manufacturing danger or certainty.

## Brand mark

The Signal Mark is a geometric aperture: an outer boundary, a visible opening, and a central point of attention. It is rendered as scalable native geometry in the app and is also available as [signal-mark.svg](../src/brand/assets/signal-mark.svg). It is intentionally not a generic shield or padlock.

## Colour roles

All interface colours live in `src/design/tokens.ts`.

| Role | Light value | Purpose |
| --- | --- | --- |
| Canvas | `#F2F4EF` | Soft stone background |
| Surface | `#FAFBF7` | Cards and input areas |
| Forest | `#174C38` | Primary action and trusted structure |
| Signal | `#B9DE58` | Availability and focused emphasis |
| Amber | `#A96525` | Caution that needs attention |
| Danger | `#B93D45` | A concrete high-risk local finding |

The default experience is warm light. A purpose-designed dark mode is available from Profile and retains the same meaning for status colours.

## Type and layout

- Display uses the platform’s medium system face; body uses the native sans-serif; technical labels use the platform monospace face.
- Titles use short, plain language. No security jargon is used as decoration.
- The base spacing scale is 4, 8, 12, 16, 24, 32, 44, and 60 points.
- Corners are restrained: 8, 14, 22, or 30 points depending on component weight.
- Bottom navigation is primary, low-emphasis, and appears only on primary screens.

## Motion and feedback

- Screen transitions use a 260 ms native opacity and vertical-settle motion.
- The reusable Signal Trace moves only when there is an explicit active state; it remains still when monitoring is unavailable.
- Link and file assessments respond immediately to the local result. Vibration differentiates a low-risk structural result from a result that needs attention.
- There are no fake loading percentages, countdowns, network events, or progress animations.

## Accessibility and honesty

- Controls have touch-safe dimensions and platform accessibility roles where relevant.
- Status is always stated in text, not only by colour.
- “Clear” means no high-risk signal was found by the documented local checks; it is not a safety guarantee.
- Monitoring, permissions, and unavailable capabilities are shown as boundaries, never as active protection.
