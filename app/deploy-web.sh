#!/usr/bin/env bash
# Build the SvelteKit app and deploy to Cloudflare Pages (production),
# hosting the downloadable APK at /apk/Mezzo-1.0.apk.
set -euo pipefail
cd "$(dirname "$0")"

echo "-> Building web app"
npm run build

APK_SRC="${APK_SRC:-$HOME/Downloads/Mezzo-1.0-2026-09-13.apk}"
OUT="./.svelte-kit/cloudflare"
TARGET="$OUT/apk/Mezzo-1.0.apk"
if [[ -f "$APK_SRC" ]]; then
  echo "-> Adding APK to deploy output"
  mkdir -p "$OUT/apk"
  cp "$APK_SRC" "$TARGET"
else
  echo "!! APK source not found at $APK_SRC — deploying without APK"
fi

echo "-> Excluding /apk/* from Worker routing (serve as static asset)"
node -e '
const fs = require("fs");
const p = "./.svelte-kit/cloudflare/_routes.json";
const routes = JSON.parse(fs.readFileSync(p, "utf8"));
if (!routes.exclude.includes("/apk/*")) {
  routes.exclude.push("/apk/*");
  fs.writeFileSync(p, JSON.stringify(routes, null, "\t"));
}
'

echo "-> Deploying to Cloudflare Pages (project: mezzo-music, branch: production)"
npx wrangler pages deploy "$OUT" --project-name mezzo-music --branch production --commit-dirty=true