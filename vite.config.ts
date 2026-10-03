import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (command === 'build' && (process.env.VITE_TEST_FIXTURES === 'true' || env.VITE_TEST_FIXTURES === 'true')) {
    throw new Error('Production build blocked: VITE_TEST_FIXTURES must be disabled.');
  }
  return { plugins: [react(), tailwindcss()] };
});
