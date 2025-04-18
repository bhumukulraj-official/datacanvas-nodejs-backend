module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'max-len': ['error', { code: 100, ignoreUrls: true }],
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
  },
}; 