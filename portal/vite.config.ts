import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// One self-contained HTML file: no third-party script or style at runtime.
// Data is read at build time from ../product, ../evals and ../docs, and the
// engine is compiled from ../app/src/engine, so the portal cannot drift from
// the repo.
export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), viteSingleFile()],
  server: { fs: { allow: [".."] } },
  build: { outDir: "dist", emptyOutDir: true, target: "es2022" },
});
