class BlogService {
  async getPosts(options = {}) {
    const Post = require('src/modules/blog/models/Post');
    const Tag = require('src/modules/blog/models/Tag');
    const Category = require('src/modules/blog/models/Category');
    
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;
    
    const includes = [];
    
    // Add tag filtering if provided
    if (options.tag) {
      includes.push({
        model: Tag,
        where: { slug: options.tag }
      });
    }
    
    // Add category filtering if provided
    if (options.category) {
      includes.push({
        model: Category,
        where: { slug: options.category }
      });
    }
    
    const result = await Post.findAndCountAll({
      where: { status: 'published' },
      order: [['published_at', 'DESC']],
      limit,
      offset,
      include: includes
    });
    
    const totalPages = Math.ceil(result.count / limit);
    
    return {
      posts: result.rows,
      pagination: {
        total: result.count,
        page,
        limit,
        pages: totalPages
      }
    };
  }
  
  async getPostBySlug(slug) {
    const Post = require('src/modules/blog/models/Post');
    
    const post = await Post.findOne({
      where: { slug, status: 'published' },
      include: []
    });
    
    if (!post) {
      return null;
    }
    
    // Increment view count
    await post.incrementViews();
    await post.reload();
    
    return post;
  }
  
  async createPost(postData, userId) {
    const Post = require('src/modules/blog/models/Post');
    const slugify = require('slugify');
    
    // Generate slug from title
    let slug = slugify(postData.title, {
      lower: true,
      strict: true
    });
    
    // Check if slug already exists
    let existingPost = await Post.findOne({ where: { slug } });
    let suffix = 1;
    
    // Add a number suffix if slug already exists
    while (existingPost) {
      slug = `${slug}-${suffix}`;
      existingPost = await Post.findOne({ where: { slug } });
      suffix++;
    }
    
    // Prepare post data
    const postCreateData = {
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt,
      status: postData.status,
      slug,
      user_id: userId
    };
    
    // Set published_at date if status is published
    if (postData.status === 'published') {
      postCreateData.published_at = new Date();
    }
    
    // Create post
    const post = await Post.create(postCreateData);
    
    // Associate categories and tags if provided
    if (postData.categories && postData.categories.length > 0) {
      await post.setCategories(postData.categories);
    }
    
    if (postData.tags && postData.tags.length > 0) {
      await post.setTags(postData.tags);
    }
    
    // Reload post with associations
    return await post.reload();
  }
  
  async updatePost() {}
  async deletePost() {}
  async searchPosts() {}
  async getPostsByAuthor() {}
  async getRelatedPosts() {}
}

module.exports = BlogService; 