import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config.js";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["tests/integration/**/*.test.ts"],
      testTimeout: 15000,
      hookTimeout: 30000,
      sequence: { concurrent: false },
    },
  })
);
