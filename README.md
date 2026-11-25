# templates

Scaffolds a [Vite+](https://viteplus.dev) workspace, and holds what every scaffolded repository shares:

- [`@beehivejava/config`](packages/config): the Vite+ config (format, lint, staged checks and tasks) and the TypeScript configs
- [`node.yaml`](.github/workflows/node.yaml): the CI workflow, running the `lint`, `test`, `build` and `deploy` tasks
- [`renovate.json`](.github/renovate.json): the Renovate preset

This repository is scaffolded the same way: everything except `.github`, `packages`, `scaffold` and this file is copied, then [`scaffold`](scaffold) is layered on top.

## Scaffold

```sh
curl -fsSL https://raw.githubusercontent.com/beehivejava/templates/main/init.sh | bash
```

Local test, using the local `@beehivejava/config`:

```sh
mkdir -p /tmp/test && cd /tmp/test && TEMPLATE=/workspaces/templates bash /workspaces/templates/init.sh
```

## Extend the config

`defineConfig` merges plain objects key by key; anything else (a string, an array) replaces what it overrides:

```ts
import { defineConfig } from "@beehivejava/config/vite";

export default defineConfig({
    fmt: { printWidth: 120 },
    lint: { rules: { "max-params": ["error", { max: 4 }] } },
    run: { tasks: { lint: "vp run codegen && vp check" } }
});
```

## Commit hooks

`pnpm install` runs `vp config`, which points git at [`.vite-hooks`](.vite-hooks): the pre-commit hook runs `vp staged`, formatting and linting the staged files. In the devcontainer this happens on creation.
