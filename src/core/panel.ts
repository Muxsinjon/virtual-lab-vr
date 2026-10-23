import * as THREE from 'three';
import { getLang, t } from '../i18n';
import { fitText } from './parts';
import { BOARD } from './room';

// The board behind the bench: task list, topic menu and buttons. It is a canvas texture, so the
// same board works in VR (controller ray) and on a screen (mouse or finger).

export interface PanelData {
  title: string;
  steps: { text: string; done: boolean; next: boolean }[];
  /** Step-by-step help for the current task, when opened with its ! button. */
  hint: string | null;
  /** The person has been on the current task a while: make the ! pulse. */
  nudge: boolean;
  info: string;
  used: string[];
  /** Table height in cm. */
  table: number;
  inXR: boolean;
  topics: { id: string; title: string; ready: boolean; current: boolean }[];
  toast: string;
}

interface Hit {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const W = 1600;
const H = 1000;
const SCALE = 1.5;

export class WorldPanel {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly canvas = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;
  private hits: Hit[] = [];
  private hover: string | null = null;
  private mode: 'main' | 'topics' = 'main';
  private data: PanelData | null = null;
  onButton: (id: string) => void = () => {};

  constructor() {
    // Drawn at 1.5× so text stays crisp in the headset.
    this.canvas.width = W * SCALE;
    this.canvas.height = H * SCALE;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
    // A wall-mounted smart board above the bench.
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false }));
    this.mesh.position.set(BOARD.x, BOARD.y, BOARD.z);
  }

  set(data: PanelData) {
    this.data = data;
    this.draw();
  }

  showTopics(on: boolean) {
    this.mode = on ? 'topics' : 'main';
    this.draw();
  }

  private idAt(uv: THREE.Vector2) {
    const x = uv.x * W;
    const y = (1 - uv.y) * H;
    return this.hits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h)?.id ?? null;
  }

  pointAt(uv: THREE.Vector2 | null) {
    const id = uv ? this.idAt(uv) : null;
    if (id !== this.hover) {
      this.hover = id;
      this.draw();
    }
    return id !== null;
  }

  click(uv: THREE.Vector2) {
    const id = this.idAt(uv);
    if (!id) return false;
    if (id === 'topics') this.showTopics(true);
    else if (id === 'back') this.showTopics(false);
    else {
      if (id.startsWith('topic:')) this.mode = 'main';
      this.onButton(id);
    }
    return true;
  }

  private button(c: CanvasRenderingContext2D, id: string, label: string, x: number, y: number, w: number, h: number, primary = false, disabled = false) {
    const hot = this.hover === id && !disabled;
    c.fillStyle = disabled ? '#3a4a58' : primary ? (hot ? '#3fb7a0' : '#2a9d8a') : hot ? '#3d5a73' : '#2c4458';
    roundRect(c, x, y, w, h, 18);
    c.fill();
    c.fillStyle = disabled ? '#7f8f9c' : '#ffffff';
    c.font = `600 34px "Segoe UI", system-ui, sans-serif`;
    fitText(c, label, w - 30, 34, 600);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, x + w / 2, y + h / 2 + 1);
    if (!disabled) this.hits.push({ id, x, y, w, h });
  }

  private draw() {
    const d = this.data;
    if (!d) return;
    const c = this.canvas.getContext('2d')!;
    c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    this.hits = [];
    c.fillStyle = '#152230';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = '#2a9d8a';
    c.lineWidth = 10;
    c.strokeRect(5, 5, W - 10, H - 10);

    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#7fd6c4';
    c.font = '600 30px "Segoe UI", system-ui, sans-serif';
    c.fillText(t('app.title').toUpperCase(), 60, 72);

    if (this.mode === 'topics') {
      c.fillStyle = '#ffffff';
      c.font = '700 58px "Segoe UI", system-ui, sans-serif';
      c.fillText(t('ui.topics'), 60, 150);
      d.topics.forEach((tp, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const label = tp.ready ? tp.title : `${tp.title} · ${t('ui.soon')}`;
        this.button(c, `topic:${tp.id}`, label, 60 + col * 750, 200 + row * 130, 720, 105, tp.current, !tp.ready);
      });
      this.button(c, 'back', `← ${t('ui.back')}`, 60, H - 150, 320, 95);
    } else {
      c.fillStyle = '#ffffff';
      c.font = '700 62px "Segoe UI", system-ui, sans-serif';
      fitText(c, d.title, W - 120, 62, 700);
      c.fillText(d.title, 60, 145);

      c.fillStyle = '#9fb3c3';
      c.font = '600 30px "Segoe UI", system-ui, sans-serif';
      c.fillText(t('ui.steps'), 60, 205);
      d.steps.forEach((s, i) => {
        const y = 262 + i * 76;
        c.fillStyle = s.done ? '#2a9d8a' : 'transparent';
        c.strokeStyle = s.done ? '#2a9d8a' : '#9fb3c3';
        c.lineWidth = 4;
        roundRect(c, 60, y - 34, 44, 44, 10);
        c.fill();
        c.stroke();
        if (s.done) {
          c.strokeStyle = '#ffffff';
          c.lineWidth = 6;
          c.beginPath();
          c.moveTo(70, y - 12);
          c.lineTo(80, y - 2);
          c.lineTo(96, y - 24);
          c.stroke();
        }
        c.fillStyle = s.done ? '#8fa6b6' : '#ffffff';
        c.font = `600 40px "Segoe UI", system-ui, sans-serif`;
        fitText(c, s.text, s.next ? 880 : 1000, 40, 600);
        c.fillText(s.text, 125, y);
        if (s.next) {
          // "!" opens step-by-step help for the task you're on.
          const bx = 1030;
          const hot = this.hover === 'hint' || !!d.hint;
          c.fillStyle = hot ? '#ffd978' : d.nudge ? '#ffb347' : '#f4c95d';
          c.beginPath();
          c.arc(bx + 28, y - 12, d.nudge && !d.hint ? 32 : 28, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#1b2533';
          c.textAlign = 'center';
          c.font = '900 40px "Segoe UI", system-ui, sans-serif';
          c.fillText('!', bx + 28, y + 2);
          c.textAlign = 'left';
          this.hits.push({ id: 'hint', x: bx - 6, y: y - 52, w: 68, h: 80 });
        }
      });

      // Equation / explanation box.
      const infoY = 262 + d.steps.length * 76 - 10;
      c.fillStyle = d.hint ? '#3a3216' : '#1e3243';
      roundRect(c, 60, infoY, 1050, 175, 16);
      c.fill();
      if (d.hint) {
        c.fillStyle = '#f4c95d';
        c.font = '700 28px "Segoe UI", system-ui, sans-serif';
        c.fillText(`! ${t('ui.help')}`, 85, infoY + 38);
        c.fillStyle = '#fff6dc';
        wrap(c, d.hint, 85, infoY + 76, 1000, 34, '500 28px "Segoe UI", system-ui, sans-serif', 3);
      } else {
        c.fillStyle = '#e8f1f6';
        wrap(c, d.info, 85, infoY + 52, 1000, 44, '500 34px "Segoe UI", system-ui, sans-serif', 3);
      }

      // Usage: the point of the whole project, nothing runs out.
      const ux = 1160;
      c.fillStyle = '#1e3243';
      roundRect(c, ux, 180, 380, 520, 16);
      c.fill();
      c.fillStyle = '#7fd6c4';
      c.font = '600 28px "Segoe UI", system-ui, sans-serif';
      fitText(c, t('ui.used'), 330, 28, 600);
      c.fillText(t('ui.used'), ux + 25, 228);
      c.fillStyle = '#e8f1f6';
      c.font = '500 27px "Segoe UI", system-ui, sans-serif';
      const lines = d.used.length ? d.used.slice(0, 9) : [t('ui.usedNone')];
      lines.forEach((l, i) => {
        fitText(c, l, 330, 27, 500);
        c.fillText(l, ux + 25, 280 + i * 44);
      });
      c.fillStyle = '#f4c95d';
      c.font = '700 29px "Segoe UI", system-ui, sans-serif';
      fitText(c, t('ui.supply'), 330, 29, 700);
      c.fillText(t('ui.supply'), ux + 25, 675);

      const by = H - 145;
      this.button(c, 'topics', `☰ ${t('ui.topics')}`, 60, by, 330, 95, true);
      this.button(c, 'reset', `↺ ${t('ui.reset')}`, 410, by, 360, 95);
      // Language: both choices visible, the current one highlighted.
      this.button(c, 'langEn', 'EN', 790, by, 120, 95, getLang() === 'en');
      this.button(c, 'langUz', 'UZ', 920, by, 120, 95, getLang() === 'uz');
      // Table height: lower / current / raise.
      this.button(c, 'tableDown', '▼', 1060, by, 90, 95);
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '600 26px "Segoe UI", system-ui, sans-serif';
      c.fillText(t('ui.table'), 1235, by + 30);
      c.font = '800 38px "Segoe UI", system-ui, sans-serif';
      c.fillText(`${d.table} cm`, 1235, by + 68);
      this.button(c, 'tableUp', '▲', 1320, by, 90, 95);
      if (d.inXR) this.button(c, 'exit', '✕ VR', 1430, by, 110, 95);
    }

    // Messages appear as a banner across the top of the board.
    if (d.toast) {
      c.fillStyle = 'rgba(244, 201, 93, 0.97)';
      roundRect(c, 40, 30, W - 80, 130, 18);
      c.fill();
      c.fillStyle = '#1b2533';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '700 44px "Segoe UI", system-ui, sans-serif';
      fitText(c, d.toast, W - 160, 44, 700);
      c.fillText(d.toast, W / 2, 96);
    }
    this.texture.needsUpdate = true;
  }
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, font: string, maxLines: number) {
  c.font = font;
  c.textAlign = 'left';
  const words = text.split(' ');
  let line = '';
  let n = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (c.measureText(test).width > maxW && line) {
      c.fillText(line, x, y + n * lh);
      line = w;
      if (++n >= maxLines) return;
    } else line = test;
  }
  if (line) c.fillText(line, x, y + n * lh);
}
