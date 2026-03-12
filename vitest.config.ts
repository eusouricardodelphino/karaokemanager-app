import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/test/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/setupTests.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/components/ui/**",
      ],
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
