import * as THREE from 'three';
import { BASE_TOP, BENCH, mergeByMaterial, SINK, std } from './room';
import { canvasTexture } from './textures';

// Your bench, modelled with its top at BASE_TOP: epoxy top, oak cabinets, sink, gas taps, a
// reagent shelf along the back and the usual clutter of a school lab. The table-height setting
// moves this whole group; the cabinet runs on below the floor, so raising it never shows a gap.

export interface BenchMaterials {
  epoxyMat: THREE.Material;
  woodMat: THREE.Material;
  darkWoodMat: THREE.Material;
  steelMat: THREE.Material;
  darkSteelMat: THREE.Material;
  blackMat: THREE.Material;
  whiteMat: THREE.Material;
  handleMat: THREE.Material;
}

/** A printed label for the decorative bottles on the shelf. */
function shelfLabel(formula: string, band: string) {
  return canvasTexture(256, 192, (c, w, h) => {
    c.fillStyle = '#f6f2e6';
    c.fillRect(0, 0, w, h);
    c.fillStyle = band;
    c.fillRect(0, 0, w, h * 0.24);
    c.fillStyle = '#16212c';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    let size = 76;
    c.font = `800 ${size}px "Segoe UI", sans-serif`;
    while (c.measureText(formula).width > w * 0.9 && size > 20) {
      size -= 4;
      c.font = `800 ${size}px "Segoe UI", sans-serif`;
    }
    c.fillText(formula, w / 2, h * 0.62);
  });
}

