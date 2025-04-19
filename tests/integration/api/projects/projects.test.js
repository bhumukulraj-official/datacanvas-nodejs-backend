const request = require('supertest');
const app = require('../../../../src/app');
const { User } = require('../../../../src/modules/auth/models');
const { Project } = require('../../../../src/modules/projects/models');
const { sequelize } = require('../../../../src/shared/database');
const { hashPassword } = require('../../../../src/modules/auth/services/auth.service');

// Helper to authenticate and get token
const authenticate = async (email, password) => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  
  return response.body.data.tokens.accessToken;
};

describe('Projects API Integration Tests', () => {
  let testUser;
  let adminUser;
  let userToken;
  let adminToken;
  let testProject;
  
  // Setup test database and create test users and project
  beforeAll(async () => {
    // Sync test database
    await sequelize.sync({ force: true });
    
    // Create regular test user
    const userPassword = await hashPassword('UserPassword123!');
    testUser = await User.create({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test User',
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
      status: 'active'
    });
    
    // Create admin test user
    const adminPassword = await hashPassword('AdminPassword123!');
    adminUser = await User.create({
      id: '660e8400-e29b-41d4-a716-446655440000',
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      status: 'active'
    });
    
    // Get authentication tokens
    userToken = await authenticate('user@example.com', 'UserPassword123!');
    adminToken = await authenticate('admin@example.com', 'AdminPassword123!');
    
    // Create test project
    testProject = await Project.create({
      id: '770e8400-e29b-41d4-a716-446655440000',
      title: 'Test Project',
      description: 'A test project for API testing',
      tags: ['test', 'api'],
      technologies: ['Node.js', 'Jest'],
      userId: testUser.id
    });
  });
  
  // Clean up after tests
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('GET /api/v1/projects', () => {
    test('should return paginated list of projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('projects');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.projects).toBeInstanceOf(Array);
    });
    
    test('should filter projects by tags', async () => {
      const response = await request(app)
        .get('/api/v1/projects?tags=test')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toBeInstanceOf(Array);
      expect(response.body.data.projects.length).toBeGreaterThan(0);
      expect(response.body.data.projects[0].tags).toContain('test');
    });
    
    test('should paginate results', async () => {
      // Create additional test projects
      await Project.bulkCreate([
        {
          title: 'Project 2',
          description: 'Second test project',
          tags: ['test'],
          userId: testUser.id
        },
        {
          title: 'Project 3',
          description: 'Third test project',
          tags: ['test'],
          userId: testUser.id
        }
      ]);
      
      const response = await request(app)
        .get('/api/v1/projects?page=1&limit=2')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.projects.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.data.pagination).toHaveProperty('totalItems');
      expect(response.body.data.pagination.totalItems).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('GET /api/v1/projects/:id', () => {
    test('should return project by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('project');
      expect(response.body.data.project).toHaveProperty('id', testProject.id);
      expect(response.body.data.project).toHaveProperty('title', testProject.title);
    });
    
    test('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/v1/projects/999e8400-e29b-41d4-a716-446655440000')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'NOT_001');
    });
  });
  
  describe('POST /api/v1/projects', () => {
    test('should create new project when authenticated', async () => {
      const newProject = {
        title: 'New Project',
        description: 'Project created through API test',
        tags: ['api', 'test'],
        technologies: ['Jest', 'Supertest']
      };
      
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProject)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('project');
      expect(response.body.data.project).toHaveProperty('title', newProject.title);
      expect(response.body.data.project).toHaveProperty('userId', testUser.id);
    });
    
    test('should return 401 when not authenticated', async () => {
      const newProject = {
        title: 'Unauthorized Project',
        description: 'Should not be created'
      };
      
      const response = await request(app)
        .post('/api/v1/projects')
        .send(newProject)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'AUTH_001');
    });
    
    test('should return validation error for invalid data', async () => {
      const invalidProject = {
        // Missing title
        description: 'Invalid project without title'
      };
      
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidProject)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'VAL_001');
    });
  });
  
  describe('PUT /api/v1/projects/:id', () => {
    test('should update project when owner', async () => {
      const updateData = {
        title: 'Updated Project Title',
        description: 'Updated project description'
      };
      
      const response = await request(app)
        .put(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('project');
      expect(response.body.data.project).toHaveProperty('title', updateData.title);
      expect(response.body.data.project).toHaveProperty('description', updateData.description);
    });
    
    test('should update project when admin (not owner)', async () => {
      // Create a project owned by the regular user
      const userProject = await Project.create({
        title: 'User Project',
        description: 'Project owned by regular user',
        userId: testUser.id
      });
      
      const updateData = {
        title: 'Admin Updated Title',
        description: 'Project updated by admin'
      };
      
      const response = await request(app)
        .put(`/api/v1/projects/${userProject.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.project).toHaveProperty('title', updateData.title);
    });
    
    test('should return 403 when not owner or admin', async () => {
      // Create a project owned by the admin
      const adminProject = await Project.create({
        title: 'Admin Project',
        description: 'Project owned by admin',
        userId: adminUser.id
      });
      
      const updateData = {
        title: 'Unauthorized Update'
      };
      
      const response = await request(app)
        .put(`/api/v1/projects/${adminProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'PERM_001');
    });
  });
  
  describe('DELETE /api/v1/projects/:id', () => {
    test('should delete project when owner', async () => {
      // Create a project to delete
      const projectToDelete = await Project.create({
        title: 'Project to Delete',
        description: 'This project will be deleted',
        userId: testUser.id
      });
      
      const response = await request(app)
        .delete(`/api/v1/projects/${projectToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verify project was deleted
      const deletedProject = await Project.findByPk(projectToDelete.id);
      expect(deletedProject).toBeNull();
    });
    
    test('should delete project when admin (not owner)', async () => {
      // Create a project owned by the regular user
      const userProject = await Project.create({
        title: 'User Project to Delete',
        description: 'Project owned by regular user, to be deleted by admin',
        userId: testUser.id
      });
      
      const response = await request(app)
        .delete(`/api/v1/projects/${userProject.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verify project was deleted
      const deletedProject = await Project.findByPk(userProject.id);
      expect(deletedProject).toBeNull();
    });
    
    test('should return 403 when not owner or admin', async () => {
      // Create a project owned by the admin
      const adminProject = await Project.create({
        title: 'Admin Project',
        description: 'Project owned by admin',
        userId: adminUser.id
      });
      
      const response = await request(app)
        .delete(`/api/v1/projects/${adminProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'PERM_001');
      
      // Verify project was not deleted
      const project = await Project.findByPk(adminProject.id);
      expect(project).not.toBeNull();
    });
  });
}); 