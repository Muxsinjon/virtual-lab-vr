import * as THREE from 'three';
import { solidMaterial } from './parts';

// The classroom lab around the bench. You stand at the origin facing -Z; the bench is in front.

export const BENCH = {
  top: 0.9,
  width: 1.8,
  front: -0.22,
  back: -0.92,
  z: -0.57,
};

export const SINK = { x: 0.7, z: -0.6, r: 0.13 };

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...repeat);
  }
  return tex;
}

const floorTexture = () =>
  canvasTexture(
    256,
    256,
    (c) => {
      c.fillStyle = '#c9cdd1';
      c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1400; i++) {
        c.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '90,95,100'},0.07)`;
        c.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
      c.strokeStyle = '#aeb3b8';
      c.lineWidth = 3;
      c.strokeRect(0, 0, 256, 256);
    },
    [12, 12],
  );

// Periods 1–4 of the periodic table: [symbol, period, group, category].
const ELEMENTS: [string, number, number, number][] = [
  ['H', 1, 1, 0], ['He', 1, 18, 5],
  ['Li', 2, 1, 1], ['Be', 2, 2, 2], ['B', 2, 13, 4], ['C', 2, 14, 0], ['N', 2, 15, 0], ['O', 2, 16, 0], ['F', 2, 17, 6], ['Ne', 2, 18, 5],
  ['Na', 3, 1, 1], ['Mg', 3, 2, 2], ['Al', 3, 13, 7], ['Si', 3, 14, 4], ['P', 3, 15, 0], ['S', 3, 16, 0], ['Cl', 3, 17, 6], ['Ar', 3, 18, 5],
  ['K', 4, 1, 1], ['Ca', 4, 2, 2], ['Sc', 4, 3, 3], ['Ti', 4, 4, 3], ['V', 4, 5, 3], ['Cr', 4, 6, 3], ['Mn', 4, 7, 3], ['Fe', 4, 8, 3],
  ['Co', 4, 9, 3], ['Ni', 4, 10, 3], ['Cu', 4, 11, 3], ['Zn', 4, 12, 3], ['Ga', 4, 13, 7], ['Ge', 4, 14, 4], ['As', 4, 15, 4],
  ['Se', 4, 16, 0], ['Br', 4, 17, 6], ['Kr', 4, 18, 5],
];
const CATEGORY = ['#9fd3a8', '#f4a6a6', '#f6c99a', '#f3e29b', '#b9d7c9', '#b7c7f0', '#d4b8ec', '#c9ccd2'];

const periodicTexture = () =>
  canvasTexture(1024, 420, (c) => {
    c.fillStyle = '#fbfbf7';
    c.fillRect(0, 0, 1024, 420);
    c.fillStyle = '#26364a';
    c.font = '700 34px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('Periodic table', 512, 46);
    const cell = 52;
    const x0 = (1024 - cell * 18) / 2;
    for (const [sym, period, group, cat] of ELEMENTS) {
      const x = x0 + (group - 1) * cell;
      const y = 70 + (period - 1) * (cell + 6);
      c.fillStyle = CATEGORY[cat];
      c.fillRect(x + 2, y + 2, cell - 4, cell - 4);
      c.fillStyle = '#1b2533';
      c.font = '600 22px "Segoe UI", sans-serif';
      c.fillText(sym, x + cell / 2, y + cell / 2 + 8);
    }
  });

export function buildRoom(scene: THREE.Scene) {
  const room = new THREE.Group();

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.85 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe9eef0, roughness: 0.95 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xc9d6dc, roughness: 0.9 });
  const wall = (w: number, h: number, x: number, z: number, ry: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    m.position.set(x, h / 2, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    room.add(m);
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.9), accentMat);
    stripe.position.set(x, 0.45, z);
    stripe.rotation.y = ry;
    stripe.position.add(new THREE.Vector3(0, 0, 0.002).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry));
    room.add(stripe);
  };
  wall(6, 3, 0, -1.6, 0);
  wall(6, 3, -2.6, 1.0, Math.PI / 2);
  wall(6, 3, 2.6, 1.0, -Math.PI / 2);
  wall(6, 3, 0, 3.4, Math.PI);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshStandardMaterial({ color: 0xf4f6f7, roughness: 1 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 3, 0.9);
  room.add(ceiling);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfffdf3 });
  for (const [x, z] of [[-1, -0.6], [1, -0.6], [-1, 1.4], [1, 1.4]]) {
    const lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.3), lampMat);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(x, 2.99, z);
    room.add(lamp);
  }

  // Window on the right wall.
  const sky = canvasTexture(256, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#8fc3ea');
    g.addColorStop(0.7, '#d9ecf7');
    g.addColorStop(1, '#b8d6a0');
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), new THREE.MeshBasicMaterial({ map: sky }));
  win.position.set(2.59, 1.75, -0.2);
  win.rotation.y = -Math.PI / 2;
  room.add(win);
  const frameMat = solidMaterial(0xffffff, 0.5);
  for (const [w, h, y, z] of [[0.05, 1.2, 1.75, -1.0], [0.05, 1.2, 1.75, 0.6], [0.05, 1.2, 1.75, -0.2], [1.65, 0.05, 2.3, -0.2], [1.65, 0.05, 1.2, -0.2]]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, w), frameMat);
    bar.position.set(2.57, y, z);
    room.add(bar);
  }

  // The bench: dark epoxy top over pale cabinets.
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(BENCH.width, 0.04, BENCH.front - BENCH.back + 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2d3a3f, roughness: 0.45, metalness: 0.05 }),
  );
  top.position.set(0, BENCH.top - 0.02, BENCH.z);
  top.receiveShadow = true;
  room.add(top);
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(BENCH.width - 0.04, BENCH.top - 0.12, 0.66),
    new THREE.MeshStandardMaterial({ color: 0xdfe4e6, roughness: 0.8 }),
  );
  cab.position.set(0, (BENCH.top - 0.12) / 2 + 0.08, BENCH.z - 0.02);
  room.add(cab);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(BENCH.width - 0.1, 0.08, 0.6), solidMaterial(0x2a2f33));
  plinth.position.set(0, 0.04, BENCH.z - 0.04);
  room.add(plinth);
  const handleMat = solidMaterial(0x8a949b, 0.3, 0.8);
  for (let i = 0; i < 4; i++) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.62), new THREE.MeshStandardMaterial({ color: 0xd2d9dc, roughness: 0.7 }));
    door.position.set(-0.66 + i * 0.44, 0.45, BENCH.z + 0.311);
    room.add(door);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.015), handleMat);
    handle.position.set(-0.66 + i * 0.44, 0.7, BENCH.z + 0.32);
    room.add(handle);
  }

  // Steel sink with a tap, at the right end of the bench.
  const steel = new THREE.MeshStandardMaterial({ color: 0xc4cbd0, roughness: 0.25, metalness: 0.85 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(SINK.r, SINK.r * 0.85, 0.02, 32, 1, true), steel);
  basin.material.side = THREE.DoubleSide;
  basin.position.set(SINK.x, BENCH.top + 0.01, SINK.z);
  room.add(basin);
  const drainPlate = new THREE.Mesh(new THREE.CircleGeometry(SINK.r * 0.85, 32), solidMaterial(0x9aa3a8, 0.35, 0.8));
  drainPlate.rotation.x = -Math.PI / 2;
  drainPlate.position.set(SINK.x, BENCH.top + 0.001, SINK.z);
  room.add(drainPlate);
  const drain = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), solidMaterial(0x30363a));
  drain.rotation.x = -Math.PI / 2;
  drain.position.set(SINK.x, BENCH.top + 0.002, SINK.z);
  room.add(drain);
  const tapPost = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.22, 12), steel);
  tapPost.position.set(SINK.x, BENCH.top + 0.11, SINK.z - SINK.r - 0.04);
  room.add(tapPost);
  const tapArm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 12), steel);
  tapArm.rotation.x = Math.PI / 2;
  tapArm.position.set(SINK.x, BENCH.top + 0.22, SINK.z - SINK.r + 0.03);
  room.add(tapArm);

  // Periodic table and shelves on the back wall.
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.53), new THREE.MeshStandardMaterial({ map: periodicTexture(), roughness: 0.9 }));
  poster.position.set(-1.65, 1.75, -1.59);
  room.add(poster);
  const shelfMat = solidMaterial(0xb08a5a, 0.7);
  const jarColors = [0x7a4a1c, 0x2f6f5a, 0x9b2f2f, 0xd9d9d9, 0x264e86, 0x7a4a1c, 0xc7a43a, 0x5b3f7a];
  for (let s = 0; s < 2; s++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.025, 0.22), shelfMat);
    shelf.position.set(1.6, 1.45 + s * 0.42, -1.48);
    shelf.castShadow = true;
    room.add(shelf);
    for (let i = 0; i < 6; i++) {
      const color = jarColors[(i + s * 3) % jarColors.length];
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.13 + (i % 2) * 0.04, 14),
        new THREE.MeshStandardMaterial({ color, roughness: 0.25, transparent: true, opacity: 0.85 }),
      );
      jar.position.set(1.15 + i * 0.17, 1.53 + s * 0.42 + (i % 2) * 0.02, -1.48);
      room.add(jar);
    }
  }

  scene.add(room);

  // Light: soft sky fill plus one shadow-casting key light above the bench.
  scene.add(new THREE.HemisphereLight(0xf2f7ff, 0x8a8478, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-0.8, 2.8, 0.6);
  key.target.position.set(0, BENCH.top, BENCH.z);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -1.1;
  key.shadow.camera.right = 1.1;
  key.shadow.camera.top = 0.8;
  key.shadow.camera.bottom = -0.8;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 5;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfeeff, 0.5);
  fill.position.set(2.5, 1.8, -0.2);
  scene.add(fill);
}
