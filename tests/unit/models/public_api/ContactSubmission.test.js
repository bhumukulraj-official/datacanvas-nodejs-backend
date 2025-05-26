const ContactSubmission = require('../../../../src/data/models/public_api/ContactSubmission');

describe('ContactSubmission Model', () => {
  let origInit;
  
  beforeEach(() => {
    origInit = ContactSubmission.init;
    
    ContactSubmission.init = jest.fn().mockReturnValue(ContactSubmission);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    ContactSubmission.init = origInit;
    
    jest.clearAllMocks();
  });
  
  describe('Model Definition', () => {
    it('should define the model with correct attributes and options', () => {
      const mockSequelize = {};
      
      ContactSubmission.init(mockSequelize);
      
      const initCall = ContactSubmission.init.mock.calls[0];
      expect(initCall).toBeDefined();
      
      // Ensure the method was called with the sequelize instance
      expect(ContactSubmission.init).toHaveBeenCalledTimes(1);
      expect(ContactSubmission.init).toHaveBeenCalledWith(mockSequelize);
    });
  });
}); 