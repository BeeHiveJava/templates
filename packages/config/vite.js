export const fmt = {
  trailingComma: "none",
  // Biome owns everything except JavaScript, TypeScript and Vue
  ignorePatterns: [
    "**/*.{json,jsonc,json5,md,mdx,css,scss,less,html,graphql,gql,yaml,yml,toml,hbs,handlebars}"
  ]
};

export const lint = {
  options: {
    typeAware: true,
    typeCheck: true
  },
  rules: {
    // Covered by noUnusedLocals and noUnusedParameters
    "no-unused-vars": "off",
    "typescript/explicit-member-accessibility": "error",
    "typescript/prefer-readonly": "error"
  }
};
