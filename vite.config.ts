import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Base path for GitHub Pages project site
  base: '/electricity_calculator/',
  plugins: [react()],
  test: {
    environment: 'node'
  }
});
