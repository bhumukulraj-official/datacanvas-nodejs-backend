const categoryService = require('../services/category.service');
const { NotFoundError } = require('../../../shared/errors');

/**
 * Get all blog categories
 */
exports.listCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories();
    
    return res.status(200).json({
      success: true,
      data: categories,
      message: 'Blog categories retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get categories with post count
 */
exports.getCategoriesWithCount = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategoriesWithPostCount();
    
    return res.status(200).json({
      success: true,
      data: categories,
      message: 'Blog categories with post count retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by slug
 */
exports.getCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const category = await categoryService.getCategoryBySlug(slug);
    
    return res.status(200).json({
      success: true,
      data: category,
      message: 'Blog category retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category (admin)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = req.body;
    
    const category = await categoryService.createCategory(categoryData);
    
    return res.status(201).json({
      success: true,
      data: category,
      message: 'Blog category created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category (admin)
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    
    const category = await categoryService.updateCategory(id, categoryData);
    
    return res.status(200).json({
      success: true,
      data: category,
      message: 'Blog category updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category (admin)
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await categoryService.deleteCategory(id);
    
    return res.status(200).json({
      success: true,
      message: 'Blog category deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 