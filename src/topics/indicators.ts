import * as THREE from 'three';
import { indicatorStrength, pHOf, solutionTint, type Indicator } from '../chem/acidBase';
import { beaker, dropper, phProbe, reagentBottle, sink } from '../core/kit';
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
    { id: 'acid', key: 'ind.s1' },
    { id: 'acidInd', key: 'ind.s2' },
    { id: 'baseInd', key: 'ind.s3' },
    { id: 'ph', key: 'ind.s4' },
    { id: 'neutral', key: 'ind.s5' },
  ],
  build(lab, api) {
    // 0.1 M solutions; amounts are per 100 mL. `acid` is mol of H⁺ (negative = OH⁻).
    reagentBottle(lab, 'item.hcl', 'HCl 0,1 M', { volume: 100, amounts: { acid: 0.01 } }, -0.72, -0.8);
    reagentBottle(lab, 'item.naoh', 'NaOH 0,1 M', { volume: 100, amounts: { acid: -0.01 } }, -0.6, -0.8);
    reagentBottle(lab, 'item.water', 'H₂O', { volume: 100, amounts: {} }, -0.48, -0.8);

    const beakers = [-0.34, -0.14, 0.06].map((x) => beaker(lab, x, -0.5).vessel!);

    dropper(lab, 'item.litmus', drop('litmus'), 0x7a3e9d, -0.02, -0.82);
    dropper(lab, 'item.phenol', drop('phenol'), 0xe9eef0, 0.06, -0.82);
    dropper(lab, 'item.methyl', drop('methyl'), 0xf07a1a, 0.14, -0.82);
    dropper(lab, 'item.universal', drop('universal'), 0x3fae49, 0.22, -0.82);

    const probe = phProbe(lab, 0.38, -0.78);
    sink(lab);

    for (const v of lab.vessels) v.tint = solutionTint;

    const wasPink = new WeakSet<Vessel>();
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
        const phenol = indicatorStrength(v.mix, 'phenol') > 0.2;
        if (phenol && pH > 9) wasPink.add(v);
        if (phenol && pH < 8.2 && wasPink.has(v)) api.done('neutral');
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
