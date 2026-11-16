// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // JS project: resolve the `@/` alias from jsconfig.json instead of tsconfig.json.
    settings: {
      'import/resolver': {
        typescript: { project: './jsconfig.json' },
      },
    },
  },
]);
