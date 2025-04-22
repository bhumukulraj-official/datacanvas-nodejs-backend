'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return queryInterface.bulkInsert('blog_posts', [
      {
        title: 'Getting Started with Node.js',
        slug: 'getting-started-with-nodejs',
        content: 'Node.js is a powerful JavaScript runtime that allows you to build scalable network applications. In this tutorial, we\'ll cover the basics of Node.js, including installation, setting up your first project, and understanding the event-driven architecture that makes Node.js unique.\n\nFirst, let\'s start with installation...',
        excerpt: 'Learn the fundamentals of Node.js and start building server-side applications with JavaScript.',
        featured_image: 'https://example.com/images/nodejs-intro.jpg',
        category_id: 2, // Programming category
        author_id: 1, // admin_user
        status: 'published',
        visibility: 'public',
        password: null,
        published_at: now,
        meta_title: 'Getting Started with Node.js - Complete Beginner\'s Guide',
        meta_description: 'Learn how to install Node.js and create your first server-side JavaScript application with this beginner-friendly tutorial.',
        view_count: 1250,
        comment_count: 15,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        title: 'Advanced React Hooks Tutorial',
        slug: 'advanced-react-hooks-tutorial',
        content: 'React Hooks have revolutionized how we build components in React. In this advanced tutorial, we\'ll dive deep into useCallback, useMemo, and custom hooks to optimize your React applications.\n\nWe\'ll start by understanding the memoization concept...',
        excerpt: 'Take your React skills to the next level with advanced hooks and optimization techniques.',
        featured_image: 'https://example.com/images/react-hooks.jpg',
        category_id: 3, // Web Development category
        author_id: 3, // writer_one
        status: 'published',
        visibility: 'public',
        password: null,
        published_at: oneMonthAgo,
        meta_title: 'Advanced React Hooks - Optimization Techniques',
        meta_description: 'Learn advanced React hooks like useCallback, useMemo, and how to create custom hooks for optimized React applications.',
        view_count: 980,
        comment_count: 23,
        created_at: oneMonthAgo,
        updated_at: now,
        deleted_at: null
      },
      {
        title: 'Building RESTful APIs with Express',
        slug: 'building-restful-apis-with-express',
        content: 'Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. In this tutorial, we\'ll learn how to build a RESTful API with Express.\n\nWe\'ll cover route organization, middleware, error handling, and more...',
        excerpt: 'Learn how to create well-structured RESTful APIs using Express.js and Node.js.',
        featured_image: 'https://example.com/images/express-api.jpg',
        category_id: 2, // Programming category
        author_id: 2, // editor_main
        status: 'published',
        visibility: 'public',
        password: null,
        published_at: twoMonthsAgo,
        meta_title: 'Building RESTful APIs with Express.js - Complete Guide',
        meta_description: 'Step-by-step tutorial on creating robust RESTful APIs using Express.js with proper error handling and middleware.',
        view_count: 1540,
        comment_count: 18,
        created_at: twoMonthsAgo,
        updated_at: twoMonthsAgo,
        deleted_at: null
      },
      {
        title: '5 Daily Habits for Better Health',
        slug: '5-daily-habits-for-better-health',
        content: 'Maintaining good health doesn\'t always require major lifestyle changes. Sometimes, small daily habits can make a significant difference. In this article, we\'ll explore five simple daily habits that can improve your overall health and wellbeing.\n\n1. Start your day with a glass of water...',
        excerpt: 'Simple daily routines that can significantly improve your physical and mental health.',
        featured_image: 'https://example.com/images/daily-health-habits.jpg',
        category_id: 5, // Health & Wellness category
        author_id: 5, // content_creator
        status: 'published',
        visibility: 'public',
        password: null,
        published_at: now,
        meta_title: '5 Essential Daily Habits for Improved Health and Wellness',
        meta_description: 'Discover five simple daily routines that can significantly improve your physical and mental wellbeing with minimal effort.',
        view_count: 2100,
        comment_count: 42,
        created_at: threeMonthsAgo,
        updated_at: now,
        deleted_at: null
      },
      {
        title: 'Funding Options for Early-Stage Startups',
        slug: 'funding-options-for-early-stage-startups',
        content: 'Securing funding is one of the biggest challenges for early-stage startups. In this comprehensive guide, we\'ll explore various funding options available to entrepreneurs, from bootstrapping to venture capital.\n\nWe\'ll discuss the pros and cons of each approach and when to consider them...',
        excerpt: 'A comprehensive overview of different funding strategies for new startup ventures.',
        featured_image: 'https://example.com/images/startup-funding.jpg',
        category_id: 7, // Startups category
        author_id: 3, // writer_one
        status: 'published',
        visibility: 'public',
        password: null,
        published_at: oneMonthAgo,
        meta_title: 'Complete Guide to Startup Funding Options',
        meta_description: 'Explore the various funding options available for early-stage startups, including bootstrapping, angel investors, and venture capital.',
        view_count: 1650,
        comment_count: 28,
        created_at: oneMonthAgo,
        updated_at: oneMonthAgo,
        deleted_at: null
      },
      {
        title: 'Introduction to MongoDB for Node.js Developers',
        slug: 'introduction-to-mongodb-for-nodejs-developers',
        content: 'MongoDB is a popular NoSQL database that works exceptionally well with Node.js applications. In this introductory tutorial, we\'ll cover MongoDB basics, setting up a database, and performing CRUD operations from a Node.js application.\n\nWe\'ll also discuss Mongoose, an elegant MongoDB object modeling tool...',
        excerpt: 'Learn how to integrate MongoDB with your Node.js applications for flexible data storage.',
        featured_image: 'https://example.com/images/mongodb-nodejs.jpg',
        category_id: 2, // Programming category
        author_id: 2, // editor_main
        status: 'draft',
        visibility: 'public',
        password: null,
        published_at: null,
        meta_title: 'MongoDB for Node.js Developers - Getting Started Guide',
        meta_description: 'Learn how to use MongoDB with Node.js applications and master basic CRUD operations with the Mongoose ODM.',
        view_count: 0,
        comment_count: 0,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        title: 'Private Content: Premium Development Strategies',
        slug: 'private-premium-development-strategies',
        content: 'This premium article contains exclusive development strategies that are only available to subscribers. We\'ll cover advanced techniques for optimizing your development workflow, increasing productivity, and delivering high-quality projects consistently.\n\nThese techniques are based on years of industry experience...',
        excerpt: 'Exclusive development strategies for premium subscribers only.',
        featured_image: 'https://example.com/images/premium-strategies.jpg',
        category_id: 3, // Web Development category
        author_id: 1, // admin_user
        status: 'published',
        visibility: 'password_protected',
        password: 'premium2023', // This would be hashed in a real application
        published_at: threeMonthsAgo,
        meta_title: 'Premium Development Strategies - Subscriber Only Content',
        meta_description: 'Exclusive premium content for serious developers looking to level up their skills and productivity.',
        view_count: 320,
        comment_count: 8,
        created_at: threeMonthsAgo,
        updated_at: threeMonthsAgo,
        deleted_at: null
      },
      {
        title: 'Deprecated: Old JavaScript Patterns to Avoid',
        slug: 'deprecated-old-javascript-patterns-to-avoid',
        content: 'JavaScript has evolved significantly over the years, and many patterns that were once common are now considered outdated or inefficient. This article highlights several deprecated JavaScript patterns and provides modern alternatives.\n\nWe\'ll look at issues with old function patterns, variable declarations, and more...',
        excerpt: 'Learn which outdated JavaScript patterns to avoid and what to use instead.',
        featured_image: 'https://example.com/images/deprecated-js.jpg',
        category_id: 2, // Programming category
        author_id: 1, // admin_user
        status: 'archived',
        visibility: 'public',
        password: null,
        published_at: threeMonthsAgo,
        meta_title: 'Deprecated JavaScript Patterns and Modern Alternatives',
        meta_description: 'Identify outdated JavaScript coding patterns and learn the modern, efficient alternatives to use in your projects.',
        view_count: 850,
        comment_count: 12,
        created_at: threeMonthsAgo,
        updated_at: now,
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('blog_posts', null, {});
  }
}; 