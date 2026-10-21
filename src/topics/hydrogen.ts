import * as THREE from 'three';
import { amount, change } from '../chem/mixture';
import { audio } from '../core/audio';
import { collectorTube, jar, rackWithTubes, reagentBottle, sink, spiritLamp } from '../core/kit';
import type { TopicDef } from './topic';

// Making hydrogen: Zn + 2HCl → ZnCl₂ + H₂↑. Collect the gas in an upside-down tube, then bring
// it to the flame for the squeaky pop. Held mouth-up, the light gas escapes.

const ML_PER_MOL = 24000; // gas at room temperature
const ZN_PER_PIECE = 0.25; // g
const TUBE_ML = 20; // what the collecting tube holds

export const hydrogen: TopicDef = {
  id: 'hydrogen',
  title: 'topic.hydrogen',
  ready: true,
  info: 'h2.info',
  steps: [
    { id: 'zinc', key: 'h2.s1' },
    { id: 'acid', key: 'h2.s2' },
    { id: 'collect', key: 'h2.s3' },
    { id: 'pop', key: 'h2.s4' },
    { id: 'leak', key: 'h2.s5' },
  ],
  build(lab, api) {
    // 10% hydrochloric acid is about 2.9 M; amounts are per 100 mL.
    reagentBottle(lab, 'item.hclDilute', 'HCl 10%', { volume: 100, amounts: { acid: 0.29 } }, -0.62, -0.8);
    jar(lab, 'item.zinc', 'Zn', { volume: 0, amounts: { zn: ZN_PER_PIECE } }, 0x9aa3ab, 0.0035, -0.45, -0.8, 'pieces');
    const { tubes, slotX } = rackWithTubes(lab, -0.12, -0.55, 3, 2);
    const collector = collectorTube(lab, slotX(2), -0.55);
    const flame = spiritLamp(lab, 0.32, -0.6);
    sink(lab);

    const added = new Map<(typeof tubes)[number], number>();
    let gas = 0; // mL of hydrogen in the collecting tube
    let peak = 0; // most gas since the last pop or leak
    let emptyCooldown = 0;
    const up = new THREE.Vector3();
    const mouth = new THREE.Vector3();
    const tubeMouth = new THREE.Vector3();
    const flamePos = new THREE.Vector3();

    for (const v of tubes) {
      v.onReceive = (part) => {
        if (part.amounts.zn) added.set(v, (added.get(v) ?? 0) + part.amounts.zn);
      };
    }

    return (dt) => {
      emptyCooldown -= dt;
      collector.tool.tipWorld(mouth);
      up.set(0, 1, 0).applyQuaternion(collector.tool.root.getWorldQuaternion(new THREE.Quaternion()));
      const mouthDown = up.y < -0.6;

      for (const v of tubes) {
        const zn = amount(v.mix, 'zn');
        const acid = amount(v.mix, 'acid');
        if (zn > 0) api.done('zinc');
        let rate = 0; // mL of H₂ per second
        if (zn > 0.002 && acid > 1e-5 && v.mix.volume > 0.5) {
          api.done('acid');
          const c = acid / (v.mix.volume / 1000);
          rate = 0.9 * (zn / ZN_PER_PIECE) * Math.min(c / 2, 1.5);
          const mol = (rate * dt) / ML_PER_MOL;
          change(v.mix, 'acid', -2 * mol);
          change(v.mix, 'zn', -65.4 * mol);
          // Granules shrink as the zinc dissolves.
          const left = Math.cbrt(Math.max(0, amount(v.mix, 'zn')) / Math.max(1e-6, added.get(v) ?? 1));
          for (const g of v.solids.children) g.scale.setScalar(Math.max(0.05, left));
        }
        v.bubbleRate = Math.min(60, rate * 14);

        // Gas rising out of the tube fills the collecting tube held upside down over it.
        if (rate > 0 && mouthDown) {
          v.mouthWorld(tubeMouth);
          const dx = mouth.x - tubeMouth.x;
          const dz = mouth.z - tubeMouth.z;
          const dy = mouth.y - tubeMouth.y;
          if (dx * dx + dz * dz < 0.025 * 0.025 && dy > -0.04 && dy < 0.05) {
            gas = Math.min(TUBE_ML, gas + rate * dt * 0.9);
            peak = Math.max(peak, gas);
          }
        }
      }

      // Hydrogen is much lighter than air: mouth-up it floats out within a second or two.
      if (up.y > 0.3 && gas > 0) {
        gas *= Math.exp(-dt * 1.6);
        if (peak > TUBE_ML * 0.4 && gas < peak * 0.3) {
          api.done('leak');
          api.toast('h2.leak');
          peak = 0;
        }
      } else if (gas > 0) gas *= Math.exp(-dt * 0.01);
      if (gas > TUBE_ML * 0.6) api.done('collect');

      // Mouth to the flame: pop.
      if (flame.lit && collector.tool.held !== null) {
        flame.group.getWorldPosition(flamePos);
        flamePos.y += 0.035;
        if (mouth.distanceTo(flamePos) < 0.04) {
          if (gas > 2) {
            const strength = gas / TUBE_ML;
            audio.pop(strength);
            lab.flash.fire(mouth, 0.03 + strength * 0.05);
            api.toast(strength > 0.7 ? 'h2.popBig' : 'h2.pop');
            if (strength > 0.3) api.done('pop');
            gas = 0;
            peak = 0;
            emptyCooldown = 4; // keep the pop message up while the tube is still at the flame
          } else if (emptyCooldown <= 0) {
            api.toast('h2.empty');
            emptyCooldown = 4;
          }
        }
      }
      collector.setGas(gas / TUBE_ML);
    };
  },
};
