const blogService = require('../services/blog.service');
const { NotFoundError, ValidationError, PermissionError } = require('../../../shared/errors');

/**
 * Get comments for a blog post
 */
exports.getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page, limit, sort = 'created_at', order = 'asc' } = req.query;
    
    const result = await blogService.getCommentsForPost(postId, {
      page,
      limit,
      sort,
      order
    });
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Comments retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new comment
 */
exports.createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    
    // Add post ID to comment data
    const commentData = {
      ...req.body,
      post_id: postId
    };
    
    // Add user ID if authenticated
    if (req.user && req.user.id) {
      commentData.user_id = req.user.id;
    }

    // Add IP and user agent for moderation purposes
    commentData.ip_address = req.ip;
    commentData.user_agent = req.get('User-Agent');
    
    const comment = await blogService.createComment(commentData);
    
    return res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment submitted successfully and is awaiting moderation',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update comment status (admin only)
 */
exports.updateCommentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const comment = await blogService.updateCommentStatus(id, status);
    
    return res.status(200).json({
      success: true,
      data: comment,
      message: `Comment status updated to ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a comment (admin only)
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await blogService.deleteComment(id);
    
    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all comments for admin with filtering
 */
exports.getAdminComments = async (req, res, next) => {
  try {
    const { 
      page, 
      limit, 
      sort = 'created_at', 
      order = 'desc',
      status,
      postId
    } = req.query;
    
    const result = await blogService.getCommentsForAdmin({
      page,
      limit,
      sort,
      order,
      status,
      postId
    });
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Comments retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 