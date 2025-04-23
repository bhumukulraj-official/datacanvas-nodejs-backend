const blogService = require('../services/blog.service');
const { NotFoundError, PermissionError } = require('../../../shared/errors');

/**
 * Get all blog tags
 */
exports.listTags = async (req, res, next) => {
  try {
    const { 
      page, 
      limit, 
      sort = 'name', 
      order = 'asc'
    } = req.query;
    
    const result = await blogService.getBlogTags({
      page,
      limit,
      sort,
      order
    });
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Blog tags retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tags with post count
 */
exports.getTagsWithCount = async (req, res, next) => {
  try {
    const result = await blogService.getTagsWithPostCount();
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Tags with post count retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a tag by slug
 */
exports.getTag = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tag = await blogService.getBlogTagBySlug(slug);
    
    return res.status(200).json({
      success: true,
      data: tag,
      message: 'Blog tag retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new tag (admin)
 */
exports.createTag = async (req, res, next) => {
  try {
    const tagData = req.body;
    const userId = req.user.id;
    
    const tag = await blogService.createBlogTag(tagData, userId);
    
    return res.status(201).json({
      success: true,
      data: tag,
      message: 'Blog tag created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a tag (admin)
 */
exports.updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tagData = req.body;
    const userId = req.user.id;
    
    const tag = await blogService.updateBlogTag(id, tagData, userId);
    
    return res.status(200).json({
      success: true,
      data: tag,
      message: 'Blog tag updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'You do not have permission to update this tag') {
      return next(new PermissionError('You do not have permission to update this tag'));
    }
    next(error);
  }
};

/**
 * Delete a tag (admin)
 */
exports.deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await blogService.deleteBlogTag(id, userId);
    
    return res.status(200).json({
      success: true,
      message: 'Blog tag deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'You do not have permission to delete this tag') {
      return next(new PermissionError('You do not have permission to delete this tag'));
    }
    next(error);
  }
}; 