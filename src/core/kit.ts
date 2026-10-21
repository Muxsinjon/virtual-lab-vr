import * as THREE from 'three';
import type { Mixture } from '../chem/mixture';
import { t, type Key } from '../i18n';
import { Ember, Flame } from './fx';
import type { Lab } from './lab';
import { curvedLabel, glassMaterial, solidMaterial, Vessel } from './parts';
import { BENCH, SINK } from './room';
import { Tool } from './tools';

// Ready-made equipment that the topics put on the bench.

const Y = BENCH.top;

export function sink(lab: Lab) {
  const v = new Vessel({ radius: SINK.r, height: 0.02, capacity: 1e9, sink: true });
  return lab.addVessel(v, SINK.x, Y, SINK.z);
}

/** A reagent bottle that never runs out. `mix` is what 100 mL of it contains. */
export function reagentBottle(lab: Lab, key: Key, formula: string, mix: Mixture, x: number, z: number, liquidColor?: number) {
  const tool = new Tool(key, () => t(key));
  const v = new Vessel({ radius: 0.03, height: 0.16, neck: { r: 0.013, start: 0.11 }, infinite: true });
  v.mix = mix;
  if (liquidColor !== undefined) v.tint = () => ({ color: liquidColor, opacity: 0.55 });
  tool.root.add(v.root);
  tool.vessel = v;
  tool.use = 'pour';
  tool.pourRate = 16;
  tool.gripOffset = 0.07;
  tool.snapKinds = ['mouth'];
  tool.snapLift = 0.05;
  tool.tip.set(v.rimRadius, v.height, 0);
  const label = lab.label(0.075, 0.05, () => [formula, t(key)]);
  const mesh = curvedLabel(0.0318, 0.05, label);
  mesh.position.y = 0.06;
  tool.root.add(mesh);
  // Ground-glass stopper resting next to the bottle is implied; the bottle stays open.
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

export function beaker(lab: Lab, x: number, z: number) {
  const tool = new Tool('beaker', () => t('item.beaker'));
  const v = new Vessel({ radius: 0.034, height: 0.095 });
  tool.root.add(v.root);
  tool.vessel = v;
  tool.use = 'pour';
  tool.pourRate = 30;
  tool.gripOffset = 0.045;
  tool.snapKinds = ['mouth'];
  tool.snapLift = 0.04;
  tool.tip.set(v.rimRadius, v.height, 0);
  // Graduation marks every 50 mL.
  const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  const area = Math.PI * v.radius * v.radius;
  for (let ml = 50; ml < v.capacity; ml += 50) {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.0012), markMat);
    mark.position.set(0, (ml * 1e-6) / area, v.radius + 0.0022);
    tool.root.add(mark);
  }
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

/** A dropper standing in its small bottle. Each drop adds `perDrop`. */
export function dropper(lab: Lab, key: Key, perDrop: Mixture, color: number, x: number, z: number) {
  const bottle = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.06, 20),
    new THREE.MeshStandardMaterial({ color: 0x6b3a12, roughness: 0.2, transparent: true, opacity: 0.75 }),
  );
  body.position.y = 0.03;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.012, 16), solidMaterial(0x6b3a12, 0.2));
  neck.position.y = 0.066;
  bottle.add(body, neck);
  const label = lab.label(0.05, 0.03, () => [t(key)], { bg: '#fffdf5', fg: '#1d2a3a' });
  const lm = curvedLabel(0.0185, 0.03, label, Math.PI * 0.9);
  lm.position.y = 0.03;
  bottle.add(lm);
  bottle.position.set(x, Y, z);
  lab.group.add(bottle);

  const tool = new Tool(key, () => t(key));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0012, 0.085, 12, 1, true), glassMaterial());
  glass.position.y = 0.0425;
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.001, 0.045, 10), new THREE.MeshBasicMaterial({ color }));
  fill.position.y = 0.0245;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 14, 10), solidMaterial(0x1d1d1f, 0.6));
  bulb.scale.y = 1.7;
  bulb.position.y = 0.1;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.008, 12), solidMaterial(0x1d1d1f, 0.6));
  collar.position.y = 0.086;
  tool.root.add(glass, fill, bulb, collar);
  tool.use = 'drip';
  tool.drop = { part: perDrop, color };
  tool.gripOffset = 0.09;
  tool.grabRadius = 0.06;
  tool.snapKinds = ['mouth'];
  tool.snapLift = 0.035;
  tool.tip.set(0, 0, 0);
  tool.setHome(x, Y + 0.03, z);
  return lab.addTool(tool);
}

