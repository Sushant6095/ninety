# Motion

## The duration scale (`--durations-*`)

```
fastest 50ms · faster 100ms · fast 150ms · normal 200ms
· slow 300ms · slower 400ms · slowest 500ms
```

The **entire product animates inside 50–500ms.** Nothing is slower than half a second. This is the
core motion discipline: motion is *feedback and information*, not entertainment.

| Band | Intent | Examples |
|---|---|---|
| 50–100ms | Instant micro-feedback | Hover wash, chip press, toggle knob |
| 150ms (`fast`) | State toggles | Tab underline slide, favourite star fill, filter select |
| 200ms (`normal`) | **Default transition** | Accordion expand, content cross-fade, dropdown open |
| 300–400ms | Larger reveals | Modal/sheet entry, panel slide, skeleton→content |
| 500ms (`slowest`) | The ceiling | Reserved; rarely used |

## Observed motion behaviors

- **Live number flash.** When a score or minute updates live, the value flashes its semantic color
  briefly (green/red family) then settles — a short attention pulse, not a bounce. This is the same
  mechanic our design law already mandates ("flash up/down color 180ms on change"). SofaScore's is
  in the 150–200ms band.
- **Live indicators pulse, not spin.** The live-minute / live dot uses `status-live #cb1818` and a
  gentle opacity pulse — signals "in-play" without a distracting spinner.
- **Accordion expand/collapse.** League groups expand at ~200ms with a chevron rotate; height
  animates, content cross-fades in. No overshoot.
- **Tab switches cross-fade content (~120–200ms)** while the active-tab underline slides. Snappy,
  because users switch tabs constantly.
- **Sticky, not animated, chrome.** The header (z-104), sub-headers (z-103/98/97), and column rails
  are `position: sticky` (41 sticky/fixed elements on the home page). Scrolling is the primary
  "motion" and it's native/instant — they don't hijack scroll.
- **Reduced decorative motion.** No parallax, no scroll-triggered choreography, no entrance
  staggering on the data itself. Motion is applied to *controls and updates*, never to the numbers'
  first paint (which would delay information).

## Easing

Transitions use short ease-out curves (fast-out, settle-in) appropriate for UI feedback. There is no
elastic/bounce easing anywhere in the product — a bounce would read as "toy," wrong for a
data-authority brand. (This matches our law: "Motion 150–250ms ease-out.")

## Sticky / scroll architecture

The named z-index scale exists largely to manage **layered sticky elements**:
```
sticky-tertiary 97 · sticky-secondary 98 · sticky 99   ← content sticky headers
dropdown 100 · popover 102 · subheader 103 · header 104 ← chrome
mobile-menu 105 · bottom-nav 106 · floating-cta 107     ← mobile chrome
modal-backdrop 108 → alert 111                          ← overlays
```
As you scroll a match or league, section sub-headers pin under the global header in a predictable
stack. Nothing ever fights for z-order because the order is *declared, not discovered.*

## Takeaways for Ninety

1. **Adopt a named duration scale (50–500ms)** and make every animation pull from it — we already
   have `--duration-*`; audit that Framer Motion and GSAP both consume it (per ADR-052).
2. **Motion = information.** Price flashes (up/down) and live pulses are the *only* motion the data
   itself gets; keep the numbers' first paint instant. Save GSAP choreography for the **Momentum
   River** (our sanctioned "loud" surface), exactly as SofaScore never choreographs its scores.
3. **Ease-out, never bounce.** A trading product must feel exact. Reserve spring/overshoot for
   genuinely playful moments (there basically shouldn't be any in-market).
4. **Declare a z-index contract** (97–111 + escape hatch). Kills the `z-index: 9999` arms race and
   makes multi-layer sticky headers (market header → tab bar → column header) reliable.
5. **Respect `prefers-reduced-motion`** — drop the flash/pulse to an instant color change.
