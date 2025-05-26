const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  ServerError,
  DatabaseError,
  ServiceUnavailableError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  InvalidCredentialsError,
  ResourceNotFoundError,
  DuplicateResourceError,
  handleSequelizeError,
} = require('../../../src/utils/error.util');

describe('Error Utility', () => {
  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('SERVER_ERROR');
      expect(error.data).toEqual({});
      expect(error.timestamp).toBeDefined();
    });

    it('should create an AppError with custom values', () => {
      const data = { field: 'test' };
      const error = new AppError('Custom error', 400, 'CUSTOM_CODE', data);
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('CUSTOM_CODE');
      expect(error.data).toBe(data);
    });

    it('should have a toJSON method that returns the correct format', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR', { field: 'test' });
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: {
          name: 'AppError',
          message: 'Test error',
          statusCode: 400,
          errorCode: 'TEST_ERROR',
          timestamp: expect.any(String),
          data: { field: 'test' }
        }
      });
    });
  });

  describe('Error Subclasses', () => {
    it('should create BadRequestError with correct defaults', () => {
      const error = new BadRequestError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Bad Request');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('BAD_REQUEST');
    });

    it('should create UnauthorizedError with correct defaults', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('UNAUTHORIZED');
    });

    it('should create ForbiddenError with correct defaults', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('FORBIDDEN');
    });

    it('should create NotFoundError with correct defaults', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource Not Found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('NOT_FOUND');
    });

    it('should create ConflictError with correct defaults', () => {
      const error = new ConflictError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource Conflict');
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe('CONFLICT');
    });

    it('should create ValidationError with correct defaults', () => {
      const error = new ValidationError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation Error');
      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should create RateLimitError with correct defaults', () => {
      const error = new RateLimitError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Too Many Requests');
      expect(error.statusCode).toBe(429);
      expect(error.errorCode).toBe('RATE_LIMIT');
    });

    it('should create ServerError with correct defaults', () => {
      const error = new ServerError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Internal Server Error');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('SERVER_ERROR');
    });

    it('should create DatabaseError with correct defaults', () => {
      const error = new DatabaseError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Database Error');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('DATABASE_ERROR');
    });

    it('should create ServiceUnavailableError with correct defaults', () => {
      const error = new ServiceUnavailableError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Service Unavailable');
      expect(error.statusCode).toBe(503);
      expect(error.errorCode).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('Authentication Error Subclasses', () => {
    it('should create AuthenticationError with correct defaults', () => {
      const error = new AuthenticationError();
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Authentication Failed');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('AUTH_FAILED');
    });

    it('should create TokenExpiredError with correct defaults', () => {
      const error = new TokenExpiredError();
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Token Expired');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('TOKEN_EXPIRED');
    });

    it('should create InvalidTokenError with correct defaults', () => {
      const error = new InvalidTokenError();
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Invalid Token');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('INVALID_TOKEN');
    });

    it('should create InvalidCredentialsError with correct defaults', () => {
      const error = new InvalidCredentialsError();
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Invalid Credentials');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Resource Error Subclasses', () => {
    it('should create ResourceNotFoundError with correct message', () => {
      const error = new ResourceNotFoundError('User', 123);
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('User with ID 123 not found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('RESOURCE_NOT_FOUND');
    });

    it('should create ResourceNotFoundError with custom message', () => {
      const error = new ResourceNotFoundError('User', 123, 'User does not exist');
      
      expect(error.message).toBe('User does not exist');
    });

    it('should create DuplicateResourceError with correct message', () => {
      const error = new DuplicateResourceError('User', 'email', 'test@example.com');
      
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('User with email test@example.com already exists');
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe('DUPLICATE_RESOURCE');
    });

    it('should create DuplicateResourceError with custom message', () => {
      const error = new DuplicateResourceError('User', 'email', 'test@example.com', 'Email already registered');
      
      expect(error.message).toBe('Email already registered');
    });
  });

  describe('handleSequelizeError', () => {
    it('should handle SequelizeValidationError', () => {
      const sequelizeError = {
        name: 'SequelizeValidationError',
        errors: [
          { path: 'email', message: 'Email is invalid', value: 'invalid-email' }
        ]
      };
      
      const appError = handleSequelizeError(sequelizeError);
      
      expect(appError).toBeInstanceOf(ValidationError);
      expect(appError.errorCode).toBe('SEQUELIZE_VALIDATION_ERROR');
      expect(appError.data).toEqual({
        errors: [
          { field: 'email', message: 'Email is invalid', value: 'invalid-email' }
        ]
      });
    });

    it('should handle SequelizeUniqueConstraintError', () => {
      const sequelizeError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [
          { path: 'email', message: 'Email must be unique', value: 'test@example.com' }
        ]
      };
      
      const appError = handleSequelizeError(sequelizeError);
      
      expect(appError).toBeInstanceOf(ConflictError);
      expect(appError.errorCode).toBe('UNIQUE_CONSTRAINT_ERROR');
      expect(appError.data).toEqual({
        errors: [
          { field: 'email', message: 'Email must be unique', value: 'test@example.com' }
        ]
      });
    });

    it('should handle SequelizeForeignKeyConstraintError', () => {
      const sequelizeError = {
        name: 'SequelizeForeignKeyConstraintError',
        fields: ['user_id'],
        table: 'projects'
      };
      
      const appError = handleSequelizeError(sequelizeError);
      
      expect(appError).toBeInstanceOf(ValidationError);
      expect(appError.errorCode).toBe('FOREIGN_KEY_CONSTRAINT_ERROR');
      expect(appError.data).toEqual({
        field: ['user_id'],
        table: 'projects'
      });
    });

    it('should handle SequelizeDatabaseError', () => {
      const sequelizeError = {
        name: 'SequelizeDatabaseError',
        message: 'Database connection error'
      };
      
      const appError = handleSequelizeError(sequelizeError);
      
      expect(appError).toBeInstanceOf(DatabaseError);
      expect(appError.errorCode).toBe('DATABASE_ERROR');
      expect(appError.data).toEqual({
        message: 'Database connection error'
      });
    });

    it('should handle unknown Sequelize errors', () => {
      const sequelizeError = {
        name: 'UnknownSequelizeError',
        message: 'Unknown error'
      };
      
      const appError = handleSequelizeError(sequelizeError);
      
      expect(appError).toBeInstanceOf(ServerError);
      expect(appError.errorCode).toBe('UNEXPECTED_DB_ERROR');
      expect(appError.data).toEqual({
        message: 'Unknown error'
      });
    });
  });
}); 