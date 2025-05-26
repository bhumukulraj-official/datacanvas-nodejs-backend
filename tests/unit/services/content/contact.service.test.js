const contactService = require('../../../../src/services/content/contact.service');
const { ContactSubmissionRepository } = require('../../../../src/data/repositories/public_api');
const { transporter } = require('../../../../src/config/email');
const logger = require('../../../../src/utils/logger.util');

// Mock the repository
jest.mock('../../../../src/data/repositories/public_api', () => ({
  ContactSubmissionRepository: {
    create: jest.fn()
  }
}));

// Mock email transporter
jest.mock('../../../../src/config/email', () => ({
  transporter: {
    sendMail: jest.fn()
  }
}));

// Mock logger
jest.mock('../../../../src/utils/logger.util', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('ContactService', () => {
  beforeEach(() => {
    // Reset mock implementations
    jest.clearAllMocks();
  });

  describe('submitContactForm', () => {
    test('should submit contact form and send emails successfully', async () => {
      // Mock contact form data
      const contactData = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      };
      
      // Mock IP and user agent
      const ipAddress = '127.0.0.1';
      const userAgent = 'Test User Agent';
      const recaptchaScore = 0.9;
      
      // Mock submission creation
      const mockSubmission = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message',
        ip_address: '127.0.0.1',
        user_agent: 'Test User Agent',
        recaptcha_score: 0.9,
        status: 'pending',
        created_at: new Date()
      };
      
      ContactSubmissionRepository.create.mockResolvedValue(mockSubmission);
      
      // Mock email sending
      transporter.sendMail.mockResolvedValue({ messageId: 'test-id' });
      
      // Call the service method
      const result = await contactService.submitContactForm(
        contactData,
        ipAddress,
        userAgent,
        recaptchaScore
      );
      
      // Assertions
      expect(ContactSubmissionRepository.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message',
        ip_address: '127.0.0.1',
        user_agent: 'Test User Agent',
        recaptcha_score: 0.9,
        status: 'pending'
      });
      
      // Verify admin email was sent
      expect(transporter.sendMail).toHaveBeenCalledTimes(2);
      expect(transporter.sendMail.mock.calls[0][0]).toHaveProperty('subject', 'New Contact Form Submission: Test Subject');
      
      // Verify confirmation email was sent
      expect(transporter.sendMail.mock.calls[1][0]).toHaveProperty('to', 'test@example.com');
      expect(transporter.sendMail.mock.calls[1][0]).toHaveProperty('subject', 'Thank you for your message');
      
      // Verify logging
      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.error).not.toHaveBeenCalled();
      
      expect(result).toEqual(mockSubmission);
    });
    
    test('should handle admin email sending failure gracefully', async () => {
      // Mock contact form data
      const contactData = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      };
      
      // Mock submission creation
      const mockSubmission = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message',
        ip_address: '127.0.0.1',
        user_agent: 'Test User Agent',
        status: 'pending',
        created_at: new Date()
      };
      
      ContactSubmissionRepository.create.mockResolvedValue(mockSubmission);
      
      // Mock admin email sending to fail, but confirmation email to succeed
      transporter.sendMail
        .mockRejectedValueOnce(new Error('Failed to send admin email'))
        .mockResolvedValueOnce({ messageId: 'test-id' });
      
      // Call the service method
      const result = await contactService.submitContactForm(
        contactData,
        '127.0.0.1',
        'Test User Agent'
      );
      
      // Assertions
      expect(ContactSubmissionRepository.create).toHaveBeenCalled();
      
      // Verify both emails were attempted
      expect(transporter.sendMail).toHaveBeenCalledTimes(2);
      
      // Verify error was logged for admin email
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send admin notification',
        expect.objectContaining({ 
          error: 'Failed to send admin email',
          submission_id: 1
        })
      );
      
      // Verify confirmation email success was logged
      expect(logger.info).toHaveBeenCalledWith(
        'Confirmation email sent',
        expect.objectContaining({ submission_id: 1 })
      );
      
      expect(result).toEqual(mockSubmission);
    });
    
    test('should handle both email sending failures gracefully', async () => {
      // Mock contact form data
      const contactData = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      };
      
      // Mock submission creation
      const mockSubmission = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message',
        ip_address: '127.0.0.1',
        user_agent: 'Test User Agent',
        status: 'pending',
        created_at: new Date()
      };
      
      ContactSubmissionRepository.create.mockResolvedValue(mockSubmission);
      
      // Mock both emails failing to send
      transporter.sendMail
        .mockRejectedValueOnce(new Error('Failed to send admin email'))
        .mockRejectedValueOnce(new Error('Failed to send confirmation email'));
      
      // Call the service method
      const result = await contactService.submitContactForm(
        contactData,
        '127.0.0.1',
        'Test User Agent'
      );
      
      // Assertions
      expect(ContactSubmissionRepository.create).toHaveBeenCalled();
      
      // Verify both emails were attempted
      expect(transporter.sendMail).toHaveBeenCalledTimes(2);
      
      // Verify errors were logged for both emails
      expect(logger.error).toHaveBeenCalledTimes(2);
      
      // The service should still return the submission
      expect(result).toEqual(mockSubmission);
    });
  });
}); 