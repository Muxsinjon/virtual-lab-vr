import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildBench } from './bench';
import {
  canvasTexture,
  ceilingTexture,
  chalkboardTexture,
  clockTexture,
  epoxyTexture,
  floorTexture,
  paintTexture,
  periodicTexture,
  safetyPosterTexture,
  tileTexture,
  woodTexture,
} from './textures';

// A school chemistry classroom around the bench. You stand at the origin facing -Z; your bench is
// in front of you, the boards are on the wall behind it, and more student benches are behind you.

export const BENCH = {
  top: 0.9,
  width: 1.8,
  front: -0.22,
  back: -0.92,
  z: -0.57,
};

export const SINK = { x: 0.7, z: -0.6, r: 0.13 };

/** The bench is modelled at this height; the table-height setting moves it (and all that's on it). */
export const BASE_TOP = 0.9;
export const TABLE_MIN = 0.6;
export const TABLE_MAX = 1.15;

/** Where the task board hangs on the back wall. */
export const BOARD = { x: 0, y: 1.84, z: -1.552, w: 1.5, h: 0.94 };

const ROOM = { left: -3.2, right: 3.2, back: -1.6, front: 3.6, height: 3 };
const TILE_HEIGHT = 1.25;

export const std = (color: number | string, roughness = 0.7, metalness = 0, map?: THREE.Texture) =>
  new THREE.MeshStandardMaterial({ color: map ? 0xffffff : color, roughness, metalness, map });

/** Merge static meshes that share a material, so the whole room costs a few dozen draw calls. */
export function mergeByMaterial(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const flags = new Map<THREE.Material, { cast: boolean; receive: boolean }>();
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrixWorld);
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    const list = buckets.get(m.material) ?? [];
    list.push(g);
    buckets.set(m.material, list);
    const f = flags.get(m.material) ?? { cast: false, receive: false };
    f.cast ||= m.castShadow;
    f.receive ||= m.receiveShadow;
    flags.set(m.material, f);
  });
  const merged = new THREE.Group();
  for (const [mat, geos] of buckets) {
    const g = mergeGeometries(geos, false);
    if (!g) continue;
    const mesh = new THREE.Mesh(g, mat);
    mesh.castShadow = flags.get(mat)!.cast;
    mesh.receiveShadow = flags.get(mat)!.receive;
    merged.add(mesh);
  }
  return merged;
}