/** A wide jar of granules or powder, poured by tipping it. */
export function jar(lab: Lab, key: Key, formula: string, part: Mixture, color: number, size: number, x: number, z: number, unit: 'pieces' | 'spoons') {
  const tool = new Tool(key, () => t(key));
  const h = 0.075;
  const r = 0.03;
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(r, 0), new THREE.Vector2(r, h - 0.01), new THREE.Vector2(r - 0.006, h)], 24),
    glassMaterial(),
  );
  glass.renderOrder = 2;
  tool.root.add(glass);
  const grainMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: color === 0x9aa3ab ? 0.6 : 0 });
  const grain = new THREE.IcosahedronGeometry(size, 0);
  for (let i = 0; i < 26; i++) {
    const g = new THREE.Mesh(grain, grainMat);
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * (r - 0.006);
    g.position.set(Math.cos(a) * rr, size + Math.random() * 0.02, Math.sin(a) * rr);
    g.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    tool.root.add(g);
  }
  const label = lab.label(0.07, 0.034, () => [formula, t(key)]);
  const lm = curvedLabel(r + 0.001, 0.034, label);
  lm.position.y = 0.04;
  tool.root.add(lm);
  tool.use = 'pour';
  tool.solid = { part, color, size, perSecond: 5, unit };
  tool.gripOffset = 0.04;
  tool.snapKinds = ['mouth'];
  tool.snapLift = 0.045;
  tool.tip.set(r - 0.006, h, 0);
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

/** A wooden test-tube rack with `n` tubes in its first slots. Returns the tubes and slot positions. */
export function rackWithTubes(lab: Lab, x: number, z: number, slots: number, n: number) {
  const rack = new THREE.Group();
  const wood = solidMaterial(0xb98a55, 0.7);
  const span = 0.05 * slots + 0.04;
  const slotX = (i: number) => x - (0.05 * (slots - 1)) / 2 + i * 0.05;
  for (const y of [0.008, 0.045]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(span, 0.01, 0.05), wood);
    plate.position.y = y;
    plate.castShadow = true;
    rack.add(plate);
  }
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.055, 0.05), wood);
    side.position.set((sx * span) / 2, 0.0275, 0);
    rack.add(side);
  }
  rack.position.set(x, Y, z);
  lab.group.add(rack);
  const tubes: Vessel[] = [];
  for (let i = 0; i < n; i++) {
    const v = new Vessel({ radius: 0.0085, height: 0.15, roundBottom: true });
    lab.addVessel(v, slotX(i), Y + 0.016, z);
    tubes.push(v);
  }
  return { tubes, slotX };
}

export function spiritLamp(lab: Lab, x: number, z: number) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(
      [new THREE.Vector2(0, 0), new THREE.Vector2(0.04, 0), new THREE.Vector2(0.042, 0.02), new THREE.Vector2(0.03, 0.05), new THREE.Vector2(0.012, 0.06), new THREE.Vector2(0.012, 0.068)],
      28,
    ),
    glassMaterial(),
  );
  body.renderOrder = 2;
  const alcohol = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.038, 0.022, 24), new THREE.MeshStandardMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.4 }));
  alcohol.position.y = 0.012;
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.016, 14), solidMaterial(0xb0b6bb, 0.3, 0.8));
  holder.position.y = 0.074;
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.01, 8), solidMaterial(0xf1ead6, 1));
  wick.position.y = 0.086;
  g.add(body, alcohol, holder, wick);
  g.position.set(x, Y, z);
  lab.group.add(g);

  const flame = new Flame(1.2, true);
  flame.group.position.set(0, 0.09, 0);
  g.add(flame.group);
  lab.flames.push(flame);
  lab.addFlameSnap(flame);
  const label = lab.label(0.06, 0.02, () => [t('item.burner')], { bg: 'transparent', fg: '#e8eef2' });
  label.mesh.position.set(0, 0.002, 0.065);
  label.mesh.rotation.x = -Math.PI / 2;
  label.mesh.position.y = 0.001;
  g.add(label.mesh);
  lab.addPressable(body, () => {
    flame.lit = !flame.lit;
  });
  return flame;
}

