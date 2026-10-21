import * as THREE from 'three';
import { addTo, scaled, type Mixture } from '../chem/mixture';
import type { Key } from '../i18n';
import { audio } from './audio';
import { Flame, Flash } from './fx';
import { Label, Vessel, type Draw } from './parts';
import { BENCH } from './room';
import { Puddles, Splashes } from './spills';
import { blobShadowTexture } from './textures';
import type { SnapKind, Tool } from './tools';

// The bench simulation shared by every topic: pouring liquids and pieces, drops, bubbles,
// tools sliding home, and the running tally of chemicals used.

export interface SnapTarget {
  kinds: SnapKind[];
  vessel?: Vessel;
  /** World position for this kind of snap, or null if it doesn't apply right now. */
  point(kind: SnapKind, target: THREE.Vector3): THREE.Vector3 | null;
}

export type UsageUnit = 'ml' | 'pieces' | 'drops' | 'spoons';
export interface UsageEntry {
  name: () => string;
  unit: UsageUnit;
  amount: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  part: Mixture;
  kind: 'drop' | 'piece';
  color: number;
  size: number;
}

const MAX_BUBBLES = 70;

class Bubbles {
  readonly mesh: THREE.InstancedMesh;
  private readonly pos: THREE.Vector3[] = [];
  private readonly speed: number[] = [];
  private readonly size: number[] = [];
  private acc = 0;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();

