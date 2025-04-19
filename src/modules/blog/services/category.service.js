const { BlogCategory, BlogPost } = require('../../../shared/database/models');
const { NotFoundError, ValidationError } = require('../../../shared/errors');
const cache = require('../../../shared/utils/cache');
const logger = require('../../../shared/utils/logger');
const slugify = require('slugify');
const { Op } = require('sequelize');

/**
 * Get all blog categories
 */
const getCategories = async () => {
  const categories = await BlogCategory.findAll({
    order: [['name', 'ASC']]
  });
  
  return categories;
};

/**
 * Get a category by slug
 */
const getCategoryBySlug = async (slug) => {
  const category = await BlogCategory.findOne({
    where: { slug }
  });
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  return category;
};

/**
 * Get category with post count
 */
const getCategoriesWithPostCount = async () => {
  const categories = await BlogCategory.findAll({
    attributes: {
      include: [
        [
          BlogCategory.sequelize.literal(`(
            SELECT COUNT(*)
            FROM blog_posts
            WHERE blog_posts."categoryId" = "BlogCategory"."id"
            AND blog_posts."status" = 'published'
          )`),
          'postCount'
        ]
      ]
    },
    order: [['name', 'ASC']]
  });
  
  return categories;
};

/**
 * Create a new category
 */
const createCategory = async (categoryData) => {
  try {
    // Generate slug from name if not provided
    if (!categoryData.slug) {
      categoryData.slug = slugify(categoryData.name, { lower: true, strict: true });
    } else {
      categoryData.slug = slugify(categoryData.slug, { lower: true, strict: true });
    }
    
    // Check if slug already exists
    const existingCategory = await BlogCategory.findOne({ where: { slug: categoryData.slug } });
    if (existingCategory) {
      throw new ValidationError('A category with this slug already exists');
    }
    
    const category = await BlogCategory.create(categoryData);
    
    // Invalidate cache
    await cache.delByPattern('blog:categories:*');
    
    logger.info(`Blog category created: ${category.id}`);
    
    return category;
  } catch (error) {
    logger.error(`Error creating blog category: ${error.message}`, { categoryData });
    throw error;
  }
};

/**
 * Update a category
 */
const updateCategory = async (id, categoryData) => {
  try {
    const category = await BlogCategory.findByPk(id);
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // Handle slug update
    if (categoryData.slug) {
      categoryData.slug = slugify(categoryData.slug, { lower: true, strict: true });
      
      // Check if slug already exists (and it's not this category)
      const existingCategory = await BlogCategory.findOne({ 
        where: { 
          slug: categoryData.slug,
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingCategory) {
        throw new ValidationError('A category with this slug already exists');
      }
    } else if (categoryData.name && !categoryData.slug) {
      // Update slug if name changed but slug not provided
      categoryData.slug = slugify(categoryData.name, { lower: true, strict: true });
    }
    
    await category.update(categoryData);
    
    // Invalidate cache
    await cache.delByPattern('blog:categories:*');
    await cache.delByPattern('blog:posts:*'); // Also invalidate posts since they include category
    
    logger.info(`Blog category updated: ${id}`);
    
    return category;
  } catch (error) {
    logger.error(`Error updating blog category: ${error.message}`, { id, categoryData });
    throw error;
  }
};

/**
 * Delete a category
 */
const deleteCategory = async (id) => {
  try {
    const category = await BlogCategory.findByPk(id);
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // Check if category has posts
    const postCount = await BlogPost.count({ where: { categoryId: id } });
    if (postCount > 0) {
      throw new ValidationError('Cannot delete category with associated posts');
    }
    
    await category.destroy();
    
    // Invalidate cache
    await cache.delByPattern('blog:categories:*');
    
    logger.info(`Blog category deleted: ${id}`);
    
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting blog category: ${error.message}`, { id });
    throw error;
  }
};

// Apply caching to read operations
exports.getCategories = cache.cacheWrapper(
  getCategories,
  'blog:categories:all',
  3600 // 1 hour
);

exports.getCategoryBySlug = cache.cacheWrapper(
  getCategoryBySlug,
  'blog:category',
  3600 // 1 hour
);

exports.getCategoriesWithPostCount = cache.cacheWrapper(
  getCategoriesWithPostCount,
  'blog:categories:counts',
  1800 // 30 minutes
);

// Non-cached write operations
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory; 