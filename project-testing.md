# Portfolio Backend Testing Strategy

## Overview
This document outlines a comprehensive testing strategy for the Portfolio Backend application. The goal is to ensure code quality, prevent regressions, and maintain a reliable and performant API.

## Testing Levels

### 1. Unit Testing

**Purpose**: Test individual functions and components in isolation.

**Test Framework**: Jest

**Areas to Focus On**:
- Service layer methods
- Utility functions
- Model methods
- Validators
- Helper functions

**Implementation Strategy**:
- Each module's service should have corresponding unit tests
- Mock external dependencies (database, APIs, other services)
- Use dependency injection for better testability
- Test both successful paths and error scenarios

**Example Test Case**:
```javascript
// Example unit test for auth service login method
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens when valid credentials are provided', async () => {
      // Arrange
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashedPassword' };
      const userRepositoryMock = {
        findByEmailOrUsername: jest.fn().mockResolvedValue(mockUser)
      };
      const passwordServiceMock = {
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      const tokenServiceMock = {
        generateTokens: jest.fn().mockResolvedValue({ accessToken: 'abc', refreshToken: 'xyz' })
      };
      
      const authService = new AuthService(
        userRepositoryMock,
        passwordServiceMock,
        tokenServiceMock
      );
      
      // Act
      const result = await authService.login('test@example.com', 'password123', '127.0.0.1', 'Chrome');
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(userRepositoryMock.findByEmailOrUsername).toHaveBeenCalledWith('test@example.com');
      expect(passwordServiceMock.comparePassword).toHaveBeenCalled();
      expect(tokenServiceMock.generateTokens).toHaveBeenCalled();
    });
    
    it('should throw error when invalid credentials are provided', async () => {
      // Similar setup with invalid credentials test
    });
  });
});
```

### 2. Integration Testing

**Purpose**: Test interactions between modules and external dependencies.

**Test Framework**: Jest with Supertest

**Areas to Focus On**:
- API endpoints
- Database interactions
- External service integrations
- Middleware functionality

**Implementation Strategy**:
- Use test database with real schema
- Test full request/response cycle for API endpoints
- Test database operations
- Mock third-party services when necessary

**Example Test Case**:
```javascript
// Example integration test for login endpoint
describe('Auth API', () => {
  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      // Set up test database
      await sequelize.sync({ force: true });
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        // other required fields
      });
    });
    
    it('should return 200 and tokens for valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });
    
    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    afterAll(async () => {
      // Clean up test database
      await sequelize.close();
    });
  });
});
```

### 3. End-to-End Testing

**Purpose**: Test complete user flows and system behavior.

**Test Framework**: Jest with Supertest

**Areas to Focus On**:
- Critical user flows
- Authentication flows
- Full API workflows
- System behavior under realistic conditions

**Implementation Strategy**:
- Test complete workflows that span multiple API endpoints
- Use a containerized test environment
- Test with realistic data scenarios

**Example Test Case**:
```javascript
// Example E2E test for user registration and profile creation
describe('User Registration Flow', () => {
  it('should allow a user to register, verify email, and create a profile', async () => {
    // Step 1: Register
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'securepassword123',
        firstName: 'New',
        lastName: 'User'
      });
    
    expect(registerResponse.status).toBe(201);
    const userId = registerResponse.body.data.id;
    
    // Step 2: Verify email (mocked)
    const verificationToken = await EmailVerificationToken.findOne({
      where: { userId }
    });
    
    const verifyResponse = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: verificationToken.token });
    
    expect(verifyResponse.status).toBe(200);
    
    // Step 3: Login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        emailOrUsername: 'newuser@example.com',
        password: 'securepassword123'
      });
    
    expect(loginResponse.status).toBe(200);
    const { accessToken } = loginResponse.body.data;
    
    // Step 4: Create profile
    const profileResponse = await request(app)
      .post('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Software Developer',
        bio: 'Experienced developer',
        location: 'New York',
        website: 'https://example.com'
      });
    
    expect(profileResponse.status).toBe(201);
    expect(profileResponse.body.data).toHaveProperty('id');
  });
});
```

### 4. Performance Testing

**Purpose**: Verify the system meets performance requirements.

**Tools**: Artillery, k6

**Areas to Focus On**:
- API response times
- Database query performance
- Resource utilization
- Concurrency handling

**Implementation Strategy**:
- Define performance SLAs (e.g., 95% of requests < 200ms)
- Test with gradual load increases
- Identify bottlenecks and optimize
- Monitor system resources during tests

