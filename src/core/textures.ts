import * as THREE from 'three';

// Procedural textures: everything is drawn on canvases at startup, so the app ships no image files.

export function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...repeat);
  }
  return tex;
}

/** Deterministic noise so textures look the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function speckle(c: CanvasRenderingContext2D, w: number, h: number, n: number, colors: string[], size: [number, number], seed: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    c.fillStyle = colors[Math.floor(r() * colors.length)];
    const s = size[0] + r() * (size[1] - size[0]);
    c.beginPath();
    c.ellipse(r() * w, r() * h, s, s * (0.6 + r() * 0.4), r() * Math.PI, 0, Math.PI * 2);
    c.fill();
  }
}

/** Oak-veneer cabinet wood with grain running vertically. */
export const woodTexture = (base = '#a8784a', dark = '#7d5532') =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 90; i++) {
      const x = r() * w;
      c.strokeStyle = dark;
      c.globalAlpha = 0.06 + r() * 0.16;
      c.lineWidth = 1 + r() * 3.5;
      c.beginPath();
      c.moveTo(x, 0);
      for (let y = 0; y <= h; y += 32) c.lineTo(x + Math.sin(y * 0.018 + i) * (4 + r() * 6), y);
      c.stroke();
    }
    c.globalAlpha = 1;
  });

/** Black epoxy-resin bench top, faintly speckled. */
export const epoxyTexture = () =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#323a3d';
    c.fillRect(0, 0, w, h);
    speckle(c, w, h, 2200, ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.22)', 'rgba(140,160,170,0.08)'], [0.6, 2], 3);
  }, [3, 1.2]);

/** Glazed wall tiles with grout lines (lower half of the walls, as in most school labs). */
export const tileTexture = (color = '#9fc2b4') =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#d9ddd6';
    c.fillRect(0, 0, w, h);
    const n = 4;
    const s = w / n;
    const r = rng(11);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const shade = 0.93 + r() * 0.1;
        c.fillStyle = color;
        c.globalAlpha = 1;
        c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        c.fillStyle = shade > 1 ? '#ffffff' : '#000000';
        c.globalAlpha = Math.abs(shade - 1) * 1.4;
        c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        // Glaze highlight.
        const g = c.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
        g.addColorStop(0, 'rgba(255,255,255,0.18)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        c.globalAlpha = 1;
        c.fillStyle = g;
        c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
      }
  });

/** Painted plaster with a slight mottle. */
export const paintTexture = (color: string) =>
  canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    speckle(c, w, h, 3000, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.035)'], [0.4, 1.2], 5);
  });

/** Large vinyl floor tiles, terrazzo-like. */
export const floorTexture = () =>
  canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#8f877b';
    c.fillRect(0, 0, w, h);
    speckle(c, w, h, 2600, ['#6f675c', '#a59d90', '#b7afa1', '#5d564d', '#9a8f7e'], [0.8, 2.6], 9);
    c.strokeStyle = 'rgba(40,35,30,0.45)';
    c.lineWidth = 3;
    c.strokeRect(0, 0, w, h);
    c.strokeRect(w / 2, 0, 0.01, h);
    c.strokeRect(0, h / 2, w, 0.01);
  }, [6, 6]);

/** Suspended-ceiling tiles. */
export const ceilingTexture = () =>
  canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#d8d4cb';
    c.fillRect(0, 0, w, h);
    speckle(c, w, h, 900, ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.08)'], [0.5, 1.4], 13);
    c.strokeStyle = '#a9a69f';
    c.lineWidth = 6;
    c.strokeRect(0, 0, w, h);
  }, [10, 10]);

/** A green school chalkboard with today's chemistry on it. */
export const chalkboardTexture = () =>
  canvasTexture(1600, 800, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#2f4a3c');
    g.addColorStop(1, '#273f33');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    // Old chalk smudges.
    speckle(c, w, h, 60, ['rgba(255,255,255,0.035)'], [40, 140], 21);
    c.fillStyle = 'rgba(245,245,235,0.92)';
    c.font = 'italic 600 64px "Segoe Print", "Comic Sans MS", cursive';
    c.fillText('Kimyo · Chemistry', 90, 120);
    c.font = '500 58px "Segoe Print", "Comic Sans MS", cursive';
    c.fillText('Zn + 2HCl → ZnCl₂ + H₂↑', 110, 260);
    c.fillText('2H₂O₂ → 2H₂O + O₂↑   (MnO₂)', 110, 370);
    c.fillText('HCl + NaOH → NaCl + H₂O', 110, 480);
    c.fillText('pH = −lg[H⁺]', 110, 590);
    c.font = '500 46px "Segoe Print", "Comic Sans MS", cursive';
    c.fillStyle = 'rgba(250,225,120,0.9)';
    c.fillText('pH < 7 kislota   pH = 7 neytral   pH > 7 ishqor', 110, 700);
    c.strokeStyle = 'rgba(245,245,235,0.6)';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(90, 140);
    c.lineTo(720, 140);
    c.stroke();
  });

