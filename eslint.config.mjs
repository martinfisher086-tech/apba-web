import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import astro from "eslint-plugin-astro";

const typescriptRules = tsPlugin.configs.recommended.rules;

export default [
  { ignores: [".astro/**", "dist/**", "node_modules/**"] },
  ...astro.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tsParser },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...typescriptRules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.astro"],
    plugins: { "@typescript-eslint": tsPlugin },
    rules: typescriptRules,
  },
  {
    files: ["**/*.d.ts"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },
];
