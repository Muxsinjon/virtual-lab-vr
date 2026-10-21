import * as THREE from 'three';
import type { Mixture } from '../chem/mixture';
import { t, type Key } from '../i18n';
import { Ember, Flame } from './fx';
import type { Lab } from './lab';
import { curvedLabel, glassMaterial, reagentLabel, solidMaterial, Vessel, type Draw, type ReagentInfo } from './parts';
import { BENCH, SINK } from './room';
import { Tool } from './tools';

// Ready-made equipment that the topics put on the bench, at real-life sizes.

const Y = BENCH.top;
const FONT = '"Segoe UI", system-ui, sans-serif';

export const BAND = { acid: '#c62828', base: '#1f5fae', neutral: '#2e7d4f', oxidiser: '#e0a100', metal: '#5f6b75' };

export function sink(lab: Lab) {
  const v = new Vessel({ radius: SINK.r, height: 0.01, capacity: 1e9, sink: true });
  return lab.addVessel(v, SINK.x, Y, SINK.z);
}

export interface BottleSpec extends Omit<ReagentInfo, 'name'> {
  key: Key;
  amber?: boolean;
}

/** A 500 mL reagent bottle that never runs out. `mix` is what 100 mL of it contains. */
export function reagentBottle(lab: Lab, spec: BottleSpec, mix: Mixture, x: number, z: number) {
  const name = () => t(spec.key);
  const tool = new Tool(spec.key, name);
  const glass = spec.amber ? glassMaterial(0x7a3c0c, 0.55, 0.35) : glassMaterial();
  const v = new Vessel({ radius: 0.036, height: 0.18, neck: { r: 0.014, start: 0.128 }, infinite: true, glass });
  v.mix = mix;
  v.shownFill = 0.75;
  tool.root.add(v.root);
  tool.vessel = v;
  tool.use = 'pour';
  tool.pourRate = 16;
  tool.gripOffset = 0.08;
  tool.snapKinds = ['mouth'];
  tool.snapLift = 0.05;
  tool.tip.set(v.rimRadius, v.height, 0);
  tool.detail = () => `${spec.formula} · ${spec.detail}`;
  const label = lab.label(0.09, 0.068, reagentLabel({ ...spec, name }));
  const mesh = curvedLabel(0.0378, 0.068, label, 0.09 / 0.0378);
  mesh.position.y = 0.064;
  tool.root.add(mesh);
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

/** White enamel graduations printed on a beaker: a line every 25 mL, numbers every 50. */
const graduations =
  (capacity: number, heightOf: (ml: number) => number, labelH: number): Draw =>
  (c, W, H) => {
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.strokeStyle = 'rgba(255,255,255,0.95)';
    c.textBaseline = 'middle';
    const px = (m: number) => H - (m / labelH) * H;
    for (let ml = 25; ml <= capacity; ml += 25) {
      const y = px(heightOf(ml));
      const major = ml % 50 === 0;
      c.lineWidth = H * 0.008;
      c.beginPath();
      c.moveTo(W * 0.1, y);
      c.lineTo(W * (major ? 0.42 : 0.28), y);
      c.stroke();
      if (major) {
        c.font = `700 ${H * 0.07}px ${FONT}`;
        c.textAlign = 'left';
        c.fillText(String(ml), W * 0.46, y);
      }
    }
    c.font = `800 ${H * 0.085}px ${FONT}`;
    c.textAlign = 'center';
    c.fillText(`${capacity} mL`, W * 0.5, H * 0.08);
  };

export function beaker(lab: Lab, x: number, z: number) {
  const tool = new Tool('beaker', () => t('item.beaker'));
  const v = new Vessel({ radius: 0.036, height: 0.1 });
  tool.root.add(v.root);
  tool.vessel = v;
  tool.use = 'pour';
  tool.pourRate = 30;
  tool.gripOffset = 0.05;
  tool.snapKinds = ['mouth'];
  tool.snapLift = 0.04;
  tool.tip.set(v.rimRadius, v.height, 0);
  tool.detail = () => `${Math.round(v.mix.volume)} ${t('unit.ml')}`;
  const area = Math.PI * v.radius * v.radius;
  const labelH = 0.092;
  const marks = lab.label(0.05, labelH, graduations(250, (ml) => (ml * 1e-6) / area, labelH), true);
  const mesh = curvedLabel(v.radius + 0.0022, labelH, marks, 0.05 / 0.038);
  mesh.position.y = labelH / 2;
  mesh.renderOrder = 3;
  tool.root.add(mesh);
  // A small pouring lip.
  const lip = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.012, 10, 1, true, 0, Math.PI), glassMaterial());
  lip.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  lip.position.set(v.radius + 0.002, v.height - 0.002, 0);
  tool.root.add(lip);
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