/** A wooden splint with its own flame and glowing tip. Lies on the bench until picked up. */
export function splint(lab: Lab, x: number, z: number) {
  const tool = new Tool('splint', () => t('item.splint'));
  const len = 0.17;
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.005, len, 0.005), solidMaterial(0xd9b77e, 0.8));
  stick.position.y = len / 2;
  stick.castShadow = true;
  tool.root.add(stick);
  const char = new THREE.Mesh(new THREE.BoxGeometry(0.0055, 0.014, 0.0055), solidMaterial(0x2a1d14, 1));
  char.position.y = len - 0.007;
  char.visible = false;
  tool.root.add(char);
  const flame = new Flame(0.55);
  flame.group.position.y = len;
  flame.lit = false;
  tool.root.add(flame.group);
  lab.flames.push(flame);
  const ember = new Ember();
  ember.mesh.position.y = len;
  tool.root.add(ember.mesh);
  tool.tip.set(0, len, 0);
  tool.gripOffset = 0.03;
  tool.grabRadius = 0.1;
  tool.snapKinds = ['flame', 'mouth'];
  tool.snapLift = -0.025;
  // Held with the mouse, the tip points down and away so it can go into a tube.
  tool.desktopQuat.setFromEuler(new THREE.Euler(0, 0, Math.PI * 0.82));
  tool.setHome(x, Y + 0.003, z, 0, -Math.PI / 2);
  lab.addTool(tool);
  return { tool, flame, ember, char };
}

/** An empty test tube for collecting gas, held upside down. */
export function collectorTube(lab: Lab, x: number, z: number) {
  const tool = new Tool('collector', () => t('item.collector'));
  const h = 0.15;
  const glass = new THREE.Mesh(new THREE.LatheGeometry(roundTube(0.0105, h), 24), glassMaterial());
  glass.renderOrder = 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0105, 0.0016, 6, 24), glassMaterial());
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h;
  tool.root.add(glass, rim);
  // A faint haze shows how much gas has been collected, from the closed end.
  const gas = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0095, 0.0095, 1, 16),
    new THREE.MeshBasicMaterial({ color: 0xbfe4ff, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  gas.visible = false;
  tool.root.add(gas);
  tool.tip.set(0, h, 0);
  tool.gripOffset = 0.06;
  tool.snapKinds = ['mouth', 'flame'];
  tool.snapLift = 0.012;
  tool.desktopQuat.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
  tool.setHome(x, Y + 0.016, z);
  lab.addTool(tool);
  const setGas = (fill: number) => {
    gas.visible = fill > 0.02;
    const len = h * 0.95 * fill;
    gas.scale.y = Math.max(0.0001, len);
    gas.position.y = 0.006 + len / 2;
  };
  return { tool, setGas };
}

function roundTube(r: number, h: number) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.sin(a) * r, r - Math.cos(a) * r));
  }
  pts.push(new THREE.Vector2(r, h));
  return pts;
}

/** A pen-style pH meter. Its origin is the tip of the probe. */
export function phProbe(lab: Lab, x: number, z: number) {
  const tool = new Tool('probe', () => t('item.probe'));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 12), glassMaterial());
  rod.position.y = 0.045;
  rod.renderOrder = 2;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.005, 12, 8), new THREE.MeshStandardMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.6 }));
  bulb.position.y = 0.004;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.11, 0.018), solidMaterial(0x24323d, 0.5));
  body.position.y = 0.145;
  body.castShadow = true;
  tool.root.add(rod, bulb, body);
  let reading: number | null = null;
  const screen = lab.label(0.026, 0.02, () => ['pH', reading === null ? '– –' : reading.toFixed(1)], { bg: '#b8e3c4', fg: '#0f2a18' });
  screen.mesh.position.set(0, 0.17, 0.0092);
  tool.root.add(screen.mesh);
  tool.gripOffset = 0.14;
  tool.snapKinds = ['liquid'];
  tool.snapLift = 0;
  tool.tip.set(0, 0, 0);
  // Stands in a small holder.
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.05, 16), solidMaterial(0x24323d, 0.5));
  holder.position.set(x, Y + 0.025, z);
  lab.group.add(holder);
  tool.setHome(x, Y + 0.012, z);
  lab.addTool(tool);
  const show = (pH: number | null) => {
    const next = pH === null ? null : Math.round(pH * 10) / 10;
    if (next === reading) return;
    reading = next;
    screen.redraw();
  };
  return { tool, show };
}
