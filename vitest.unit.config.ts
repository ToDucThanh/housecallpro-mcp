import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config.js";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["tests/unit/**/*.test.ts"],
      mockReset: true,
    },
  })
);
