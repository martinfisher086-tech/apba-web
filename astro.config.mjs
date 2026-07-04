import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://psicologos.org.ar",
  trailingSlash: "always",

  output: "static",

  build: {
    inlineStylesheets: "auto",
  },

  image: {
    domains: ["psicologos.org.ar"],
    formats: ["avif", "webp"],
  },

  vite: {
    css: {
      transformer: "lightningcss",
    },
  },
});
