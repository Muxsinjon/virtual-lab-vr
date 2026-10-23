import * as THREE from 'three';
import { t, type Key } from '../i18n';

// A small card of controller instructions floating above the left controller in VR, for people
// who have never used a headset. B or Y hides and shows it.

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
      new THREE.PlaneGeometry(0.18, (0.18 * H) / W),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, toneMapped: false }),
    );
    // Above the controller, tilted back towards your eyes.
    this.mesh.position.set(0, 0.11, 0.0);
    this.mesh.rotation.x = -0.55;
    this.mesh.renderOrder = 997;
    this.draw();
  }

  toggle() {
    this.mesh.visible = !this.mesh.visible;
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