/** A dropper standing in its amber bottle. Each drop adds `perDrop`. */
export function dropper(lab: Lab, key: Key, perDrop: Mixture, color: number, x: number, z: number) {
  const bottle = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 24), glassMaterial(0x7a3c0c, 0.6, 0.3));
  body.position.y = 0.035;
  body.renderOrder = 2;
  const inside = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.045, 20), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.7 }));
  inside.position.y = 0.0235;
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.022, 0.012, 20), glassMaterial(0x7a3c0c, 0.6, 0.3));
  shoulder.position.y = 0.076;
  bottle.add(inside, body, shoulder);
  const colorHex = `#${color.toString(16).padStart(6, '0')}`;
  const label = lab.label(0.055, 0.04, (c, W, H) => {
    c.fillStyle = '#f8f5ea';
    c.fillRect(0, 0, W, H);
    c.fillStyle = colorHex === '#e9eef0' ? '#b0157a' : colorHex;
    c.fillRect(0, 0, W, H * 0.22);
    c.fillStyle = '#16212c';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const name = t(key);
    const words = name.split(' ');
    const lines = words.length > 1 && name.length > 11 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [name];
    lines.forEach((l, i) => {
      const size = H * (lines.length > 1 ? 0.27 : 0.36);
      c.font = `800 ${size}px ${FONT}`;
      let s = size;
      while (c.measureText(l).width > W * 0.92 && s > 8) {
        s *= 0.92;
        c.font = `800 ${s}px ${FONT}`;
      }
      c.fillText(l, W / 2, H * (lines.length > 1 ? 0.45 + i * 0.3 : 0.6));
    });
  });
  const lm = curvedLabel(0.0225, 0.04, label, 0.055 / 0.0225);
  lm.position.y = 0.03;
  bottle.add(lm);
  bottle.position.set(x, Y, z);
  lab.group.add(bottle);

  const tool = new Tool(key, () => t(key));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0013, 0.09, 12, 1, true), glassMaterial(undefined, 0.15, 0.6));
  glass.position.y = 0.045;
  glass.renderOrder = 2;
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.0011, 0.05, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.2 }));
  fill.position.y = 0.026;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 16, 12), solidMaterial(0x1a1a1c, 0.55));
  bulb.scale.y = 1.7;
  bulb.position.y = 0.108;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.012, 0.012, 16), solidMaterial(0x1a1a1c, 0.55));
  cap.position.y = 0.09;
  tool.root.add(glass, fill, bulb, cap);
  tool.use = 'drip';
  tool.drop = { part: perDrop, color };
  tool.gripOffset = 0.1;
  tool.grabRadius = 0.06;
  tool.snapKinds = ['mouth'];
  tool.snapLift = 0.035;
  tool.tip.set(0, 0, 0);
  tool.setHome(x, Y + 0.0, z);
  return lab.addTool(tool);
}

/** A wide-mouth jar of granules or powder, poured by tipping it. */
export function jar(lab: Lab, spec: BottleSpec, part: Mixture, color: number, size: number, x: number, z: number, unit: 'pieces' | 'spoons') {
  const name = () => t(spec.key);
  const tool = new Tool(spec.key, name);
  const h = 0.09;
  const r = 0.034;
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(r - 0.003, 0), new THREE.Vector2(r, 0.004), new THREE.Vector2(r, h - 0.012), new THREE.Vector2(r - 0.006, h - 0.004), new THREE.Vector2(r - 0.006, h)], 28),
    glassMaterial(),
  );
  glass.renderOrder = 2;
  tool.root.add(glass);
  const grainMat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: color === 0x9aa3ab ? 0.7 : 0 });
  const grain = new THREE.IcosahedronGeometry(size, 0);
  for (let i = 0; i < 40; i++) {
    const g = new THREE.Mesh(grain, grainMat);
    const a = i * 2.4;
    const rr = Math.sqrt((i % 10) / 10) * (r - 0.007);
    g.position.set(Math.cos(a) * rr, size + Math.floor(i / 10) * size * 1.3, Math.sin(a) * rr);
    g.rotation.set(i, i * 0.7, 0);
    tool.root.add(g);
  }
  const label = lab.label(0.085, 0.05, reagentLabel({ ...spec, name }));
  const lm = curvedLabel(r + 0.001, 0.05, label, 0.085 / (r + 0.001));
  lm.position.y = 0.045;
  tool.root.add(lm);
  tool.use = 'pour';
  tool.solid = { part, color, size, perSecond: 5, unit };
  tool.gripOffset = 0.045;
  tool.snapKinds = ['mouth'];
  tool.snapLift = 0.045;
  tool.tip.set(r - 0.006, h, 0);
  tool.detail = () => `${spec.formula} · ${spec.detail}`;
  tool.setHome(x, Y, z);
  return lab.addTool(tool);
}

