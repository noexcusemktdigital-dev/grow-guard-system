import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    testTimeout: 10000,
    setupFiles: ["./src/test/setup.ts"],
    server: {
      deps: {
        // Resolve node_modules from the symlinked location
        inline: [/@testing-library/],
      },
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/**/*.d.ts", "src/integrations/**"],
      thresholds: { lines: 10, functions: 10 }, // meta inicial — elevar a cada sprint
    },
  },
});
