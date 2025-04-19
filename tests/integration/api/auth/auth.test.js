const request = require('supertest');
const app = require('../../../../src/app');
const { User } = require('../../../../src/modules/auth/models');
const { sequelize } = require('../../../../src/shared/database');
const { hashPassword } = require('../../../../src/modules/auth/services/auth.service');

// Mock Redis for token storage
jest.mock('../../../../src/shared/config/redis', () => ({
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue('user_id'),
  del: jest.fn().mockResolvedValue(1),
  multi: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(['OK', 'OK'])
  })
}));

describe('Authentication API Integration Tests', () => {
  let testUser;
  let authToken;
  
  // Setup test database and create test user
  beforeAll(async () => {
    // Sync test database
    await sequelize.sync({ force: true });
    
    // Create test user
    const hashedPassword = await hashPassword('TestPassword123!');
    testUser = await User.create({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
      status: 'active'
    });
  });
  
  // Clean up after tests
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('POST /api/v1/auth/register', () => {
    test('should register a new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        passwordConfirm: 'NewPassword123!'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', newUser.email);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
    });
    
    test('should return validation error for invalid data', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'notanemail',
        password: 'short',
        passwordConfirm: 'nomatch'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VAL_001');
      expect(response.body.error).toHaveProperty('details');
    });
    
    test('should return error for existing email', async () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: 'test@example.com', // Already exists
        password: 'Password123!',
        passwordConfirm: 'Password123!'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/v1/auth/login', () => {
    test('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', credentials.email);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      
      // Save token for later tests
      authToken = response.body.data.tokens.accessToken;
    });
    
    test('should return error for invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'AUTH_001');
    });
    
    test('should return error for invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'AUTH_001');
    });
  });
  
  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;
    
    beforeAll(async () => {
      // Login to get a refresh token
      const credentials = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials);
      
      refreshToken = response.body.data.tokens.refreshToken;
    });
    
    test('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });
    
    test('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'AUTH_003');
    });
  });
  
  describe('GET /api/v1/auth/me', () => {
    test('should return user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
    });
    
    test('should return error when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'AUTH_001');
    });
  });
  
  describe('POST /api/v1/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });
    
    test('should return error when not authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'AUTH_001');
    });
  });
}); 