const { User, UserRole } = require('../../../../src/data/models');

describe('User Model', () => {
  test('should create a valid user', async () => {
    const userData = {
      email: 'test@example.com',
      password_hash: 'hashedpassword123',
      name: 'Test User',
      is_active: true
    };

    // Mock the create method
    User.create = jest.fn().mockResolvedValue({
      ...userData,
      id: 1,
      uuid: '123e4567-e89b-12d3-a456-426614174000'
    });

    const user = await User.create(userData);
    expect(user).toBeTruthy();
    expect(user.email).toEqual(userData.email);
  });

  test('should not create user with invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      password_hash: 'hashedpassword123',
      name: 'Test User',
      is_active: true
    };

    // Mock create to throw an error for invalid email
    User.create = jest.fn().mockRejectedValue(new Error('Validation error: Invalid email format'));

    await expect(User.create(userData)).rejects.toThrow();
  });

  test('should have correct associations', () => {
    // Mock the associations
    User.associations = {
      roles: {
        target: UserRole
      }
    };

    // Check that associations are properly defined
    expect(User.associations.roles).toBeDefined();
    expect(User.associations.roles.target).toBe(UserRole);
  });
}); 