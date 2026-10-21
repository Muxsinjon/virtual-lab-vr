import * as THREE from 'three';
import { amount, change } from '../chem/mixture';
import { audio } from '../core/audio';
import { jar, rackWithTubes, reagentBottle, sink, spiritLamp, splint } from '../core/kit';
import type { TopicDef } from './topic';

// Making oxygen: 2H₂O₂ → 2H₂O + O₂↑ with MnO₂ as the catalyst. A glowing splint bursts back
// into flame in the oxygen.

const ML_PER_MOL = 24000;
const BURN_TIME = 3.5; // s before a lit splint's flame dies down to a glow
const GLOW_TIME = 40; // s a glowing tip lasts

type SplintState = 'fresh' | 'burning' | 'glowing' | 'out';

export const oxygen: TopicDef = {
  id: 'oxygen',
  title: 'topic.oxygen',
  ready: true,
  info: 'o2.info',
  steps: [
    { id: 'peroxide', key: 'o2.s1' },
    { id: 'catalyst', key: 'o2.s2' },
    { id: 'light', key: 'o2.s3' },
    { id: 'glow', key: 'o2.s4' },
    { id: 'relight', key: 'o2.s5' },
  ],
  build(lab, api) {
    // 3% hydrogen peroxide is 0.88 M; amounts are per 100 mL.
    reagentBottle(lab, 'item.h2o2', 'H₂O₂ 3%', { volume: 100, amounts: { h2o2: 0.088 } }, -0.62, -0.8);
    jar(lab, 'item.mno2', 'MnO₂', { volume: 0, amounts: { mno2: 1 } }, 0x1f1c1a, 0.0022, -0.45, -0.8, 'spoons');
    const { tubes } = rackWithTubes(lab, -0.14, -0.55, 2, 2);
    const flame = spiritLamp(lab, 0.32, -0.6);
    const s = splint(lab, 0.0, -0.36);
    sink(lab);

    // Peroxide turns slightly grey-black once MnO₂ powder is stirred through it.
    for (const v of tubes) {
      v.tint = (m) => (amount(m, 'mno2') > 0 ? { color: 0x8a8d8f, opacity: 0.55 } : { color: 0xdfeef8, opacity: 0.38 });
    }

    const o2 = new Map<(typeof tubes)[number], number>(); // oxygen share of the air in each tube, 0..1
    let state: SplintState = 'fresh';
    let timer = 0;
    let noO2Cooldown = 0;
    let insideFor = 0; // how long a glowing tip has been in a tube without enough oxygen
    const tip = new THREE.Vector3();
    const flamePos = new THREE.Vector3();
    const tubeMouth = new THREE.Vector3();

    const setState = (next: SplintState) => {
      state = next;
      timer = 0;
    };

    return (dt) => {
      noO2Cooldown -= dt;
      for (const v of tubes) {
        const h2o2 = amount(v.mix, 'h2o2');
        const cat = amount(v.mix, 'mno2');
        if (h2o2 > 0) api.done('peroxide');
        let rate = 0; // mL of O₂ per second
        if (h2o2 > 1e-6 && v.mix.volume > 0.5) {
          const c = h2o2 / (v.mix.volume / 1000);
          rate = cat > 0 ? 6 * Math.min(1, cat / 3) * (c / 0.88) : 0.01 * c;
          const mol = (rate * dt) / ML_PER_MOL;
          change(v.mix, 'h2o2', -2 * mol);
          if (cat > 0) api.done('catalyst');
        }
        v.bubbleRate = Math.min(60, rate * 9);
        const level = o2.get(v) ?? 0.21;
        const target = Math.max(0.21, Math.min(1, rate / 1.5));
        o2.set(v, level + (target - level) * dt * (target > level ? 1.5 : 0.06));
      }

      // Where is the splint tip, and is it inside a tube?
      s.tool.tipWorld(tip);
      let inside: (typeof tubes)[number] | null = null;
      for (const v of tubes) {
        v.mouthWorld(tubeMouth);
        const dx = tip.x - tubeMouth.x;
        const dz = tip.z - tubeMouth.z;
        if (dx * dx + dz * dz < (v.radius + 0.01) ** 2 && tip.y < tubeMouth.y + 0.01 && tip.y > tubeMouth.y - 0.13) inside = v;
      }
      const insideO2 = inside ? (o2.get(inside) ?? 0.21) : 0.21;

      flame.group.getWorldPosition(flamePos);
      flamePos.y += 0.035;
      if (flame.lit && s.tool.held !== null && tip.distanceTo(flamePos) < 0.04 && state !== 'burning') {
        setState('burning');
        api.done('light');
      }

      timer += dt;
      if (state === 'burning') {
        // In oxygen-rich air the flame flares up and keeps going.
        if (insideO2 > 0.35) timer = 0;
        else if (timer > BURN_TIME && tip.distanceTo(flamePos) > 0.05) {
          setState('glowing');
          api.done('glow');
          api.toast('o2.glowing');
        }
      } else if (state === 'glowing') {
        if (inside && insideO2 > 0.35) {
          setState('burning');
          audio.whoosh();
          lab.flash.fire(tip, 0.02);
          api.done('relight');
          api.toast('o2.relit');
        } else {
          insideFor = inside ? insideFor + dt : 0;
          if (insideFor > 0.6 && noO2Cooldown <= 0) {
            api.toast('o2.noO2');
            noO2Cooldown = 5;
          }
          if (timer > GLOW_TIME) setState('out');
        }
      }

      s.flame.lit = state === 'burning';
      s.flame.boost = state === 'burning' && insideO2 > 0.35 ? 1.8 : 1;
      s.ember.glow = state === 'glowing' ? 1 - timer / GLOW_TIME : state === 'burning' ? 1 : 0;
      s.ember.update(dt);
      s.char.visible = state !== 'fresh';
    };
  },
};