  constructor(private readonly vessel: Vessel) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false }),
      MAX_BUBBLES,
    );
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    vessel.root.add(this.mesh);
  }

  update(dt: number) {
    const v = this.vessel;
    const top = v.liquidHeight();
    if (top > 0.003) this.acc += v.bubbleRate * dt;
    while (this.acc >= 1 && this.pos.length < MAX_BUBBLES) {
      this.acc -= 1;
      const p = new THREE.Vector3();
      const grains = v.solids.children;
      if (grains.length) {
        p.copy(grains[Math.floor(Math.random() * grains.length)].position);
        p.x += (Math.random() - 0.5) * 0.004;
        p.z += (Math.random() - 0.5) * 0.004;
      } else {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * v.radius * 0.75;
        p.set(Math.cos(a) * r, 0.004, Math.sin(a) * r);
      }
      this.pos.push(p);
      this.speed.push(0.04 + Math.random() * 0.05);
      this.size.push(0.0008 + Math.random() * 0.0014);
    }
    this.acc = Math.min(this.acc, 3);
    let n = 0;
    for (let i = 0; i < this.pos.length; i++) {
      const p = this.pos[i];
      p.y += this.speed[i] * dt;
      p.x += Math.sin(p.y * 90 + i) * 0.0004;
      if (p.y > top) {
        this.pos.splice(i, 1);
        this.speed.splice(i, 1);
        this.size.splice(i, 1);
        i--;
        continue;
      }
      this.s.setScalar(this.size[i] * (1 + p.y * 6));
      this.m.compose(p, this.q, this.s);
      this.mesh.setMatrixAt(n++, this.m);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export class Lab {
  readonly group = new THREE.Group();
  readonly tools: Tool[] = [];
  readonly vessels: Vessel[] = [];
  readonly snaps: SnapTarget[] = [];
  readonly pressables: { mesh: THREE.Object3D; onPress: () => void }[] = [];
  readonly labels: Label[] = [];
  readonly flames: Flame[] = [];
  readonly flash = new Flash();
  private readonly streams: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly particles: Particle[] = [];
  private readonly bubbles = new Map<Vessel, Bubbles>();
  private readonly solidAcc = new Map<Tool, number>();
  /** Soft contact shadows under each tool; glass casts no real shadow, so this grounds it. */
  private readonly blobs = new Map<Tool, THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>();
  private readonly blobTexture = blobShadowTexture();
  readonly splashes = new Splashes();
  readonly puddles = new Puddles();
  /** Granules that fell on the bench stay where they landed. */
  private readonly strays: THREE.Mesh[] = [];
  private splashAcc = 0;
  private spillCooldown = 0;
  private fullCooldown = 0;
  /** How hard something is pouring this frame, for the pour sound. */
  private pourLevel = 0;

  constructor(
    readonly usage: Map<string, UsageEntry>,
    readonly toast: (key: Key) => void,
  ) {
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.CylinderGeometry(0.0022, 0.003, 1, 8, 1, true);
      geo.translate(0, -0.5, 0);
      const s = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xcfe6f5, transparent: true, opacity: 0.7, depthWrite: false }));
      s.visible = false;
      s.renderOrder = 4;
      this.streams.push(s);
      this.group.add(s);
    }
    this.group.add(this.flash.mesh, this.splashes.mesh, this.puddles.group);
    // On the bench top a puddle stops at the edges; what runs over drips to the floor below.
    this.puddles.limit = (x, y, z) => {
      if (y < BENCH.top - 0.01) return { maxR: 0.32 };
      const edges = [
        { d: x + BENCH.width / 2, to: new THREE.Vector3(-BENCH.width / 2 - 0.06, 0, z) },
        { d: BENCH.width / 2 - x, to: new THREE.Vector3(BENCH.width / 2 + 0.06, 0, z) },
        { d: BENCH.front - z, to: new THREE.Vector3(x, 0, BENCH.front + 0.08) },
        { d: z - BENCH.back, to: new THREE.Vector3(x, 0, BENCH.back) },
      ].sort((p, q) => p.d - q.d);
      return { maxR: Math.max(0.004, edges[0].d), spillTo: edges[0].to };
    };
  }

  addTool(tool: Tool) {
    this.tools.push(tool);
    this.group.add(tool.root);
    if (tool.kind !== 'splint') {
      const size = (tool.vessel ? tool.vessel.radius : 0.022) * 3.2;
      const blob = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({ map: this.blobTexture, transparent: true, depthWrite: false, opacity: 0.6 }),
      );
      blob.rotation.x = -Math.PI / 2;
      blob.renderOrder = 0;
      this.group.add(blob);
      this.blobs.set(tool, blob);
    }
    if (tool.vessel) this.trackVessel(tool.vessel);
    return tool;
  }

  addVessel(v: Vessel, x: number, y: number, z: number) {
    v.root.position.set(x, y, z);
    this.group.add(v.root);
    this.trackVessel(v);
    return v;
  }

  private trackVessel(v: Vessel) {
    this.vessels.push(v);
    if (v.infinite) return;
    this.snaps.push({
      kinds: ['mouth', 'liquid'],
      vessel: v,
      point: (kind, target) => {
        v.mouthWorld(target);
        if (kind === 'liquid') {
          const floor = v.root.getWorldPosition(new THREE.Vector3()).y + 0.008;
          target.y = Math.max(floor, Math.min(target.y - 0.02, v.surfaceWorldY() - 0.012));
        }
        return target;
      },
    });
  }

  addFlameSnap(flame: Flame) {
    this.snaps.push({
      kinds: ['flame'],
      point: (_kind, target) => (flame.lit ? flame.group.getWorldPosition(target).setY(target.y + 0.035) : null),
    });
  }

  addPressable(mesh: THREE.Object3D, onPress: () => void) {
    this.pressables.push({ mesh, onPress });
  }

  label(w: number, h: number, draw: Draw, transparent = false) {
    const l = new Label(w, h, draw, transparent);
    this.labels.push(l);
    return l;
  }

  /** Vessels that are standing still and could receive something. */
  private openVessels(except?: Vessel) {
    return this.vessels.filter((v) => {
      if (v === except || v.infinite) return false;
      const owner = this.tools.find((t) => t.vessel === v);
      return !owner || (owner.held === null && owner.returning < 0);
    });
  }

  private vesselBelow(p: THREE.Vector3, except?: Vessel) {
    const m = new THREE.Vector3();
    let best: Vessel | null = null;
    let bestY = -Infinity;
    for (const v of this.openVessels(except)) {
      v.mouthWorld(m);
      const dx = p.x - m.x;
      const dz = p.z - m.z;
      const reach = v.rimRadius + (v.sink ? 0 : 0.006);
      if (dx * dx + dz * dz < reach * reach && p.y > m.y - 0.015 && m.y > bestY) {
        best = v;
        bestY = m.y;
      }
    }
    return best;
  }

  record(key: string, name: () => string, unit: UsageUnit, amount: number) {
    const e = this.usage.get(key) ?? { name, unit, amount: 0 };
    e.amount += amount;
    this.usage.set(key, e);
  }

  /** Put a granule (zinc, MnO₂) at the bottom of a vessel. */
  addGranule(v: Vessel, color: number, size: number) {
    const g = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: color === 0x9aa3ab ? 0.6 : 0 }));
    const r = v.radius * 0.6 * Math.sqrt(Math.random());
    const a = Math.random() * Math.PI * 2;
    g.position.set(Math.cos(a) * r, size + v.solids.children.length * size * 0.25, Math.sin(a) * r);
    g.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    v.solids.add(g);
    return g;
  }

  /** A granule that missed lies on the bench (or floor) where it fell. */
  private leaveStray(p: Particle, ground: number) {
    const g = new THREE.Mesh(p.mesh.geometry.clone(), (p.mesh.material as THREE.Material).clone());
    g.position.set(p.mesh.position.x + (Math.random() - 0.5) * 0.01, ground + p.size * 0.75, p.mesh.position.z + (Math.random() - 0.5) * 0.01);
    g.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    g.castShadow = true;
    this.group.add(g);
    this.strays.push(g);
    if (this.strays.length > 120) {
      const old = this.strays.shift()!;
      this.group.remove(old);
      old.geometry.dispose();
      (old.material as THREE.Material).dispose();
    }
    audio.clink();
  }

  /** One drop from a dropper's tip. */
  drip(tool: Tool) {
    if (!tool.drop) return;
    const p = tool.tipWorld(new THREE.Vector3());
    this.spawn(p, new THREE.Vector3(0, -0.2, 0), 'drop', tool.drop.part, tool.drop.color, 0.0022);
    this.record(tool.kind, tool.name, 'drops', 1);
    audio.drip();
  }

  private spawn(p: THREE.Vector3, vel: THREE.Vector3, kind: Particle['kind'], part: Mixture, color: number, size: number) {
    const mesh = new THREE.Mesh(
      kind === 'drop' ? new THREE.SphereGeometry(size, 8, 6) : new THREE.IcosahedronGeometry(size, 0),
      kind === 'drop'
        ? new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.8, roughness: 0.05 })
        : new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: color === 0x9aa3ab ? 0.6 : 0 }),
    );
    mesh.position.copy(p);
    this.group.add(mesh);
    this.particles.push({ mesh, vel, part, kind, color, size });
  }

  private lowestRimPoint(tool: Tool, v: Vessel | null, out: THREE.Vector3) {
    const rimY = v ? v.height : (tool.tip.y || 0.06);
    const rimR = v ? v.rimRadius : 0.025;
    const c = tool.root.localToWorld(new THREE.Vector3(0, rimY, 0));
    const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(tool.root.getWorldQuaternion(new THREE.Quaternion()));
    const down = new THREE.Vector3(0, -1, 0);
    down.addScaledVector(axis, -down.dot(axis));
    if (down.lengthSq() < 1e-6) down.set(1, 0, 0).applyQuaternion(tool.root.quaternion);
    return out.copy(c).addScaledVector(down.normalize(), rimR);
  }

  private pour(tool: Tool, dt: number, stream: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>) {
    const src = tool.vessel;
    const liquid = !!src && !tool.solid;
    if (liquid && !src!.infinite && src!.mix.volume < 0.05) return false;
    const fill = liquid ? src!.fill : 0.5;
    const threshold = THREE.MathUtils.lerp(1.75, 0.75, fill);
    const tilt = tool.tiltAngle();
    if (tilt < threshold) return false;
    const k = THREE.MathUtils.clamp((tilt - threshold) / 0.5, 0.15, 1);
    const spout = this.lowestRimPoint(tool, src ?? null, new THREE.Vector3());

    if (tool.solid) {
      const acc = (this.solidAcc.get(tool) ?? 0.6) + tool.solid.perSecond * k * dt;
      let n = Math.floor(acc);
      this.solidAcc.set(tool, acc - n);
      while (n-- > 0) {
        const vel = new THREE.Vector3((Math.random() - 0.5) * 0.04, -0.05, (Math.random() - 0.5) * 0.04);
        this.spawn(spout, vel, 'piece', tool.solid.part, tool.solid.color, tool.solid.size);
        this.record(tool.kind, tool.name, tool.solid.unit, 1);
      }
      return false;
    }

    const s = src!;
    let ml = tool.pourRate * k * dt;
    if (!s.infinite) ml = Math.min(ml, s.mix.volume);
    const part = scaled(s.mix, ml / s.mix.volume);
    if (!s.infinite) s.mix = scaled(s.mix, 1 - ml / s.mix.volume);
    else this.record(tool.kind, tool.name, 'ml', ml);
    this.pourLevel = Math.max(this.pourLevel, k);

    const target = this.vesselBelow(spout, s);
    const { color, opacity } = s.tint(s.mix);
    let endY: number;
    // Splash where the stream lands: hard on a surface, gentle into liquid.
    this.splashAcc += dt * (target && !target.sink ? 20 : 110) * k;
    const splashes = Math.floor(this.splashAcc);
    this.splashAcc -= splashes;
    if (target) {
      endY = target.sink ? target.mouthWorld(new THREE.Vector3()).y - 0.02 : target.surfaceWorldY();
      if (!target.sink) {
        const room = target.capacity - target.mix.volume;
        if (room <= 0.01) {
          if (this.fullCooldown <= 0) this.toast('toast.full');
          this.fullCooldown = 3;
        } else {
          const fits = scaled(part, Math.min(1, room / ml));
          addTo(target.mix, fits);
          target.onReceive?.(fits);
        }
      }
      this.splashes.emit(new THREE.Vector3(spout.x, endY, spout.z), color, splashes, target.sink ? 0.8 : 0.35);
    } else {
      endY = groundBelow(spout);
      this.splashes.emit(new THREE.Vector3(spout.x, endY, spout.z), color, splashes, 1);
      this.puddles.add(spout.x, endY, spout.z, ml, color, puddleOpacity(opacity));
      if (this.spillCooldown <= 0) this.toast('toast.spill');
      this.spillCooldown = 4;
    }
    stream.visible = true;
    stream.position.copy(spout);
    stream.scale.y = Math.max(0.005, spout.y - endY);
    stream.material.color.setHex(color);
    stream.material.opacity = Math.min(0.9, opacity + 0.25);
    stream.scale.x = stream.scale.z = 0.6 + k * 0.6;
    return true;
  }

  update(dt: number) {
    this.spillCooldown -= dt;
    this.fullCooldown -= dt;
    this.pourLevel = 0;
    let si = 0;
    for (const s of this.streams) s.visible = false;
    for (const tool of this.tools) {
      if (tool.held !== null && tool.use === 'pour' && si < this.streams.length) {
        if (this.pour(tool, dt, this.streams[si])) si++;
      }
      if (tool.returning >= 0) {
        tool.returning = Math.min(1, tool.returning + dt / 0.45);
        const e = 1 - Math.pow(1 - tool.returning, 3);
        tool.root.position.lerpVectors(tool.returnFrom, tool.homePos, e);
        tool.root.quaternion.slerpQuaternions(tool.returnFromQuat, tool.homeQuat, e);
        if (tool.returning >= 1) {
          tool.returning = -1;
          audio.clink();
        }
      }
    }
    audio.setPour(this.pourLevel);
    const p = new THREE.Vector3();
    for (const [tool, blob] of this.blobs) {
      tool.root.getWorldPosition(p);
      const lift = Math.max(0, p.y - BENCH.top);
      const overBench = Math.abs(p.x) < BENCH.width / 2 && p.z < BENCH.front && p.z > BENCH.back;
      blob.visible = overBench && lift < 0.4;
      blob.position.set(p.x, BENCH.top + 0.0008, p.z);
      blob.material.opacity = 0.6 * Math.max(0, 1 - lift / 0.35);
      blob.scale.setScalar(1 + lift * 2.5);
    }

    const m = new THREE.Vector3();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const prevY = p.mesh.position.y;
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 5;
      const pos = p.mesh.position;
      let gone = false;
      for (const v of this.openVessels()) {
        v.mouthWorld(m);
        const dx = pos.x - m.x;
        const dz = pos.z - m.z;
        const reach = v.rimRadius + 0.006;
        if (prevY >= m.y && pos.y < m.y && dx * dx + dz * dz < reach * reach) {
          if (!v.sink) {
            addTo(v.mix, p.part);
            if (p.kind === 'piece') this.addGranule(v, p.color, p.size);
            v.onReceive?.(p.part);
          }
          if (p.kind === 'piece') audio.plop();
          gone = true;
          break;
        }
      }
      const ground = groundBelow(pos);
      if (!gone && pos.y < ground) {
        gone = true;
        pos.y = ground;
        if (p.kind === 'drop') {
          // A stray drop leaves a coloured spot and a tiny splash.
          this.puddles.add(pos.x, ground, pos.z, p.part.volume, p.color, 0.8);
          this.splashes.emit(pos, p.color, 4, 0.45);
        } else this.leaveStray(p, ground);
      }
      if (gone) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i--, 1);
      }
    }

    let fizz = 0;
    for (const v of this.vessels) {
      if (v.bubbleRate > 0 && !this.bubbles.has(v)) this.bubbles.set(v, new Bubbles(v));
      this.bubbles.get(v)?.update(dt);
      if (v.liquidHeight() > 0.003) fizz += v.bubbleRate;
      v.updateLook();
    }
    audio.setFizz(Math.min(1, fizz / 40));
    this.splashes.update(dt);
    for (const f of this.flames) f.update(dt);
    this.flash.update(dt);
  }

  dispose() {
    audio.setPour(0);
    audio.setFizz(0);
    this.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) {
        (mat as THREE.MeshBasicMaterial).map?.dispose();
        mat.dispose();
      }
    });
    this.group.removeFromParent();
  }
}

/** Height of whatever is under a point: the bench top, or the floor. */
function groundBelow(p: THREE.Vector3) {
  const overBench = Math.abs(p.x) < BENCH.width / 2 && p.z < BENCH.front && p.z > BENCH.back;
  return overBench ? BENCH.top : 0;
}

/** Spilled liquid looks more solid than the same liquid in glass: it's a glossy film. */
const puddleOpacity = (o: number) => THREE.MathUtils.clamp(o + 0.2, 0.45, 0.8);
