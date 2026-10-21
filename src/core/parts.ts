import * as THREE from 'three';
import { emptyMix, type Mixture, type Tint } from '../chem/mixture';

// Glassware, labels and the Vessel class (anything that can hold a mixture).
// Units are metres; every object's origin is at its base unless noted.

/**
 * Glass: nearly clear face-on, more opaque and reflective towards the edges (Fresnel), which is
 * what makes real glassware read as glass. Cheap enough for a headset: no refraction pass.
 */
export const glassMaterial = (tint = 0xeef6f8, base = 0.08, edge = 0.6) => {
  const m = new THREE.MeshStandardMaterial({
    color: tint,
    roughness: 0.03,
    metalness: 0.0,
    transparent: true,
    opacity: base,
    envMapIntensity: 2.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.edge = { value: edge };
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float edge;\nvoid main() {')
      .replace(
        '#include <opaque_fragment>',
        `float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
        float fres = pow(1.0 - facing, 2.5);
        diffuseColor.a = clamp(diffuseColor.a + edge * fres, 0.0, 0.92);
        outgoingLight += vec3(0.9, 0.95, 1.0) * fres * 0.35;
        #include <opaque_fragment>`,
      );
  };
  m.customProgramCacheKey = () => `glass-${edge}`;
  return m;
};

const rimMaterial = () =>
  new THREE.MeshStandardMaterial({
    color: 0xf6fbfc,
    roughness: 0.08,
    transparent: true,
    opacity: 0.6,
    envMapIntensity: 2,
    depthWrite: false,
  });

const WHITE = new THREE.Color(0xffffff);

export const solidMaterial =(color: number, roughness = 0.6, metalness = 0) =>
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
  tint: (m: Mixture) => Tint = () => ({ color: 0xb9d8e6, opacity: 0.22 });
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
    // The liquid's top surface: shinier and a touch lighter, like a real meniscus catching light.
    this.surface = new THREE.Mesh(
      new THREE.CircleGeometry(1, 28),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.5, depthWrite: false, envMapIntensity: 2 }),
    );
    this.surface.rotation.x = -Math.PI / 2;
    this.surface.renderOrder = 1;
    this.surface.visible = false;
    this.root.add(this.liquid, this.surface, this.solids);
  }

  private readonly surface: THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial>;

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
    this.surface.visible = show;
    if (!show) return;
    const r = this.radius * 0.97;
    this.liquid.scale.set(r, h, r);
    this.liquid.position.y = h / 2 + 0.001;
    this.surface.scale.set(r, r, 1);
    this.surface.position.y = h + 0.0012;
    const { color, opacity } = this.tint(this.mix);
    this.liquid.material.color.setHex(color);
    this.liquid.material.opacity = Math.min(0.92, opacity + 0.1);
    this.surface.material.color.setHex(color).lerp(WHITE, 0.25);
    this.surface.material.opacity = Math.min(0.95, opacity + 0.25);
  }
}

export type Draw = (c: CanvasRenderingContext2D, W: number, H: number) => void;

/** A printed label: a canvas drawn again when the language changes. Lit like paper, but never too dark to read. */
export class Label {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private readonly canvas = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;

  constructor(
    w: number,
    h: number,
    private readonly draw: Draw,
    transparent = false,
    pxPerMetre = 6000,
  ) {
    this.canvas.width = Math.round(w * pxPerMetre);
    this.canvas.height = Math.round(h * pxPerMetre);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        map: this.texture,
        roughness: 0.75,
        emissive: 0xffffff,
        emissiveMap: this.texture,
        emissiveIntensity: 0.28,
        transparent,
        depthWrite: !transparent,
      }),
    );
    this.redraw();
  }

  redraw() {
    const c = this.canvas.getContext('2d')!;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.draw(c, this.canvas.width, this.canvas.height);
    this.texture.needsUpdate = true;
  }
}

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

/** Plain centred lines of text; the first line is bold. */
export const textLines =
  (lines: () => string[], style: { bg: string; fg: string; border?: string } = { bg: '#fbf8ef', fg: '#1d2a3a' }): Draw =>
  (c, W, H) => {
    if (style.bg !== 'transparent') {
      c.fillStyle = style.bg;
      c.fillRect(0, 0, W, H);
    }
    if (style.border) {
      c.strokeStyle = style.border;
      c.lineWidth = Math.max(2, H * 0.05);
      c.strokeRect(0, 0, W, H);
    }
    const ls = lines();
    const px = Math.min(H / (ls.length * 1.3), W / 5);
    c.fillStyle = style.fg;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    ls.forEach((line, i) => {
      const size = i === 0 ? px : px * 0.75;
      const weight = i === 0 ? 700 : 600;
      c.font = `${weight} ${size}px ${FONT}`;
      fitText(c, line, W * 0.9, size, weight);
      c.fillText(line, W / 2, (H / (ls.length + 0.2)) * (i + 0.6));
    });
  };

export interface ReagentInfo {
  formula: string;
  name: () => string;
  detail: string; // concentration or grade, e.g. "0.1 M", "10%"
  band: string; // colour band: red for acids, blue for bases, …
  hazard?: 'corrosive' | 'oxidiser' | 'irritant';
}

/** A reagent-bottle label: coloured band with the name, big formula, concentration, hazard diamond. */
export const reagentLabel =
  (r: ReagentInfo): Draw =>
  (c, W, H) => {
    c.fillStyle = '#f8f5ea';
    c.fillRect(0, 0, W, H);
    const band = H * 0.28;
    c.fillStyle = r.band;
    c.fillRect(0, 0, W, band);
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const name = r.name().toUpperCase();
    c.font = `700 ${band * 0.5}px ${FONT}`;
    fitText(c, name, W * 0.9, band * 0.5, 700);
    c.fillText(name, W / 2, band * 0.53);

    const hasHazard = !!r.hazard;
    const textW = hasHazard ? W * 0.68 : W * 0.9;
    const cx = hasHazard ? W * 0.39 : W / 2;
    c.fillStyle = '#16212c';
    c.font = `800 ${H * 0.34}px ${FONT}`;
    fitText(c, r.formula, textW, H * 0.34, 800);
    c.fillText(r.formula, cx, band + H * 0.24);
    c.fillStyle = '#3a4754';
    c.font = `700 ${H * 0.17}px ${FONT}`;
    fitText(c, r.detail, textW, H * 0.17, 700);
    c.fillText(r.detail, cx, band + H * 0.52);

    if (r.hazard) {
      // GHS-style red diamond with a simple pictogram.
      const s = H * 0.26;
      const x = W * 0.84;
      const y = band + H * 0.36;
      c.save();
      c.translate(x, y);
      c.rotate(Math.PI / 4);
      c.fillStyle = '#ffffff';
      c.fillRect(-s / 2, -s / 2, s, s);
      c.strokeStyle = '#d21f1f';
      c.lineWidth = s * 0.1;
      c.strokeRect(-s / 2, -s / 2, s, s);
      c.restore();
      c.fillStyle = '#111111';
      c.font = `900 ${s * 0.75}px ${FONT}`;
      c.fillText(r.hazard === 'oxidiser' ? '◯' : r.hazard === 'corrosive' ? '⚗' : '!', x, y + s * 0.04);
    }
    c.strokeStyle = 'rgba(0,0,0,0.25)';
    c.lineWidth = 2;
    c.strokeRect(1, 1, W - 2, H - 2);
  };

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