**Example Test Scenario**:
```javascript
// Example Artillery test configuration
{
  "config": {
    "target": "http://localhost:3000",
    "phases": [
      { "duration": 60, "arrivalRate": 5 },
      { "duration": 120, "arrivalRate": 5, "rampTo": 50 },
      { "duration": 180, "arrivalRate": 50 }
    ],
    "defaults": {
      "headers": {
        "Content-Type": "application/json"
      }
    }
  },
  "scenarios": [
    {
      "name": "API endpoints",
      "flow": [
        {
          "post": {
            "url": "/api/v1/auth/login",
            "json": {
              "emailOrUsername": "test@example.com",
              "password": "password123"
            },
            "capture": {
              "json": "$.data.accessToken",
              "as": "token"
            }
          }
        },
        {
          "get": {
            "url": "/api/v1/profile",
            "headers": {
              "Authorization": "Bearer {{ token }}"
            }
          }
        },
        {
          "get": {
            "url": "/api/v1/projects"
          }
        },
        {
          "get": {
            "url": "/api/v1/blog?page=1&limit=10"
          }
        }
      ]
    }
  ]
}
```

### 5. Security Testing

**Purpose**: Identify security vulnerabilities.

**Tools**: OWASP ZAP, npm audit

**Areas to Focus On**:
- Authentication and authorization
- Input validation and sanitization
- Data encryption
- Dependency vulnerabilities
- API security

**Implementation Strategy**:
- Regular security scanning with automated tools
- Penetration testing for authentication flows
- Dependency vulnerability scanning
- Code reviews with security focus

## Test Organization

### Directory Structure
```
/tests
  /unit
    /modules
      /auth
      /blog
      /profile
      /...other modules
    /shared
      /utils
      /middleware
  /integration
    /api
      /auth
      /blog
      /profile
    /database
  /e2e
    /flows
  /performance
  /security
```

### Naming Conventions
- Unit tests: `*.test.js` or `*.spec.js`
- Integration tests: `*.integration.test.js`
- E2E tests: `*.e2e.test.js`

## Test Data Management

### Approach
1. **Factories**: Use factory functions to generate test data with customizable attributes
2. **Fixtures**: Pre-defined JSON data for common test scenarios
3. **Test Database**: Separate database for testing with automated setup/teardown

### Implementation
```javascript
// Example test data factory
const createUserFactory = (overrides = {}) => ({
  username: `user_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'hashed_password_value',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  status: 'active',
  ...overrides
});

// Usage in test
const testUser = createUserFactory({ role: 'admin' });
```

## Mocking Strategy

### External Dependencies
- Use Jest mock functions for external APIs
- Use in-memory databases for database testing when appropriate
- Mock file system operations with mock-fs

### Example
```javascript
// Mocking email service
jest.mock('../../../shared/services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true })
}));
```

## Code Coverage

### Goals
- Unit tests: 80%+ coverage
- Integration tests: 70%+ coverage for API endpoints
- Overall: 75%+ code coverage

### Implementation
- Use Jest's built-in coverage reporting
- Generate coverage reports in CI/CD pipeline
- Track coverage trends over time

## CI/CD Integration

### Pipeline Integration
1. Run linting and unit tests on every commit
2. Run integration tests on pull requests
3. Run E2E tests before deployment
4. Run security scans weekly

### Implementation Tools
- GitHub Actions or similar CI/CD service
- Automated test reporting
- Fail builds that don't meet coverage thresholds

## Test Implementation Roadmap

### Phase 1: Foundation (1-2 months)
1. Set up testing frameworks and tools
2. Implement unit tests for core modules (auth, users, profiles)
3. Set up CI pipeline for running tests

### Phase 2: Expansion (2-3 months)
1. Implement integration tests for all API endpoints
2. Add E2E tests for critical user flows
3. Improve unit test coverage across modules

### Phase 3: Performance & Security (1-2 months)
1. Set up performance testing infrastructure
2. Implement security scanning
3. Address performance bottlenecks

### Phase 4: Maintenance & Monitoring (Ongoing)
1. Maintain and update tests as code evolves
2. Monitor test metrics and improve coverage
3. Regularly review and update security tests

## Conclusion
This testing strategy provides a comprehensive approach to ensure the quality, reliability, and security of the Portfolio Backend application. By implementing tests at multiple levels and integrating them into the development workflow, we can prevent regressions, maintain high code quality, and deliver a robust application. 