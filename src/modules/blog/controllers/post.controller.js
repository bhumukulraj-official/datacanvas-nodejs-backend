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

/**
 * Get related posts
 */
exports.getRelatedPosts = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { limit = 5 } = req.query;
    
    // First get the post by slug
    const post = await blogService.getBlogPostBySlug(slug, { 
      status: 'published' // Only consider published posts
    });
    
    // Then get related posts
    const relatedPosts = await blogService.getRelatedPosts(post.id, limit);
    
    return res.status(200).json({
      success: true,
      data: relatedPosts,
      message: 'Related posts retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate RSS feed
 */
exports.getRssFeed = async (req, res, next) => {
  try {
    const posts = await blogService.generateRssFeed();
    
    // Set content type to XML
    res.setHeader('Content-Type', 'application/rss+xml');
    
    // Generate simple RSS feed XML
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const siteName = process.env.SITE_NAME || 'DataCanvas Blog';
    const siteDescription = process.env.SITE_DESCRIPTION || 'The DataCanvas Blog';
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">';
    xml += '<channel>';
    xml += `<title>${siteName}</title>`;
    xml += `<description>${siteDescription}</description>`;
    xml += `<link>${siteUrl}</link>`;
    xml += `<atom:link href="${siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml" />`;
    
    // Add each post
    posts.forEach(post => {
      xml += '<item>';
      xml += `<title>${post.title}</title>`;
      xml += `<description>${post.excerpt || ''}</description>`;
      xml += `<pubDate>${new Date(post.published_at).toUTCString()}</pubDate>`;
      xml += `<link>${siteUrl}/blog/${post.slug}</link>`;
      xml += `<guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>`;
      
      if (post.category) {
        xml += `<category>${post.category.name}</category>`;
      }
      
      if (post.author) {
        xml += `<author>${post.author.name}</author>`;
      }
      
      xml += '</item>';
    });
    
    xml += '</channel>';
    xml += '</rss>';
    
    return res.send(xml);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Atom feed
 */
exports.getAtomFeed = async (req, res, next) => {
  try {
    const posts = await blogService.generateRssFeed();
    
    // Set content type to XML
    res.setHeader('Content-Type', 'application/atom+xml');
    
    // Generate simple Atom feed XML
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const siteName = process.env.SITE_NAME || 'DataCanvas Blog';
    const siteDescription = process.env.SITE_DESCRIPTION || 'The DataCanvas Blog';
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<feed xmlns="http://www.w3.org/2005/Atom">';
    xml += `<title>${siteName}</title>`;
    xml += `<subtitle>${siteDescription}</subtitle>`;
    xml += `<link href="${siteUrl}" />`;
    xml += `<link href="${siteUrl}/blog/feed.atom" rel="self" />`;
    xml += `<id>${siteUrl}/</id>`;
    xml += `<updated>${new Date().toISOString()}</updated>`;
    
    // Add each post
    posts.forEach(post => {
      xml += '<entry>';
      xml += `<title>${post.title}</title>`;
      xml += `<id>${siteUrl}/blog/${post.slug}</id>`;
      xml += `<link href="${siteUrl}/blog/${post.slug}" />`;
      xml += `<updated>${new Date(post.updated_at).toISOString()}</updated>`;
      xml += `<published>${new Date(post.published_at).toISOString()}</published>`;
      
      if (post.author) {
        xml += '<author>';
        xml += `<name>${post.author.name}</name>`;
        xml += '</author>';
      }
      
      xml += `<summary>${post.excerpt || ''}</summary>`;
      
      if (post.category) {
        xml += `<category term="${post.category.name}" scheme="${siteUrl}/blog/categories/${post.category.slug}" />`;
      }
      
      xml += '</entry>';
    });
    
    xml += '</feed>';
    
    return res.send(xml);
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule a post for future publication
 */
exports.schedulePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { publish_date } = req.body;
    const userId = req.user.id;
    
    if (!publish_date) {
      return res.status(400).json({
        success: false,
        message: 'Publication date is required',
        timestamp: new Date().toISOString()
      });
    }
    
    const post = await blogService.schedulePost(id, publish_date, userId);
    
    return res.status(200).json({
      success: true,
      data: post,
      message: 'Post scheduled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'You do not have permission to schedule this post') {
      return next(new PermissionError('You do not have permission to schedule this post'));
    }
    next(error);
  }
};

/**
 * Publish all scheduled posts that have reached their publication date (admin only)
 */
exports.publishScheduledPosts = async (req, res, next) => {
  try {
    const results = await blogService.publishScheduledPosts();
    
    return res.status(200).json({
      success: true,
      data: results,
      message: `${results.count} posts published successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 