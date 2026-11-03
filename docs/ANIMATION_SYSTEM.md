# Animation System — Sentinel Motion

The current Expo/RN stack uses React Native `Animated`; no dependency upgrade is required for the implemented motion. Motion tokens live in `src/design/tokens.ts`.

| Token | Duration | Implementation |
| --- | ---: | --- |
| Instant | 110 ms | Immediate press feedback |
| Quick | 180 ms | Bottom-navigation indicator |
| Standard | 280 ms | Screen spatial-settle transition |
| Deliberate | 460 ms | Demo module audit/diagnostic completion |
| Scan stage | 340 ms | URL/file trace stage change |

## Implemented interactions

- **Navigation:** the active bottom-tab indicator moves with cubic easing; non-primary screens use Android back handling and a short vertical/opacity settle.
- **Sentinel Core:** a slow orbit runs only when reduced motion is off. Node colour derives from each module’s actual declared capability state.
- **URL and file scan:** user action begins `Normalize`/`Inspect`/`Explain` stages. Completion is tied to the real local URL function or the actual Android picker metadata result; there is no fake security progress after completion.
- **Demo module scans:** progress is explicitly labelled `SAMPLE` and changes only the in-memory demo workspace.
- **Network Monitor:** no live movement appears when no VPN session exists. The sample session uses a labelled trace and constellation only while Demo Mode is on.
- **Alerts:** read and dismiss actions immediately update the persisted local alert record.

## Reduced Motion

Profile exposes a persistent Reduce Motion setting. It makes screen transition duration zero, stops Sentinel orbiting, stops scan-trace flicker, and completes intentional demo stages without delayed animation. It does not remove functional state changes.
