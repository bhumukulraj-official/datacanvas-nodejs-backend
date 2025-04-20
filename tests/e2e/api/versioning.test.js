const axios = require('axios');
const { startServer, stopServer } = require('../../test-utils/server');
const { LATEST_VERSION } = require('../../../src/shared/middleware/version.middleware');

let baseUrl;
const API_PORT = process.env.TEST_API_PORT || 5001;

describe('API Versioning E2E', () => {
  beforeAll(async () => {
    await startServer(API_PORT);
    baseUrl = `http://localhost:${API_PORT}/api`;
  });

  afterAll(async () => {
    await stopServer();
  });

  describe('URL Path Versioning', () => {
    it('should access a resource with explicit version in URL path', async () => {
      const response = await axios.get(`${baseUrl}/v1/health`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('healthy');
      expect(response.data.metadata.apiVersion).toBe('v1');
    });
    
    it('should access a resource with default version when none specified', async () => {
      const response = await axios.get(`${baseUrl}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('healthy');
      expect(response.data.metadata.apiVersion).toBe('v1');
    });

    it('should reject access to an unsupported version', async () => {
      try {
        await axios.get(`${baseUrl}/v999/health`);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error.code).toBe('API_001');
      }
    });
  });

  describe('Header Versioning', () => {
    it('should access a resource with version in Accept-Version header', async () => {
      const response = await axios.get(`${baseUrl}/health`, {
        headers: {
          'Accept-Version': 'v1'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('healthy');
      expect(response.data.metadata.apiVersion).toBe('v1');
    });

    it('should reject access with an unsupported version in header', async () => {
      try {
        await axios.get(`${baseUrl}/health`, {
          headers: {
            'Accept-Version': 'v999'
          }
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error.code).toBe('API_001');
      }
    });
  });

  describe('Version Headers and Metadata', () => {
    it('should include version headers in response', async () => {
      const response = await axios.get(`${baseUrl}/v1/health`);
      
      expect(response.headers['x-api-version']).toBe('v1');
      expect(response.headers['x-api-latest-version']).toBe(LATEST_VERSION);
    });

    it('should include version metadata in response body', async () => {
      const response = await axios.get(`${baseUrl}/v1/health`);
      
      expect(response.data.metadata).toBeDefined();
      expect(response.data.metadata.apiVersion).toBe('v1');
      expect(response.data.metadata.releaseDate).toBeDefined();
    });
  });

  describe('Client Resource Access', () => {
    it('should successfully access a protected resource with proper version', async () => {
      // This test assumes a valid auth flow - in a real test, you would authenticate first
      // and then access a protected resource
      const response = await axios.get(`${baseUrl}/v1/version`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.version).toBe('v1');
      expect(response.data.data.endpoints).toBeInstanceOf(Array);
    });
  });
}); 