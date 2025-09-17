import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import { defineConfig } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])

// {
//   "extends": ["react-app", "react-app/jest"],
//   "overrides": [
//     {
//       "files": ["src/**/*.ts", "src/**/*.tsx"],
//       "rules": {
//         "@typescript-eslint/no-unused-vars": "warn",
//         "no-console": "warn"
//       }
//     }
//   ]
// }
