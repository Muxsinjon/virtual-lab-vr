import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { audio } from './audio';
import type { Lab } from './lab';
import type { WorldPanel } from './panel';
import { BENCH } from './room';
import { HelpCard } from './help';
import type { Holder, Tool } from './tools';

// Picking things up and using them, with a mouse, a finger or VR controllers.
//
// Mouse/finger: click a tool to hold it; it floats above the bench and snaps onto whatever it is
// over (a beaker's mouth, the flame). Holding the button tilts it to pour.
// VR: grip or trigger picks up whatever is near the hand (or under the ray); tilting your
// wrist pours for real. The other button uses the tool (a drop from a dropper).

export interface InputHost {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  rig: THREE.Group;
  controls: OrbitControls;
  panel: WorldPanel;
  lab: () => Lab;
  onHoldChange: (tool: Tool | null) => void;
}

interface Hand {
  i: 0 | 1;
  /** Buttons pressed last frame, to catch new presses (A/X, B/Y). */
  was: boolean[];
  /** Snap turn waits for the stick to come back to the middle. */
  turnReady: boolean;
  ray: THREE.Group;
  grip: THREE.Group;
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  source: XRInputSource | null;
  held: Tool | null;
  heldBy: 'select' | 'squeeze' | null;
}

const UP = new THREE.Vector3(0, 1, 0);

/** Raycasting ignores `visible`, so hidden meshes (empty liquid, unlit flame) must be skipped. */
function shown(o: THREE.Object3D | null) {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}
const POUR_TILT = 1.95;

export class Input {
  heldPointer: Tool | null = null;
  private useActive = false;
  /** The free tool under the mouse or a controller's ray, for the name tag. */
  private hovered: Tool | null = null;
  private readonly ndc = new THREE.Vector2();
  /** Height of the held tool's tip, with the mouse or a finger. */
  private tipY = BENCH.top + 0.2;
  private readonly raycaster = new THREE.Raycaster();
  private readonly hands: Hand[] = [];
  private readonly canvas: HTMLCanvasElement;

