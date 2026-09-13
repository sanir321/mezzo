import cloudflareAdapter from "@sveltejs/adapter-cloudflare";
import staticAdapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// STATIC_BUILD=1 produces a SPA bundle for the Capacitor Android app
// (webDir: build/). Everything else deploys to Cloudflare Pages.
const isStatic = process.env.STATIC_BUILD === "1";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess({
    scss: {
      includePaths: ["src"],
    },
  }),

  kit: {
    adapter: isStatic
      ? staticAdapter({ fallback: "index.html" })
      : cloudflareAdapter(),
    alias: {
      $lib: "./src/lib",
      $components: "./src/lib/components",
    },
    prerender: isStatic ? { entries: [] } : { concurrency: 3 },
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
