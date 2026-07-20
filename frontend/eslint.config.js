import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'src/assets'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Data policy: nothing is persisted in the browser. Auth tokens live in
      // memory (access) or an httpOnly cookie (refresh) — never web storage.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='localStorage'], MemberExpression[object.name='sessionStorage'], MemberExpression[property.name='localStorage'], MemberExpression[property.name='sessionStorage']",
          message:
            'Web Storage (localStorage/sessionStorage) is banned by the data policy: no browser persistence. Keep the access token in memory (AuthContext); the refresh token is an httpOnly cookie.',
        },
      ],
    },
  },
)
