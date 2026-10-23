import * as THREE from 'three';
import { audio } from './audio';

// Records the lab to a video file (with its sound), straight from the browser, so no separate
// screen recorder or headset camera app is needed. On a screen it records what you see. In VR it
// records a steadied version of your view: head motion is smoothed so the video doesn't shake.
// When you stop, the file is saved to Downloads.

const W = 1280;
const H = 720;

const TYPES: [mime: string, ext: string][] = [
  ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'mp4'],
  ['video/mp4', 'mp4'],
  ['video/webm;codecs=vp9,opus', 'webm'],
  ['video/webm;codecs=vp8,opus', 'webm'],
  ['video/webm', 'webm'],
];

export class Recorder {
  private readonly canvas = document.createElement('canvas');
  private readonly ctx2d: CanvasRenderingContext2D;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private ext = 'webm';
  private startedAt = 0;
  private readonly spectator = new THREE.PerspectiveCamera(72, W / H, 0.02, 30);
  private readonly pos = new THREE.Vector3();
  private readonly quat = new THREE.Quaternion();
  private readonly headPos = new THREE.Vector3();
  private readonly headQuat = new THREE.Quaternion();
  private readonly viewport = new THREE.Vector4();
  private hasPose = false;
  private everyOther = false;
  /** Called with the file name once a recording has been saved. */
  onSaved: (name: string) => void = () => {};

  constructor() {
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx2d = this.canvas.getContext('2d')!;
    this.ctx2d.fillStyle = '#1b2533';
    this.ctx2d.fillRect(0, 0, W, H);
  }

  static supported() {
    return typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function';
  }

  get active() {
    return this.rec !== null;
  }

  /** Seconds recorded so far. */
  get seconds() {
    return this.rec ? (performance.now() - this.startedAt) / 1000 : 0;
  }

  start() {
    if (this.rec || !Recorder.supported()) return false;
    const stream = this.canvas.captureStream(30);
    audio.recordStream()?.getAudioTracks().forEach((track) => stream.addTrack(track));
    const [mime, ext] = TYPES.find(([m]) => MediaRecorder.isTypeSupported(m)) ?? ['', 'webm'];
    this.ext = ext;
    this.chunks = [];
    this.rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 8_000_000 });
    this.rec.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.rec.start(1000);
    this.startedAt = performance.now();
    this.hasPose = false;
    return true;
  }

  stop() {
    const rec = this.rec;
    if (!rec) return;
    this.rec = null;
    rec.onstop = () => {
      const blob = new Blob(this.chunks, { type: rec.mimeType || `video/${this.ext}` });
      const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const name = `virtual-lab-${stamp}.${this.ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      this.onSaved(name);
    };
    rec.stop();
  }

  /** Call right after the frame has been drawn. */
  capture(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    if (!this.rec) return;
    const gl = renderer.domElement;
    if (!renderer.xr.isPresenting) {
      // On a screen: copy what's on the canvas, cropped to 16:9.
      const aspect = gl.width / gl.height;
      let sw = gl.width;
      let sh = gl.height;
      if (aspect > W / H) sw = sh * (W / H);
      else sh = sw / (W / H);
      this.ctx2d.drawImage(gl, (gl.width - sw) / 2, (gl.height - sh) / 2, sw, sh, 0, 0, W, H);
      return;
    }
    // In VR, at 30 fps: draw one steadied, flat view of what you're looking at.
    this.everyOther = !this.everyOther;
    if (!this.everyOther) return;
    renderer.xr.getCamera().matrixWorld.decompose(this.headPos, this.headQuat, this.spectator.scale);
    if (!this.hasPose) {
      this.pos.copy(this.headPos);
      this.quat.copy(this.headQuat);
      this.hasPose = true;
    }
    this.pos.lerp(this.headPos, 0.35);
    this.quat.slerp(this.headQuat, 0.18);
    this.spectator.position.copy(this.pos);
    this.spectator.quaternion.copy(this.quat);
    this.spectator.scale.set(1, 1, 1);
    this.spectator.updateMatrixWorld(true);

    const target = renderer.getRenderTarget();
    renderer.getViewport(this.viewport);
    const w = Math.min(W, gl.width);
    const h = Math.min(H, gl.height);
    renderer.xr.enabled = false;
    renderer.setRenderTarget(null);
    renderer.setViewport(0, 0, w, h);
    renderer.setScissor(0, 0, w, h);
    renderer.setScissorTest(true);
    renderer.render(scene, this.spectator);
    renderer.setScissorTest(false);
    renderer.xr.enabled = true;
    renderer.setRenderTarget(target);
    renderer.setViewport(this.viewport);
    this.ctx2d.drawImage(gl, 0, gl.height - h, w, h, 0, 0, W, H);
  }
}
