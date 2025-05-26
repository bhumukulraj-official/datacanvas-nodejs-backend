const ContactSubmissionRepository = require('../../../../src/data/repositories/public_api/ContactSubmissionRepository');
const ContactSubmission = require('../../../../src/data/models/public_api/ContactSubmission');

// Mock the model
jest.mock('../../../../src/data/models/public_api/ContactSubmission', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn()
}));

describe('ContactSubmissionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findByUuid should call findOne with correct parameters', async () => {
    const uuid = 'submission-uuid-123';
    const mockSubmission = { id: 1, uuid, email: 'test@example.com' };
    
    ContactSubmission.findOne.mockResolvedValue(mockSubmission);
    
    const result = await ContactSubmissionRepository.findByUuid(uuid);
    
    expect(ContactSubmission.findOne).toHaveBeenCalledWith({
      where: { uuid }
    });
    expect(result).toEqual(mockSubmission);
  });

  test('findByEmail should call findAll with correct parameters', async () => {
    const email = 'test@example.com';
    const mockSubmissions = [
      { id: 1, email, message: 'First message' },
      { id: 2, email, message: 'Second message' }
    ];
    
    ContactSubmission.findAll.mockResolvedValue(mockSubmissions);
    
    const result = await ContactSubmissionRepository.findByEmail(email);
    
    expect(ContactSubmission.findAll).toHaveBeenCalledWith({
      where: { email },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockSubmissions);
  });

  test('findByStatus should call findAll with correct parameters', async () => {
    const status = 'pending';
    const mockSubmissions = [
      { id: 1, status, email: 'test1@example.com' },
      { id: 2, status, email: 'test2@example.com' }
    ];
    
    ContactSubmission.findAll.mockResolvedValue(mockSubmissions);
    
    const result = await ContactSubmissionRepository.findByStatus(status);
    
    expect(ContactSubmission.findAll).toHaveBeenCalledWith({
      where: { status },
      order: [['created_at', 'DESC']]
    });
    expect(result).toEqual(mockSubmissions);
  });

  test('markAsReviewed should call update with correct parameters', async () => {
    const uuid = 'submission-uuid-123';
    const updateResult = [1]; // Number of affected rows
    
    ContactSubmission.update.mockResolvedValue(updateResult);
    
    const result = await ContactSubmissionRepository.markAsReviewed(uuid);
    
    expect(ContactSubmission.update).toHaveBeenCalledWith(
      { status: 'reviewed' },
      { where: { uuid } }
    );
    expect(result).toEqual(updateResult);
  });

  test('markAsReplied should call update with correct parameters', async () => {
    const uuid = 'submission-uuid-123';
    const updateResult = [1]; // Number of affected rows
    
    ContactSubmission.update.mockResolvedValue(updateResult);
    
    const result = await ContactSubmissionRepository.markAsReplied(uuid);
    
    expect(ContactSubmission.update).toHaveBeenCalledWith(
      { status: 'replied' },
      { where: { uuid } }
    );
    expect(result).toEqual(updateResult);
  });

  test('markAsSpam should call update with correct parameters', async () => {
    const uuid = 'submission-uuid-123';
    const updateResult = [1]; // Number of affected rows
    
    ContactSubmission.update.mockResolvedValue(updateResult);
    
    const result = await ContactSubmissionRepository.markAsSpam(uuid);
    
    expect(ContactSubmission.update).toHaveBeenCalledWith(
      { status: 'spam' },
      { where: { uuid } }
    );
    expect(result).toEqual(updateResult);
  });

  test('softDelete should call update with correct parameters', async () => {
    const uuid = 'submission-uuid-123';
    const updateResult = [1]; // Number of affected rows
    
    ContactSubmission.update.mockResolvedValue(updateResult);
    
    const result = await ContactSubmissionRepository.softDelete(uuid);
    
    expect(ContactSubmission.update).toHaveBeenCalledWith(
      { is_deleted: true },
      { where: { uuid } }
    );
    expect(result).toEqual(updateResult);
  });
}); 