import { defineConfig, fmt, lint, staged, tasks } from "@beehivejava/config/vite";
import { describe, expect, it } from "vite-plus/test";

describe("defineConfig", () => {
  it("returns the shared config without overrides", () => {
    expect(defineConfig()).toStrictEqual({ fmt, lint, staged, run: { tasks } });
  });

  it("merges plain objects key by key", () => {
    const config = defineConfig({ fmt: { semi: false }, lint: { rules: { "no-console": "off" } } });

    expect(config.fmt).toStrictEqual({ ...fmt, semi: false });
    expect(config.lint?.rules?.["no-console"]).toBe("off");
    expect(config.lint?.rules?.["typescript/no-explicit-any"]).toBe("error");
    expect(config.lint?.options).toStrictEqual(lint.options);
  });

  it("replaces anything that is not a plain object", () => {
    const config = defineConfig({
      lint: { rules: { "max-params": ["error", { max: 2 }] } },
      run: { tasks: { lint: "vp run codegen && vp check" } }
    });

    expect(config.lint?.rules?.["max-params"]).toStrictEqual(["error", { max: 2 }]);
    expect(config.run?.tasks?.["lint"]).toBe("vp run codegen && vp check");
    expect(config.run?.tasks?.["dev"]).toStrictEqual(tasks["dev"]);
  });

  it("adds what the shared config lacks", () => {
    const config = defineConfig({ run: { tasks: { barrels: "vp run codegen" } } });

    expect(config.run?.tasks?.["barrels"]).toBe("vp run codegen");
    expect(config.run?.tasks?.["test"]).toBe(tasks["test"]);
  });

  it("leaves the shared config untouched", () => {
    defineConfig({ fmt: { printWidth: 80 } });

    expect(fmt.printWidth).toBe(120);
  });
});
