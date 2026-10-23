import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { audio } from './core/audio';
import { Input } from './core/input';
import { Lab, type UsageEntry } from './core/lab';
import { WorldPanel } from './core/panel';
import { NameTag } from './core/tag';
import { BENCH, buildRoom } from './core/room';
import type { Tool } from './core/tools';
import { getLang, onLangChange, setLang, t, type Key } from './i18n';
import { TOPICS } from './topics';
import type { TopicDef } from './topics/topic';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export class App {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.02, 30);
  private readonly rig = new THREE.Group();
  private readonly controls: OrbitControls;
  private readonly panel = new WorldPanel();
  private readonly tag = new NameTag();
  private readonly input: Input;
  private readonly clock = new THREE.Clock();
  /** Everything used this session, across topics: the "nothing runs out" tally. */
  private readonly usage = new Map<string, UsageEntry>();
  private lab!: Lab;
  private topic!: TopicDef;
  private topicUpdate: (dt: number) => void = () => {};
  private done = new Set<string>();
  private toastText = '';
  private toastTimer = 0;
  private usageSig = '';
  private usageTimer = 0;
  private seated = false;
  private xrSupported = false;

  constructor(container: HTMLElement) {
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1.18;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.xr.enabled = true;
    r.xr.setReferenceSpaceType('local-floor');
    r.xr.setFoveation(1);
    container.appendChild(r.domElement);
    this.renderer = r;

    this.scene.background = new THREE.Color(0x30363a);
    buildRoom(this.scene);
    // Reflections come from the room itself, so glass mirrors the real walls, windows and lights.
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(this.scene, 0.015, 0.05, 20, { position: new THREE.Vector3(0, 1.3, -0.45) }).texture;
    this.scene.environmentIntensity = 0.7;
    pmrem.dispose();

    this.rig.add(this.camera);
    this.scene.add(this.rig, this.panel.mesh, this.tag.sprite);

    this.controls = new OrbitControls(this.camera, r.domElement);
    // Aim between the bench and the task board so both are in view.
    this.controls.target.set(-0.02, BENCH.top + 0.06, BENCH.z - 0.08);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.3;
    this.controls.maxDistance = 2.6;
    this.controls.minPolarAngle = 0.25;
    this.controls.maxPolarAngle = 1.45;
    this.controls.minAzimuthAngle = -1.2;
    this.controls.maxAzimuthAngle = 1.2;

    this.input = new Input({
      camera: this.camera,
      renderer: r,
      rig: this.rig,
      controls: this.controls,
      panel: this.panel,
      lab: () => this.lab,
      onHoldChange: (tool) => this.showHolding(tool),
    });

    this.panel.onButton = (id) => this.onButton(id);
    this.setupOverlay();
    onLangChange(() => this.relabel());

    const fromUrl = new URLSearchParams(location.search).get('topic');
    this.loadTopic(TOPICS.find((tp) => tp.id === fromUrl && tp.ready)?.id ?? TOPICS[0].id);

    window.addEventListener('resize', () => this.resize());
    this.resize(true);
    if (matchMedia('(max-width: 720px)').matches) ($('tasks') as HTMLDetailsElement).open = false;
    r.xr.addEventListener('sessionstart', () => this.onXR(true));
    r.xr.addEventListener('sessionend', () => this.onXR(false));
    r.setAnimationLoop(() => this.frame());
  }

  private loadTopic(id: string) {
    const def = TOPICS.find((tp) => tp.id === id && tp.ready);
    if (!def?.build) return;
    this.input.dropAll();
    this.lab?.dispose();
    this.topic = def;
    this.done = new Set();
    this.lab = new Lab(this.usage, (key) => this.toast(key));
    this.scene.add(this.lab.group);
    this.topicUpdate = def.build(this.lab, {
      done: (step) => this.markDone(step),
      toast: (key) => this.toast(key),
    });
    // Shadows from the opaque parts only; glass and liquids don't cast them.
    this.lab.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.Material;
      if (!mat.transparent) m.castShadow = true;
      m.receiveShadow = false;
    });
    ($('topic') as HTMLSelectElement).value = id;
    const url = new URL(location.href);
    url.searchParams.set('topic', id);
    history.replaceState(null, '', url);
    this.refreshPanel();
  }

  private markDone(step: string) {
    if (this.done.has(step)) return;
    this.done.add(step);
    audio.success();
    const all = this.topic.steps?.every((s) => this.done.has(s.id));
    // Let the step's own message show first.
    if (all) setTimeout(() => this.toast('ui.allDone', 6), 2500);
    this.refreshPanel();
  }

  private toast(key: Key, seconds = 4) {
    const text = t(key);
    if (text === this.toastText && this.toastTimer > 0) {
      this.toastTimer = seconds;
      return;
    }
    this.toastText = text;
    this.toastTimer = seconds;
    const el = $('toast');
    el.textContent = text;
    el.hidden = false;
    this.refreshPanel();
  }

  private usageLines() {
    const units: Record<UsageEntry['unit'], Key> = { ml: 'unit.ml', pieces: 'unit.pieces', drops: 'unit.drops', spoons: 'unit.spoons' };
    return [...this.usage.values()].map((u) => {
      const n = u.unit === 'ml' && u.amount >= 1000 ? `${(u.amount / 1000).toFixed(2)} L` : `${Math.round(u.amount)} ${t(units[u.unit])}`;
      return `${u.name()}: ${n}`;
    });
  }

  private refreshPanel() {
    this.panel.set({
      title: t(this.topic.title),
      steps: (this.topic.steps ?? []).map((s) => ({ text: t(s.key), done: this.done.has(s.id) })),
      info: this.topic.info ? t(this.topic.info) : '',
      used: this.usageLines(),
      seated: this.seated,
      inXR: this.renderer.xr.isPresenting,
      topics: TOPICS.map((tp) => ({ id: tp.id, title: t(tp.title), ready: tp.ready, current: tp.id === this.topic.id })),
      toast: this.toastTimer > 0 ? this.toastText : '',
    });
    $('used').textContent = this.usageLines().join(' · ') || t('ui.usedNone');
    this.fillTasks();
  }

  /** The on-screen task list (screens only; in VR the wall board shows it). */
  private fillTasks() {
    const steps = this.topic.steps ?? [];
    const doneCount = steps.filter((s) => this.done.has(s.id)).length;
    $('taskTitle').textContent = t(this.topic.title);
    $('taskCount').textContent = `${doneCount}/${steps.length}`;
    const list = $('taskList');
    list.innerHTML = '';
    const next = steps.find((s) => !this.done.has(s.id));
    for (const s of steps) {
      const li = document.createElement('li');
      li.textContent = t(s.key);
      if (this.done.has(s.id)) li.className = 'done';
      else if (s === next) li.className = 'next';
      list.appendChild(li);
    }
    $('taskInfo').textContent = this.topic.info ? t(this.topic.info) : '';
  }

  private onButton(id: string) {
    audio.click();
    if (id.startsWith('topic:')) this.loadTopic(id.slice(6));
    else if (id === 'reset') this.loadTopic(this.topic.id);
    else if (id === 'lang') setLang(getLang() === 'en' ? 'uz' : 'en');
    else if (id === 'seated') {
      this.seated = !this.seated;
      this.rig.position.y = this.seated ? 0.4 : 0;
      this.refreshPanel();
    } else if (id === 'exit') void this.renderer.xr.getSession()?.end();
  }

  private relabel() {
    for (const l of this.lab.labels) l.redraw();
    this.input.help.draw();
    this.fillOverlayText();
    this.refreshPanel();
  }

  // ---- HTML overlay (screens only; in VR the panel does this job) ----

  private setupOverlay() {
    const select = $<HTMLSelectElement>('topic');
    select.addEventListener('change', () => this.loadTopic(select.value));
    $('lang').addEventListener('click', () => setLang(getLang() === 'en' ? 'uz' : 'en'));
    $('reset').addEventListener('click', () => this.loadTopic(this.topic.id));
    $('putback').addEventListener('click', () => this.input.putBack());
    const use = $('use');
    use.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio.unlock();
      this.input.useStart();
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) use.addEventListener(ev, () => this.input.useEnd());
    $('vr').addEventListener('click', () => this.enterVR());
    $('launch').addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'launchLang') return;
      void this.enterVR();
    });
    $('launchLang').addEventListener('click', () => setLang(getLang() === 'en' ? 'uz' : 'en'));
    // Raise / lower while the button is held down.
    for (const [id, dy] of [['up', 0.012], ['down', -0.012]] as const) {
      const btn = $(id);
      let timer = 0;
      const stop = () => clearInterval(timer);
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.input.nudgeHeight(dy);
        stop();
        timer = window.setInterval(() => this.input.nudgeHeight(dy), 40);
      });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, stop);
    }
    const xr = navigator.xr;
    if (xr) {
      void xr.isSessionSupported('immersive-vr').then((ok) => {
        this.xrSupported = ok;
        // In a headset's browser, skip the website: show one big button into the lab.
        const headset = /OculusBrowser|Quest|Pico|Wolvic/i.test(navigator.userAgent) || new URLSearchParams(location.search).has('vr');
        $('launch').hidden = !(ok && headset);
        this.fillOverlayText();
      });
    }
    this.fillOverlayText();
  }

  private fillOverlayText() {
    document.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => {
      el.textContent = t(el.dataset.t as Key);
    });
    const select = $<HTMLSelectElement>('topic');
    select.innerHTML = '';
    for (const tp of TOPICS) {
      const o = document.createElement('option');
      o.value = tp.id;
      o.textContent = tp.ready ? t(tp.title) : `${t(tp.title)} (${t('ui.soon')})`;
      o.disabled = !tp.ready;
      select.appendChild(o);
    }
    if (this.topic) select.value = this.topic.id;
    $('vr').classList.toggle('off', !this.xrSupported);
    $('up').title = t('ui.up');
    $('down').title = t('ui.down');
    const touch = matchMedia('(pointer: coarse)').matches;
    $('hint').textContent = t(touch ? 'hint.touch' : 'hint.mouse');
    this.showHolding(this.input?.heldPointer ?? null);
  }

  private showHolding(tool: Tool | null) {
    const bar = $('hold');
    bar.hidden = !tool;
    if (!tool) return;
    $('holdName').textContent = t('ui.holding', { name: tool.name() });
    const use = $('use');
    use.hidden = tool.use === 'none';
    use.textContent = tool.use === 'drip' ? t('ui.use.drip') : t('ui.use.pour');
  }

  private async enterVR() {
    audio.unlock();
    if (!this.xrSupported || !navigator.xr) {
      this.toast('ui.noVR', 5);
      return;
    }
    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });
      await this.renderer.xr.setSession(session);
    } catch {
      this.toast('ui.noVR', 5);
    }
  }

  private onXR(on: boolean) {
    document.body.classList.toggle('in-xr', on);
    // Coming back out of VR on a headset returns to the big "Enter the lab" button.
    if (!on && /OculusBrowser|Quest|Pico|Wolvic/i.test(navigator.userAgent)) $('launch').hidden = false;
    if (on) $('launch').hidden = true;
    this.input.dropAll();
    // A headset draws everything twice: halve the shadow map there.
    this.scene.traverse((o) => {
      const light = o as THREE.DirectionalLight;
      if (!light.isDirectionalLight || !light.castShadow) return;
      light.shadow.mapSize.setScalar(on ? 1024 : 2048);
      light.shadow.map?.dispose();
      light.shadow.map = null;
    });
    if (on) {
      this.input.help.mesh.visible = true;
      this.input.recenterSoon();
    } else {
      this.rig.position.set(0, 0, 0);
      this.rig.rotation.set(0, 0, 0);
      this.seated = false;
    }
    this.refreshPanel();
  }

  private resize(first = false) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (first) {
      // Back off far enough that the whole bench fits the width of the screen.
      const half = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      // Where a student's eyes would be, standing at the bench; narrow screens step back until
      // the whole bench fits.
      const dist = Math.max(1.0, 0.86 / (half * this.camera.aspect));
      const tgt = this.controls.target;
      const elev = 0.6;
      this.camera.position.set(tgt.x, tgt.y + Math.sin(elev) * Math.min(dist, 1.6), tgt.z + Math.cos(elev) * dist);
      this.controls.update();
    }
  }

  private frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.renderer.xr.isPresenting) this.controls.update();
    this.input.update(dt);
    this.lab.update(dt);
    this.topicUpdate(dt);
    this.tag.update(this.input.focus(), dt, this.renderer.xr.isPresenting ? 1.3 : 1);

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        $('toast').hidden = true;
        this.refreshPanel();
      }
    }
    // The usage tally changes while pouring; redraw it a few times a second at most.
    this.usageTimer -= dt;
    if (this.usageTimer <= 0) {
      this.usageTimer = 0.25;
      const sig = this.usageLines().join('|');
      if (sig !== this.usageSig) {
        this.usageSig = sig;
        this.refreshPanel();
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}
