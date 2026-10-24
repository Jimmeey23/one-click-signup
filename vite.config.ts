import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { criticalCssPlugin } from "./scripts/critical-css.mjs";

export default defineConfig(({ command }) => ({
  plugins: [
    criticalCssPlugin(),
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    ...(command === "build"
      ? [
          nitro({
            preset: "vercel",
            routeRules: {
              "/fonts/**": { headers: { "cache-control": "public, max-age=2592000" } },
              // Stable filenames: rename a file when its content changes.
              "/p57-assets/**": { headers: { "cache-control": "public, max-age=2592000" } },
              "/physique57-logo-small.webp": {
                headers: { "cache-control": "public, max-age=604800" },
              },
            },
          }),
        ]
      : []),
    react(),
  ],
  css: { transformer: "lightningcss" },
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [".ngrok-free.app", ".e2b.app"],
  },
}));
