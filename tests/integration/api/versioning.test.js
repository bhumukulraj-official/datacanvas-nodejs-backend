const request = require('supertest');
const app = require('../../../src/app');
const { SUPPORTED_VERSIONS, LATEST_VERSION } = require('../../../src/shared/middleware/version.middleware');

describe('API Versioning', () => {
  describe('URL Path Versioning', () => {
    it('should route to specific version when specified in URL', async () => {
      const response = await request(app)
        .get('/api/v1/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.metadata.apiVersion).toBe('v1');
    });

    it('should route to default version when no version specified', async () => {
      const response = await request(app)
        .get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.metadata.apiVersion).toBe('v1');
    });

    it('should reject requests for unsupported versions', async () => {
      const response = await request(app)
        .get('/api/v999/health');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('API_001');
    });
  });

  describe('Header Versioning', () => {
    it('should accept version specified in Accept-Version header', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept-Version', 'v1');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.metadata.apiVersion).toBe('v1');
    });

    it('should reject requests with unsupported version in header', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept-Version', 'v999');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('API_001');
    });

    it('should prefer URL version over header version if both specified', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Accept-Version', 'v999'); // This would be invalid on its own
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.metadata.apiVersion).toBe('v1');
    });
  });

  describe('Version Headers', () => {
    it('should include version headers in responses', async () => {
      const response = await request(app)
        .get('/api/v1/health');
      
      expect(response.headers['x-api-version']).toBe('v1');
      expect(response.headers['x-api-latest-version']).toBe(LATEST_VERSION);
    });
  });

  describe('Version Metadata', () => {
    it('should include version metadata in response body', async () => {
      const response = await request(app)
        .get('/api/v1/health');
      
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.apiVersion).toBe('v1');
      expect(response.body.metadata.releaseDate).toBeDefined();
    });
  });

  describe('Version Info Endpoint', () => {
    it('should provide detailed version information', async () => {
      const response = await request(app)
        .get('/api/v1/version');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe('v1');
      expect(response.body.data.releaseDate).toBeDefined();
      expect(response.body.data.endpoints).toBeInstanceOf(Array);
    });
  });
}); 