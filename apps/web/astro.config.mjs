import node from '@astrojs/node';
import react from '@astrojs/react';
// oxlint-disable-next-line import/default
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const PROD_SITE_URL = 'https://qafiyah.com';
const DEV_WEB_PORT = 4321;

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN || undefined;

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: PROD_SITE_URL,
  security: { allowedDomains: [{ hostname: new URL(PROD_SITE_URL).hostname, protocol: 'https' }] },
  server: { port: Number(process.env.WEB_PORT ?? DEV_WEB_PORT) },
  build: { inlineStylesheets: 'always' },
  integrations: [
    react(),
    sentry({
      org: 'qafiyah',
      project: 'javascript-astro',
      authToken: sentryAuthToken,
      sourcemaps: { disable: !sentryAuthToken },
      errorHandler: sentryAuthToken
        ? (error) => {
            throw error;
          }
        : undefined,
    }),
  ],
  trailingSlash: 'never',
  vite: {
    build: { target: ['chrome91', 'edge91', 'firefox90', 'safari15'] },
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['@tanstack/react-query', 'nuqs', 'nuqs/adapters/react'],
    },
  },
});
