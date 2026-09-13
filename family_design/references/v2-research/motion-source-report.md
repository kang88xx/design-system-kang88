# Family motion recovery — public bundle evidence

Captured 2026-09-06 from the public `https://family.co/` Next.js build ID
`rRV0VudUgPX8B6k4MyCnE`.  The current live page is a publicly served, minified
production bundle; “offset” below is a zero-based character offset in the saved
bundle, because the original files are single-line minified JavaScript.  The
pretty-printed copies in `/tmp` were only used to read it; the quoted values
come from the saved raw bundle.

Primary source URLs:

- https://family.co/_next/static/chunks/pages/index-9c94e1d3d027443f.js
- https://family.co/_next/static/chunks/7087-0908057adee7ff82.js
- https://family.co/_next/static/chunks/861-4bee4940f7ae3785.js

## What was missing from v1

### Hero / footer illustration choreography — source-confirmed

`SectionIntro` uses a large desktop SVG ornament system and a separate compact
mobile system.  They are interactive: individual desktop ornament groups are
draggable and spring back to their home position.

| Behaviour | Exact implementation evidence |
| --- | --- |
| Desktop intro scatter | Group parent: `delayChildren:.2`, `staggerChildren:.05`, `staggerDirection:-1`. Children: `opacity:0,y:40,scale:0` → `opacity:1,y:0,rotate:0,scale:1`. Spring `{type:"spring",mass:4,stiffness:800,damping:80,restDelta:1e-4}`. |
| Desktop ambient motion | Each group chooses random rotation `[-2,2]` degrees, Y `[-2,5]`px, duration `2–3`sec, delay `0–1`sec, `repeat:Infinity`, `repeatType:"mirror"`. |
| Direct manipulation | `drag:true`, `dragElastic:.1`, zero-size drag constraints, `dragSnapToOrigin:true`, `dragTransition:{bounceStiffness:600,bounceDamping:20}`. |
| Mobile intro scatter | Parent `delayChildren:.2`, `staggerChildren:.05`, forward order. Child origin is `opacity:0,y:60,scale:0`; return spring is mass 4 / stiffness 800 / damping 60. Ambient wobble chooses ±6° and ±5px, duration `1–3`sec, delay `0–1`sec, mirrored forever. |
| Hero copy | Shared transition `{duration:.937,ease:[.19,1,.22,1]}`. Each word starts `opacity:0,rotateX:-45,y:"100%"`; it ends at opacity 1 / rotateX 0 / y 0. Individual words receive `+ .05s`; heading lines start at `.3` and `.6` seconds. Supporting copy starts at `1s`, CTAs at `1.1s`, both from `opacity:0,y:32`. |

Source mapping: `graphic-complex__GroupContainer` / complex `P` system starts at
`7087…js:0:~3,000–108,549`; `SectionIntro__GraphicContainer` begins at raw
offset `108549`. The hero code uses the same Family graphic language seen in
the recorded footer, but the footer CTA is a separately bundled illustration,
not evidence that it shares the same exact SVG instance.

The footer CTA is source-confirmed as viewport-triggered, rather than
load-triggered: `CallToAction` uses `useInView(ref,{once:true,amount:.25})` and
then runs a parent opacity reveal with `staggerChildren:.025`. Its individual
paths use the same `{mass:4,stiffness:800,damping:80,restDelta:.0001}` spring.
This is a stronger implementation target than an arbitrary “footer loop”.
Source mapping: `861…js:0:96572`, `CallToAction__GraphicContainer`.

### Explore bento: five internal states — source-confirmed

The five cards are not hover cards. Their demos are autonomous `setInterval`
state machines even though a `playing` prop is passed and discarded. Do not
make the basic demo loop contingent on card hover.

| Card | Original state behaviour |
| --- | --- |
| Easy | Four `Send → Swap → Receive → Purchase` rows, 2s per state. Active row performs `[1,.99,1,1,1,1]` scale on spring `{mass:4,stiffness:800,damping:80}`. Swap icon rotates `0→360`; receive arrow moves in from `y:-100`; all active actions have `.1s` delay. |
| Secure | Three-state loop every 2s. Ring and shield state uses a mass-4/stiffness-800/damping-80 spring. Active security rings pulse opacity `.1→.5→.1` and `.25→1→.25` over 1s `easeInOut`, one delayed `.15s`; this is continuous ambient evidence, not an urgency alert. |
| Fast | Three-state loop every 2s. The graphic is a date/status panel; it uses the same 4/800/80 spring to reshuffle fields and layers. |
| Powerful | Three-state loop every 2s. Its counter is a real numeric tween: `animate(from,to,{duration:.8,ease:"easeOut"})`, using values `15→60`, `60→30`, `30→15`. The state panel moves/fades text with spring `{mass:4,stiffness:2000,damping:80}` and a `.1s` incoming delay. This is the source of the video’s `Urgent ~15 Secs` / `Normal ~60 Secs` cadence. |
| Fun | Nine emoji states cycle every 2s. The rail uses 1000ms `cubic-bezier(.19,1,.22,1)` translation and scale; active bubble is 1.25 and emoji scale is 1; inactive bubble is 1 and emoji is .8. Each emoji motion is `{duration:.75,ease:[.63,.01,.54,1.03],repeat:10,repeatDelay:.25}`. Examples include 10° wiggle, ±5px shake, -10px squash/stretch, and the “pop” emoji Y sequence `[0,0,2,-35,-35,-38,0]`. |

