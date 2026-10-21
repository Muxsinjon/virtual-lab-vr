import * as THREE from 'three';

// Flames, glowing embers and the hydrogen flash. All use additive, unlit materials so they
// stay cheap on a headset.

const additive = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

export class Flame {
  readonly group = new THREE.Group();
  private readonly outer: THREE.Mesh;
  private readonly inner: THREE.Mesh;
  private readonly light?: THREE.PointLight;
  private t = Math.random() * 10;
  private readonly q = new THREE.Quaternion();
  lit = true;
  /** 1 = normal, bigger when burning in pure oxygen. */
  boost = 1;

  constructor(size = 1, withLight = false) {
    const cone = new THREE.ConeGeometry(0.009 * size, 0.04 * size, 14, 1, true);
    cone.translate(0, 0.02 * size, 0);
    this.outer = new THREE.Mesh(cone, additive(0xff9a3c, 0.75));
    this.inner = new THREE.Mesh(cone, additive(0x6f8cff, 0.55));
    this.inner.scale.set(0.55, 0.45, 0.55);
    this.group.add(this.outer, this.inner);
    if (withLight) {
      this.light = new THREE.PointLight(0xffa24a, 0.12, 0.6, 2);
      this.light.position.y = 0.03 * size;
      this.group.add(this.light);
    }
  }

  update(dt: number) {
    this.group.visible = this.lit;
    if (!this.lit) return;
    // Flames rise straight up, however the splint is tilted.
    const parent = this.group.parent;
    if (parent) this.group.quaternion.copy(parent.getWorldQuaternion(this.q).invert());
    this.t += dt;
    const f = 1 + Math.sin(this.t * 23) * 0.06 + Math.sin(this.t * 37) * 0.05;
    this.outer.scale.set(this.boost * (1 - (f - 1) * 0.5), this.boost * f * (this.boost > 1 ? 1.3 : 1), this.boost);
    this.outer.rotation.y += dt * 2;
    if (this.light) this.light.intensity = 0.1 + (f - 1) * 0.4;
  }
}

export class Ember {
  readonly mesh = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff5a1f }));
  private t = 0;
  glow = 0; // 0..1

  update(dt: number) {
    this.t += dt;
    this.mesh.visible = this.glow > 0.02;
    const pulse = 0.75 + Math.sin(this.t * 6) * 0.25;
    this.mesh.material.color.setRGB(1 * this.glow * pulse + 0.15, 0.3 * this.glow * pulse + 0.05, 0.05);
  }
}

export class Flash {
  readonly mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), additive(0xffd27a, 0));
  private t = -1;
  private size = 0.06;

  fire(at: THREE.Vector3, size: number) {
    this.mesh.position.copy(at);
    this.size = size;
    this.t = 0;
  }

  update(dt: number) {
    if (this.t < 0) {
      this.mesh.visible = false;
      return;
    }
    this.t += dt;
    const k = this.t / 0.3;
    if (k >= 1) {
      this.t = -1;
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    this.mesh.scale.setScalar(this.size * (0.3 + k));
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k);
  }
}
