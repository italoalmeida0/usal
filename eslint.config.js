import js from '@eslint/js';
import globals from 'globals';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import sonarjs from 'eslint-plugin-sonarjs';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  sonarjs.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-debugger': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
      'no-duplicate-imports': 'error',
      'no-useless-return': 'error',
      'no-else-return': 'error',

      'no-constant-condition': 'error',
      'no-unreachable': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-useless-escape': 'error',
      'no-useless-rename': 'error',

      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-same-line-conditional': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/no-inverted-boolean-check': 'error',

      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/max-switch-cases': ['warn', 30],
      'sonarjs/no-nested-switch': 'off',
      'sonarjs/no-nested-template-literals': 'warn',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/pseudo-random': 'off',

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: false,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/usal.js', 'src/usal.ts'],
    rules: {
      'no-console': 'error',
      complexity: 'off',
      'max-depth': 'off',
      'max-lines': 'off',
      'sonarjs/cognitive-complexity': 'off',
    },
  },
  {
    files: ['src/integrations/react/**/*.{js,ts}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|React',
        },
      ],
    },
  },
  {
    files: ['src/integrations/vue/**/*.{js,ts}'],
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_|h',
          varsIgnorePattern: '^_|h',
        },
      ],
    },
  },
  {
    files: ['src/integrations/lit/**/*.{js,ts}'],
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|html|css|LitElement',
        },
      ],
    },
  },
  {
    files: ['src/integrations/angular/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|Injectable|Directive|Input',
        },
      ],
    },
  },
  {
    files: ['build.js', 'update-tags.js', 'postbuild.js', '*.config.{js,mjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/packages/**',
      '**/dist/**',
      '**/*.min.js',
      '**/coverage/**',
      '**/*.d.ts',
    ],
  },
];
