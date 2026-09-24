import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// One self-contained HTML file. The engine is compiled from ../engine
// and the body model from ../engine/bodymodel.ts, unchanged, so the
// prototype can't drift from what CI tests.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  server: { fs: { allow: [".."] } },
  build: { outDir: "dist", emptyOutDir: true, target: "es2022" },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
