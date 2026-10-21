import * as THREE from 'three';
import type { App } from './app';

// Dev-only helpers for driving the lab from the browser console (or automated checks):
//   await step(1)                         run one second of frames, even in a hidden tab
//   await useTool('item.hcl', vessel, 2)  pick a tool, hold it over a vessel, pour for 2 s
//   await useTool('item.phenol', vessel, 0, 3)  …or squeeze 3 drops

export function installDevHelpers(app: App) {
  const a = app as any;
  const w = window as any;
  w.app = app;
  w.step = async (sec: number) => {
    const n = Math.round(sec * 60);
    for (let i = 0; i < n; i++) {
      a.frame();
      await new Promise((r) => setTimeout(r, 16));
    }
  };
  w.aimAt = (point: THREE.Vector3) => {
    const p = point.clone().project(a.camera);
    a.input.ndc.set(p.x, p.y);
  };
  w.vessels = () => a.lab.vessels.filter((v: any) => !v.infinite && !v.sink);
  w.useTool = async (kind: string, vessel: any, sec: number, drops = 0) => {
    const t = a.lab.tools.find((x: any) => x.kind === kind);
    a.input.putBack();
    await w.step(0.1);
    a.input.grab(t, 'pointer');
    const p = vessel.mouthWorld(new THREE.Vector3());
    p.y += Math.max(0.04, t.snapLift);
    w.aimAt(p);
    await w.step(0.7);
    if (drops) {
      for (let i = 0; i < drops; i++) {
        a.input.useStart();
        await w.step(0.3);
      }
    } else {
      a.input.useStart();
      await w.step(sec);
      a.input.useEnd();
      await w.step(0.5);
    }
    a.input.putBack();
    await w.step(0.6);
  };
}
