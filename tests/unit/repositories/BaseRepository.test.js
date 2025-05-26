const BaseRepository = require('../../../src/data/repositories/BaseRepository');

// Create a mock model
const mockModel = {
  create: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  findAndCountAll: jest.fn()
};

// Create mock record with update and destroy methods
const mockRecord = {
  update: jest.fn(),
  destroy: jest.fn()
};

describe('BaseRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new BaseRepository(mockModel);
    jest.clearAllMocks();
  });

  test('create should call model create method', async () => {
    const data = { name: 'Test', value: 123 };
    const mockCreatedRecord = { id: 1, ...data };
    mockModel.create.mockResolvedValue(mockCreatedRecord);

    const result = await repository.create(data);
    
    expect(mockModel.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(mockCreatedRecord);
  });

  test('findById should call model findByPk method', async () => {
    const id = 1;
    const mockFoundRecord = { id, name: 'Test' };
    mockModel.findByPk.mockResolvedValue(mockFoundRecord);

    const result = await repository.findById(id);
    
    expect(mockModel.findByPk).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockFoundRecord);
  });

  test('findByUuid should call model findOne method', async () => {
    const uuid = 'test-uuid-123';
    const mockFoundRecord = { id: 1, uuid };
    mockModel.findOne.mockResolvedValue(mockFoundRecord);

    const result = await repository.findByUuid(uuid);
    
    expect(mockModel.findOne).toHaveBeenCalledWith({ where: { uuid } });
    expect(result).toEqual(mockFoundRecord);
  });

  test('findAll should call model findAll method', async () => {
    const options = { where: { active: true }, order: [['createdAt', 'DESC']] };
    const mockRecords = [{ id: 1 }, { id: 2 }];
    mockModel.findAll.mockResolvedValue(mockRecords);

    const result = await repository.findAll(options);
    
    expect(mockModel.findAll).toHaveBeenCalledWith(options);
    expect(result).toEqual(mockRecords);
  });

  test('update should find record and call its update method', async () => {
    const id = 1;
    const data = { name: 'Updated Name' };
    const updatedRecord = { id, ...data };
    
    mockModel.findByPk.mockResolvedValue(mockRecord);
    mockRecord.update.mockResolvedValue(updatedRecord);

    const result = await repository.update(id, data);
    
    expect(mockModel.findByPk).toHaveBeenCalledWith(id);
    expect(mockRecord.update).toHaveBeenCalledWith(data);
    expect(result).toEqual(updatedRecord);
  });

  test('update should return null if record not found', async () => {
    const id = 999;
    const data = { name: 'Updated Name' };
    
    mockModel.findByPk.mockResolvedValue(null);

    const result = await repository.update(id, data);
    
    expect(mockModel.findByPk).toHaveBeenCalledWith(id);
    expect(mockRecord.update).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  test('delete should find record and call its destroy method', async () => {
    const id = 1;
    
    mockModel.findByPk.mockResolvedValue(mockRecord);
    mockRecord.destroy.mockResolvedValue(true);

    const result = await repository.delete(id);
    
    expect(mockModel.findByPk).toHaveBeenCalledWith(id);
    expect(mockRecord.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('delete should return null if record not found', async () => {
    const id = 999;
    
    mockModel.findByPk.mockResolvedValue(null);

    const result = await repository.delete(id);
    
    expect(mockModel.findByPk).toHaveBeenCalledWith(id);
    expect(mockRecord.destroy).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  test('paginate should call findAndCountAll with pagination params', async () => {
    const page = 2;
    const limit = 10;
    const where = { active: true };
    const include = [{ model: 'AnotherModel' }];
    const order = [['createdAt', 'DESC']];
    
    const mockResponse = {
      count: 25,
      rows: [{ id: 11 }, { id: 12 }, { id: 13 }]
    };
    
    mockModel.findAndCountAll.mockResolvedValue(mockResponse);

    const result = await repository.paginate({ page, limit, where, include, order });
    
    expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
      where,
      include,
      order,
      offset: 10, // (page-1) * limit
      limit
    });
    
    expect(result).toEqual({
      totalItems: 25,
      items: mockResponse.rows,
      totalPages: 3,
      currentPage: 2
    });
  });
}); 