import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `npm run dev:vr` serves over HTTPS on the local network, because a headset's
// browser only allows WebXR on secure pages (localhost is the one exception).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'vr' ? [basicSsl()] : [],
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
}));
