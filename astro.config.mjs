// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://astro.maltavisions.com",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  adapter: node({ mode: "standalone" }),
  server: {
    host: true,
  },
});
