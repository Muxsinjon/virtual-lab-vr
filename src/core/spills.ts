import * as THREE from 'three';

// What happens to liquid that misses: it splashes where it lands and leaves a puddle that keeps
// growing, in the liquid's own colour. Stray drops leave small coloured spots.

const MAX_SPLASH = 260;
const FILM = 0.0012; // a spilled puddle is about 1.2 mm deep
const MAX_PUDDLES = 80;

/** Little droplets thrown up where a stream or a drop hits something. */
export class Splashes {
  readonly mesh: THREE.InstancedMesh;
  private readonly items: { p: THREE.Vector3; v: THREE.Vector3; life: number; size: number; floor: number }[] = [];
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();
  private readonly c = new THREE.Color();

  constructor() {
    this.mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshStandardMaterial({ roughness: 0.05, transparent: true, opacity: 0.85, depthWrite: false, envMapIntensity: 1.5 }),
      MAX_SPLASH,
    );
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    // Allocate per-droplet colours up front.
    this.mesh.setColorAt(0, this.c.set(0xffffff));
  }

  /** Throw `n` droplets up and out from `at`; they fall back to `at.y`. */
  emit(at: THREE.Vector3, color: number, n: number, strength = 1) {
    this.c.setHex(color);
    for (let i = 0; i < n && this.items.length < MAX_SPLASH; i++) {
      const a = Math.random() * Math.PI * 2;
      const out = (0.12 + Math.random() * 0.35) * strength;
      const v = new THREE.Vector3(Math.cos(a) * out, (0.35 + Math.random() * 0.75) * strength, Math.sin(a) * out);
      this.mesh.setColorAt(this.items.length, this.c);
      this.items.push({ p: at.clone().setY(at.y + 0.002), v, life: 0, size: 0.0012 + Math.random() * 0.0022, floor: at.y });
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt: number) {
    let n = 0;
    for (let i = 0; i < this.items.length; i++) {
      const d = this.items[i];
      d.life += dt;
      d.v.y -= 9.8 * dt;
      d.p.addScaledVector(d.v, dt);
      if (d.p.y < d.floor || d.life > 0.9) {
        // Keep colours paired with droplets: move the last one into this slot.
        const last = this.items.length - 1;
        if (i !== last && this.mesh.instanceColor) {
          this.mesh.getColorAt(last, this.c);
          this.mesh.setColorAt(i, this.c);
          this.mesh.instanceColor.needsUpdate = true;
        }
        this.items[i] = this.items[last];
        this.items.pop();
        i--;
        continue;
      }
      // Stretch droplets along their motion a little, like fast-moving liquid.
      this.s.set(d.size, d.size * (1 + Math.min(1.5, d.v.length() * 1.5)), d.size);
      this.q.setFromUnitVectors(UP, this.tmp.copy(d.v).normalize());
      this.m.compose(d.p, this.q, this.s);
      this.mesh.setMatrixAt(n++, this.m);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private readonly tmp = new THREE.Vector3();
}

const UP = new THREE.Vector3(0, 1, 0);

interface Puddle {
  mesh: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshStandardMaterial>;
  ml: number;
  color: THREE.Color;
  opacity: number;
  x: number;
  z: number;
  r: number;
}

/** An irregular, organic blob outline with radius about 1. */
function blobShape(seed: number) {
  const shape = new THREE.Shape();
  const p1 = seed * 1.7;
  const p2 = seed * 3.1;
  const p3 = seed * 5.3;
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = 1 + 0.13 * Math.sin(3 * a + p1) + 0.08 * Math.sin(5 * a + p2) + 0.05 * Math.sin(8 * a + p3);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return new THREE.ShapeGeometry(shape, 2);
}

/**
 * Shading for a puddle: clearer in the middle, a darker rim where the liquid is thicker at the
 * edge (the meniscus), and a feathered border. Mapped over the blob's -1.3…1.3 outline.
 */
function puddleMaps() {
  const make = (draw: (c: CanvasRenderingContext2D, g: CanvasGradient) => void, stops: [number, string][]) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const c = canvas.getContext('2d')!;
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [o, col] of stops) g.addColorStop(o, col);
    draw(c, g);
    const tex = new THREE.CanvasTexture(canvas);
    tex.repeat.set(1 / 2.6, 1 / 2.6);
    tex.offset.set(0.5, 0.5);
    return tex;
  };
  const fill = (c: CanvasRenderingContext2D, g: CanvasGradient) => {
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  };
  // Radius 1 of the blob sits at 1/1.3 of the texture's half-width.
  const edge = 1 / 1.3;
  const color = make(fill, [[0, '#ffffff'], [edge * 0.7, '#f2f2f2'], [edge * 0.97, '#9a9a9a'], [1, '#9a9a9a']]);
  color.colorSpace = THREE.SRGBColorSpace;
  const alpha = make(fill, [[0, '#9a9a9a'], [edge * 0.75, '#b8b8b8'], [edge * 0.96, '#ffffff'], [edge * 1.12, '#000000'], [1, '#000000']]);
  return { color, alpha };
}

