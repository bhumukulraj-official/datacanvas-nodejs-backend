const { BlogPost, BlogCategory, User, Sequelize } = require('../../../shared/database/models');
const { NotFoundError, ValidationError } = require('../../../shared/errors');
const cache = require('../../../shared/utils/cache');
const logger = require('../../../shared/utils/logger');
const slugify = require('slugify');
const { Op } = require('sequelize');

/**
 * Get all blog posts with pagination, filtering and sorting
 */
const getBlogPosts = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    category = null,
    tag = null,
    search = null,
    status = 'published',
    sort = 'publishedAt',
    order = 'desc'
  } = options;

  const offset = (page - 1) * limit;
  
  const query = {
    limit,
    offset,
    order: [[sort, order.toUpperCase()]],
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: BlogCategory,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }
    ],
    where: {}
  };

  // Apply filters
  if (status) {
    query.where.status = status;
  }
  
  if (category) {
    query.include[1].where = { slug: category };
  }
  
  if (tag) {
    query.where.tags = {
      [Op.contains]: [tag]
    };
  }
  
  // Apply full-text search if provided
  if (search) {
    query.where = {
      ...query.where,
      [Op.or]: [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } }
      ]
    };
  }
  
  const { rows, count } = await BlogPost.findAndCountAll(query);
  
  return {
    posts: rows,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(count / limit),
      hasPreviousPage: page > 1
    }
  };
};

/**
 * Get blog post by slug
 */
const getBlogPostBySlug = async (slug) => {
  const post = await BlogPost.findOne({
    where: { slug, status: 'published' },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      },
      {
        model: BlogCategory,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }
    ]
  });
  
  if (!post) {
    throw new NotFoundError('Blog post not found');
  }
  
  return post;
};

/**
 * Create a new blog post
 */
const createBlogPost = async (postData, userId) => {
  try {
    // Generate slug from title if not provided
    if (!postData.slug) {
      postData.slug = slugify(postData.title, { lower: true, strict: true });
    } else {
      postData.slug = slugify(postData.slug, { lower: true, strict: true });
    }
    
    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ where: { slug: postData.slug } });
    if (existingPost) {
      throw new ValidationError('A post with this slug already exists');
    }
    
    // Set author ID
    postData.authorId = userId;
    
    // Create the post
    const post = await BlogPost.create(postData);
    
    // Build search vector (using raw query for PostgreSQL)
    await generateSearchVector(post.id);
    
    // Invalidate cache
    await cache.delByPattern('blog:posts:*');
    await cache.delByPattern('blog:categories:*');
    
    logger.info(`Blog post created: ${post.id}`);
    
    return post;
  } catch (error) {
    logger.error(`Error creating blog post: ${error.message}`, { postData });
    throw error;
  }
};

/**
 * Update a blog post
 */
const updateBlogPost = async (id, postData, userId) => {
  try {
    const post = await BlogPost.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    if (!post) {
      throw new NotFoundError('Blog post not found');
    }
    
    // Check permissions
    if (post.authorId !== userId) {
      throw new Error('You do not have permission to update this post');
    }
    
    // Handle slug update
    if (postData.slug) {
      postData.slug = slugify(postData.slug, { lower: true, strict: true });
      
      // Check if slug already exists (and it's not this post)
      const existingPost = await BlogPost.findOne({ 
        where: { 
          slug: postData.slug,
          id: { [Op.ne]: id }
        } 
      });
      
      if (existingPost) {
        throw new ValidationError('A post with this slug already exists');
      }
    } else if (postData.title && !postData.slug) {
      // Update slug if title changed but slug not provided
      postData.slug = slugify(postData.title, { lower: true, strict: true });
    }
    
    // Update the post
    await post.update(postData);
    
    // Rebuild search vector
    await generateSearchVector(post.id);
    
    // Invalidate cache
    await cache.delByPattern('blog:posts:*');
    await cache.del(`blog:post:${post.slug}`);
    
    logger.info(`Blog post updated: ${id}`);
    
    return post;
  } catch (error) {
    logger.error(`Error updating blog post: ${error.message}`, { id, postData });
    throw error;
  }
};

/**
 * Delete a blog post
 */
const deleteBlogPost = async (id, userId) => {
  try {
    const post = await BlogPost.findByPk(id);
    
    if (!post) {
      throw new NotFoundError('Blog post not found');
    }
    
    // Check permissions
    if (post.authorId !== userId) {
      throw new Error('You do not have permission to delete this post');
    }
    
    // Delete the post
    await post.destroy();
    
    // Invalidate cache
    await cache.delByPattern('blog:posts:*');
    await cache.del(`blog:post:${post.slug}`);
    
    logger.info(`Blog post deleted: ${id}`);
    
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting blog post: ${error.message}`, { id });
    throw error;
  }
};

/**
 * Search blog posts
 */
const searchBlogPosts = async (query, options = {}) => {
  const {
    page = 1,
    limit = 10,
    status = 'published'
  } = options;

  const offset = (page - 1) * limit;
  
  try {
    // Use PostgreSQL full-text search if searchVector is available
    const result = await BlogPost.findAndCountAll({
      where: {
        status,
        [Op.or]: [
          Sequelize.literal(`"searchVector" @@ plainto_tsquery('english', '${query}')`),
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } }
        ]
      },
      order: [
        // Rank results by relevance
        [Sequelize.literal(`ts_rank("searchVector", plainto_tsquery('english', '${query}'))`), 'DESC'],
        ['publishedAt', 'DESC']
      ],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: BlogCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    return {
      posts: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(result.count / limit),
        totalItems: result.count,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(result.count / limit),
        hasPreviousPage: page > 1
      },
      query
    };
  } catch (error) {
    logger.error(`Error searching blog posts: ${error.message}`, { query });
    
    // Fallback to simple search if full-text search fails
    return getBlogPosts({
      page,
      limit,
      status,
      search: query
    });
  }
};

/**
 * Generate or update search vector for a blog post
 */
const generateSearchVector = async (postId) => {
  try {
    // This is PostgreSQL specific - updates the tsvector column with weighted search content
    await BlogPost.sequelize.query(`
      UPDATE blog_posts
      SET "searchVector" = 
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'C')
      WHERE id = :postId
    `, {
      replacements: { postId }
    });
  } catch (error) {
    logger.error(`Error generating search vector: ${error.message}`, { postId });
  }
};

// Apply caching to read operations
exports.getBlogPosts = cache.cacheWrapper(
  getBlogPosts,
  'blog:posts',
  1800 // 30 minutes
);

exports.getBlogPostBySlug = cache.cacheWrapper(
  getBlogPostBySlug,
  'blog:post',
  1800 // 30 minutes
);

exports.searchBlogPosts = cache.cacheWrapper(
  searchBlogPosts,
  'blog:search',
  900 // 15 minutes
);

// Non-cached write operations
exports.createBlogPost = createBlogPost;
exports.updateBlogPost = updateBlogPost;
exports.deleteBlogPost = deleteBlogPost; 