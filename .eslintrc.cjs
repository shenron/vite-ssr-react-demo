module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['plugin:react/recommended', 'airbnb'],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  settings: {
    'import/core-modules': ['vite-ssr'],
  },
  plugins: ['react'],
  ignorePatterns: ['dist/**'],
  rules: {
    'import/extensions': 0,
    'no-underscore-dangle': 0,
    'react/forbid-prop-types': 0,
    'react/jsx-props-no-spreading': 0,
    'react/react-in-jsx-scope': 0,
    'no-param-reassign': 0,
    'func-names': 0,
  }
}
