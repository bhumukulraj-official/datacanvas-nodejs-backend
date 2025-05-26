// Global test setup
const path = require('path');

// Set NODE_ENV to test before loading any configurations
process.env.NODE_ENV = 'test';

// Load test environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

// Mock Redis to prevent connection issues
jest.mock('ioredis', () => {
  const mockRedis = {
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue('OK')
  };
  return jest.fn(() => mockRedis);
});

// Optional: Add database connection verification
const { sequelize } = require('./src/data/models');

// Setup and teardown for all tests
beforeAll(async () => {
  console.log('Setting up test environment with database:', process.env.DB_NAME);
  
  try {
    // Verify database connection
    await sequelize.authenticate();
    console.log('Test database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the test database:', error);
  }
});

afterAll(async () => {
  console.log('Tearing down test environment');
  
  // Close database connections
  await sequelize.close();
  console.log('Database connections closed');
}); 