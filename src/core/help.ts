import * as THREE from 'three';
import { t, type Key } from '../i18n';

// A small card of controller instructions on the left wrist in VR, for people who have never
// used a headset. It sits back towards the wrist so it never covers what the hand reaches for,
// hides itself once you've picked something up (or after 40 s), and B or Y shows it again.

const W = 900;
const H = 760;
const FONT = '"Segoe UI", system-ui, sans-serif';

const ROWS: [button: string, color: string, text: Key][] = [
  ['GRIP', '#2a9d8a', 'vr.grip'],
  ['↻', '#2a9d8a', 'vr.tilt'],
  ['TRIGGER', '#3d6fb8', 'vr.trigger'],
  ['L ◎', '#6b5bb8', 'vr.leftStick'],
  ['R ◎', '#6b5bb8', 'vr.rightStick'],
  ['A / X', '#c27c1a', 'vr.recenter'],
  ['B / Y', '#c27c1a', 'vr.toggleHelp'],
];

export class HelpCard {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly canvas = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;

  constructor() {
    this.canvas.width = W;
    this.canvas.height = H;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.13, (0.13 * H) / W),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, toneMapped: false }),
    );
    // Above the back of the controller, by the wrist, tilted towards your eyes.
    this.mesh.position.set(-0.01, 0.075, 0.075);
    this.mesh.rotation.x = -0.6;
    this.mesh.renderOrder = 997;
    this.draw();
  }

  private shownFor = 0;

  show() {
    this.mesh.visible = true;
    this.shownFor = 0;
  }

  hide() {
    this.mesh.visible = false;
  }

  toggle() {
    if (this.mesh.visible) this.hide();
    else this.show();
  }

  update(dt: number) {
    if (!this.mesh.visible) return;
    this.shownFor += dt;
    if (this.shownFor > 40) this.hide();
  }

  draw() {
    const c = this.canvas.getContext('2d')!;
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(14, 24, 34, 0.92)';
    c.beginPath();
    c.roundRect(0, 0, W, H, 40);
    c.fill();
    c.fillStyle = '#7fd6c4';
    c.font = `800 52px ${FONT}`;
    c.textBaseline = 'middle';
    c.fillText(t('vr.title'), 44, 62);
    ROWS.forEach(([btn, color, key], i) => {
      const y = 150 + i * 88;
      c.fillStyle = color;
      c.beginPath();
      c.roundRect(40, y - 32, 210, 64, 18);
      c.fill();
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      c.font = `800 32px ${FONT}`;
      c.fillText(btn, 145, y + 2);
      c.textAlign = 'left';
      c.font = `600 36px ${FONT}`;
      let size = 36;
      const text = t(key);
      while (c.measureText(text).width > W - 310 && size > 22) {
        size -= 2;
        c.font = `600 ${size}px ${FONT}`;
      }
      c.fillText(text, 280, y + 2);
    });
    this.texture.needsUpdate = true;
  }
}