/** Spilled liquid lying on the bench or the floor. Nearby spills join into one puddle. */
export class Puddles {
  readonly group = new THREE.Group();
  private readonly maps = puddleMaps();
  /**
   * How big a puddle at (x, y, z) may grow before it reaches an edge, and where the liquid that
   * runs over that edge goes. Set by the lab for the bench top.
   */
  limit: (x: number, y: number, z: number) => { maxR: number; spillTo?: THREE.Vector3 } = () => ({ maxR: 0.32 });
  private readonly list: Puddle[] = [];
  private seed = 1;

  add(x: number, y: number, z: number, ml: number, color: number, opacity: number) {
    const c = new THREE.Color(color);
    const newR = radiusFor(ml);
    // Join the nearest puddle this spill touches.
    let hit: Puddle | null = null;
    let best = Infinity;
    for (const p of this.list) {
      if (Math.abs(p.mesh.position.y - y) > 0.05) continue;
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < p.r * 0.9 + newR && d < best) {
        best = d;
        hit = p;
      }
    }
    if (hit) {
      // Full to the edge: the rest runs off (onto the floor below the bench edge).
      const { maxR, spillTo } = this.limit(hit.x, y, hit.z);
      if (hit.r >= maxR) {
        if (spillTo) this.add(spillTo.x, spillTo.y, spillTo.z, ml, color, opacity);
        return;
      }
      const total = hit.ml + ml;
      const w = ml / total;
      hit.color.lerp(c, w);
      hit.opacity += (opacity - hit.opacity) * w;
      // The puddle creeps towards where the new liquid lands.
      hit.x += (x - hit.x) * w * 0.5;
      hit.z += (z - hit.z) * w * 0.5;
      hit.ml = total;
      this.refresh(hit);
      return;
    }
    if (this.list.length >= MAX_PUDDLES) {
      const old = this.list.shift()!;
      this.group.remove(old.mesh);
      old.mesh.geometry.dispose();
      old.mesh.material.dispose();
    }
    const mesh = new THREE.Mesh(
      blobShape(this.seed++),
      new THREE.MeshStandardMaterial({
        map: this.maps.color,
        alphaMap: this.maps.alpha,
        roughness: 0.03,
        metalness: 0,
        transparent: true,
        depthWrite: false,
        envMapIntensity: 1.8,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;
    // Stagger heights a hair so overlapping puddles never flicker.
    mesh.position.y = y + 0.0005 + (this.list.length % 6) * 0.00012;
    mesh.renderOrder = 1;
    const p: Puddle = { mesh, ml, color: c, opacity, x, z, r: newR };
    this.list.push(p);
    this.group.add(mesh);
    this.refresh(p);
  }

  private refresh(p: Puddle) {
    p.r = Math.min(radiusFor(p.ml), this.limit(p.x, p.mesh.position.y, p.z).maxR);
    p.mesh.scale.set(p.r, p.r, 1);
    p.mesh.position.x = p.x;
    p.mesh.position.z = p.z;
    p.mesh.material.color.copy(p.color);
    p.mesh.material.opacity = p.opacity;
  }
}

function radiusFor(ml: number) {
  return THREE.MathUtils.clamp(Math.sqrt((ml * 1e-6) / FILM / Math.PI), 0.0025, 0.32);
}
