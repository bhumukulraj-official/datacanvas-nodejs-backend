const { Op } = require('sequelize');
const slugify = require('slugify');

// Mock dependencies
jest.mock('sequelize');
jest.mock('slugify');
jest.mock('src/modules/blog/models/Post');
jest.mock('src/modules/blog/models/Category');
jest.mock('src/modules/blog/models/Tag');
jest.mock('src/modules/blog/models/Comment');
jest.mock('src/shared/utils/logger');

// Import the mocks for use in tests
const Post = require('src/modules/blog/models/Post');
const Category = require('src/modules/blog/models/Category');
const Tag = require('src/modules/blog/models/Tag');
const Comment = require('src/modules/blog/models/Comment');
const logger = require('src/shared/utils/logger');

// Import the service to test
const BlogService = require('src/modules/blog/services/blog.service');

describe('BlogService', () => {
  let blogService;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of the service
    blogService = new BlogService();
  });
  
  describe('getPosts', () => {
    it('should return paginated posts with default parameters', async () => {
      // Setup
      const mockPosts = [
        { id: 1, title: 'Post 1', content: 'Content 1' },
        { id: 2, title: 'Post 2', content: 'Content 2' }
      ];
      
      const mockCount = 2;
      
      Post.findAndCountAll.mockResolvedValue({
        rows: mockPosts,
        count: mockCount
      });
      
      // Execute
      const result = await blogService.getPosts();
      
      // Assert
      expect(Post.findAndCountAll).toHaveBeenCalledWith({
        where: { status: 'published' },
        order: [['published_at', 'DESC']],
        limit: 10,
        offset: 0,
        include: expect.any(Array)
      });
      
      expect(result).toEqual({
        posts: mockPosts,
        pagination: {
          total: mockCount,
          page: 1,
          limit: 10,
          pages: 1
        }
      });
    });
    
    it('should apply custom pagination parameters', async () => {
      // Setup
      const mockPosts = [
        { id: 3, title: 'Post 3', content: 'Content 3' },
        { id: 4, title: 'Post 4', content: 'Content 4' }
      ];
      
      const mockCount = 20;
      
      Post.findAndCountAll.mockResolvedValue({
        rows: mockPosts,
        count: mockCount
      });
      
      // Execute
      const result = await blogService.getPosts({ page: 2, limit: 2 });
      
      // Assert
      expect(Post.findAndCountAll).toHaveBeenCalledWith({
        where: { status: 'published' },
        order: [['published_at', 'DESC']],
        limit: 2,
        offset: 2,
        include: expect.any(Array)
      });
      
      expect(result).toEqual({
        posts: mockPosts,
        pagination: {
          total: mockCount,
          page: 2,
          limit: 2,
          pages: 10
        }
      });
    });
    
    it('should apply tag filter if provided', async () => {
      // Setup
      const mockPosts = [
        { id: 1, title: 'Post 1', content: 'Content 1' }
      ];
      
      const mockCount = 1;
      
      Post.findAndCountAll.mockResolvedValue({
        rows: mockPosts,
        count: mockCount
      });
      
      // Execute
      const result = await blogService.getPosts({ tag: 'javascript' });
      
      // Assert
      expect(Post.findAndCountAll).toHaveBeenCalledWith({
        where: { status: 'published' },
        order: [['published_at', 'DESC']],
        limit: 10,
        offset: 0,
        include: expect.arrayContaining([
          expect.objectContaining({
            model: Tag,
            where: { slug: 'javascript' }
          })
        ])
      });
    });
    
    it('should apply category filter if provided', async () => {
      // Setup
      const mockPosts = [
        { id: 1, title: 'Post 1', content: 'Content 1' }
      ];
      
      const mockCount = 1;
      
      Post.findAndCountAll.mockResolvedValue({
        rows: mockPosts,
        count: mockCount
      });
      
      // Execute
      const result = await blogService.getPosts({ category: 'tutorials' });
      
      // Assert
      expect(Post.findAndCountAll).toHaveBeenCalledWith({
        where: { status: 'published' },
        order: [['published_at', 'DESC']],
        limit: 10,
        offset: 0,
        include: expect.arrayContaining([
          expect.objectContaining({
            model: Category,
            where: { slug: 'tutorials' }
          })
        ])
      });
    });
  });
  
  describe('getPostBySlug', () => {
    it('should return null if post not found', async () => {
      // Setup
      Post.findOne.mockResolvedValue(null);
      
      // Execute
      const result = await blogService.getPostBySlug('nonexistent-post');
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should return post with all related data when found', async () => {
      // Setup
      const mockPost = {
        id: 1,
        title: 'Test Post',
        slug: 'test-post',
        content: 'Post content',
        status: 'published',
        published_at: new Date(),
        user_id: 1,
        user: {
          id: 1,
          username: 'testuser'
        },
        categories: [
          { id: 1, name: 'Tutorials', slug: 'tutorials' }
        ],
        tags: [
          { id: 1, name: 'JavaScript', slug: 'javascript' }
        ],
        incrementViews: jest.fn().mockResolvedValue({}),
        reload: jest.fn().mockImplementation(function() {
          this.views += 1;
          return this;
        })
      };
      
      Post.findOne.mockResolvedValue(mockPost);
      
      // Execute
      const result = await blogService.getPostBySlug('test-post');
      
      // Assert
      expect(Post.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-post', status: 'published' },
        include: expect.any(Array)
      });
      
      expect(mockPost.incrementViews).toHaveBeenCalled();
      expect(mockPost.reload).toHaveBeenCalled();
      expect(result).toBe(mockPost);
    });
  });
  
  describe('createPost', () => {
    const mockPostData = {
      title: 'New Test Post',
      content: 'This is the content of the test post.',
      excerpt: 'Short excerpt',
      status: 'draft',
      categories: [1, 3],
      tags: [2, 4]
    };
    
    const mockUserId = 1;
    
    it('should create a new post with a unique slug', async () => {
      // Setup
      slugify.mockReturnValue('new-test-post');
      
      // Mock first check for existing slug
      Post.findOne.mockResolvedValueOnce(null);
      
      const mockCreatedPost = {
        id: 1,
        ...mockPostData,
        slug: 'new-test-post',
        user_id: mockUserId,
        setCategories: jest.fn().mockResolvedValue({}),
        setTags: jest.fn().mockResolvedValue({}),
        reload: jest.fn().mockResolvedValue({
          id: 1,
          title: mockPostData.title,
          content: mockPostData.content,
          slug: 'new-test-post',
          user_id: mockUserId,
          categories: [
            { id: 1, name: 'Category 1' },
            { id: 3, name: 'Category 3' }
          ],
          tags: [
            { id: 2, name: 'Tag 2' },
            { id: 4, name: 'Tag 4' }
          ]
        })
      };
      
      Post.create.mockResolvedValue(mockCreatedPost);
      
      // Execute
      const result = await blogService.createPost(mockPostData, mockUserId);
      
      // Assert
      expect(slugify).toHaveBeenCalledWith(mockPostData.title, {
        lower: true,
        strict: true
      });
      
      expect(Post.create).toHaveBeenCalledWith({
        title: mockPostData.title,
        content: mockPostData.content,
        excerpt: mockPostData.excerpt,
        status: mockPostData.status,
        slug: 'new-test-post',
        user_id: mockUserId
      });
      
      expect(mockCreatedPost.setCategories).toHaveBeenCalledWith(mockPostData.categories);
      expect(mockCreatedPost.setTags).toHaveBeenCalledWith(mockPostData.tags);
      expect(mockCreatedPost.reload).toHaveBeenCalled();
    });
    
    it('should generate a unique slug if the initial slug exists', async () => {
      // Setup
      slugify.mockReturnValue('new-test-post');
      
      // Mock first check for existing slug - found
      Post.findOne.mockResolvedValueOnce({ id: 2 });
      
      // Mock second check with suffix - not found
      Post.findOne.mockResolvedValueOnce(null);
      
      const mockCreatedPost = {
        id: 1,
        ...mockPostData,
        slug: 'new-test-post-1',
        user_id: mockUserId,
        setCategories: jest.fn().mockResolvedValue({}),
        setTags: jest.fn().mockResolvedValue({}),
        reload: jest.fn().mockResolvedValue({
          id: 1,
          title: mockPostData.title,
          content: mockPostData.content,
          slug: 'new-test-post-1'
        })
      };
      
      Post.create.mockResolvedValue(mockCreatedPost);
      
      // Execute
      const result = await blogService.createPost(mockPostData, mockUserId);
      
      // Assert
      expect(Post.create).toHaveBeenCalledWith({
        title: mockPostData.title,
        content: mockPostData.content,
        excerpt: mockPostData.excerpt,
        status: mockPostData.status,
        slug: 'new-test-post-1',
        user_id: mockUserId
      });
      
      expect(result.slug).toBe('new-test-post-1');
    });
    
    it('should set published_at when status is published', async () => {
      // Setup
      const publishedPostData = {
        ...mockPostData,
        status: 'published'
      };
      
      slugify.mockReturnValue('new-test-post');
      Post.findOne.mockResolvedValue(null);
      
      const mockCreatedPost = {
        id: 1,
        ...publishedPostData,
        slug: 'new-test-post',
        user_id: mockUserId,
        published_at: expect.any(Date),
        setCategories: jest.fn().mockResolvedValue({}),
        setTags: jest.fn().mockResolvedValue({}),
        reload: jest.fn().mockResolvedValue({
          id: 1,
          title: publishedPostData.title,
          content: publishedPostData.content,
          slug: 'new-test-post',
          status: 'published',
          published_at: expect.any(Date)
        })
      };
      
      Post.create.mockResolvedValue(mockCreatedPost);
      
      // Execute
      const result = await blogService.createPost(publishedPostData, mockUserId);
      
      // Assert
      expect(Post.create).toHaveBeenCalledWith({
        title: publishedPostData.title,
        content: publishedPostData.content,
        excerpt: publishedPostData.excerpt,
        status: publishedPostData.status,
        slug: 'new-test-post',
        user_id: mockUserId,
        published_at: expect.any(Date)
      });
      
      expect(result.published_at).toBeDefined();
    });
  });
  
  // Additional tests could be added for other methods like:
  // - updatePost
  // - deletePost
  // - searchPosts
  // - getPostsByAuthor
  // - getRelatedPosts
  // - etc.
}); 