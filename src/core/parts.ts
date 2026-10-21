import * as THREE from 'three';
import { emptyMix, type Mixture, type Tint } from '../chem/mixture';

// Glassware, labels and the Vessel class (anything that can hold a mixture).
// Units are metres; every object's origin is at its base unless noted.

export const glassMaterial = () =>
  new THREE.MeshStandardMaterial({
    color: 0xf4fbff,
    roughness: 0.04,
    metalness: 0.0,
    transparent: true,
    opacity: 0.2,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

const rimMaterial = () =>
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    transparent: true,
    opacity: 0.45,
    envMapIntensity: 1.5,
    depthWrite: false,
  });

export const solidMaterial = (color: number, roughness = 0.6, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

/** A thin-walled lathe profile: flat (beaker) or round (test tube) bottom. */
function glassProfile(r: number, h: number, roundBottom: boolean, neck?: { r: number; start: number }) {
  const pts: THREE.Vector2[] = [];
  if (roundBottom) {
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.sin(a) * r, r - Math.cos(a) * r));
    }
  } else {
    pts.push(new THREE.Vector2(0, 0), new THREE.Vector2(r - 0.003, 0), new THREE.Vector2(r, 0.003));
  }
  if (neck) {
    pts.push(new THREE.Vector2(r, neck.start));
    pts.push(new THREE.Vector2(neck.r + (r - neck.r) * 0.35, neck.start + (r - neck.r) * 0.8));
    pts.push(new THREE.Vector2(neck.r, neck.start + (r - neck.r) * 1.2));
    pts.push(new THREE.Vector2(neck.r, h));
  } else {
    pts.push(new THREE.Vector2(r, h));
  }
  return new THREE.LatheGeometry(pts, 28);
}

export interface VesselOptions {
  radius: number; // inner radius of the body, where the liquid sits
  height: number; // total height
  capacity?: number; // mL; worked out from the shape when left out
  roundBottom?: boolean;
  neck?: { r: number; start: number }; // bottles narrow to a neck
  glass?: THREE.Material;
  infinite?: boolean; // reagent bottles never run out
  sink?: boolean; // swallows whatever is poured in
  spout?: boolean; // beakers have a small lip
}

/** Anything that holds a mixture: beakers, test tubes, reagent bottles, the sink. */
export class Vessel {
  readonly root = new THREE.Group();
  readonly liquid: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  readonly solids = new THREE.Group();
  readonly glass?: THREE.Mesh;
  mix: Mixture = emptyMix();
  readonly radius: number;
  readonly height: number;
  readonly capacity: number;
  readonly rimRadius: number;
  readonly infinite: boolean;
  readonly sink: boolean;
  /** Turns the mixture into a liquid colour; each topic sets its own. */
  tint: (m: Mixture) => Tint = () => ({ color: 0xcfe6f5, opacity: 0.35 });
  /** Bubbles per second, set by the topic's reaction. */
  bubbleRate = 0;
  /** Shown level for infinite bottles, which never change. */
  shownFill = 0.7;
  /** Called when something arrives, so topics can react (e.g. drop a zinc granule in). */
  onReceive?: (part: Mixture) => void;

  private readonly neckStart?: number;

  constructor(opts: VesselOptions) {
    this.radius = opts.radius;
    this.height = opts.height;
    this.neckStart = opts.neck?.start;
    // What fits below the rim (or the neck), so the drawn level always matches the volume.
    const usable = opts.neck?.start ?? opts.height * 0.92;
    this.capacity = opts.capacity ?? Math.round(Math.PI * opts.radius * opts.radius * usable * 1e6);
    this.rimRadius = opts.neck ? opts.neck.r : opts.radius;
    this.infinite = !!opts.infinite;
    this.sink = !!opts.sink;

    if (!opts.sink) {
      const glass = new THREE.Mesh(
        glassProfile(opts.radius + 0.0015, opts.height, !!opts.roundBottom, opts.neck),
        opts.glass ?? glassMaterial(),
      );
      glass.renderOrder = 2;
      this.glass = glass;
      this.root.add(glass);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(this.rimRadius + 0.0015, 0.0018, 6, 28), rimMaterial());
      rim.rotation.x = Math.PI / 2;
      rim.position.y = opts.height;
      rim.renderOrder = 3;
      this.root.add(rim);
    }

