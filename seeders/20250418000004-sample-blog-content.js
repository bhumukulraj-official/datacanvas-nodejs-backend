'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (!adminUser || !adminUser.length) return;
    const adminId = adminUser[0].id;

    // Create blog categories
    await queryInterface.bulkInsert('blog_categories', [
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Articles about frontend and backend web development technologies and best practices.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Design',
        slug: 'design',
        description: 'Articles about UI/UX design, graphic design, and creative processes.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'DevOps',
        slug: 'devops',
        description: 'Articles about deployment, CI/CD, containerization, and cloud infrastructure.',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});

    // Create blog tags
    await queryInterface.bulkInsert('blog_tags', [
      {
        name: 'JavaScript',
        slug: 'javascript',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'React',
        slug: 'react',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Node.js',
        slug: 'nodejs',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'UI/UX',
        slug: 'uiux',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Docker',
        slug: 'docker',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});

    // Get category IDs
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM blog_categories;`
    );

    const categoryIds = {};
    categories.forEach(category => {
      categoryIds[category.slug] = category.id;
    });

    // Get tag IDs
    const [tags] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM blog_tags;`
    );

    const tagIds = {};
    tags.forEach(tag => {
      tagIds[tag.slug] = tag.id;
    });

    // Create blog posts
    await queryInterface.bulkInsert('blog_posts', [
      {
        title: 'Getting Started with React Hooks',
        slug: 'getting-started-with-react-hooks',
        content: `# Getting Started with React Hooks\n\nReact Hooks are a powerful feature that allows you to use state and other React features without writing a class component. In this article, we'll explore the most commonly used hooks and how they can simplify your React code.\n\n## useState Hook\n\nThe useState hook is the most basic hook that allows you to add state to functional components.\n\n\`\`\`jsx\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n\`\`\`\n\n## useEffect Hook\n\nThe useEffect hook lets you perform side effects in functional components. It's similar to componentDidMount, componentDidUpdate, and componentWillUnmount combined.\n\n\`\`\`jsx\nimport React, { useState, useEffect } from 'react';\n\nfunction Example() {\n  const [count, setCount] = useState(0);\n\n  // Similar to componentDidMount and componentDidUpdate:\n  useEffect(() => {\n    // Update the document title using the browser API\n    document.title = \`You clicked \${count} times\`;\n  });\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n\`\`\`\n\n## Conclusion\n\nReact Hooks provide a more direct API to React concepts you already know: props, state, context, refs, and lifecycle. They also offer a new powerful way to combine them.`,
        excerpt: 'Learn how to use React Hooks to simplify your functional components and add state and lifecycle methods without using classes.',
        featured_image: 'react-hooks-featured.jpg',
        author_id: adminId,
        category_id: categoryIds['web-development'],
        status: 'published',
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Modern CSS Techniques Every Developer Should Know',
        slug: 'modern-css-techniques',
        content: `# Modern CSS Techniques Every Developer Should Know\n\nCSS has evolved significantly over the years, and there are now powerful features that make styling web applications much easier. In this post, we'll explore some modern CSS techniques that every developer should have in their toolkit.\n\n## CSS Grid Layout\n\nCSS Grid Layout is a two-dimensional layout system designed for the web. It makes it easy to create complex grid layouts with just a few lines of CSS.\n\n\`\`\`css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));\n  grid-gap: 20px;\n}\n\`\`\`\n\n## CSS Custom Properties (Variables)\n\nCSS variables allow you to store values that you can reuse throughout your stylesheet.\n\n\`\`\`css\n:root {\n  --primary-color: #007bff;\n  --secondary-color: #6c757d;\n  --font-size-base: 16px;\n}\n\n.button {\n  background-color: var(--primary-color);\n  font-size: var(--font-size-base);\n  padding: 10px 15px;\n}\n\`\`\`\n\n## Flexbox\n\nFlexbox is a one-dimensional layout method designed for laying out items in rows or columns.\n\n\`\`\`css\n.container {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\`\`\`\n\n## Conclusion\n\nBy mastering these modern CSS techniques, you can create more maintainable and responsive web designs with less code. These features have excellent browser support now, so don't hesitate to use them in your projects!`,
        excerpt: 'Explore modern CSS techniques including Grid, Custom Properties, and Flexbox that will make your styling workflow more efficient and maintainable.',
        featured_image: 'css-techniques-featured.jpg',
        author_id: adminId,
        category_id: categoryIds['design'],
        status: 'published',
        published_at: new Date(Date.now() - 86400000), // 1 day ago
        created_at: new Date(Date.now() - 86400000),
        updated_at: new Date(Date.now() - 86400000),
      },
      {
        title: 'Containerizing Your Node.js Application with Docker',
        slug: 'containerizing-nodejs-with-docker',
        content: `# Containerizing Your Node.js Application with Docker\n\nDocker has revolutionized how we deploy applications by making them more portable and consistent across different environments. In this article, we'll walk through the process of containerizing a Node.js application.\n\n## Setting Up a Dockerfile\n\n\`\`\`dockerfile\n# Use an official Node.js runtime as the base image\nFROM node:16-alpine\n\n# Set the working directory in the container\nWORKDIR /app\n\n# Copy package.json and package-lock.json files\nCOPY package*.json ./\n\n# Install dependencies\nRUN npm install\n\n# Copy the rest of the application code\nCOPY . .\n\n# Expose the port the app runs on\nEXPOSE 3000\n\n# Command to run the application\nCMD ["npm", "start"]\n\`\`\`\n\n## Building and Running the Docker Image\n\n\`\`\`bash\n# Build the Docker image\ndocker build -t my-nodejs-app .\n\n# Run the container\ndocker run -p 3000:3000 my-nodejs-app\n\`\`\`\n\n## Using Docker Compose for Multi-Container Applications\n\nIf your application uses other services like databases or caching servers, you can use Docker Compose to define and run multi-container applications.\n\n\`\`\`yaml\n# docker-compose.yml\nversion: '3'\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    depends_on:\n      - db\n  db:\n    image: postgres\n    environment:\n      POSTGRES_PASSWORD: example\n      POSTGRES_DB: myapp\n\`\`\`\n\n## Conclusion\n\nContainerizing your Node.js application with Docker offers numerous benefits, including easier deployment, better consistency across environments, and simplified scaling. Start incorporating Docker into your development workflow today to take advantage of these benefits!`,
        excerpt: 'Learn how to containerize your Node.js application with Docker for consistent deployments across different environments.',
        featured_image: 'docker-nodejs-featured.jpg',
        author_id: adminId,
        category_id: categoryIds['devops'],
        status: 'published',
        published_at: new Date(Date.now() - 172800000), // 2 days ago
        created_at: new Date(Date.now() - 172800000),
        updated_at: new Date(Date.now() - 172800000),
      }
    ], {});

    // Get post IDs
    const [posts] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM blog_posts;`
    );

    const postIds = {};
    posts.forEach(post => {
      postIds[post.slug] = post.id;
    });

    // Create blog post tags associations
    const blogPostTags = [
      { post_id: postIds['getting-started-with-react-hooks'], tag_id: tagIds['react'] },
      { post_id: postIds['getting-started-with-react-hooks'], tag_id: tagIds['javascript'] },
      { post_id: postIds['modern-css-techniques'], tag_id: tagIds['uiux'] },
      { post_id: postIds['containerizing-nodejs-with-docker'], tag_id: tagIds['nodejs'] },
      { post_id: postIds['containerizing-nodejs-with-docker'], tag_id: tagIds['docker'] }
    ];

    await queryInterface.bulkInsert('blog_posts_tags', blogPostTags, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Clean up in reverse order to avoid foreign key constraints
    await queryInterface.bulkDelete('blog_posts_tags', null, {});
    await queryInterface.bulkDelete('blog_posts', null, {});
    await queryInterface.bulkDelete('blog_tags', null, {});
    await queryInterface.bulkDelete('blog_categories', null, {});
  }
}; 