export function buildRoom(scene: THREE.Scene) {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, ry = 0, rx = 0, cast = false) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    m.castShadow = cast;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const plane = (w: number, h: number) => new THREE.PlaneGeometry(w, h);

  // Materials.
  const floorMat = std(0, 0.8, 0, floorTexture());
  const tileMat = std(0, 0.35, 0, tileTexture());
  (tileMat.map as THREE.Texture).wrapS = (tileMat.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
  const paintMat = std(0, 0.95, 0, paintTexture('#e4d9c3'));
  const ceilingMat = std(0, 1, 0, ceilingTexture());
  const trimMat = std(0x6f8f84, 0.5);
  const epoxyMat = std(0, 0.22, 0.05, epoxyTexture());
  const woodMat = std(0, 0.6, 0, woodTexture());
  const darkWoodMat = std(0, 0.6, 0, woodTexture('#7b5434', '#55371f'));
  const steelMat = std(0xb9c0c4, 0.28, 0.85);
  const darkSteelMat = std(0x50585e, 0.45, 0.6);
  const blackMat = std(0x1c1f22, 0.6);
  const whiteMat = std(0xe9e6df, 0.5);
  const handleMat = std(0x9aa2a8, 0.25, 0.9);

  // Floor and ceiling.
  const W = ROOM.right - ROOM.left;
  const D = ROOM.front - ROOM.back;
  const cx = (ROOM.left + ROOM.right) / 2;
  const cz = (ROOM.back + ROOM.front) / 2;
  add(plane(W, D), floorMat, cx, 0, cz, 0, -Math.PI / 2);
  add(plane(W, D), ceilingMat, cx, ROOM.height, cz, 0, Math.PI / 2);

  // Walls: glazed tiles below, painted plaster above, a trim strip between.
  const wall = (len: number, x: number, z: number, ry: number) => {
    const tileGeo = plane(len, TILE_HEIGHT);
    const uv = tileGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (len / 0.6), uv.getY(i) * (TILE_HEIGHT / 0.6));
    add(tileGeo, tileMat, x, TILE_HEIGHT / 2, z, ry);
    add(plane(len, ROOM.height - TILE_HEIGHT), paintMat, x, TILE_HEIGHT + (ROOM.height - TILE_HEIGHT) / 2, z, ry);
    const n = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    add(box(len, 0.04, 0.02), trimMat, x + n.x * 0.01, TILE_HEIGHT, z + n.z * 0.01, ry);
    add(box(len, 0.1, 0.015), darkSteelMat, x + n.x * 0.008, 0.05, z + n.z * 0.008, ry);
  };
  wall(W, cx, ROOM.back, 0);
  wall(W, cx, ROOM.front, Math.PI);
  wall(D, ROOM.left, cz, Math.PI / 2);
  wall(D, ROOM.right, cz, -Math.PI / 2);

  // Ceiling light panels.
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff6e4 });
  for (const x of [-1.4, 1.4]) for (const z of [-0.4, 1.6]) {
    add(box(1.2, 0.03, 0.3), std(0xdedbd3, 0.6), x, ROOM.height - 0.015, z);
    add(plane(1.12, 0.24), lampMat, x, ROOM.height - 0.032, z, 0, Math.PI / 2);
  }

  // Windows on the right wall, with daylight behind them.
  const sky = canvasTexture(256, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#79b3e3');
    gr.addColorStop(0.55, '#cfe5f4');
    gr.addColorStop(0.62, '#9bbf7c');
    gr.addColorStop(1, '#6f9a58');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
  });
  const skyMat = new THREE.MeshBasicMaterial({ map: sky });
  const frameMat = std(0xf2f0ea, 0.4);
  for (const z of [-0.6, 1.4]) {
    add(plane(1.5, 1.2), skyMat, ROOM.right - 0.005, 1.8, z, -Math.PI / 2);
    for (const [w, h, y, dz] of [[1.6, 0.06, 2.4, 0], [1.6, 0.06, 1.2, 0], [0.06, 1.25, 1.8, -0.77], [0.06, 1.25, 1.8, 0.77], [0.04, 1.2, 1.8, 0], [1.5, 0.04, 1.8, 0]] as const)
      add(box(0.06, h, w), frameMat, ROOM.right - 0.03, y, z + dz);
    add(box(0.18, 0.04, 1.7), whiteMat, ROOM.right - 0.09, 1.17, z);
    // Radiator under each window.
    for (let i = 0; i < 10; i++) add(box(0.08, 0.55, 0.05), whiteMat, ROOM.right - 0.08, 0.45, z - 0.5 + i * 0.11, 0, 0, true);
  }

  // Back wall: chalkboard (left), task board bezel (centre), clock, wall cabinet (right).
  add(box(1.5, 0.82, 0.03), darkWoodMat, -1.75, 1.8, ROOM.back + 0.015);
  add(plane(1.4, 0.72), std(0, 0.9, 0, chalkboardTexture()), -1.75, 1.8, ROOM.back + 0.032);
  add(box(1.45, 0.04, 0.08), darkWoodMat, -1.75, 1.38, ROOM.back + 0.05);
  add(box(BOARD.w + 0.08, BOARD.h + 0.08, 0.04), blackMat, BOARD.x, BOARD.y, ROOM.back + 0.02);
  const clock = add(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 32), whiteMat, 0, 2.66, ROOM.back + 0.02, 0, Math.PI / 2);
  clock.rotation.set(Math.PI / 2, 0, 0);
  add(new THREE.CircleGeometry(0.15, 32), std(0, 0.6, 0, clockTexture()), 0, 2.66, ROOM.back + 0.041);

  // Wall cabinet with glass doors, full of reagent bottles.
  const cabX = 1.65;
  add(box(1.3, 0.9, 0.32), woodMat, cabX, 1.85, ROOM.back + 0.16, 0, 0, true);
  add(box(1.22, 0.82, 0.3), std(0xb59a78, 0.8), cabX, 1.85, ROOM.back + 0.17);
  const bottleColors = [0x6b3a12, 0x7a4a1c, 0xe8eef0, 0x2f5f8f, 0x6b3a12, 0xe8eef0, 0x3e6f4f, 0x8a2f2f];
  for (let s = 0; s < 2; s++) {
    add(box(1.2, 0.015, 0.28), woodMat, cabX, 1.47 + s * 0.4, ROOM.back + 0.17);
    for (let i = 0; i < 9; i++) {
      const h = 0.15 + ((i * 7 + s * 3) % 4) * 0.025;
      const col = bottleColors[(i + s * 5) % bottleColors.length];
      add(new THREE.CylinderGeometry(0.038, 0.038, h, 14), std(col, 0.2), cabX - 0.52 + i * 0.13, 1.48 + s * 0.4 + h / 2, ROOM.back + 0.17);
      add(new THREE.CylinderGeometry(0.015, 0.018, 0.03, 10), blackMat, cabX - 0.52 + i * 0.13, 1.48 + s * 0.4 + h + 0.015, ROOM.back + 0.17);
    }
  }
  const glassDoor = new THREE.MeshStandardMaterial({ color: 0xdfeff5, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false });
  add(plane(1.26, 0.86), glassDoor, cabX, 1.85, ROOM.back + 0.325);
  add(box(0.02, 0.86, 0.02), woodMat, cabX, 1.85, ROOM.back + 0.33);

  // Fume hood in the back-right corner.
  const hoodX = 2.45;
  const hoodZ = -1.15;
  add(box(1.1, 0.9, 0.8), whiteMat, hoodX, 0.45, hoodZ, 0, 0, true);
  add(box(1.12, 0.03, 0.82), epoxyMat, hoodX, 0.915, hoodZ);
  add(box(1.1, 0.75, 0.05), whiteMat, hoodX, 2.25, hoodZ + 0.37);
  add(box(0.05, 1.4, 0.8), whiteMat, hoodX - 0.53, 1.6, hoodZ);
  add(box(0.05, 1.4, 0.8), whiteMat, hoodX + 0.53, 1.6, hoodZ);
  add(box(1.1, 1.4, 0.03), std(0x2a2f33, 0.7), hoodX, 1.6, hoodZ - 0.38);
  add(box(1.1, 0.6, 0.8), whiteMat, hoodX, 2.7, hoodZ);
  add(plane(1.0, 0.8), glassDoor, hoodX, 1.5, hoodZ + 0.4);
  add(box(1.0, 0.03, 0.03), handleMat, hoodX, 1.1, hoodZ + 0.41);
  const hoodSign = canvasTexture(512, 128, (c, w, h) => {
    c.fillStyle = '#f2c230';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#1b1b1b';
    c.font = '800 54px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('MO‘RILI SHKAF', w / 2, 80);
  });
  add(plane(0.5, 0.125), std(0, 0.6, 0, hoodSign), hoodX, 2.25, hoodZ + 0.4);

  // Left wall: periodic table, safety poster, fire extinguisher, first-aid box.
  add(box(0.03, 0.72, 1.62), darkWoodMat, ROOM.left + 0.015, 1.75, -0.4);
  add(plane(1.56, 0.67), std(0, 0.8, 0, periodicTexture()), ROOM.left + 0.032, 1.75, -0.4, Math.PI / 2);
  add(plane(0.5, 0.7), std(0, 0.8, 0, safetyPosterTexture()), ROOM.left + 0.01, 1.65, 1.0, Math.PI / 2);
  const red = std(0xc62828, 0.35, 0.1);
  add(new THREE.CylinderGeometry(0.075, 0.075, 0.5, 20), red, ROOM.left + 0.15, 0.4, 1.8, 0, 0, true);
  add(new THREE.CylinderGeometry(0.03, 0.04, 0.08, 12), blackMat, ROOM.left + 0.15, 0.69, 1.8);
  add(box(0.3, 0.3, 0.1), std(0x2e7d32, 0.5), ROOM.left + 0.05, 1.55, 2.4, 0, 0, true);
  const cross = std(0xffffff, 0.5);
  add(box(0.02, 0.16, 0.05), cross, ROOM.left + 0.105, 1.55, 2.4);
  add(box(0.02, 0.05, 0.16), cross, ROOM.left + 0.105, 1.55, 2.4);

  // Other student benches behind you, with stools.
  const stoolSeat = std(0x234a6b, 0.6);
  for (const z of [1.2, 2.4]) {
    for (const x of [-1.3, 1.3]) {
      add(box(1.6, 0.035, 0.65), epoxyMat, x, 0.9, z, 0, 0, true);
      add(box(1.56, 0.78, 0.6), woodMat, x, 0.48, z, 0, 0, true);
      for (const sx of [-0.4, 0.4]) {
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 20), stoolSeat, x + sx, 0.65, z - 0.55, 0, 0, true);
        add(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 8), steelMat, x + sx, 0.31, z - 0.55);
        add(new THREE.CylinderGeometry(0.16, 0.18, 0.02, 20), darkSteelMat, x + sx, 0.01, z - 0.55);
      }
      // A rack and a couple of bottles left out.
      add(box(0.22, 0.06, 0.06), darkWoodMat, x - 0.3, 0.95, z - 0.1);
      add(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 14), std(0x6b3a12, 0.2), x + 0.4, 0.995, z - 0.12);
    }
  }

  // The teacher's desk by the board, to the left of your bench.
  add(box(1.2, 0.04, 0.6), darkWoodMat, -2.25, 0.76, -0.75, 0, 0, true);
  add(box(0.4, 0.72, 0.55), darkWoodMat, -2.6, 0.37, -0.75, 0, 0, true);
  add(box(0.04, 0.72, 0.55), darkWoodMat, -1.68, 0.37, -0.75);

  scene.add(mergeByMaterial(g));
  const bench = buildBench({ epoxyMat, woodMat, darkWoodMat, steelMat, darkSteelMat, blackMat, whiteMat, handleMat });
  scene.add(bench);

  // Light: warm ceiling light from above the bench, cool daylight from the windows.
  scene.add(new THREE.HemisphereLight(0xfff4e2, 0x6e6458, 0.75));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.9);
  key.position.set(-0.6, 2.9, 0.5);
  key.target.position.set(0, BENCH.top, BENCH.z);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -1.3;
  key.shadow.camera.right = 1.3;
  key.shadow.camera.top = 1.0;
  key.shadow.camera.bottom = -1.0;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 5;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  key.shadow.radius = 5;
  scene.add(key, key.target);
  const daylight = new THREE.DirectionalLight(0xcfe3ff, 0.7);
  daylight.position.set(4, 2.2, 0.2);
  daylight.target.position.set(0, 1, -0.5);
  scene.add(daylight, daylight.target);
  return { bench };
}