    this.liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 24),
      new THREE.MeshStandardMaterial({
        color: 0xcfe6f5,
        roughness: 0.08,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        envMapIntensity: 0.8,
      }),
    );
    this.liquid.renderOrder = 1;
    this.liquid.visible = false;
    this.liquid.scale.setScalar(0.001);
    this.root.add(this.liquid, this.solids);
  }

  get fill() {
    if (this.infinite) return this.shownFill;
    return Math.min(1, this.mix.volume / this.capacity);
  }

  /** Height of the liquid surface above the base, in metres. */
  liquidHeight() {
    const usable = this.neckStart ?? this.height * 0.92;
    if (this.infinite) return this.shownFill * usable;
    const area = Math.PI * this.radius * this.radius;
    return Math.min(usable, (this.mix.volume * 1e-6) / area);
  }

  mouthWorld(target: THREE.Vector3) {
    return this.root.localToWorld(target.set(0, this.height, 0));
  }

  surfaceWorldY() {
    const v = new THREE.Vector3(0, Math.max(0.004, this.liquidHeight()), 0);
    return this.root.localToWorld(v).y;
  }

  /** Refresh the liquid mesh from the mixture. */
  updateLook() {
    const h = this.liquidHeight();
    const show = h > 0.0008 && !this.sink;
    this.liquid.visible = show;
    if (!show) return;
    const r = this.radius * 0.97;
    this.liquid.scale.set(r, h, r);
    this.liquid.position.y = h / 2 + 0.001;
    const { color, opacity } = this.tint(this.mix);
    this.liquid.material.color.setHex(color);
    this.liquid.material.opacity = opacity;
  }
}

/** Text on a small canvas, drawn again when the language changes. */
export class Label {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly canvas = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;

  constructor(
    w: number,
    h: number,
    private readonly lines: () => string[],
    private readonly style: { bg: string; fg: string; px?: number; border?: string } = { bg: '#fffdf5', fg: '#1d2a3a' },
  ) {
    const scale = 1400; // canvas px per metre
    this.canvas.width = Math.round(w * scale);
    this.canvas.height = Math.round(h * scale);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: style.bg === 'transparent' }),
    );
    this.redraw();
  }

  redraw() {
    const c = this.canvas.getContext('2d')!;
    const { width: W, height: H } = this.canvas;
    c.clearRect(0, 0, W, H);
    if (this.style.bg !== 'transparent') {
      c.fillStyle = this.style.bg;
      c.fillRect(0, 0, W, H);
    }
    if (this.style.border) {
      c.strokeStyle = this.style.border;
      c.lineWidth = Math.max(2, H * 0.06);
      c.strokeRect(0, 0, W, H);
    }
    const lines = this.lines();
    const px = this.style.px ?? Math.min(H / (lines.length * 1.35), W / 6);
    c.fillStyle = this.style.fg;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    lines.forEach((line, i) => {
      const size = i === 0 ? px : px * 0.78;
      c.font = `${i === 0 ? 700 : 500} ${size}px "Segoe UI", system-ui, sans-serif`;
      fitText(c, line, W * 0.92, size, i === 0 ? 700 : 500);
      c.fillText(line, W / 2, (H / (lines.length + 0.2)) * (i + 0.6));
    });
    this.texture.needsUpdate = true;
  }
}

/** Shrink the font until `text` fits `maxW`. */
export function fitText(c: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight: number) {
  let s = size;
  while (s > 8 && c.measureText(text).width > maxW) {
    s *= 0.92;
    c.font = `${weight} ${s}px "Segoe UI", system-ui, sans-serif`;
  }
}

/** A label wrapped around the front of a round bottle or jar. */
export function curvedLabel(radius: number, h: number, label: Label, arc = Math.PI * 0.75) {
  const geo = new THREE.CylinderGeometry(radius, radius, h, 20, 1, true, -arc / 2, arc);
  label.mesh.geometry.dispose();
  label.mesh.geometry = geo as unknown as THREE.PlaneGeometry;
  label.mesh.material.side = THREE.FrontSide;
  // Cylinder UVs run around the side; the default faces +Z at theta 0, which is the front.
  return label.mesh;
}
