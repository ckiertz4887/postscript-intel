import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    extends: [
      tseslint.configs.recommended,
    ],
    rules: {
      // Catch unused variables (common source of bugs)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Prevent unsafe any usage
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: [".next/", "node_modules/"],
  }
);
