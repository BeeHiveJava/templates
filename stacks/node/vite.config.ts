import { fmt, lint } from "@beehivejava/config/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt,
  lint,
  run: {
    tasks: {
      lint: "biome check . && vp check",
      test: "vp run -F '!.' --cache test",
      build: "vp run -F '!.' --cache build",
      dev: {
        command: "vp run -F '!.' --parallel dev",
        cache: false
      },
      // dependsOn: ["build"] expands the build twice, so chain it instead
      preview: {
        command: "vp run build && vp run -F '!.' preview",
        cache: false
      },
      deploy: {
        command: "vp run build && vp run -F '!.' deploy",
        cache: false
      }
    }
  }
});
