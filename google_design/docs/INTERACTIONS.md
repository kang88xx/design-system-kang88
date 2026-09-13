# Interactions

## State model

Every interactive component defines `default`, `hover`, `pressed`, `focus`, `disabled`, and, where relevant, `selected`, `expanded`, `checked`, or `drag`.

## Timing

| Transition | Duration | Notes |
| --- | --- | --- |
| Immediate state | 50ms | pressed feedback, icon response |
| Short state layer | 100ms | hover and focus tint |
| Standard | 200ms | selection, tab indicator, compact disclosure |
| Emphasized | 300ms | dialog, drawer, panel expansion |
| Long | up to 500ms | only when spatial continuity needs it |

Default easing is `cubic-bezier(.2,0,0,1)`.

## Cross-product patterns

- Gmail: hover changes a row from metadata to contextual action buttons.
- Calendar: selected date and current time are encoded by shape, color, and position.
- Drive: selected navigation and filter chips use tonal surfaces.
- Meet: join remains disabled until the code/link field is valid.
- Finance: accordion rows and research actions use compact motion with persistent data context.

## Accessibility

- Minimum target 48px where layout permits
- 2–3px visible focus ring outside the component
- Color is never the only signal
- Motion respects `prefers-reduced-motion`
- Dialog focus is trapped and restored
- Hover-only actions remain keyboard reachable

## Live contract samples

The public viewer keeps each explanation and its working sample in one card. Every contract has exactly one sample:

1. Hover row reveals tonal state and contextual actions; keyboard focus provides the same state.
2. Focus action exposes the exterior 3px focus ring.
3. Press action compresses elevation for pointer and keyboard activation.
4. Selected navigation moves the tonal container and updates `aria-current`.
5. Expand/collapse updates `aria-expanded`, rotates the chevron, and reveals content.
6. Native dialog demonstrates modal scrim, focus movement, close result, and focus restoration.
7. Snackbar demonstrates trigger, action, dismiss, and `role=status` messaging.
8. Drag/drop demonstrates lifted state, target state, drop confirmation, and a click fallback for touch and keyboard use.
