/**
 * Common mocks for external services used in tests
 */

// Mock for email service
const emailServiceMock = {
  sendEmail: jest.fn().mockResolvedValue({
    messageId: 'mock-message-id-123',
    status: 'sent'
  }),
  sendTemplatedEmail: jest.fn().mockResolvedValue({
    messageId: 'mock-message-id-456',
    status: 'sent'
  }),
  sendBulkEmail: jest.fn().mockResolvedValue({
    messageIds: ['mock-message-id-789', 'mock-message-id-101'],
    status: 'sent'
  })
};

// Mock for payment gateway
const paymentGatewayMock = {
  createCharge: jest.fn().mockResolvedValue({
    id: 'mock-charge-id-123',
    amount: 1000,
    currency: 'usd',
    status: 'succeeded',
    created: Date.now()
  }),
  createRefund: jest.fn().mockResolvedValue({
    id: 'mock-refund-id-456',
    amount: 1000,
    currency: 'usd',
    status: 'succeeded',
    created: Date.now()
  }),
  getCustomer: jest.fn().mockResolvedValue({
    id: 'mock-customer-id-789',
    email: 'customer@example.com',
    created: Date.now()
  })
};

// Mock for file storage service
const fileStorageMock = {
  uploadFile: jest.fn().mockResolvedValue({
    key: 'mock-file-key-123',
    url: 'https://example.com/files/mock-file-key-123',
    size: 1024
  }),
  deleteFile: jest.fn().mockResolvedValue({
    deleted: true
  }),
  getFileUrl: jest.fn().mockReturnValue('https://example.com/files/mock-file-key-123')
};

// Mock for SMS service
const smsServiceMock = {
  sendSMS: jest.fn().mockResolvedValue({
    messageId: 'mock-sms-id-123',
    status: 'sent'
  })
};

// Mock for authentication service
const authServiceMock = {
  generateToken: jest.fn().mockReturnValue('mock-jwt-token-123'),
  verifyToken: jest.fn().mockReturnValue({
    userId: '1',
    email: 'admin@example.com',
    role: 'admin'
  }),
  hashPassword: jest.fn().mockReturnValue('hashed-password-123'),
  comparePassword: jest.fn().mockResolvedValue(true)
};

// Mock for third-party API client
const apiClientMock = {
  get: jest.fn().mockResolvedValue({
    data: { success: true, result: [] }
  }),
  post: jest.fn().mockResolvedValue({
    data: { success: true, id: 'mock-id-123' }
  }),
  put: jest.fn().mockResolvedValue({
    data: { success: true, updated: true }
  }),
  delete: jest.fn().mockResolvedValue({
    data: { success: true, deleted: true }
  })
};

// Mock for Redis client
const redisClientMock = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue('cached-value'),
  del: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockResolvedValue(1)
};

// Mock for WebSocket service
const webSocketServiceMock = {
  emit: jest.fn(),
  broadcast: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

module.exports = {
  emailServiceMock,
  paymentGatewayMock,
  fileStorageMock,
  smsServiceMock,
  authServiceMock,
  apiClientMock,
  redisClientMock,
  webSocketServiceMock
}; 