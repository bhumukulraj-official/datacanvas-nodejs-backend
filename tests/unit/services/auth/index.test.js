const authServices = require('../../../../src/services/auth');

describe('Auth Services Index', () => {
  test('should export all auth services', () => {
    expect(authServices).toHaveProperty('AuthService');
    expect(authServices).toHaveProperty('UserService');
    expect(authServices).toHaveProperty('TokenService');
    expect(authServices).toHaveProperty('PasswordService');
    expect(authServices).toHaveProperty('ApiKeyService');
    expect(authServices).toHaveProperty('ClientInvitationService');
  });

  test('should export services as objects', () => {
    expect(typeof authServices.AuthService).toBe('object');
    expect(typeof authServices.UserService).toBe('object');
    expect(typeof authServices.TokenService).toBe('object');
    expect(typeof authServices.PasswordService).toBe('object');
    expect(typeof authServices.ApiKeyService).toBe('object');
    expect(typeof authServices.ClientInvitationService).toBe('object');
  });
}); 