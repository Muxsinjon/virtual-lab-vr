import { App } from './app';
import { getLang } from './i18n';

document.documentElement.lang = getLang();

// Dev only: `?emulate` installs a Meta Quest 3 emulator so VR can be tested without a headset.
async function start() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('emulate')) {
    const { XRDevice, metaQuest3 } = await import('iwer');
    const { DevUI } = await import('@iwer/devui');
    const device = new XRDevice(metaQuest3);
    device.installRuntime({ forceInstall: true });
    device.installDevUI(DevUI);
    (window as unknown as { xrDevice: unknown }).xrDevice = device;
  }
  const app = new App(document.getElementById('app')!);
  if (import.meta.env.DEV) (await import('./dev')).installDevHelpers(app);
}

void start();
