'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    // Sample blog posts for testing full-text search functionality
    const blogPosts = [
      {
        title: 'Getting Started with Node.js and Express',
        slug: 'getting-started-with-nodejs-and-express',
        excerpt: 'Learn how to build web applications with Node.js and Express framework',
        content: 'Node.js is a JavaScript runtime that allows you to run JavaScript on the server side. Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. In this tutorial, we will build a simple RESTful API using Node.js and Express.',
        author_id: 1,
        category_id: 1,
        status: 'published',
        visibility: 'public',
        published_at: now,
        created_at: now,
        updated_at: now
      },
      {
        title: 'PostgreSQL Full-Text Search Implementation',
        slug: 'postgresql-full-text-search-implementation',
        excerpt: 'A comprehensive guide to implementing full-text search in PostgreSQL',
        content: 'PostgreSQL offers powerful full-text search capabilities that allow you to search through large volumes of text data efficiently. In this article, we explore how to set up tsvector columns, create GIN indexes, and write queries that utilize the full-text search functionality. We will also cover ranking results and highlighting matches in the search results.',
        author_id: 1,
        category_id: 2,
        status: 'published',
        visibility: 'public',
        published_at: now,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Building a Personal Portfolio with React',
        slug: 'building-personal-portfolio-with-react',
        excerpt: 'Steps to create an impressive developer portfolio using React',
        content: 'React is a popular JavaScript library for building user interfaces, particularly single-page applications. In this tutorial, we will walk through the process of creating a modern, responsive portfolio website using React and CSS. We will cover component structure, state management, responsive design principles, and deployment options.',
        author_id: 1,
        category_id: 3,
        status: 'published',
        visibility: 'public',
        published_at: now,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Optimizing Database Queries for Performance',
        slug: 'optimizing-database-queries-for-performance',
        excerpt: 'Techniques and best practices for improving database query performance',
        content: 'Database query performance is crucial for application responsiveness. This article covers various techniques for optimizing your database queries, including proper indexing, query restructuring, using explain plans, and avoiding common pitfalls. We will focus on PostgreSQL-specific optimizations but many principles apply to other database systems as well.',
        author_id: 1,
        category_id: 2,
        status: 'published',
        visibility: 'public',
        published_at: now,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Implementing JWT Authentication in Node.js',
        slug: 'implementing-jwt-authentication-in-nodejs',
        excerpt: 'Secure your Node.js application with JSON Web Tokens',
        content: 'JSON Web Tokens (JWT) provide a secure way to authenticate users in your web applications. This tutorial demonstrates how to implement JWT authentication in a Node.js application with Express. We cover token generation, validation, refresh tokens, and security best practices to protect your application from common vulnerabilities.',
        author_id: 1,
        category_id: 1,
        status: 'published',
        visibility: 'public',
        published_at: now,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Modern CSS Layout Techniques with Grid and Flexbox',
        slug: 'modern-css-layout-techniques-grid-flexbox',
        excerpt: 'Learn how to create responsive layouts using modern CSS techniques',
        content: 'CSS Grid and Flexbox have revolutionized web layout design. In this tutorial, we explore how to use these powerful CSS features to create complex, responsive layouts with clean, maintainable code. We will cover grid templates, flex containers, responsive design patterns, and practical examples you can use in your projects immediately.',
        author_id: 1,
        category_id: 3,
        status: 'published',
        visibility: 'public',
        published_at: now,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Building RESTful APIs with GraphQL and Apollo Server',
        slug: 'building-restful-apis-with-graphql-apollo',
        excerpt: 'Discover how to create efficient APIs using GraphQL',
        content: 'GraphQL has emerged as a powerful alternative to REST for API development. This tutorial guides you through creating a GraphQL API with Apollo Server and Node.js. We will cover schema definition, resolvers, queries, mutations, and how to integrate with various data sources. Learn how GraphQL can reduce over-fetching and provide a more flexible API architecture.',
        author_id: 1,
        category_id: 1,
        status: 'published',
        visibility: 'public',
        published_at: now,
        created_at: now,
        updated_at: now
      },
      {
        title: 'Docker and Kubernetes for Microservices Architecture',
        slug: 'docker-kubernetes-microservices-architecture',
        excerpt: 'A comprehensive guide to containerization and orchestration',
        content: 'Microservices architecture has become the standard for building scalable, maintainable applications. This in-depth guide explores how to containerize your applications with Docker and orchestrate them with Kubernetes. We cover container fundamentals, Kubernetes deployments, service discovery, scaling, and best practices for managing a microservices infrastructure in production environments.',
        author_id: 1,
        category_id: 2,
        status: 'published',
        visibility: 'public',
        published_at: now,
        created_at: now,
        updated_at: now
      }
    ];

    try {
      // Insert the sample blog posts
      await queryInterface.bulkInsert('blog_posts', blogPosts, {});
      
      console.log('Successfully seeded blog posts for testing search functionality');
    } catch (error) {
      console.error('Error seeding blog posts:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remove the sample blog posts by their slugs
      await queryInterface.bulkDelete('blog_posts', {
        slug: [
          'getting-started-with-nodejs-and-express',
          'postgresql-full-text-search-implementation',
          'building-personal-portfolio-with-react',
          'optimizing-database-queries-for-performance',
          'implementing-jwt-authentication-in-nodejs',
          'modern-css-layout-techniques-grid-flexbox',
          'building-restful-apis-with-graphql-apollo',
          'docker-kubernetes-microservices-architecture'
        ]
      }, {});
      
      console.log('Successfully removed seeded blog posts');
    } catch (error) {
      console.error('Error removing seeded blog posts:', error);
      throw error;
    }
  }
}; 