  constructor(private readonly host: InputHost) {
    this.canvas = host.renderer.domElement;
    const c = this.canvas;
    c.addEventListener('pointerdown', this.onDown, { capture: true });
    c.addEventListener('pointermove', (e) => this.setNdc(e));
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse') this.useActive = false;
    });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    // While holding something, the wheel moves it up and down instead of zooming.
    c.addEventListener(
      'wheel',
      (e) => {
        if (!this.heldPointer) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        this.nudgeHeight(-e.deltaY * 0.0004);
      },
      { capture: true, passive: false },
    );
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.putBack();
      if (this.heldPointer && ['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(e.key)) {
        e.preventDefault();
        this.nudgeHeight(e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' ? 0.02 : -0.02);
      }
      if (e.key === ' ' && this.heldPointer) {
        e.preventDefault();
        if (!e.repeat) this.useStart();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === ' ') this.useActive = false;
    });
    this.setupXR();
  }

  private setNdc(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  private onDown = (e: PointerEvent) => {
    audio.unlock();
    this.setNdc(e);
    const consume = () => {
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    if (this.heldPointer) {
      consume();
      if (e.button === 2) this.putBack();
      // A finger moves the held tool; pouring is on the on-screen button.
      else if (e.pointerType === 'mouse') this.useStart();
      return;
    }
    if (e.button !== 0) return;
    this.raycaster.setFromCamera(this.ndc, this.host.camera);
    const hit = this.pick();
    if (!hit) return;
    consume();
    if (hit.panelUv) this.host.panel.click(hit.panelUv);
    else if (hit.press) {
      audio.click();
      hit.press();
    } else if (hit.tool) this.grab(hit.tool, 'pointer');
  };

  /** Start using the held tool: pour (held) or one drop (each press). */
  useStart() {
    const tool = this.heldPointer;
    if (!tool) return;
    if (tool.use === 'drip') this.host.lab().drip(tool);
    else this.useActive = true;
  }

  useEnd() {
    this.useActive = false;
  }

  putBack() {
    if (this.heldPointer) this.release(this.heldPointer);
  }

  /** Whatever the current ray hits first: the panel, a button on the bench, or a tool. */
  private pick() {
    const lab = this.host.lab();
    const targets: THREE.Object3D[] = [this.host.panel.mesh, ...lab.pressables.map((p) => p.mesh)];
    for (const t of lab.tools) if (t.held === null) targets.push(t.root);
    const hits = this.raycaster.intersectObjects(targets, true);
    for (const h of hits) {
      if (!shown(h.object)) continue;
      if (h.object === this.host.panel.mesh) return { distance: h.distance, panelUv: h.uv ?? null };
      const press = lab.pressables.find((p) => p.mesh === h.object);
      if (press) return { distance: h.distance, press: press.onPress };
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.tool) o = o.parent;
      if (o) return { distance: h.distance, tool: o.userData.tool as Tool };
    }
    return null;
  }

  private grab(tool: Tool, holder: Holder, hand?: Hand, near = false) {
    if (tool.held !== null) this.release(tool, false);
    tool.returning = -1;
    tool.held = holder;
    tool.tilt = 0;
    audio.click();
    if (holder === 'pointer') {
      this.heldPointer = tool;
      this.tipY = BENCH.top + tool.holdHeight;
      this.host.controls.enabled = false;
      this.host.onHoldChange(tool);
    } else if (hand) {
      hand.held = tool;
      if (near) hand.grip.attach(tool.root);
      else {
        hand.grip.add(tool.root);
        tool.root.position.set(0, -tool.gripOffset, -0.01);
        tool.root.quaternion.identity();
      }
      this.pulse(hand, 0.4, 40);
    }
  }

  private release(tool: Tool, goHome = true) {
    const lab = this.host.lab();
    if (tool.held === 'pointer') {
      this.heldPointer = null;
      this.useActive = false;
      this.host.controls.enabled = true;
      this.host.onHoldChange(null);
    } else {
      const hand = this.hands.find((h) => h.held === tool);
      if (hand) {
        hand.held = null;
        hand.heldBy = null;
      }
    }
    lab.group.attach(tool.root);
    tool.held = null;
    tool.tilt = 0;
    if (goHome) {
      tool.returnFrom.copy(tool.root.position);
      tool.returnFromQuat.copy(tool.root.quaternion);
      tool.returning = 0;
    }
  }

  /** Let go of everything at once, before the bench is rebuilt. */
  dropAll() {
    for (const h of this.hands) {
      if (h.held) h.grip.remove(h.held.root);
      h.held = null;
      h.heldBy = null;
    }
    if (this.heldPointer) {
      this.heldPointer = null;
      this.useActive = false;
      this.host.controls.enabled = true;
      this.host.onHoldChange(null);
    }
  }

  update(dt: number) {
    const held = this.heldPointer;
    if (held) this.placeHeld(held, dt);
    else if (!this.host.renderer.xr.isPresenting) this.hoverPointer();
    if (this.host.renderer.xr.isPresenting) {
      this.updateHands();
      this.buttonsAndSticks(dt);
    }
  }

  private hoverPointer() {
    this.raycaster.setFromCamera(this.ndc, this.host.camera);
    const hit = this.pick();
    const onButton = this.host.panel.pointAt(hit?.panelUv ?? null);
    this.hovered = hit?.tool ?? null;
    this.canvas.style.cursor = hit?.tool ? 'grab' : hit?.press || onButton ? 'pointer' : '';
  }

  /**
   * Mouse/finger holding. The tool's tip (spout, dropper tip, splint end, tube mouth) goes exactly
   * where the cursor points, at the current height; the wheel raises and lowers it. Nothing pulls
   * it towards containers: you aim it yourself, and tilting pivots around the spout.
   */
  private placeHeld(tool: Tool, dt: number) {
    const cam = this.host.camera;
    this.raycaster.setFromCamera(this.ndc, cam);
    const plane = new THREE.Plane(UP, -this.tipY);
    const p = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, p)) p.copy(tool.tipWorld(new THREE.Vector3()));
    p.x = THREE.MathUtils.clamp(p.x, -1.6, 1.6);
    p.z = THREE.MathUtils.clamp(p.z, -1.3, 0.8);

    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    right.y = 0;
    right.normalize();
    const fwd = new THREE.Vector3().crossVectors(UP, right).normalize();
    const want = tool.use === 'pour' && this.useActive ? POUR_TILT : 0;
    tool.tilt += THREE.MathUtils.clamp(want - tool.tilt, -dt * 4, dt * 2.2);
    const q = new THREE.Quaternion()
      .setFromAxisAngle(fwd, tool.tilt)
      .multiply(new THREE.Quaternion().setFromAxisAngle(UP, Math.atan2(-right.z, right.x)))
      .multiply(tool.desktopQuat);

    const pos = p.sub(tool.tip.clone().applyQuaternion(q));
    const k = 1 - Math.exp(-dt * 20);
    tool.root.position.lerp(pos, k);
    tool.root.quaternion.slerp(q, k);
  }

  /** Raise or lower the held tool (mouse wheel, arrow keys, or the on-screen buttons). */
  nudgeHeight(dy: number) {
    this.tipY = THREE.MathUtils.clamp(this.tipY + dy, 0.03, BENCH.top + 0.75);
  }

  // ---- VR controllers and hands ----

  private setupXR() {
    const { renderer, rig } = this.host;
    const models = new XRControllerModelFactory();
    const handModels = new XRHandModelFactory();
    for (const i of [0, 1] as const) {
      const ray = renderer.xr.getController(i);
      const grip = renderer.xr.getControllerGrip(i);
      grip.add(models.createControllerModel(grip));
      const handSpace = renderer.xr.getHand(i);
      handSpace.add(handModels.createHandModel(handSpace, 'mesh'));
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
      );
      ray.add(line);
      rig.add(ray, grip, handSpace);
      const hand: Hand = { i, ray, grip, line, source: null, held: null, heldBy: null, was: [], turnReady: true };
      this.hands.push(hand);
      ray.addEventListener('connected', (e) => {
        hand.source = (e as unknown as { data: XRInputSource }).data;
        // The controls card rides above the left controller, like a wristwatch.
        if (hand.source.handedness === 'left' && !hand.source.hand) hand.grip.add(this.help.mesh);
      });
      ray.addEventListener('disconnected', () => {
        if (hand.held) this.release(hand.held);
        hand.source = null;
      });
      ray.addEventListener('selectstart', () => this.press(hand, 'select'));
      ray.addEventListener('selectend', () => this.unpress(hand, 'select'));
      ray.addEventListener('squeezestart', () => this.press(hand, 'squeeze'));
      ray.addEventListener('squeezeend', () => this.unpress(hand, 'squeeze'));
    }
  }

  /** Meta Quest controllers: sticks move, turn and raise you; A/X recentres; B/Y shows the help card. */
  private buttonsAndSticks(dt: number) {
    if (this.recenterIn > 0 && --this.recenterIn === 0) this.recenter();
    for (const hand of this.hands) {
      const pad = hand.source?.gamepad;
      if (!pad || hand.source?.hand) continue;
      const pressed = (i: number) => !!pad.buttons[i]?.pressed;
      const fresh = (i: number) => pressed(i) && !hand.was[i];
      const x = Math.abs(pad.axes[2] ?? 0) > 0.2 ? pad.axes[2] : 0;
      const y = Math.abs(pad.axes[3] ?? 0) > 0.2 ? pad.axes[3] : 0;
      if (hand.source!.handedness === 'left') {
        // Left stick: walk, relative to where you're looking.
        if (x || y) {
          const { forward, right } = this.headAxes();
          this.host.rig.position.addScaledVector(right, x * 0.6 * dt).addScaledVector(forward, -y * 0.6 * dt);
        }
      } else {
        // Right stick: left/right turns 30° at a time, up/down raises or lowers you.
        if (Math.abs(x) > 0.7 && hand.turnReady) {
          this.turn(x > 0 ? -Math.PI / 6 : Math.PI / 6);
          hand.turnReady = false;
        } else if (Math.abs(x) < 0.3) hand.turnReady = true;
        if (Math.abs(y) > 0.3 && Math.abs(x) < 0.5) {
          const rig = this.host.rig;
          rig.position.y = THREE.MathUtils.clamp(rig.position.y - y * 0.5 * dt, -0.4, 0.9);
        }
      }
      if (fresh(4)) this.recenter(); // A or X
      if (fresh(5)) this.help.toggle(); // B or Y
      hand.was = pad.buttons.map((b) => b.pressed);
    }
  }

  /** Head position and level facing direction in the world. In VR, three.js keeps the camera's
   *  headset pose relative to the rig, so combining it with the rig's current transform is
   *  always up to date, even right after the rig has moved. */
  private head() {
    const { camera, rig } = this.host;
    rig.updateMatrix();
    const pos = camera.position.clone().applyMatrix4(rig.matrix);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).applyQuaternion(rig.quaternion).setY(0);
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    return { pos, forward };
  }

  private headAxes() {
    const { forward } = this.head();
    return { forward, right: new THREE.Vector3(-forward.z, 0, forward.x) };
  }

  /** Turn the whole play space around your head. */
  private turn(angle: number) {
    const rig = this.host.rig;
    const { pos } = this.head();
    rig.position.sub(pos).applyAxisAngle(UP, angle).add(pos);
    rig.rotation.y += angle;
  }

  /** Put you at the bench, facing it, wherever you stood when VR started. */
  recenter() {
    const { forward } = this.head();
    this.turn(Math.atan2(forward.x, -forward.z));
    const { pos } = this.head();
    this.host.rig.position.x -= pos.x;
    this.host.rig.position.z -= pos.z - 0.05;
  }

  /** Recentre a moment after VR starts, once the headset reports where you are. */
  recenterSoon() {
    this.recenterIn = 30;
  }

  private recenterIn = 0;
  readonly help = new HelpCard();

  private pulse(hand: Hand, strength: number, ms: number) {
    const act = hand.source?.gamepad?.hapticActuators?.[0] as { pulse?: (v: number, d: number) => void } | undefined;
    act?.pulse?.(strength, ms);
  }

  private aim(hand: Hand) {
    hand.ray.updateMatrixWorld();
    this.raycaster.ray.origin.setFromMatrixPosition(hand.ray.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).transformDirection(hand.ray.matrixWorld);
    this.raycaster.far = 4;
  }

  /** A free tool within reach of the hand, nearest first. */
  private nearTool(hand: Hand) {
    const g = new THREE.Vector3().setFromMatrixPosition(hand.grip.matrixWorld);
    const p = new THREE.Vector3();
    let best: Tool | null = null;
    let bestD = Infinity;
    for (const t of this.host.lab().tools) {
      if (t.held !== null) continue;
      const d = t.gripWorld(p).distanceTo(g);
      if (d < t.grabRadius && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best;
  }

  private press(hand: Hand, button: 'select' | 'squeeze') {
    audio.unlock();
    if (hand.held) {
      if (hand.heldBy !== button && hand.held.use === 'drip') this.host.lab().drip(hand.held);
      return;
    }
    this.aim(hand);
    const hit = this.pick();
    if (button === 'select' && hit?.panelUv) {
      if (this.host.panel.click(hit.panelUv)) {
        audio.click();
        this.pulse(hand, 0.2, 20);
      }
      return;
    }
    if (button === 'select' && hit?.press) {
      audio.click();
      hit.press();
      return;
    }
    const near = this.nearTool(hand);
    const tool = near ?? hit?.tool;
    if (!tool) return;
    hand.heldBy = button;
    this.grab(tool, hand.i, hand, !!near);
  }

  private unpress(hand: Hand, button: 'select' | 'squeeze') {
    if (hand.held && hand.heldBy === button) this.release(hand.held);
  }

  /** What the name tag should label: something held, or else whatever is pointed at. */
  focus(): Tool | null {
    if (this.heldPointer) return this.heldPointer;
    if (this.host.renderer.xr.isPresenting) return this.hands.find((h) => h.held)?.held ?? this.hovered;
    return this.hovered;
  }

  private updateHands() {
    let panelUv: THREE.Vector2 | null = null;
    this.hovered = null;
    for (const hand of this.hands) {
      if (!hand.source) {
        hand.line.visible = false;
        continue;
      }
      hand.line.visible = !hand.held;
      if (hand.held) continue;
      this.aim(hand);
      const hit = this.pick();
      const near = this.nearTool(hand);
      hand.line.scale.z = hit ? hit.distance : 1.2;
      hand.line.material.color.setHex(near || hit?.tool ? 0x7fffd4 : hit ? 0xffe08a : 0xffffff);
      if (hit?.panelUv) panelUv = hit.panelUv;
      this.hovered ??= near ?? hit?.tool ?? null;
    }
    this.host.panel.pointAt(panelUv);
  }
}
