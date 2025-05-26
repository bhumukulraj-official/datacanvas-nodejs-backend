const invoiceService = require('../../../../src/services/billing/invoice.service');
const { InvoiceRepository, InvoiceItemRepository, InvoiceStatusRepository } = require('../../../../src/data/repositories/billing');
const { CustomError, ResourceNotFoundError } = require('../../../../src/utils/error.util');
const logger = require('../../../../src/utils/logger.util');

// Mock the repositories
jest.mock('../../../../src/data/repositories/billing', () => ({
  InvoiceRepository: jest.fn(),
  InvoiceItemRepository: jest.fn(),
  InvoiceStatusRepository: jest.fn()
}));

// Mock logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('InvoiceService', () => {
  let mockInvoiceRepository;
  let mockItemRepository;
  let mockStatusRepository;
  
  beforeEach(() => {
    // Create new instances of mocked repositories
    mockInvoiceRepository = new InvoiceRepository();
    mockItemRepository = new InvoiceItemRepository();
    mockStatusRepository = new InvoiceStatusRepository();
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Mock repositories on the service
    invoiceService.invoiceRepo = mockInvoiceRepository;
    invoiceService.itemRepo = mockItemRepository;
    invoiceService.statusRepo = mockStatusRepository;
  });

  describe('createInvoice', () => {
    test('should create a new invoice with items successfully', async () => {
      // Mock invoice data
      const invoiceData = {
        client_id: 1,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in the future
        currency: 'USD',
        notes: 'Test invoice'
      };
      
      // Mock invoice items
      const items = [
        {
          description: 'Service A',
          quantity: 2,
          unit_price: 100.00
        },
        {
          description: 'Service B',
          quantity: 1,
          unit_price: 150.00
        }
      ];
      
      // Mock draft status
      const mockStatus = {
        id: 1,
        code: 'draft',
        name: 'Draft'
      };
      
      mockStatusRepository.findByCode = jest.fn().mockResolvedValue(mockStatus);
      
      // Mock created invoice
      const mockInvoice = {
        id: 1,
        client_id: invoiceData.client_id,
        invoice_status_id: mockStatus.id,
        due_date: invoiceData.due_date,
        currency: invoiceData.currency,
        notes: invoiceData.notes,
        created_at: new Date()
      };
      
      mockInvoiceRepository.create = jest.fn().mockResolvedValue(mockInvoice);
      mockItemRepository.bulkCreateForInvoice = jest.fn().mockResolvedValue(items.map((item, index) => ({
        id: index + 1,
        invoice_id: mockInvoice.id,
        ...item
      })));
      
      // Mock getInvoiceWithItems
      const getInvoiceWithItemsSpy = jest.spyOn(invoiceService, 'getInvoiceWithItems')
        .mockResolvedValue({
          ...mockInvoice,
          InvoiceStatus: mockStatus,
          InvoiceItems: items.map((item, index) => ({
            id: index + 1,
            invoice_id: mockInvoice.id,
            ...item
          }))
        });
      
      // Call the service method
      const result = await invoiceService.createInvoice(invoiceData, items);
      
      // Assertions
      expect(mockStatusRepository.findByCode).toHaveBeenCalledWith('draft');
      expect(mockInvoiceRepository.create).toHaveBeenCalledWith({
        ...invoiceData,
        invoice_status_id: mockStatus.id
      });
      expect(mockItemRepository.bulkCreateForInvoice).toHaveBeenCalledWith(mockInvoice.id, items);
      expect(getInvoiceWithItemsSpy).toHaveBeenCalledWith(mockInvoice.id);
      
      // Check result structure
      expect(result).toHaveProperty('id', mockInvoice.id);
      expect(result).toHaveProperty('InvoiceItems');
      expect(result).toHaveProperty('InvoiceStatus');
      
      // Restore the spy
      getInvoiceWithItemsSpy.mockRestore();
    });
  });

  describe('getInvoiceWithItems', () => {
    test('should return an invoice with its items', async () => {
      const invoiceId = 1;
      
      // Mock found invoice with items
      const mockInvoice = {
        id: invoiceId,
        client_id: 1,
        invoice_status_id: 1,
        due_date: new Date(),
        currency: 'USD',
        notes: 'Test invoice',
        InvoiceStatus: {
          id: 1,
          code: 'draft',
          name: 'Draft'
        },
        InvoiceItems: [
          {
            id: 1,
            invoice_id: invoiceId,
            description: 'Service A',
            quantity: 2,
            unit_price: 100.00
          },
          {
            id: 2,
            invoice_id: invoiceId,
            description: 'Service B',
            quantity: 1,
            unit_price: 150.00
          }
        ]
      };
      
      mockInvoiceRepository.getWithItems = jest.fn().mockResolvedValue(mockInvoice);
      
      // Call the service method
      const result = await invoiceService.getInvoiceWithItems(invoiceId);
      
      // Assertions
      expect(mockInvoiceRepository.getWithItems).toHaveBeenCalledWith(invoiceId);
      expect(result).toEqual(mockInvoice);
    });
    
    test('should throw error if invoice not found', async () => {
      const invoiceId = 999;
      
      // Mock repository to return null (invoice not found)
      mockInvoiceRepository.getWithItems = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        invoiceService.getInvoiceWithItems(invoiceId)
      ).rejects.toThrow(ResourceNotFoundError);
      
      // Assertions
      expect(mockInvoiceRepository.getWithItems).toHaveBeenCalledWith(invoiceId);
    });
  });

  describe('updateInvoiceStatus', () => {
    test('should update invoice status successfully', async () => {
      const invoiceId = 1;
      const statusCode = 'paid';
      
      // Mock status
      const mockStatus = {
        id: 3,
        code: 'paid',
        name: 'Paid'
      };
      
      mockStatusRepository.findByCode = jest.fn().mockResolvedValue(mockStatus);
      mockInvoiceRepository.update = jest.fn().mockResolvedValue([1]);
      
      // Mock getInvoiceWithItems
      const mockUpdatedInvoice = {
        id: invoiceId,
        client_id: 1,
        invoice_status_id: mockStatus.id,
        due_date: new Date(),
        currency: 'USD',
        notes: 'Test invoice',
        InvoiceStatus: mockStatus,
        InvoiceItems: [
          {
            id: 1,
            invoice_id: invoiceId,
            description: 'Service A',
            quantity: 2,
            unit_price: 100.00
          }
        ]
      };
      
      const getInvoiceWithItemsSpy = jest.spyOn(invoiceService, 'getInvoiceWithItems')
        .mockResolvedValue(mockUpdatedInvoice);
      
      // Call the service method
      const result = await invoiceService.updateInvoiceStatus(invoiceId, statusCode);
      
      // Assertions
      expect(mockStatusRepository.findByCode).toHaveBeenCalledWith(statusCode);
      expect(mockInvoiceRepository.update).toHaveBeenCalledWith(invoiceId, {
        invoice_status_id: mockStatus.id
      });
      expect(getInvoiceWithItemsSpy).toHaveBeenCalledWith(invoiceId);
      expect(result).toEqual(mockUpdatedInvoice);
      
      // Restore the spy
      getInvoiceWithItemsSpy.mockRestore();
    });
    
    test('should throw error if status code is invalid', async () => {
      const invoiceId = 1;
      const invalidStatusCode = 'invalid_status';
      
      // Mock status repository to return null (invalid status)
      mockStatusRepository.findByCode = jest.fn().mockResolvedValue(null);
      
      // Call the service method and expect it to throw
      await expect(
        invoiceService.updateInvoiceStatus(invoiceId, invalidStatusCode)
      ).rejects.toThrow(CustomError);
      
      // Assertions
      expect(mockStatusRepository.findByCode).toHaveBeenCalledWith(invalidStatusCode);
      expect(mockInvoiceRepository.update).not.toHaveBeenCalled();
    });
    
    test('should throw error if invoice not found', async () => {
      const invoiceId = 999;
      const statusCode = 'paid';
      
      // Mock status
      const mockStatus = {
        id: 3,
        code: 'paid',
        name: 'Paid'
      };
      
      mockStatusRepository.findByCode = jest.fn().mockResolvedValue(mockStatus);
      
      // Mock update to return 0 affected rows (invoice not found)
      mockInvoiceRepository.update = jest.fn().mockResolvedValue([0]);
      
      // Call the service method and expect it to throw
      await expect(
        invoiceService.updateInvoiceStatus(invoiceId, statusCode)
      ).rejects.toThrow(ResourceNotFoundError);
      
      // Assertions
      expect(mockStatusRepository.findByCode).toHaveBeenCalledWith(statusCode);
      expect(mockInvoiceRepository.update).toHaveBeenCalledWith(invoiceId, {
        invoice_status_id: mockStatus.id
      });
    });
  });

  describe('getClientInvoices', () => {
    test('should return invoices for a client', async () => {
      const clientId = 1;
      
      // Mock client invoices
      const mockInvoices = [
        {
          id: 1,
          client_id: clientId,
          invoice_status_id: 1,
          due_date: new Date(),
          currency: 'USD',
          InvoiceStatus: {
            id: 1,
            code: 'draft',
            name: 'Draft'
          },
          InvoiceItems: [
            {
              id: 1,
              invoice_id: 1,
              description: 'Service A',
              quantity: 2,
              unit_price: 100.00
            }
          ]
        },
        {
          id: 2,
          client_id: clientId,
          invoice_status_id: 2,
          due_date: new Date(),
          currency: 'USD',
          InvoiceStatus: {
            id: 2,
            code: 'sent',
            name: 'Sent'
          },
          InvoiceItems: [
            {
              id: 2,
              invoice_id: 2,
              description: 'Service B',
              quantity: 1,
              unit_price: 150.00
            }
          ]
        }
      ];
      
      mockInvoiceRepository.getForClient = jest.fn().mockResolvedValue(mockInvoices);
      
      // Call the service method
      const result = await invoiceService.getClientInvoices(clientId);
      
      // Assertions
      expect(mockInvoiceRepository.getForClient).toHaveBeenCalledWith(clientId, {
        include: ['InvoiceItem', 'InvoiceStatus']
      });
      expect(result).toEqual(mockInvoices);
    });
  });
}); 