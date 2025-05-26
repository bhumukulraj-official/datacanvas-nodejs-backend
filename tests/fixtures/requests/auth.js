/**
 * Authentication request fixtures for testing
 */
module.exports = {
  // Login requests
  login: {
    valid: {
      email: 'admin@example.com',
      password: 'securePassword123!'
    },
    invalidEmail: {
      email: 'nonexistent@example.com',
      password: 'securePassword123!'
    },
    invalidPassword: {
      email: 'admin@example.com',
      password: 'wrongPassword'
    },
    missingEmail: {
      password: 'securePassword123!'
    },
    missingPassword: {
      email: 'admin@example.com'
    },
    malformedEmail: {
      email: 'not-an-email',
      password: 'securePassword123!'
    }
  },

  // Registration requests
  register: {
    valid: {
      email: 'newuser@example.com',
      password: 'securePassword123!',
      confirmPassword: 'securePassword123!',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '+12025550179'
    },
    existingEmail: {
      email: 'admin@example.com', // Already exists
      password: 'securePassword123!',
      confirmPassword: 'securePassword123!',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '+12025550179'
    },
    passwordMismatch: {
      email: 'newuser@example.com',
      password: 'securePassword123!',
      confirmPassword: 'differentPassword123!',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '+12025550179'
    },
    weakPassword: {
      email: 'newuser@example.com',
      password: 'weak',
      confirmPassword: 'weak',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '+12025550179'
    },
    missingFields: {
      email: 'newuser@example.com',
      password: 'securePassword123!',
      confirmPassword: 'securePassword123!'
      // Missing firstName, lastName, phoneNumber
    }
  },

  // Password reset requests
  passwordReset: {
    requestReset: {
      valid: {
        email: 'admin@example.com'
      },
      nonexistentEmail: {
        email: 'nonexistent@example.com'
      }
    },
    validateToken: {
      valid: {
        token: 'valid-reset-token-123',
        email: 'admin@example.com'
      },
      invalidToken: {
        token: 'invalid-token',
        email: 'admin@example.com'
      },
      expiredToken: {
        token: 'expired-token-456',
        email: 'admin@example.com'
      }
    },
    resetPassword: {
      valid: {
        token: 'valid-reset-token-123',
        email: 'admin@example.com',
        password: 'newSecurePassword456!',
        confirmPassword: 'newSecurePassword456!'
      },
      passwordMismatch: {
        token: 'valid-reset-token-123',
        email: 'admin@example.com',
        password: 'newSecurePassword456!',
        confirmPassword: 'differentPassword789!'
      },
      weakPassword: {
        token: 'valid-reset-token-123',
        email: 'admin@example.com',
        password: 'weak',
        confirmPassword: 'weak'
      },
      invalidToken: {
        token: 'invalid-token',
        email: 'admin@example.com',
        password: 'newSecurePassword456!',
        confirmPassword: 'newSecurePassword456!'
      }
    }
  },

  // Refresh token requests
  refreshToken: {
    valid: {
      refreshToken: 'valid-refresh-token-abc123'
    },
    expired: {
      refreshToken: 'expired-refresh-token-def456'
    },
    invalid: {
      refreshToken: 'invalid-refresh-token-ghi789'
    },
    malformed: {
      refreshToken: 'malformed-token'
    }
  },

  // Email verification requests
  emailVerification: {
    requestVerification: {
      valid: {
        email: 'unverified@example.com'
      },
      alreadyVerified: {
        email: 'admin@example.com'
      }
    },
    verifyEmail: {
      valid: {
        token: 'valid-verification-token-123',
        email: 'unverified@example.com'
      },
      invalidToken: {
        token: 'invalid-token',
        email: 'unverified@example.com'
      },
      expiredToken: {
        token: 'expired-token-456',
        email: 'unverified@example.com'
      }
    }
  },

  // API key requests
  apiKey: {
    create: {
      valid: {
        name: 'Test API Key',
        scopes: ['read:projects', 'write:projects']
      },
      invalidScopes: {
        name: 'Test API Key',
        scopes: ['invalid:scope']
      },
      missingName: {
        scopes: ['read:projects', 'write:projects']
      }
    },
    validateApiKey: {
      valid: {
        apiKey: 'valid-api-key-123'
      },
      invalid: {
        apiKey: 'invalid-api-key'
      },
      revoked: {
        apiKey: 'revoked-api-key-456'
      }
    }
  }
}; 