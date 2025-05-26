const { Op } = require('sequelize');
const MessageAttachmentRepository = require('../../../../src/data/repositories/messaging/MessageAttachmentRepository');
const { MessageAttachment } = require('../../../../src/data/models');

// Mock the models
jest.mock('../../../../src/data/models', () => ({
  MessageAttachment: {
    findAll: jest.fn()
  }
}));

// Mock the sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    gt: Symbol('gt')
  }
}));

describe('MessageAttachmentRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new MessageAttachmentRepository();
    jest.clearAllMocks();
  });

  test('constructor should set the model correctly', () => {
    expect(repository.model).toBe(MessageAttachment);
  });

  test('getByMessage should call findAll with correct parameters', async () => {
    const messageId = 10;
    const mockAttachments = [{ id: 1 }, { id: 2 }];
    
    MessageAttachment.findAll.mockResolvedValue(mockAttachments);

    const result = await repository.getByMessage(messageId);
    
    expect(MessageAttachment.findAll).toHaveBeenCalledWith({ 
      where: { message_id: messageId } 
    });
    expect(result).toEqual(mockAttachments);
  });

  test('getLargeAttachments should call findAll with correct parameters', async () => {
    const sizeThreshold = 5000000; // 5MB
    const mockAttachments = [{ id: 1 }, { id: 2 }];
    
    MessageAttachment.findAll.mockResolvedValue(mockAttachments);

    const result = await repository.getLargeAttachments(sizeThreshold);
    
    expect(MessageAttachment.findAll).toHaveBeenCalledWith({
      where: {
        file_size: {
          [Op.gt]: sizeThreshold
        }
      }
    });
    expect(result).toEqual(mockAttachments);
  });

  test('getByMimeType should call findAll with correct parameters', async () => {
    const mimeType = 'image/jpeg';
    const mockAttachments = [{ id: 1 }, { id: 2 }];
    
    MessageAttachment.findAll.mockResolvedValue(mockAttachments);

    const result = await repository.getByMimeType(mimeType);
    
    expect(MessageAttachment.findAll).toHaveBeenCalledWith({
      where: { file_type: mimeType }
    });
    expect(result).toEqual(mockAttachments);
  });
}); 