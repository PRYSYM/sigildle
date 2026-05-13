/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// base must match the GitHub Pages project path: https://prysym.github.io/sigildle/
export default defineConfig({
  base: '/sigildle/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
