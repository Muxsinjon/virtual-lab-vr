# Devpost submission draft

Everything in **[brackets]** is for you to fill in with real facts: your school, your teacher's own
words, your survey numbers. Don't submit anything you can't back up. Judges weigh "is this real?" at 25%.

---

## Project name

Virtual Lab VR

## Elevator pitch (max 200 characters)

> Only ~10% of schools in Uzbekistan have a lab, and their chemicals run out in months. Virtual Lab VR runs in VR or any browser, and nothing runs out: every student, every experiment.

(182 characters)

---

## About the project (Markdown, goes in "Project Story")

```markdown
## Inspiration

Only about 10% of schools in Uzbekistan have a lab [add your source]. Where a lab exists, the
chemicals are used up within months, and then the school waits years for the next delivery.

At [school name] in [city], our chemistry lab almost never has anything in it. When supplies do
arrive, [describe what arrived and when], they're used up within [weeks]. Then we wait. Our teacher
[name/role] told us: "[exact quote about how long since the last delivery]". Most of the experiments
in our Grade 7–9 textbooks we've only read about.

We surveyed [N] classmates: [X]% had never done a lab experiment with their own hands this year,
and [Y]% [another finding].

We already run [virtual-lab.uz](https://www.virtual-lab.uz), a site of experiment videos and 2D/3D
simulators in Uzbek. Watching isn't doing. We wanted students to *pour the acid themselves*.

## What it does

Virtual Lab VR is a chemistry bench in VR where reagents never run out. A school buys two
headsets once; students take turns doing real curriculum experiments:

- **Acids, bases and indicators**: pour HCl and NaOH, add litmus, phenolphthalein, methyl orange or
  universal indicator, measure pH with a meter, and neutralise
- **Making hydrogen**: drop zinc into acid, collect the gas in an upside-down tube, and hear the
  squeaky pop at the flame (and watch it escape if you hold the tube the wrong way up)
- **Making oxygen**: decompose hydrogen peroxide with an MnO₂ catalyst and relight a glowing splint

You pour by physically tilting the bottle. A task board ticks off each step and shows the equation.
A counter shows everything you've used next to "Supply left: unlimited". It's in English and
Uzbek, has a seated mode, and runs in any browser too, so students waiting for the headset can
practise on a school computer.

## How we built it

- three.js + WebXR, TypeScript, Vite. It's a web page: no app store, no install
- The chemistry is calculated, not scripted: pH comes from the actual moles of H⁺/OH⁻ mixed
  (including water's own ionisation), indicator colours follow their measured transition ranges, and
  reactions consume reagents at realistic rates
- One input system serves mouse, touch, VR controllers and hand tracking
- All sounds are generated with the Web Audio API, and all textures are drawn in code, so the whole
  app is ~175 KB
- Tested with Meta's WebXR emulator and on a real [Quest model]

## Challenges we ran into

- **Pouring that feels right with both a mouse and a VR controller.** In VR, liquid leaves from the
  lowest point of the rim, wherever you tilt. With a mouse, the bottle snaps over the container's mouth
  and tilts around its spout.
- **Making the chemistry honest.** Neutralisation jumps from pH 11 to 3 in a few drops, just like
  real titration. We kept that rather than faking a smooth curve.
- **[Something you hit on the real headset: comfort, text size, performance]**

## What we learned

[e.g. WebXR basics, how indicators actually work, how to test VR without a headset]

## What's next

- More topics, one at a time, following the national Grade 7–11 curriculum: separating mixtures, lab
  equipment, then physics
- A teacher mode that assigns an experiment and sees which steps each student finished
- Pilot with [teacher/school] using two headsets for one term

## Built with AI and open source

We used Claude (Anthropic) as an AI coding assistant. Libraries: three.js, Vite, TypeScript,
Meta's iwer WebXR emulator (development only). The VR app is a new codebase written during the
hackathon; it shares no code with our earlier site.
```

---

## Built with (tags)

`three.js` `webxr` `typescript` `vite` `javascript` `web-audio-api` `meta-quest` `github-pages` `claude`

## "Try it out" links

- Live (works in any browser, and in VR on a Meta Quest): https://muxsinjon.github.io/virtual-lab-vr/
- Code: https://github.com/Muxsinjon/virtual-lab-vr

---

## Additional info: "What is the specific problem, and how do you know it's real?"

> Only about 10% of schools in Uzbekistan have a lab [source]. Where labs exist, the chemicals
> run out within months and schools wait years for new supplies. At [school], chemistry
> supplies arrive rarely and run out within weeks; after that, students go years without doing
> experiments themselves. We know because we're the students it happens to.
> [Teacher name/role] confirmed the last delivery was in [year] and [what ran out first]. We
> surveyed [N] students at [school(s)]: [X]% had done no hands-on experiments this year.
> [Optional: photo of empty shelves / empty bottles in the image gallery.]

## Team email

[your team email]

---

## Demo video script (aim for 3–4 minutes; 2–6 allowed)

1. **0:00–0:40, the problem.** Film your real lab: empty shelves, an empty reagent bottle. One line
   from your teacher on camera if possible. Show your survey result on screen.
2. **0:40–1:00, the idea.** "Two headsets, bought once. Chemicals that never run out."
3. **1:00–2:30, live in the headset** (cast or record from the Quest):
   pour acid by tilting → add universal indicator (red) → NaOH + phenolphthalein (pink) → pour acid
   until it turns clear → pH meter. Then the hydrogen pop with sound. Point at the "used / unlimited" counter.
4. **2:30–3:00, same thing in a laptop browser and on a phone**, in Uzbek. "Students waiting their turn
   practise here."
5. **3:00–3:30, how it works.** 20 seconds of the chemistry code (pH from moles), the topic list, and
   what's next.
