import * as THREE from 'three';
import type { Mixture } from '../chem/mixture';
import type { Vessel } from './parts';

export type UseKind = 'pour' | 'drip' | 'none';
export type SnapKind = 'mouth' | 'liquid' | 'flame';

/** Who is holding a tool: the mouse/finger, or XR controller 0 or 1. */
export type Holder = 'pointer' | 0 | 1;

/** Something you can pick up. Its origin is its base (or tip, for droppers and probes). */
export class Tool {
  readonly root = new THREE.Group();
  readonly homePos = new THREE.Vector3();
  readonly homeQuat = new THREE.Quaternion();
  /** Orientation while held with the mouse, before it is turned to face the camera. */
  readonly desktopQuat = new THREE.Quaternion();
  /** The point that snaps onto targets (dropper tip, splint tip, tube mouth), in local space. */
  readonly tip = new THREE.Vector3();
  /** Height of the hand above the origin. */
  gripOffset = 0.05;
  grabRadius = 0.09;
  use: UseKind = 'none';
  snapKinds: SnapKind[] = [];
  /** How far above a snap target the tip waits, when held with the mouse. */
  snapLift = 0.05;
  vessel?: Vessel;
  /** Pours pieces instead of liquid (zinc granules, MnO₂ powder). */
  solid?: { part: Mixture; color: number; size: number; perSecond: number; unit: 'pieces' | 'spoons' };
  /** One drop from a dropper. */
  drop?: { part: Mixture; color: number };
  /** mL per second at full tilt. */
  pourRate = 18;
  held: Holder | null = null;
  /** 0..1 while sliding back home after being let go. */
  returning = -1;
  readonly returnFrom = new THREE.Vector3();
  readonly returnFromQuat = new THREE.Quaternion();
  /** Desktop tilt in radians, eased in while the mouse button is held. */
  tilt = 0;

  constructor(
    readonly kind: string,
    readonly name: () => string,
  ) {
    this.root.userData.tool = this;
  }

  setHome(x: number, y: number, z: number, rotY = 0, rotZ = 0) {
    this.homePos.set(x, y, z);
    this.homeQuat.setFromEuler(new THREE.Euler(0, rotY, rotZ));
    this.root.position.copy(this.homePos);
    this.root.quaternion.copy(this.homeQuat);
    return this;
  }

  tipWorld(target: THREE.Vector3) {
    return this.root.localToWorld(target.copy(this.tip));
  }

  gripWorld(target: THREE.Vector3) {
    return this.root.localToWorld(target.set(0, this.gripOffset, 0));
  }

  /** Tilt from upright, in radians. */
  tiltAngle() {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.root.getWorldQuaternion(new THREE.Quaternion()));
    return Math.acos(THREE.MathUtils.clamp(up.y, -1, 1));
  }
}
