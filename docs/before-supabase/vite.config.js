import { defineConfig, loadEnv } from 'vite';
import { nropMiddleware } from './server/sheets-api.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [{
    name: 'nrop-sheets-local-api',
    configureServer(server) { server.middlewares.use(nropMiddleware(loadEnv(mode, process.cwd(), ''))); }
  }],
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
  build: { outDir: 'dist' }
}));
