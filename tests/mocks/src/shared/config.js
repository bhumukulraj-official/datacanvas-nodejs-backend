const config = {
  jwt: {
    secret: 'test-secret',
    expiresIn: '1h',
    refreshTokenExpiry: '7d'
  },
  security: {
    passwordMinLength: 8,
    passwordRequireSpecialChar: true
  }
};

module.exports = config; 