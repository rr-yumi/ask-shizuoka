// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // 公開 URL（canonical・OGP・サイトマップに使う）。独自ドメインにしたら Cloudflare の環境変数 SITE_URL で上書き
  site: process.env.SITE_URL ?? 'https://ask-shizuoka.pages.dev',
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()]
  }
});
