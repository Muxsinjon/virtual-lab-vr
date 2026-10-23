# Virtual Lab VR

**A chemistry lab where the chemicals never run out.** It runs in VR on a Meta Quest, and in any
browser on a laptop or phone. Built for Neighborhood Hacks 2026 (October 16–23).

## The problem

In our public schools, lab supplies are rare. When a school finally gets chemicals and glassware,
they're used up within weeks, and then students wait years for the next delivery. Most students
read about experiments they never get to do.

## What it does

A school buys **two VR headsets once**. Students take turns doing real school experiments at a
virtual lab bench, as many times as they want:

- **Pour by tilting**: in VR you tilt the bottle with your wrist. With a mouse you hold the button.
- **Real chemistry under the hood**: pH is calculated from the actual amounts mixed, indicator
  colours follow their real transition ranges, and reactions use up their reagents at realistic rates.
- **A task list for each topic** ticks itself off as you do each step, and explains the equation.
  A **!** next to the current task opens step-by-step help, and it pulses if you seem stuck.
- **Physical behaviour**: liquid surfaces stay level when you tilt glassware; pouring follows weir
  flow (the further you tilt, the faster it pours); a stream on a rim splits; spills splash and
  spread; walls and furniture stop you.
- **Adjustable table height**: fitted to your eye height when you enter VR, then adjustable.
- **A "used this session" counter**: every mL poured is counted next to "Supply left: unlimited".
- **English and Uzbek**, switchable at any time.
- **Seated mode** for students who can't stand at the bench.
- **No install**: it's a web page. It works without a headset too, so students waiting for their
  turn can practise on any school computer, and the headset view can be cast to the classroom screen.

### Topics so far

| Topic | What you do |
|---|---|
| Acids, bases and indicators | Pour HCl, NaOH and water; add litmus, phenolphthalein, methyl orange or universal indicator; measure pH; neutralise |
| Making hydrogen | Zn + 2HCl → ZnCl₂ + H₂: collect the gas in an upside-down tube and get the squeaky pop at the flame |
| Making oxygen | 2H₂O₂ → 2H₂O + O₂ with MnO₂: relight a glowing splint |

More topics (separating a mixture, lab equipment) are added one at a time; see `src/topics/`.

## Try it

**Live: https://muxsinjon.github.io/virtual-lab-vr/** (any browser; on a Meta Quest, open it in the
Quest Browser and press **Enter the lab**).

**On a computer or phone**: open the site. Click an item to pick it up: its spout or tip follows the
cursor anywhere, and the mouse wheel (or ↑/↓) raises and lowers it. Hold the mouse button to pour; right-click
or Esc puts it back. Nothing snaps into place, so a careless pour spills, and a stream on a rim splits
between the glass and the bench. On a phone, tap to pick up, drag to move, and use the on-screen buttons.

**On a Meta Quest**: open the same address in the Quest browser and press **Enter VR**.
- Grip button: grab (or point the ray at something far away)
- Tilt your hand to pour
- Trigger: squeeze a dropper, press panel buttons

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm.cmd run serve:vr  # optimised build over HTTPS on your local network, for the headset
npm run build      # production build in dist/
```

The headset browser only allows WebXR on HTTPS pages. `npm.cmd run serve:vr` builds the optimised
version and prints a network address (`https://192.168.x.x:4173`); open it on the Quest and accept the
self-signed certificate warning. (`npm.cmd run dev:vr` also works but is slower: it serves the
unoptimised development version.)

Without a headset, `http://localhost:5173/?emulate` adds a Meta Quest 3 emulator (dev builds only).

## How it's built

- **three.js** with **WebXR** for rendering, controllers and hand tracking
- **TypeScript** + **Vite**
- **Web Audio API**: every sound (pouring, fizzing, the hydrogen pop) is generated in code, no audio files
- All textures (labels, periodic table, floor) are drawn on canvases at runtime, so the whole app is
  one small JavaScript file (~175 KB gzipped)

```
src/
  chem/       pure chemistry: mixtures, pH, indicator colours
  core/       the engine: room, glassware, pouring/drops/bubbles, input (mouse, touch, VR), task board
  topics/     one file per experiment: bench layout + reaction model + task checks
  i18n.ts     all on-screen text in English and Uzbek
```

To add a topic, create `src/topics/<name>.ts` exporting a `TopicDef` (see `topic.ts`) and list it in
`src/topics/index.ts`.

## Disclosure

- Open-source libraries: three.js (MIT), Vite (MIT), TypeScript (Apache-2.0), iwer and @iwer/devui
  (Meta's WebXR emulator, MIT; development only).
- AI assistance: we used Claude (Anthropic) as an AI coding assistant to write and debug code.
- Our team already runs a 2D/3D video and simulator site for Uzbek school science,
  [virtual-lab.uz](https://www.virtual-lab.uz). The idea comes from that work, but this VR app is a
  new codebase written during the hackathon. It shares no code with that site.