/** A wooden test-tube rack with `n` tubes in its first slots. Returns the tubes and slot positions. */
export function rackWithTubes(lab: Lab, x: number, z: number, slots: number, n: number) {
  const rack = new THREE.Group();
  const wood = solidMaterial(0xa8743f, 0.65);
  const span = 0.05 * slots + 0.04;
  const slotX = (i: number) => x - (0.05 * (slots - 1)) / 2 + i * 0.05;
  const base = new THREE.Mesh(new THREE.BoxGeometry(span, 0.012, 0.06), wood);
  base.position.y = 0.006;
  const top = new THREE.Mesh(new THREE.BoxGeometry(span, 0.01, 0.05), wood);
  top.position.y = 0.06;
  rack.add(base, top);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.07, 0.05), wood);
    side.position.set((sx * span) / 2, 0.035, 0);
    rack.add(side);
  }
  // Dark rings where the tubes go through the top board.
  for (let i = 0; i < slots; i++) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.0115, 16), solidMaterial(0x3a2414, 0.9));
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(slotX(i) - x, 0.0652, 0);
    rack.add(hole);
  }
  rack.position.set(x, Y, z);
  lab.group.add(rack);
  const tubes: Vessel[] = [];
  for (let i = 0; i < n; i++) {
    const v = new Vessel({ radius: 0.0085, height: 0.15, roundBottom: true });
    lab.addVessel(v, slotX(i), Y + 0.014, z);
    tubes.push(v);
  }
  return { tubes, slotX };
}

export function spiritLamp(lab: Lab, x: number, z: number) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(
      [new THREE.Vector2(0, 0), new THREE.Vector2(0.042, 0), new THREE.Vector2(0.046, 0.02), new THREE.Vector2(0.034, 0.052), new THREE.Vector2(0.013, 0.062), new THREE.Vector2(0.013, 0.07)],
      32,
    ),
    glassMaterial(),
  );
  body.renderOrder = 2;
  const alcohol = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.042, 0.024, 28), new THREE.MeshStandardMaterial({ color: 0xa9c8e8, transparent: true, opacity: 0.35, depthWrite: false }));
  alcohol.position.y = 0.013;
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.018, 16), solidMaterial(0xb7bcc0, 0.3, 0.85));
  holder.position.y = 0.077;
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.01, 8), solidMaterial(0x3a2a1c, 1));
  wick.position.y = 0.09;
  g.add(alcohol, body, holder, wick);
  g.position.set(x, Y, z);
  lab.group.add(g);

  const flame = new Flame(1.2, true);
  flame.group.position.set(0, 0.093, 0);
  g.add(flame.group);
  lab.flames.push(flame);
  lab.addFlameSnap(flame);
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
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0105, 0.0016, 6, 24), glassMaterial(undefined, 0.4, 0.4));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h;
  tool.root.add(glass, rim);
  // A faint haze shows how much gas has been collected, from the closed end.
  const gas = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0095, 0.0095, 1, 16),
    new THREE.MeshBasicMaterial({ color: 0xbfe4ff, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  gas.visible = false;
  tool.root.add(gas);
  tool.tip.set(0, h, 0);
  tool.gripOffset = 0.06;
  tool.snapKinds = ['mouth', 'flame'];
  tool.snapLift = 0.012;
  tool.desktopQuat.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
  tool.setHome(x, Y + 0.014, z);
  lab.addTool(tool);
  let fill = 0;
  tool.detail = () => (fill > 0.02 ? `H₂ ${Math.round(fill * 100)}%` : '');
  const setGas = (f: number) => {
    fill = f;
    gas.visible = f > 0.02;
    const len = h * 0.95 * f;
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
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.09, 12), glassMaterial(undefined, 0.2, 0.6));
  rod.position.y = 0.045;
  rod.renderOrder = 2;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 12, 8), new THREE.MeshStandardMaterial({ color: 0xdfeef6, transparent: true, opacity: 0.7 }));
  bulb.position.y = 0.005;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.13, 0.02), solidMaterial(0x1f6f8b, 0.45));
  body.position.y = 0.155;
  body.castShadow = true;
  const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, 0.02), solidMaterial(0x15232c, 0.5));
  capTop.position.y = 0.226;
  tool.root.add(rod, bulb, body, capTop);
  let reading: number | null = null;
  const screen = lab.label(0.03, 0.026, (c, W, H) => {
    c.fillStyle = '#a9d8b3';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#0d2614';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `600 ${H * 0.26}px ${FONT}`;
    c.fillText('pH', W / 2, H * 0.22);
    c.font = `800 ${H * 0.52}px ${FONT}`;
    c.fillText(reading === null ? '- -' : reading.toFixed(1), W / 2, H * 0.64);
  });
  screen.mesh.position.set(0, 0.185, 0.0102);
  tool.root.add(screen.mesh);
  tool.gripOffset = 0.15;
  tool.snapKinds = ['liquid'];
  tool.snapLift = 0;
  tool.tip.set(0, 0, 0);
  tool.detail = () => (reading === null ? '' : `pH ${reading.toFixed(1)}`);
  // Stands in a small holder.
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.05, 18), solidMaterial(0x15232c, 0.5));
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
