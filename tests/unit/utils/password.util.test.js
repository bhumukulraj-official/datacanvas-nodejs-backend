const passwordUtil = require('../../../src/utils/password.util');

describe('Password Utilities', () => {
  test('should hash password correctly', async () => {
    const password = 'TestPassword123';
    const hash = await passwordUtil.hashPassword(password);
    expect(hash).toBeTruthy();
    expect(hash).not.toEqual(password);
  });

  test('should verify correct password', async () => {
    const password = 'TestPassword123';
    const hash = await passwordUtil.hashPassword(password);
    const result = await passwordUtil.verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  test('should reject incorrect password', async () => {
    const password = 'TestPassword123';
    const hash = await passwordUtil.hashPassword(password);
    const result = await passwordUtil.verifyPassword('WrongPassword', hash);
    expect(result).toBe(false);
  });
}); 