// Periods 1–4 of the periodic table: [symbol, number, period, group, category].
const ELEMENTS: [string, number, number, number][] = [
  ['H', 1, 1, 0], ['He', 1, 18, 5],
  ['Li', 2, 1, 1], ['Be', 2, 2, 2], ['B', 2, 13, 4], ['C', 2, 14, 0], ['N', 2, 15, 0], ['O', 2, 16, 0], ['F', 2, 17, 6], ['Ne', 2, 18, 5],
  ['Na', 3, 1, 1], ['Mg', 3, 2, 2], ['Al', 3, 13, 7], ['Si', 3, 14, 4], ['P', 3, 15, 0], ['S', 3, 16, 0], ['Cl', 3, 17, 6], ['Ar', 3, 18, 5],
  ['K', 4, 1, 1], ['Ca', 4, 2, 2], ['Sc', 4, 3, 3], ['Ti', 4, 4, 3], ['V', 4, 5, 3], ['Cr', 4, 6, 3], ['Mn', 4, 7, 3], ['Fe', 4, 8, 3],
  ['Co', 4, 9, 3], ['Ni', 4, 10, 3], ['Cu', 4, 11, 3], ['Zn', 4, 12, 3], ['Ga', 4, 13, 7], ['Ge', 4, 14, 4], ['As', 4, 15, 4],
  ['Se', 4, 16, 0], ['Br', 4, 17, 6], ['Kr', 4, 18, 5],
];
const CATEGORY = ['#7cc48a', '#ef8a80', '#f5b971', '#efd768', '#9cc7b5', '#8fb3ea', '#c49be6', '#b8bec8'];

export const periodicTexture = () =>
  canvasTexture(1400, 600, (c, w, h) => {
    c.fillStyle = '#fbfaf4';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#1f3a5a';
    c.fillRect(0, 0, w, 70);
    c.fillStyle = '#ffffff';
    c.font = '700 40px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('D. I. Mendeleyev · Kimyoviy elementlar davriy jadvali', w / 2, 50);
    const cell = 72;
    const x0 = (w - cell * 18) / 2;
    let n = 0;
    for (const [sym, period, group, cat] of ELEMENTS) {
      n++;
      const x = x0 + (group - 1) * cell;
      const y = 100 + (period - 1) * (cell + 50);
      c.fillStyle = CATEGORY[cat];
      c.fillRect(x + 3, y + 3, cell - 6, cell + 34);
      c.fillStyle = '#1b2533';
      c.font = '500 18px "Segoe UI", sans-serif';
      c.textAlign = 'left';
      c.fillText(String(n), x + 9, y + 24);
      c.textAlign = 'center';
      c.font = '700 34px "Segoe UI", sans-serif';
      c.fillText(sym, x + cell / 2, y + 68);
    }
  });

/** Lab safety poster: goggles, gloves, no food. */
export const safetyPosterTexture = () =>
  canvasTexture(600, 840, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#1565c0';
    c.fillRect(0, 0, w, 130);
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.font = '800 54px "Segoe UI", sans-serif';
    c.fillText('XAVFSIZLIK', w / 2, 60);
    c.font = '600 32px "Segoe UI", sans-serif';
    c.fillText('Lab safety rules', w / 2, 108);
    const rules = ['Ko‘zoynak taqing', 'Qo‘lqop kiying', 'Ovqat yemang', 'Hidlamang'];
    const icons = ['👓', '🧤', '🚫', '👃'];
    rules.forEach((r, i) => {
      const y = 200 + i * 160;
      c.fillStyle = i === 2 || i === 3 ? '#c62828' : '#1565c0';
      c.beginPath();
      c.arc(110, y + 20, 58, 0, Math.PI * 2);
      c.fill();
      c.font = '64px "Segoe UI Emoji", sans-serif';
      c.fillText(icons[i], 110, y + 42);
      c.fillStyle = '#1b2533';
      c.textAlign = 'left';
      c.font = '700 40px "Segoe UI", sans-serif';
      c.fillText(r, 200, y + 34);
      c.textAlign = 'center';
    });
  });

export const clockTexture = () =>
  canvasTexture(256, 256, (c, w) => {
    const r = w / 2;
    c.fillStyle = '#fbfbf7';
    c.beginPath();
    c.arc(r, r, r - 4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#222';
    c.lineWidth = 10;
    c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      c.lineWidth = i % 3 === 0 ? 8 : 4;
      c.beginPath();
      c.moveTo(r + Math.sin(a) * (r - 18), r - Math.cos(a) * (r - 18));
      c.lineTo(r + Math.sin(a) * (r - 38), r - Math.cos(a) * (r - 38));
      c.stroke();
    }
    const hand = (a: number, len: number, wdt: number) => {
      c.lineWidth = wdt;
      c.beginPath();
      c.moveTo(r, r);
      c.lineTo(r + Math.sin(a) * len, r - Math.cos(a) * len);
      c.stroke();
    };
    hand(Math.PI * 2 * (10.2 / 12), r * 0.5, 10);
    hand(Math.PI * 2 * (12 / 60), r * 0.75, 6);
  });

/** Soft round shadow for under objects that don't get a real one. */
export const blobShadowTexture = () =>
  canvasTexture(128, 128, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, w);
  });
