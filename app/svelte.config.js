import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess({
    scss: {
      includePaths: ["src"],
    },
  }),

  kit: {
    adapter: adapter(),
    alias: {
      $lib: "./src/lib",
      $components: "./src/lib/components",
    },
    prerender: { concurrency: 3 },
    files: {
      assets: "static",
      lib: "src/lib",
      routes: "src/routes",
      appTemplate: "src/app.html",
      hooks: { server: "src/hooks.server" },
    },
    version: { pollInterval: 600000 },
  },
};

export default config;
