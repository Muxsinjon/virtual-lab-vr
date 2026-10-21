import { amount, type Mixture, type Tint } from './mixture';

// Every solution here is a strong acid or base, so pH follows from the net amount of H⁺.
// `acid` is mol of H⁺, negative for OH⁻. 0.1 M HCl adds 1e-4 mol per mL.

export const INDICATORS = ['litmus', 'phenol', 'methyl', 'universal'] as const;
export type Indicator = (typeof INDICATORS)[number];

export function pHOf(m: Mixture): number | null {
  if (m.volume < 0.5) return null;
  const c = amount(m, 'acid') / (m.volume / 1000);
  // [H⁺] from charge balance with water's own ionisation (Kw = 1e-14).
  const h = (c + Math.sqrt(c * c + 4e-14)) / 2;
  return Math.min(14, Math.max(0, -Math.log10(h)));
}

type Stop = [pH: number, color: number, alpha: number];

// Transition ranges: litmus 4.5–8.3, phenolphthalein 8.2–10, methyl orange 3.1–4.4.
const STOPS: Record<Indicator, Stop[]> = {
  litmus: [[4.5, 0xd0263b, 1], [6.4, 0x7a3e9d, 1], [8.3, 0x2c58c8, 1]],
  phenol: [[8.2, 0xe0218a, 0], [10, 0xe0218a, 1]],
  methyl: [[3.1, 0xd9301c, 1], [3.75, 0xf07a1a, 1], [4.4, 0xf2c230, 1]],
  universal: [
    [1, 0xd7191c, 1], [3, 0xf46d43, 1], [5, 0xf7b733, 1], [6, 0xe8d630, 1], [7, 0x3fae49, 1],
    [8, 0x1fa187, 1], [9, 0x2b83ba, 1], [11, 0x3b4cc0, 1], [13, 0x6a3d9a, 1],
  ],
};

const lerpColor = (a: number, b: number, t: number) => {
  const ch = (shift: number) => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * t) << shift;
  };
  return ch(16) | ch(8) | ch(0);
};

export function indicatorColor(ind: Indicator, pH: number): { color: number; alpha: number } {
  const stops = STOPS[ind];
  if (pH <= stops[0][0]) return { color: stops[0][1], alpha: stops[0][2] };
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1, a1] = stops[i];
    if (pH <= p1) {
      const [p0, c0, a0] = stops[i - 1];
      const t = (pH - p0) / (p1 - p0);
      return { color: lerpColor(c0, c1, t), alpha: a0 + (a1 - a0) * t };
    }
  }
  const last = stops[stops.length - 1];
  return { color: last[1], alpha: last[2] };
}

const WATER = 0xcfe6f5;

/** How strongly each indicator shows: a few drops in 100 mL is clearly coloured. */
export function indicatorStrength(m: Mixture, ind: Indicator) {
  if (m.volume < 0.5) return 0;
  const perMl = amount(m, `ind:${ind}`) / m.volume;
  return 1 - Math.exp(-perMl * 45);
}

export function solutionTint(m: Mixture): Tint {
  const pH = pHOf(m);
  if (pH === null) return { color: WATER, opacity: 0.35 };
  // Average the visible indicator colours, then show them as strongly as the strongest one.
  let avg = WATER;
  let weight = 0;
  let strongest = 0;
  for (const ind of INDICATORS) {
    const { color: c, alpha } = indicatorColor(ind, pH);
    const w = indicatorStrength(m, ind) * alpha;
    if (w < 0.01) continue;
    weight += w;
    avg = lerpColor(avg, c, w / weight);
    strongest = Math.max(strongest, w);
  }
  return { color: lerpColor(WATER, avg, strongest), opacity: 0.35 + 0.5 * strongest };
}
