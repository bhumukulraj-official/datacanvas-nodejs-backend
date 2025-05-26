const invoiceController = require('../../../../src/api/controllers/billing/invoice.controller');
const { InvoiceService } = require('../../../../src/services/billing');

// Mock the InvoiceService
jest.mock('../../../../src/services/billing/invoice.service', () => ({
  createInvoice: jest.fn(),
  getInvoiceWithItems: jest.fn(),
  updateInvoiceStatus: jest.fn(),
  getClientInvoices: jest.fn()
}));

describe('InvoiceController', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  
  beforeEach(() => {
    // Mock request, response, and next
    mockReq = {
      params: {
        id: 'invoice-123',
        clientId: 'client-123'
      },
      body: {
        client_id: 'client-123',
        amount: 1000,
        currency: 'USD',
        due_date: '2023-12-31',
        items: [
          { description: 'Service 1', amount: 500 },
          { description: 'Service 2', amount: 500 }
        ],
        status: 'paid'
      }
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createInvoice', () => {
    test('should create an invoice successfully', async () => {
      const mockInvoice = {
        id: 'invoice-123',
        client_id: 'client-123',
        amount: 1000,
        currency: 'USD',
        due_date: '2023-12-31',
        status: 'pending'
      };
      
      // Mock the createInvoice service method
      InvoiceService.createInvoice.mockResolvedValue(mockInvoice);
      
      await invoiceController.createInvoice(mockReq, mockRes, mockNext);
      
      expect(InvoiceService.createInvoice).toHaveBeenCalledWith(
        mockReq.body,
        mockReq.body.items
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockInvoice
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to create invoice');
      
      // Mock the createInvoice service method to throw an error
      InvoiceService.createInvoice.mockRejectedValue(mockError);
      
      await invoiceController.createInvoice(mockReq, mockRes, mockNext);
      
      expect(InvoiceService.createInvoice).toHaveBeenCalledWith(
        mockReq.body,
        mockReq.body.items
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getInvoice', () => {
    test('should get an invoice with items', async () => {
      const mockInvoice = {
        id: 'invoice-123',
        client_id: 'client-123',
        amount: 1000,
        currency: 'USD',
        due_date: '2023-12-31',
        status: 'pending',
        items: [
          { description: 'Service 1', amount: 500 },
          { description: 'Service 2', amount: 500 }
        ]
      };
      
      // Mock the getInvoiceWithItems service method
      InvoiceService.getInvoiceWithItems.mockResolvedValue(mockInvoice);
      
      await invoiceController.getInvoice(mockReq, mockRes, mockNext);
      
      expect(InvoiceService.getInvoiceWithItems).toHaveBeenCalledWith(
        mockReq.params.id
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockInvoice
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get invoice');
      
      // Mock the getInvoiceWithItems service method to throw an error
      InvoiceService.getInvoiceWithItems.mockRejectedValue(mockError);
      
      await invoiceController.getInvoice(mockReq, mockRes, mockNext);
      
      expect(InvoiceService.getInvoiceWithItems).toHaveBeenCalledWith(
        mockReq.params.id
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateInvoiceStatus', () => {
    test('should update invoice status successfully', async () => {
      const mockInvoice = {
        id: 'invoice-123',
        client_id: 'client-123',
        amount: 1000,
        status: 'paid'
      };
      
      // Mock the updateInvoiceStatus service method
      InvoiceService.updateInvoiceStatus.mockResolvedValue(mockInvoice);
      
      await invoiceController.updateInvoiceStatus(mockReq, mockRes, mockNext);
      
      expect(InvoiceService.updateInvoiceStatus).toHaveBeenCalledWith(
        mockReq.params.id,
        mockReq.body.status
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockInvoice
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to update invoice status');
      
      // Mock the updateInvoiceStatus service method to throw an error
      InvoiceService.updateInvoiceStatus.mockRejectedValue(mockError);
      
      await invoiceController.updateInvoiceStatus(mockReq, mockRes, mockNext);
      
      expect(InvoiceService.updateInvoiceStatus).toHaveBeenCalledWith(
        mockReq.params.id,
        mockReq.body.status
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getClientInvoices', () => {
    test('should get client invoices successfully', async () => {
      const mockInvoices = [
        { id: 'invoice-1', client_id: 'client-123', amount: 1000 },
        { id: 'invoice-2', client_id: 'client-123', amount: 2000 }
      ];
      
      // Mock the getClientInvoices service method
      InvoiceService.getClientInvoices.mockResolvedValue(mockInvoices);
      
      await invoiceController.getClientInvoices(mockReq, mockRes, mockNext);
      
      expect(InvoiceService.getClientInvoices).toHaveBeenCalledWith(
        mockReq.params.clientId
      );
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockInvoices
      });
    });
    
    test('should call next with error on failure', async () => {
      const mockError = new Error('Failed to get client invoices');
      
      // Mock the getClientInvoices service method to throw an error
      InvoiceService.getClientInvoices.mockRejectedValue(mockError);
      
      await invoiceController.getClientInvoices(mockReq, mockRes, mockNext);
      
      expect(InvoiceService.getClientInvoices).toHaveBeenCalledWith(
        mockReq.params.clientId
      );
      
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
}); 