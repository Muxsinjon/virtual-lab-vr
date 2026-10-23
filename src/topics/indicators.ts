import * as THREE from 'three';
import { indicatorStrength, pHOf, solutionTint, type Indicator } from '../chem/acidBase';
import { BAND, beaker, dropper, phProbe, reagentBottle, sink } from '../core/kit';
import type { Vessel } from '../core/parts';
import type { TopicDef } from './topic';

// Acids, bases and indicators: pour HCl, NaOH or water into beakers, add indicator drops,
// measure pH, and neutralise one with the other.

const DROP_ML = 0.05;
const drop = (ind: Indicator) => ({ volume: DROP_ML, amounts: { [`ind:${ind}`]: 1 } });

export const indicators: TopicDef = {
  id: 'indicators',
  title: 'topic.indicators',
  ready: true,
  info: 'ind.info',
  steps: [
    { id: 'acid', key: 'ind.s1', hint: 'ind.h1' },
    { id: 'acidInd', key: 'ind.s2', hint: 'ind.h2' },
    { id: 'baseInd', key: 'ind.s3', hint: 'ind.h3' },
    { id: 'ph', key: 'ind.s4', hint: 'ind.h4' },
    { id: 'neutral', key: 'ind.s5', hint: 'ind.h5' },
  ],
  build(lab, api) {
    // 0.1 M solutions; amounts are per 100 mL. `acid` is mol of H⁺ (negative = OH⁻).
    reagentBottle(lab, { key: 'item.hcl', formula: 'HCl', detail: '0.1 M', band: BAND.acid, hazard: 'corrosive' }, { volume: 100, amounts: { acid: 0.01 } }, -0.5, -0.76);
    reagentBottle(lab, { key: 'item.naoh', formula: 'NaOH', detail: '0.1 M', band: BAND.base, hazard: 'corrosive' }, { volume: 100, amounts: { acid: -0.01 } }, -0.39, -0.76);
    reagentBottle(lab, { key: 'item.water', formula: 'H₂O', detail: 'dist.', band: BAND.neutral }, { volume: 100, amounts: {} }, -0.28, -0.76);

    const beakers = [-0.24, -0.04, 0.16].map((x) => beaker(lab, x, -0.47).vessel!);

    dropper(lab, 'item.litmus', drop('litmus'), 0x7a3e9d, -0.08, -0.8);
    dropper(lab, 'item.phenol', drop('phenol'), 0xe9eef0, 0.0, -0.8);
    dropper(lab, 'item.methyl', drop('methyl'), 0xf07a1a, 0.08, -0.8);
    dropper(lab, 'item.universal', drop('universal'), 0x3fae49, 0.16, -0.8);

    const probe = phProbe(lab, 0.36, -0.74);
    sink(lab);

    for (const v of lab.vessels) v.tint = solutionTint;

    // A beaker counts as neutralised once pink phenolphthalein has been in it (it was pink itself,
    // or pink base was poured in) and it is no longer basic. Either order of pouring works.
    const wasPink = new WeakSet<Vessel>();
    const isPink = (m: Parameters<typeof pHOf>[0]) => (pHOf(m) ?? 7) > 8.2 && indicatorStrength(m, 'phenol') > 0.1;
    for (const v of beakers) {
      v.onReceive = (part) => {
        // A pour carries mL and indicator together, so this part alone tells us if it was pink.
        if (part.volume > 0.2 && isPink(part)) wasPink.add(v);
      };
    }
    const tip = new THREE.Vector3();
    const base = new THREE.Vector3();

    return () => {
      for (const v of beakers) {
        const pH = pHOf(v.mix);
        if (pH === null) continue;
        const coloured = (['litmus', 'phenol', 'methyl', 'universal'] as const).some((i) => indicatorStrength(v.mix, i) > 0.2);
        if (pH < 3 && v.mix.volume > 5) api.done('acid');
        if (pH < 7 && coloured) api.done('acidInd');
        if (pH > 11 && coloured) api.done('baseInd');
        const phenol = indicatorStrength(v.mix, 'phenol') > 0.1;
        if (phenol && pH > 8.2) wasPink.add(v);
        if (phenol && pH <= 8.2 && wasPink.has(v)) api.done('neutral');
      }

      // The meter reads whatever liquid its tip is in.
      probe.tool.tipWorld(tip);
      let reading: number | null = null;
      for (const v of beakers) {
        v.root.getWorldPosition(base);
        const dx = tip.x - base.x;
        const dz = tip.z - base.z;
        if (dx * dx + dz * dz < v.radius * v.radius && tip.y > base.y && tip.y < v.surfaceWorldY()) {
          reading = pHOf(v.mix);
          break;
        }
      }
      probe.show(reading);
      if (reading !== null && probe.tool.held !== null) api.done('ph');
    };
  },
};