export function buildBench(m: BenchMaterials) {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, ry = 0, rx = 0, cast = false) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, 0);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rt: number, rb: number, h: number, seg = 20) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const T = BASE_TOP;

  // Top and cabinets.
  const depth = BENCH.front - BENCH.back + 0.04;
  add(box(BENCH.width, 0.035, depth), m.epoxyMat, 0, T - 0.0175, BENCH.z, 0, 0, true);
  const cabTop = T - 0.035;
  const cabBottom = -0.4;
  add(box(BENCH.width - 0.04, cabTop - cabBottom, depth - 0.08), m.woodMat, 0, (cabTop + cabBottom) / 2, BENCH.z - 0.02, 0, 0, true);
  add(box(BENCH.width - 0.1, 0.5, depth - 0.14), m.blackMat, 0, -0.15, BENCH.z - 0.04);
  const frontZ = BENCH.z - 0.02 + (depth - 0.08) / 2 + 0.001;
  for (let i = 0; i < 4; i++) {
    const x = -0.66 + i * 0.44;
    add(new THREE.PlaneGeometry(0.41, 0.15), m.darkWoodMat, x, T - 0.12, frontZ);
    add(new THREE.PlaneGeometry(0.41, 0.56), m.darkWoodMat, x, T - 0.5, frontZ);
    add(box(0.12, 0.014, 0.022), m.handleMat, x, T - 0.12, frontZ + 0.012);
    add(box(0.012, 0.12, 0.022), m.handleMat, x + 0.17, T - 0.38, frontZ + 0.012);
  }

  // Gas taps and a socket along the back edge.
  const brass = std(0xb8913a, 0.3, 0.9);
  for (const x of [-0.45, 0.25]) {
    add(cyl(0.012, 0.014, 0.08, 12), brass, x, T + 0.04, BENCH.back + 0.04);
    add(cyl(0.006, 0.006, 0.05, 8), brass, x, T + 0.07, BENCH.back + 0.065, 0, Math.PI / 2);
    add(box(0.03, 0.012, 0.012), std(0xd84315, 0.5), x, T + 0.085, BENCH.back + 0.04);
  }
  add(box(0.12, 0.08, 0.04), m.whiteMat, -0.1, T + 0.04, BENCH.back + 0.03);

  // Sink: a dark steel basin with a swan-neck tap.
  add(cyl(SINK.r + 0.012, SINK.r + 0.012, 0.012, 36), m.steelMat, SINK.x, T + 0.002, SINK.z);
  add(new THREE.CircleGeometry(SINK.r, 36), m.darkSteelMat, SINK.x, T + 0.0085, SINK.z, 0, -Math.PI / 2);
  add(new THREE.CircleGeometry(0.02, 16), m.blackMat, SINK.x, T + 0.009, SINK.z, 0, -Math.PI / 2);
  add(cyl(0.011, 0.014, 0.3, 14), m.steelMat, SINK.x, T + 0.15, SINK.z - SINK.r - 0.04, 0, 0, true);
  add(new THREE.TorusGeometry(0.07, 0.009, 10, 24, Math.PI), m.steelMat, SINK.x, T + 0.3, SINK.z - SINK.r + 0.03, Math.PI / 2, 0, true);
  add(box(0.06, 0.012, 0.012), m.steelMat, SINK.x - 0.035, T + 0.22, SINK.z - SINK.r - 0.04);

  // Reagent shelf along the back of the bench, above the gas taps.
  const shelfZ = BENCH.back + 0.045;
  const shelfY = T + 0.27;
  const shelfL = -0.88;
  const shelfR = 0.5;
  add(box(shelfR - shelfL, 0.018, 0.085), m.woodMat, (shelfL + shelfR) / 2, shelfY, shelfZ, 0, 0, true);
  add(box(shelfR - shelfL, 0.03, 0.006), m.woodMat, (shelfL + shelfR) / 2, shelfY + 0.022, shelfZ + 0.04);
  for (const x of [shelfL + 0.01, (shelfL + shelfR) / 2, shelfR - 0.01]) add(cyl(0.008, 0.008, 0.27, 10), m.steelMat, x, T + 0.135, shelfZ - 0.02, 0, 0, true);
  const glass = new THREE.MeshStandardMaterial({ color: 0xeaf4f6, roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false, envMapIntensity: 2 });
  const amber = new THREE.MeshStandardMaterial({ color: 0x6b3510, roughness: 0.12, transparent: true, opacity: 0.82, envMapIntensity: 1.6 });
  const capMat = std(0x1d1f22, 0.5);
  const crystals = std(0xf2f2ee, 0.9);
  // [formula, label colour, solution colour (null: white crystals or opaque amber), amber glass, height]
  const shelfBottles: [string, string, number | null, boolean, number][] = [
    ['CuSO₄', '#1f5fae', 0x2f7fd0, false, 0.12],
    ['NaCl', '#2e7d4f', null, false, 0.1],
    ['KMnO₄', '#7b2fa0', 0x6a1b8a, false, 0.12],
    ['H₂SO₄', '#c62828', null, true, 0.13],
    ['C₂H₅OH', '#e0a100', null, false, 0.11],
    ['FeCl₃', '#a35214', 0xb5651d, false, 0.1],
    ['AgNO₃', '#5f6b75', null, true, 0.12],
    ['Na₂CO₃', '#2e7d4f', null, false, 0.1],
    ['HNO₃', '#c62828', null, true, 0.13],
  ];
  shelfBottles.forEach(([formula, band, liquid, brown, h], i) => {
    const x = shelfL + 0.08 + i * 0.152;
    const y = shelfY + 0.009;
    add(cyl(0.026, 0.026, h, 20), brown ? amber : glass, x, y + h / 2, shelfZ, 0, 0, true);
    add(cyl(0.011, 0.02, 0.018, 16), brown ? amber : glass, x, y + h + 0.009, shelfZ);
    add(cyl(0.013, 0.013, 0.02, 16), capMat, x, y + h + 0.026, shelfZ);
    if (liquid !== null) add(cyl(0.024, 0.024, h * 0.7, 18), new THREE.MeshStandardMaterial({ color: liquid, roughness: 0.1, transparent: true, opacity: 0.85 }), x, y + h * 0.35 + 0.002, shelfZ);
    else if (!brown) add(cyl(0.024, 0.024, h * 0.55, 18), crystals, x, y + h * 0.275 + 0.002, shelfZ);
    const map = shelfLabel(formula, band);
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0265, 0.0265, h * 0.42, 16, 1, true, -0.9, 1.8),
      new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.8 }),
    );
    label.position.set(x, y + h * 0.48, shelfZ);
    g.add(label);
  });

  // Left end: a retort stand holding a round-bottom flask of copper sulphate solution.
  const sx = -0.79;
  const sz = -0.6;
  add(box(0.15, 0.012, 0.11), m.darkSteelMat, sx, T + 0.006, sz, 0, 0, true);
  add(cyl(0.006, 0.006, 0.5, 10), m.steelMat, sx - 0.05, T + 0.25, sz - 0.035, 0, 0, true);
  add(box(0.03, 0.022, 0.022), m.darkSteelMat, sx - 0.05, T + 0.29, sz - 0.035);
  add(box(0.08, 0.008, 0.008), m.steelMat, sx - 0.01, T + 0.29, sz - 0.035, 0, 0, true);
  add(new THREE.TorusGeometry(0.014, 0.003, 8, 16), m.steelMat, sx + 0.035, T + 0.29, sz - 0.035, 0, Math.PI / 2);
  const flaskY = T + 0.18;
  add(new THREE.SphereGeometry(0.05, 28, 20), glass, sx + 0.035, flaskY, sz - 0.035);
  add(cyl(0.012, 0.012, 0.11, 16), glass, sx + 0.035, flaskY + 0.09, sz - 0.035);
  add(
    new THREE.SphereGeometry(0.047, 24, 12, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58),
    new THREE.MeshStandardMaterial({ color: 0x2b7fd4, roughness: 0.1, transparent: true, opacity: 0.85 }),
    sx + 0.035, flaskY, sz - 0.035,
  );
  add(new THREE.TorusGeometry(0.045, 0.003, 8, 24), m.steelMat, sx + 0.035, flaskY - 0.045, sz - 0.035, 0, Math.PI / 2);

  // Front-left corner: two Erlenmeyer flasks and a pair of safety goggles.
  const erlen = (x: number, z: number, color: number) => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.038, 0), new THREE.Vector2(0.04, 0.004), new THREE.Vector2(0.013, 0.085), new THREE.Vector2(0.013, 0.12), new THREE.Vector2(0.015, 0.122)];
    add(new THREE.LatheGeometry(pts, 28), glass, x, T, z);
    const liquidPts = [new THREE.Vector2(0, 0.002), new THREE.Vector2(0.037, 0.002), new THREE.Vector2(0.03, 0.03), new THREE.Vector2(0, 0.03)];
    add(new THREE.LatheGeometry(liquidPts, 24), new THREE.MeshStandardMaterial({ color, roughness: 0.1, transparent: true, opacity: 0.8 }), x, T, z);
  };
  erlen(-0.8, -0.36, 0xe8892a);
  erlen(-0.7, -0.3, 0x3fae49);
  // Safety goggles standing on the bench: a curved clear visor, black rims, and the elastic strap
  // lying in a loop behind.
  const lens = new THREE.MeshStandardMaterial({ color: 0xbfe3f5, roughness: 0.04, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 2 });
  const rubber = std(0x22282d, 0.75);
  const arc = (r: number, y: number, from: number, to: number) =>
    new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => {
      const a = from + ((to - from) * i) / 12;
      return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    }));
  const gx = -0.56;
  const gz = -0.32;
  const gr = -0.4;
  add(new THREE.CylinderGeometry(0.065, 0.065, 0.046, 28, 1, true, -1.15, 2.3), lens, gx, T + 0.03, gz, gr);
  for (const y of [-0.023, 0.023]) add(new THREE.TubeGeometry(arc(0.066, y, -1.15, 1.15), 24, 0.004, 6), rubber, gx, T + 0.03, gz, gr, 0, true);
  add(new THREE.TubeGeometry(arc(0.07, -0.02, 1.15, Math.PI * 2 - 1.15), 32, 0.006, 6), rubber, gx, T + 0.03, gz, gr);

  // Back corners: a measuring cylinder, a wash bottle and a paper-towel roll by the sink.
  add(cyl(0.015, 0.015, 0.24, 18), glass, -0.86, T + 0.135, -0.73);
  add(cyl(0.028, 0.028, 0.012, 6), glass, -0.86, T + 0.006, -0.73);
  add(cyl(0.0135, 0.0135, 0.09, 16), new THREE.MeshStandardMaterial({ color: 0xbfdbe8, transparent: true, opacity: 0.45 }), -0.86, T + 0.058, -0.73);
  add(cyl(0.034, 0.036, 0.15, 20), std(0xf4f4f0, 0.45), 0.5, T + 0.075, -0.84, 0, 0, true);
  const blue = std(0x1565c0, 0.5);
  add(cyl(0.016, 0.022, 0.025, 14), blue, 0.5, T + 0.162, -0.84);
  const nozzle = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0.025, 0.075, 0), new THREE.Vector3(0.06, 0.06, 0)]),
    16,
    0.0028,
    8,
  );
  add(nozzle, blue, 0.5, T + 0.172, -0.84, -0.6);
  add(cyl(0.006, 0.006, 0.3, 8), m.steelMat, 0.87, T + 0.15, -0.84);
  add(box(0.04, 0.02, 0.06), m.darkSteelMat, 0.87, T + 0.01, -0.84);
  add(cyl(0.055, 0.055, 0.22, 24), std(0xfbfaf6, 0.95), 0.87, T + 0.13, -0.84, 0, 0, true);
  // A box of nitrile gloves, front right.
  add(box(0.13, 0.07, 0.24), std(0x2d6cc0, 0.6), 0.82, T + 0.035, -0.32, 0.25, 0, true);
  add(box(0.04, 0.012, 0.05), std(0x6fa8f0, 0.7), 0.82, T + 0.076, -0.32, 0.25);

  const merged = mergeByMaterial(g);
  merged.position.y = BENCH.top - BASE_TOP;
  return merged;
}
