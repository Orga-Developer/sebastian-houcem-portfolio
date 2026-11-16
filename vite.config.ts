import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function normalizeBasePath(value: string | undefined): string {
  const raw = value?.trim() || "/";
  const prefixed = raw.startsWith("/") ? raw : `/${raw}`;
  return prefixed.endsWith("/") ? prefixed : `${prefixed}/`;
}

export default defineConfig({
  base: normalizeBasePath(process.env.VITE_BASE_PATH),
  plugins: [react()],
  define: {
    __BUILD_YEAR__: String(new Date().getUTCFullYear()),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
  },
});
