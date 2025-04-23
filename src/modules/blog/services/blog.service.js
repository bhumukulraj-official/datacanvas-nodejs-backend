const { BlogPost, BlogCategory, BlogTag, BlogPostTag, User, Sequelize } = require('../../../shared/database/models');
const { NotFoundError, ValidationError, AuthenticationError } = require('../../../shared/errors');
const cache = require('../../../shared/utils/cache');
const logger = require('../../../shared/utils/logger');
const slugify = require('slugify');
const bcrypt = require('bcryptjs');
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
    sort = 'published_at',  // Using snake_case to match DB column
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
      },
      {
        model: BlogTag,
        as: 'tags',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] }  // Don't include junction table fields
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
    // Filter by tag using the join table
    query.include[2].where = { slug: tag };
  }
  
  // Apply full-text search if provided
  if (search) {
    // Try to use PostgreSQL full-text search if searchVector is available
    try {
      query.where[Op.or] = [
        Sequelize.literal(`"searchVector" @@ plainto_tsquery('english', '${search.replace(/'/g, "''")}')`),
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } }
      ];
    } catch (error) {
      // Fallback to simple search if full-text search fails
      query.where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } }
      ];
    }
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
const getBlogPostBySlug = async (slug, options = {}) => {
  const { password = null } = options;
  
  const post = await BlogPost.findOne({
    where: { slug },
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
      },
      {
        model: BlogTag,
        as: 'tags',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] }
      }
    ]
  });
  
  if (!post) {
    throw new NotFoundError('Blog post not found');
  }
  
  // Check if post is published if no other options provided
  if (post.status !== 'published' && !options.isAdmin) {
    throw new NotFoundError('Blog post not found');
  }
  
  // Handle password-protected posts
  if (post.visibility === 'password_protected') {
    // If no password provided, return limited info
    if (!password) {
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featured_image: post.featured_image,
        author: post.author,
        category: post.category,
        visibility: post.visibility,
        isPasswordProtected: true,
        published_at: post.published_at,
        // Do not include the full content
      };
    }
    
    // Check if password matches
    const isValid = await bcrypt.compare(password, post.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid password for protected post');
    }
  }
  
  // Increment view count for published posts
  if (post.status === 'published') {
    post.view_count += 1;
    await post.save();
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
    
    // Handle tags
    const tags = postData.tags || [];
    delete postData.tags;
    
    // Set author ID
    postData.author_id = userId;
    
    // Hash password if provided for password-protected posts
    if (postData.visibility === 'password_protected' && postData.password) {
      postData.password = await bcrypt.hash(postData.password, 10);
    }
    
    // If post status is published, set published_at if not already set
    if (postData.status === 'published' && !postData.published_at) {
      postData.published_at = new Date();
    }
    
    // Start a transaction
    const transaction = await BlogPost.sequelize.transaction();
    
    try {
      // Create the post
      const post = await BlogPost.create(postData, { transaction });
      
      // Handle tags if any
      if (tags.length > 0) {
        // Add each tag to the post
        for (const tagData of tags) {
          let tag;
          
          // Find or create tag
          if (typeof tagData === 'string') {
            // If tag is just a string name
            const slug = slugify(tagData, { lower: true, strict: true });
            [tag] = await BlogTag.findOrCreate({
              where: { slug },
              defaults: {
                name: tagData,
                slug,
                created_by: userId
              },
              transaction
            });
          } else if (tagData.id) {
            // If tag already exists and has an ID
            tag = await BlogTag.findByPk(tagData.id, { transaction });
            if (!tag) {
              throw new NotFoundError(`Tag with ID ${tagData.id} not found`);
            }
          } else {
            // If tag is a new object with name
            const slug = slugify(tagData.name, { lower: true, strict: true });
            [tag] = await BlogTag.findOrCreate({
              where: { slug },
              defaults: {
                name: tagData.name,
                slug,
                description: tagData.description,
                created_by: userId
              },
              transaction
            });
          }
          
          // Create association
          await BlogPostTag.create({
            post_id: post.id,
            tag_id: tag.id
          }, { transaction });
        }
      }
      
      // Build search vector
      await generateSearchVector(post.id, transaction);
      
      // Commit transaction
      await transaction.commit();
      
      // Get full post with relationships
      const fullPost = await BlogPost.findByPk(post.id, {
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
          },
          {
            model: BlogTag,
            as: 'tags',
            attributes: ['id', 'name', 'slug'],
            through: { attributes: [] }
          }
        ]
      });
      
      // Invalidate cache
      await cache.delByPattern('blog:posts:*');
      await cache.delByPattern('blog:categories:*');
      
      logger.info(`Blog post created: ${post.id}`);
      
      return fullPost;
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
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
        },
        {
          model: BlogTag,
          as: 'tags',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
        }
      ]
    });
    
    if (!post) {
      throw new NotFoundError('Blog post not found');
    }
    
    // Check permissions
    if (post.author_id !== userId) {
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
    
    // Handle password-protected posts
    if (postData.visibility === 'password_protected' && postData.password) {
      // Only hash the password if it's changed
      if (postData.password !== post.password) {
        postData.password = await bcrypt.hash(postData.password, 10);
      }
    }
    
    // Handle tags
    const tags = postData.tags;
    delete postData.tags;
    
    // If post status is changing to published, set published_at if not already set
    if (postData.status === 'published' && post.status !== 'published' && !postData.published_at) {
      postData.published_at = new Date();
    }
    
    // Start a transaction
    const transaction = await BlogPost.sequelize.transaction();
    
    try {
      // Update the post
      await post.update(postData, { transaction });
      
      // Handle tags if provided
      if (Array.isArray(tags)) {
        // Remove all existing tags first
        await BlogPostTag.destroy({
          where: { post_id: post.id },
          transaction
        });
        
        // Add each new tag
        for (const tagData of tags) {
          let tag;
          
          // Find or create tag
          if (typeof tagData === 'string') {
            // If tag is just a string name
            const slug = slugify(tagData, { lower: true, strict: true });
            [tag] = await BlogTag.findOrCreate({
              where: { slug },
              defaults: {
                name: tagData,
                slug,
                created_by: userId
              },
              transaction
            });
          } else if (tagData.id) {
            // If tag already exists and has an ID
            tag = await BlogTag.findByPk(tagData.id, { transaction });
            if (!tag) {
              throw new NotFoundError(`Tag with ID ${tagData.id} not found`);
            }
          } else {
            // If tag is a new object with name
            const slug = slugify(tagData.name, { lower: true, strict: true });
            [tag] = await BlogTag.findOrCreate({
              where: { slug },
              defaults: {
                name: tagData.name,
                slug,
                description: tagData.description,
                created_by: userId
              },
              transaction
            });
          }
          
          // Create association
          await BlogPostTag.create({
            post_id: post.id,
            tag_id: tag.id
          }, { transaction });
        }
      }
      
      // Rebuild search vector
      await generateSearchVector(post.id, transaction);
      
      // Commit transaction
      await transaction.commit();
      
      // Get updated post with relationships
      const updatedPost = await BlogPost.findByPk(post.id, {
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
          },
          {
            model: BlogTag,
            as: 'tags',
            attributes: ['id', 'name', 'slug'],
            through: { attributes: [] }
          }
        ]
      });
      
      // Invalidate cache
      await cache.delByPattern('blog:posts:*');
      await cache.del(`blog:post:${post.slug}`);
      
      logger.info(`Blog post updated: ${id}`);
      
      return updatedPost;
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Error updating blog post: ${error.message}`, { id, postData });
    throw error;
  }
};

/**
 * Update post status
 */
const updatePostStatus = async (id, status, userId) => {
  try {
    const post = await BlogPost.findByPk(id);
    
    if (!post) {
      throw new NotFoundError('Blog post not found');
    }
    
    // Check permissions
    if (post.author_id !== userId) {
      throw new Error('You do not have permission to update this post');
    }
    
    // If transitioning to published, set published_at if not already set
    if (status === 'published' && post.status !== 'published' && !post.published_at) {
      post.published_at = new Date();
    }
    
    // Update the status
    await post.update({ status });
    
    // Invalidate cache
    await cache.delByPattern('blog:posts:*');
    await cache.del(`blog:post:${post.slug}`);
    
    logger.info(`Blog post status updated: ${id} -> ${status}`);
    
    return post;
  } catch (error) {
    logger.error(`Error updating blog post status: ${error.message}`, { id, status });
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
    if (post.author_id !== userId) {
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
          Sequelize.literal(`"searchVector" @@ plainto_tsquery('english', '${query.replace(/'/g, "''")}')`),
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } }
        ]
      },
      order: [
        // Rank results by relevance
        [Sequelize.literal(`ts_rank("searchVector", plainto_tsquery('english', '${query.replace(/'/g, "''")}')`), 'DESC'],
        ['published_at', 'DESC']
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
        },
        {
          model: BlogTag,
          as: 'tags',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] }
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
const generateSearchVector = async (postId, transaction = null) => {
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
      replacements: { postId },
      transaction
    });
  } catch (error) {
    logger.error(`Error generating search vector: ${error.message}`, { postId });
  }
};

/**
 * Check password for protected post
 */
const checkProtectedPostPassword = async (slug, password) => {
  try {
    const post = await BlogPost.findOne({
      where: { slug }
    });
    
    if (!post) {
      throw new NotFoundError('Blog post not found');
    }
    
    if (post.visibility !== 'password_protected') {
      throw new ValidationError('This post is not password protected');
    }
    
    // Check if password matches
    const isValid = await bcrypt.compare(password, post.password);
    if (!isValid) {
      throw new AuthenticationError('Invalid password for protected post');
    }
    
    return { success: true };
  } catch (error) {
    logger.error(`Error checking post password: ${error.message}`);
    throw error;
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
exports.updatePostStatus = updatePostStatus;
exports.deleteBlogPost = deleteBlogPost;
exports.checkProtectedPostPassword = checkProtectedPostPassword; 