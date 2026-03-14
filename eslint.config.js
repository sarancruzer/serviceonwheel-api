const js = require('@eslint/js')
const globals = require('globals')
const eslintConfigPrettier = require('eslint-config-prettier')
const tseslint = require('typescript-eslint')

module.exports = tseslint.config(
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'prisma/migrations/**',
      'eslint.config.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['src/**/*.ts', 'prisma/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/require-await': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
  eslintConfigPrettier,
)
