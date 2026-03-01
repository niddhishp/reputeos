import js from '@eslint/js';

/** 
 * Minimal ESLint config for local development.
 * Vercel builds skip ESLint (ignoreDuringBuilds: true in next.config.ts).
 * TypeScript strict mode is the primary code quality gate.
 */
const eslintConfig = [
  js.configs.recommended,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**'],
  },
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];

export default eslintConfig;