Parent section reveal is exact: `animate:{y:[20,0],opacity:[0,1]}`, with
`delay:1.4`, `duration:.8`, `ease:"circOut"`. Layout is 3 columns / two rows
above 880px (Easy spans left), two columns below 880px, and a 1rem vertical
stack below 580px. Source mapping: `SectionExplore__Section` raw offset
`781044`; bento component `tw`; individual visuals `td` (Easy), `tx` (Secure),
`tr` (Fast), `tt` (Powerful), and `e3` (Fun).

### Details micro-cards — source-confirmed

The section layout is static/sticky, but the four small cards contain true
infinite state sequences. The left copy is sticky at `top:15rem` on desktop;
the right cards are a vertical 4.4625rem gap (3rem mobile). Each panel is
223px tall, `#F6F4EF`/`var(--beige)`, radius 12px, overflow clipped.

| Detail card | Exact cadence / behaviour |
| --- | --- |
| Monitor In Real-Time (`tJ`) | Three-state card deck every 2s. Top/middle/bottom layers use the 4/800/80 spring; deck states include y=0/10 and a bottom transition `[1,-80,20]`. `zIndex` switches after .5s. |
| Protect Your Assets (`tT`) | Two-state warning/protection pill every 1.75s; pill width animates `286.25→234.25`, X `0→26` on the same 4/800/80 spring. Its semantic fill changes with CSS `fill .4s ease`. |
| Organise Your Wallet (`ie`) | Two SVG asset rows run independently. Ethereum starts immediately and USDC has a 2s phase delay. Each uses a 1.5s keyframe sequence, infinite with a 3s repeat delay: rows fade/swap background, shift X `0→64→0`, and show the favourite/reorder state. Its numeric labels use an `easeOut` .8s number tween. |
| See Everything Clearly (`t3`) | `start/end` grouping sequence toggles every 2s. It starts with a short `[1,.98,1,1,1,1]` scale settle; individual relationship marks enter/leave on the same spring, some with `.2s` delay. |

Source mapping: `SectionDetails__Section` raw offset `978022`; `tT` pretty
line 7192, `tJ` 7464, `t3` 8137. The source itself establishes the wording
“Monitor In Real-Time”, “Protect Your Assets”, “Organise Your Wallet”, and “See
Everything Clearly”, so those should replace generic detail labels.

### FAQ — source-confirmed click interaction

Accordion is a single-open-item controller. Clicking the button or question
calls `onToggle(!isOpen)`; opening a different item replaces the active index;
clicking the active item sets it to `-1`.

```js
// public index chunk, raw offset ~1,752
whileTap: { opacity: .5 }, transition: { duration: .1 }
// horizontal plus bar
transition: { type:"spring", mass:.5, damping:20, stiffness:220 }
// vertical bar: scale 1→0, rotate 0→80
transition: { type:"spring", mass:.5, damping:20, stiffness:220 }
// answer wrapper height: 0px↔auto
transition: { type:"spring", mass:.2, damping:18, stiffness:280 }
// answer content opacity, opening delayed .1s
transition: { delay:isOpen?.1:0, type:"spring", mass:.5, damping:18, stiffness:200 }
```

Source mapping: `index…js:0:1752–2510`; component
`Accordion__StyledCollapsableContainer` begins at raw offset `2665`. FAQ page
section starts at `7087…js:0:134556`. The section grid is two columns above
768px and one column below it; source padding is 6.5rem/5.75rem desktop and
2.5rem/4rem mobile.

### Testimonial rail and ordinary hover — source-confirmed

The 120s loop belongs only to testimonial row content:
`translateX(0%) → translateX(-50%)`, `120s linear infinite`, with duplicated
cards and edge fade masks. It is hidden below 768px. Testimonial cards change
only background and inset border over 100ms on hover; it is not a parallax or
hero decoration animation. Source mapping: `Testimonials__RowContainer`, raw
offset `118880`.

For generic media cards the published CSS uses image transform `220ms
cubic-bezier(.19,1,.22,1)`, while article image thumbnails use 180ms ease,
scale 1.02. CTA backgrounds transition in 100ms. These values support a
consistent interaction token set without inventing springs for every hover.

## Handoff implementation guidance

1. Show a live, draggable hero ornament thumbnail with the recovered entrance,
   drift and snap-back values. Label it **source-confirmed**.
2. Show five separate bento thumbnails, not one generic “feature card”. Let
   their 2-second demos keep running; use the Powerful counter’s actual
   `15 → 60 → 30 → 15` pattern and Fun’s rail logic.
3. Give each Details card its own thumbnail; its cycles are source-confirmed
   rather than represented by one generic status-card example.
4. Implement FAQ as exclusive accordion behavior with the exact springs,
   rather than CSS max-height easing.
5. Under `prefers-reduced-motion`, stop ambient drift, rails and interval
   loops; keep click-state feedback, with duration near zero. This is a
   recommended accessibility fallback, not a property encoded in this build.

## Evidence boundary

The public production build is the authoritative source for the values listed
as source-confirmed. It does not expose a semantic source map or component
filenames. The original recording is a 2023-published Recent capture;
the live site can change independently. These claims refer to the retrieval
date and exact hashed chunk URLs above.
