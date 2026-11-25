/** @import { ViteUserConfig } from "vite-plus" */
/** @import { OxfmtConfig } from "vite-plus/fmt" */
/** @import { OxlintConfig } from "vite-plus/lint" */

/** @type {OxfmtConfig} */
export const fmt = {
  printWidth: 120,
  trailingComma: "none"
};

/** @type {OxlintConfig} */
export const lint = {
  plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "promise", "node", "vitest", "vue"],
  categories: {
    correctness: "error",
    suspicious: "error",
    pedantic: "error",
    perf: "error"
  },
  options: {
    typeAware: true,
    typeCheck: true
  },
  rules: {
    // Covered by noUnusedLocals and noUnusedParameters
    "no-unused-vars": "off",
    // TypeScript reports redeclarations, and a type and a value may share a name
    "no-redeclare": "off",
    // Covered by the type-aware typescript/require-await
    "require-await": "off",
    // The types check what a callback is passed
    "unicorn/no-array-callback-reference": "off",
    // Unworkable with library types, which are rarely deeply readonly
    "typescript/prefer-readonly-parameter-types": "off",

    // Types
    "typescript/array-type": "error",
    "typescript/consistent-generic-constructors": "error",
    "typescript/consistent-indexed-object-style": "error",
    "typescript/consistent-type-definitions": "error",
    "typescript/consistent-type-exports": "error",
    "typescript/consistent-type-imports": "error",
    "typescript/explicit-member-accessibility": "error",
    "typescript/explicit-module-boundary-types": "error",
    "typescript/method-signature-style": "error",
    "typescript/no-dynamic-delete": "error",
    "typescript/no-empty-object-type": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-import-type-side-effects": "error",
    "typescript/no-inferrable-types": "error",
    "typescript/no-invalid-void-type": "error",
    "typescript/no-namespace": "error",
    "typescript/no-non-null-assertion": "error",
    "typescript/no-require-imports": "error",
    "typescript/no-unnecessary-condition": "error",
    "typescript/no-unnecessary-qualifier": "error",
    "typescript/prefer-find": "error",
    "typescript/prefer-function-type": "error",
    "typescript/prefer-optional-chain": "error",
    "typescript/prefer-readonly": "error",
    "typescript/prefer-reduce-type-parameter": "error",
    "typescript/prefer-regexp-exec": "error",
    "typescript/prefer-return-this-type": "error",
    "typescript/prefer-string-starts-ends-with": "error",
    "typescript/promise-function-async": "error",
    "typescript/unified-signatures": "error",
    "typescript/use-unknown-in-catch-callback-variable": "error",

    // Code
    curly: "error",
    "default-param-last": "error",
    eqeqeq: "error",
    "logical-assignment-operators": "error",
    "max-params": ["error", { max: 4 }],
    "no-console": "error",
    "no-implicit-coercion": "error",
    "no-labels": "error",
    "no-lone-blocks": "error",
    "no-multi-assign": "error",
    "no-nested-ternary": "error",
    "no-param-reassign": "error",
    "no-return-assign": "error",
    "no-sequences": "error",
    "no-useless-computed-key": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-const": "error",
    "prefer-exponentiation-operator": "error",
    "prefer-numeric-literals": "error",
    "prefer-object-has-own": "error",
    "prefer-object-spread": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "prefer-template": "error",
    "promise/no-nesting": "error",
    "promise/param-names": "error",
    "promise/prefer-await-to-then": "error",
    "unicorn/error-message": "error",
    "unicorn/no-array-for-each": "error",
    "unicorn/numeric-separators-style": "error",
    "unicorn/prefer-export-from": "error",
    "unicorn/prefer-modern-math-apis": "error",
    "unicorn/prefer-node-protocol": "error",
    "unicorn/prefer-number-properties": "error",
    "unicorn/prefer-optional-catch-binding": "error",
    "unicorn/prefer-structured-clone": "error",
    "unicorn/switch-case-braces": "error",
    "unicorn/throw-new-error": "error",

    // Modules
    "import/first": "error",
    "import/no-cycle": "error",
    "import/no-duplicates": "error",
    "import/no-mutable-exports": "error",
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["../**", "./*/**"],
            message: "Only a file in the same folder is imported relatively: ./File.ts."
          }
        ]
      }
    ],
    "oxc/no-barrel-file": ["error", { threshold: 0 }],
    "sort-imports": ["error", { ignoreCase: true, ignoreDeclarationSort: true }]
  },
  overrides: [
    {
      // A describe block holds its tests
      files: ["**/*.test.*", "**/tests/**"],
      rules: {
        "max-lines-per-function": "off"
      }
    }
  ]
};

/** @type {NonNullable<ViteUserConfig["staged"]>} */
export const staged = {
  "*": "vp check --fix"
};

/** @type {NonNullable<NonNullable<ViteUserConfig["run"]>["tasks"]>} */
export const tasks = {
  lint: "vp check",
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
};

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Plain objects are merged key by key, everything else (arrays, strings,
 * functions) replaces what it overrides, so a lint rule or task can be
 * replaced as a whole.
 *
 * @param {unknown} base
 * @param {unknown} override
 * @returns {unknown}
 */
function merge(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override;
  }
  /** @type {Record<string, unknown>} */
  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    merged[key] = Object.hasOwn(base, key) ? merge(base[key], value) : value;
  }
  return merged;
}

/**
 * @param {ViteUserConfig} [config]
 * @returns {ViteUserConfig}
 */
export function defineConfig(config = {}) {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion, no-inline-comments -- a JSDoc cast: merging two configs yields a config
  return /** @type {ViteUserConfig} */ (merge({ fmt, lint, staged, run: { tasks } }, config));
}
