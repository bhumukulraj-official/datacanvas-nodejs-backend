# Portfolio Backend Testing

This directory contains the automated tests for the Portfolio Backend application. The tests are organized into different levels and categories as outlined in the testing strategy document.

## Test Structure

```
/tests
  /unit                     # Unit tests
    /modules
      /auth                 # Auth module tests
      /blog                 # Blog module tests
      /profile              # Profile module tests
      /...                  # Other modules
    /shared                 # Shared utilities tests
  /integration              # Integration tests
    /api                    # API endpoint tests
    /database               # Database integration tests
  /e2e                      # End-to-end tests
  jest.config.js            # Jest configuration
  README.md                 # This file
```

## Running Tests

To run the tests, you'll need to have Node.js and npm installed. The application uses Jest as the testing framework.

### Install Dependencies

First, make sure you have all the required dependencies installed:

```bash
npm install
```

### Run All Tests

To run all tests:

```bash
npm test
```

### Run Tests in Watch Mode

To run tests in watch mode (useful during development):

```bash
npm run test:watch
```

### Generate Coverage Report

To generate a code coverage report:

```bash
npm run test:coverage
```

The coverage report will be available in the `/coverage` directory.

## Writing Tests

### Unit Tests

Unit tests should focus on testing individual functions and components in isolation. They should mock external dependencies.

Example:

```javascript
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens when valid credentials are provided', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

Integration tests should test interactions between modules and external dependencies.

### Test Naming Conventions

- Unit tests: `*.test.js` or `*.spec.js`
- Integration tests: `*.integration.test.js`
- E2E tests: `*.e2e.test.js`

## Test Coverage Goals

- Unit tests: 80%+ coverage
- Integration tests: 70%+ coverage for API endpoints
- Overall: 75%+ code coverage

## Mocking

Tests should use Jest's mocking capabilities to mock external dependencies:

```javascript
jest.mock('../../../shared/services/email.service');
```

## Test Data

Use factory functions to generate test data with customizable attributes:

```javascript
const createUserFactory = (overrides = {}) => ({
  username: `user_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  // other properties
  ...overrides
});
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices) 