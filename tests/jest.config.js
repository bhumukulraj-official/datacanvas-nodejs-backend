module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  },
  // Set rootDir explicitly
  rootDir: '..',
  // Set up mock paths
  moduleDirectories: ['node_modules', 'src'],
  // Use manual mocks
  moduleNameMapper: {
    '^src/modules/auth/services/auth\\.service$': '<rootDir>/tests/mocks/src/modules/auth/services/auth.service.js',
    '^src/modules/profile/services/profile\\.service$': '<rootDir>/tests/mocks/src/modules/profile/services/profile.service.js',
    '^src/modules/blog/services/blog\\.service$': '<rootDir>/tests/mocks/src/modules/blog/services/blog.service.js',
    
    '^src/modules/auth/models/User$': '<rootDir>/tests/mocks/src/modules/auth/models/User.js',
    '^src/modules/auth/models/RefreshToken$': '<rootDir>/tests/mocks/src/modules/auth/models/RefreshToken.js',
    '^src/modules/auth/models/EmailVerificationToken$': '<rootDir>/tests/mocks/src/modules/auth/models/EmailVerificationToken.js',
    '^src/modules/auth/models/AuditLog$': '<rootDir>/tests/mocks/src/modules/auth/models/AuditLog.js',
    
    '^src/modules/profile/models/Profile$': '<rootDir>/tests/mocks/src/modules/profile/models/Profile.js',
    '^src/modules/profile/models/Skill$': '<rootDir>/tests/mocks/src/modules/profile/models/Skill.js',
    
    '^src/modules/blog/models/Post$': '<rootDir>/tests/mocks/src/modules/blog/models/Post.js',
    '^src/modules/blog/models/Category$': '<rootDir>/tests/mocks/src/modules/blog/models/Category.js',
    '^src/modules/blog/models/Tag$': '<rootDir>/tests/mocks/src/modules/blog/models/Tag.js',
    '^src/modules/blog/models/Comment$': '<rootDir>/tests/mocks/src/modules/blog/models/Comment.js',
    
    '^src/shared/utils/logger$': '<rootDir>/tests/mocks/src/shared/utils/logger.js',
    '^src/shared/config$': '<rootDir>/tests/mocks/src/shared/config.js'
  }
}; 