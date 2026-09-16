import js from '@eslint/js';
import globals from 'globals';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  // Lints .astro templates and turns on the static accessibility rules
  // (missing alt text, non-interactive click handlers, bad ARIA, ...).
  // These catch at lint time what the axe suite would only catch at run time.
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-strict'],
  {
    // Build scripts, tests and config files run in Node, not the browser.
    files: [
      '*.{js,mjs,ts}',
      'scripts/**/*.{js,mjs,ts}',
      'tests/**/*.{js,mjs,ts}',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
