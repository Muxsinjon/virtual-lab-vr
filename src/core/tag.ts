import * as THREE from 'three';
import type { Tool } from './tools';

// A name tag that floats above whatever you point at or hold, always facing you and drawn on top,
// so equipment names are readable at any distance (on a screen and in the headset).

const W = 1024;
const H = 256;
const FONT = '"Segoe UI", system-ui, sans-serif';

export class NameTag {
  readonly sprite: THREE.Sprite;
  private readonly canvas = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;
  private text = '';
  private readonly box = new THREE.Box3();
  private readonly target = new THREE.Vector3();

  constructor() {
    this.canvas.width = W;
    this.canvas.height = H;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.texture, depthTest: false, depthWrite: false, transparent: true, toneMapped: false }),
    );
    this.sprite.renderOrder = 999;
    this.sprite.center.set(0.5, 0);
    this.sprite.visible = false;
  }

  /** Show the tag above `tool`, or hide it. `scale` grows it for far-away viewers (VR). */
  update(tool: Tool | null, dt: number, scale = 1) {
    if (!tool) {
      this.sprite.visible = false;
      return;
    }
    const name = tool.name();
    const detail = tool.detail?.() ?? '';
    const text = `${name}\n${detail}`;
    if (text !== this.text) {
      this.text = text;
      this.draw(name, detail);
    }
    this.box.setFromObject(tool.root);
    this.box.getCenter(this.target);
    this.target.y = this.box.max.y + 0.025;
    const fresh = !this.sprite.visible;
    this.sprite.visible = true;
    if (fresh) this.sprite.position.copy(this.target);
    else this.sprite.position.lerp(this.target, 1 - Math.exp(-dt * 20));
    const w = 0.2 * scale;
    this.sprite.scale.set(w, (w * H) / W, 1);
  }

  private draw(name: string, detail: string) {
    const c = this.canvas.getContext('2d')!;
    c.clearRect(0, 0, W, H);
    c.font = `700 92px ${FONT}`;
    let size = 92;
    while (c.measureText(name).width > W - 120 && size > 40) {
      size -= 4;
      c.font = `700 ${size}px ${FONT}`;
    }
    const nameW = c.measureText(name).width;
    c.font = `600 64px ${FONT}`;
    const detailW = detail ? c.measureText(detail).width : 0;
    const boxW = Math.min(W - 8, Math.max(nameW, detailW) + 90);
    const boxH = detail ? 220 : 140;
    const x = (W - boxW) / 2;
    const y = H - boxH - 24;
    c.fillStyle = 'rgba(14, 24, 34, 0.9)';
    c.beginPath();
    c.roundRect(x, y, boxW, boxH, 36);
    c.fill();
    // Little pointer under the box.
    c.beginPath();
    c.moveTo(W / 2 - 22, H - 25);
    c.lineTo(W / 2 + 22, H - 25);
    c.lineTo(W / 2, H - 2);
    c.fill();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#ffffff';
    c.font = `700 ${size}px ${FONT}`;
    c.fillText(name, W / 2, y + (detail ? 72 : boxH / 2 + 4));
    if (detail) {
      c.fillStyle = '#7fe0cb';
      c.font = `600 64px ${FONT}`;
      c.fillText(detail, W / 2, y + 160);
    }
    this.texture.needsUpdate = true;
  }
}
