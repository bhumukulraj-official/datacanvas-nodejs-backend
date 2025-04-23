const blogService = require('../services/blog.service');
const { NotFoundError, PermissionError } = require('../../../shared/errors');

/**
 * Get all blog posts with pagination and filtering
 */
exports.listPosts = async (req, res, next) => {
  try {
    const { 
      page, 
      limit, 
      sort = 'published_at', 
      order = 'desc', 
      category,
      tag,
      search
    } = req.query;
    
    const result = await blogService.getBlogPosts({
      page,
      limit,
      sort,
      order,
      category,
      tag,
      search,
      status: 'published' // Public API only shows published posts
    });
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Blog posts retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a blog post by slug
 */
exports.getPost = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { password } = req.body; // For password-protected posts
    
    const post = await blogService.getBlogPostBySlug(slug, { 
      password,
      isAdmin: req.user?.role === 'admin' // Allow admins to see non-published posts
    });
    
    return res.status(200).json({
      success: true,
      data: post,
      message: 'Blog post retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search blog posts
 */
exports.searchPosts = async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    
    const result = await blogService.searchBlogPosts(q, {
      page,
      limit,
      status: 'published' // Public API only shows published posts
    });
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Blog posts search results',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new blog post (admin)
 */
exports.createPost = async (req, res, next) => {
  try {
    const postData = req.body;
    const userId = req.user.id;
    
    const post = await blogService.createBlogPost(postData, userId);
    
    return res.status(201).json({
      success: true,
      data: post,
      message: 'Blog post created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a blog post (admin)
 */
exports.updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const postData = req.body;
    const userId = req.user.id;
    
    const post = await blogService.updateBlogPost(id, postData, userId);
    
    return res.status(200).json({
      success: true,
      data: post,
      message: 'Blog post updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'You do not have permission to update this post') {
      return next(new PermissionError('You do not have permission to update this post'));
    }
    next(error);
  }
};

/**
 * Update a blog post's status (admin)
 */
exports.updatePostStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    // Validate the status value
    const validStatuses = ['draft', 'published', 'archived', 'deleted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    const post = await blogService.updatePostStatus(id, status, userId);
    
    return res.status(200).json({
      success: true,
      data: post,
      message: `Blog post status updated to ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'You do not have permission to update this post') {
      return next(new PermissionError('You do not have permission to update this post'));
    } else if (error.message && error.message.startsWith('Invalid state transition')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
};

/**
 * Update a blog post's featured status (admin)
 */
exports.updatePostFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    const userId = req.user.id;
    
    // Validate the featured value is a boolean
    if (typeof featured !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Featured must be a boolean value',
        timestamp: new Date().toISOString()
      });
    }
    
    const post = await blogService.updateBlogPost(id, { is_featured: featured }, userId);
    
    return res.status(200).json({
      success: true,
      data: post,
      message: `Blog post featured status updated to ${featured}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'You do not have permission to update this post') {
      return next(new PermissionError('You do not have permission to update this post'));
    }
    next(error);
  }
};

/**
 * Delete a blog post (admin)
 */
exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await blogService.deleteBlogPost(id, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'You do not have permission to delete this post') {
      return next(new PermissionError('You do not have permission to delete this post'));
    }
    next(error);
  }
}; 