'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (!adminUser || !adminUser.length) return;
    const adminId = adminUser[0].id;

    // Create sample projects
    const projects = [
      {
        user_id: adminId,
        title: 'E-Commerce Platform',
        slug: 'e-commerce-platform',
        summary: 'A fully responsive e-commerce platform with React, Node.js, and MongoDB',
        description: `
          <p>This e-commerce platform offers a seamless shopping experience with dynamic product listings, user authentication, shopping cart functionality, and secure checkout process. Built with React on the frontend and Node.js/Express on the backend, it leverages MongoDB for flexible data storage.</p>
          
          <h3>Key Features:</h3>
          <ul>
            <li>Responsive design that works on all devices</li>
            <li>User authentication and profile management</li>
            <li>Product search and filtering capabilities</li>
            <li>Shopping cart with local storage persistence</li>
            <li>Secure payment processing with Stripe integration</li>
            <li>Admin dashboard for inventory management</li>
          </ul>
          
          <h3>Technical Highlights:</h3>
          <ul>
            <li>React Context API for state management</li>
            <li>Node.js/Express REST API</li>
            <li>MongoDB with Mongoose for data modeling</li>
            <li>JWT for secure authentication</li>
            <li>AWS S3 for image storage</li>
          </ul>
        `,
        thumbnail: '/uploads/projects/ecommerce-thumbnail.jpg',
        banner: '/uploads/projects/ecommerce-banner.jpg',
        website_url: 'https://ecommerce-demo.example.com',
        github_url: 'https://github.com/example/ecommerce-platform',
        status: 'published',
        featured: true,
        project_date: new Date('2023-08-15'),
        project_type: 'Web Application',
        client_name: 'RetailTech Solutions',
        technologies: JSON.stringify(['React', 'Node.js', 'Express', 'MongoDB', 'AWS S3', 'Stripe']),
        media: JSON.stringify([
          {
            type: 'image',
            url: '/uploads/projects/ecommerce-screenshot-1.jpg',
            caption: 'Product listing page with filtering options'
          },
          {
            type: 'image',
            url: '/uploads/projects/ecommerce-screenshot-2.jpg',
            caption: 'Shopping cart and checkout process'
          },
          {
            type: 'video',
            url: 'https://www.youtube.com/embed/abc123',
            caption: 'Platform walkthrough and features'
          }
        ]),
        meta_title: 'E-Commerce Platform | Full-Stack React & Node.js Development',
        meta_description: 'Case study of a modern e-commerce platform built with React, Node.js, and MongoDB with responsive design and secure payment processing.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: adminId,
        title: 'Task Management Dashboard',
        slug: 'task-management-dashboard',
        summary: 'A comprehensive project management tool with real-time updates and analytics',
        description: `
          <p>The Task Management Dashboard is a productivity tool designed for teams to organize, track, and collaborate on projects. It features kanban boards, task assignments, due date tracking, and real-time notifications to keep everyone in sync.</p>
          
          <h3>Key Features:</h3>
          <ul>
            <li>Drag-and-drop kanban board interface</li>
            <li>Task assignment and due date management</li>
            <li>Real-time updates with WebSockets</li>
            <li>File attachments and comments on tasks</li>
            <li>Performance analytics and reporting</li>
            <li>Team collaboration tools</li>
          </ul>
          
          <h3>Technical Highlights:</h3>
          <ul>
            <li>React with TypeScript for type safety</li>
            <li>Redux for state management</li>
            <li>Node.js backend with GraphQL API</li>
            <li>PostgreSQL database</li>
            <li>Socket.io for real-time updates</li>
            <li>Docker containerization</li>
          </ul>
        `,
        thumbnail: '/uploads/projects/taskmanager-thumbnail.jpg',
        banner: '/uploads/projects/taskmanager-banner.jpg',
        website_url: 'https://taskmanager-demo.example.com',
        github_url: 'https://github.com/example/task-management',
        status: 'published',
        featured: true,
        project_date: new Date('2023-05-10'),
        project_type: 'Web Application',
        client_name: 'AgileWorks Inc.',
        technologies: JSON.stringify(['React', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL', 'Socket.io', 'Docker']),
        media: JSON.stringify([
          {
            type: 'image',
            url: '/uploads/projects/taskmanager-screenshot-1.jpg',
            caption: 'Kanban board view with task details'
          },
          {
            type: 'image',
            url: '/uploads/projects/taskmanager-screenshot-2.jpg',
            caption: 'Analytics dashboard showing team performance'
          }
        ]),
        meta_title: 'Task Management Dashboard | React & GraphQL Project',
        meta_description: 'A modern task management solution with kanban boards, real-time updates, and performance analytics built with React, GraphQL, and PostgreSQL.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: adminId,
        title: 'Weather Forecast Application',
        slug: 'weather-forecast-app',
        summary: 'A mobile-first weather application with location-based forecasts and visual data representation',
        description: `
          <p>This weather forecast application provides users with accurate, location-based weather information and visualizations. It features current conditions, hourly forecasts, 7-day predictions, and interactive weather maps.</p>
          
          <h3>Key Features:</h3>
          <ul>
            <li>Geolocation-based weather forecasts</li>
            <li>Interactive weather maps with radar data</li>
            <li>Hourly and 7-day forecast predictions</li>
            <li>Weather alerts and notifications</li>
            <li>Customizable location favorites</li>
            <li>Offline capability with cached data</li>
          </ul>
          
          <h3>Technical Highlights:</h3>
          <ul>
            <li>Vue.js 3 with Composition API</li>
            <li>Progressive Web App (PWA) architecture</li>
            <li>Integration with OpenWeatherMap API</li>
            <li>D3.js for data visualizations</li>
            <li>Leaflet.js for interactive maps</li>
            <li>Service workers for offline support</li>
          </ul>
        `,
        thumbnail: '/uploads/projects/weather-thumbnail.jpg',
        banner: '/uploads/projects/weather-banner.jpg',
        website_url: 'https://weather-app.example.com',
        github_url: 'https://github.com/example/weather-forecast',
        status: 'published',
        featured: false,
        project_date: new Date('2023-02-20'),
        project_type: 'Progressive Web App',
        client_name: 'Personal Project',
        technologies: JSON.stringify(['Vue.js', 'PWA', 'OpenWeatherMap API', 'D3.js', 'Leaflet.js', 'Service Workers']),
        media: JSON.stringify([
          {
            type: 'image',
            url: '/uploads/projects/weather-screenshot-1.jpg',
            caption: 'Current weather and hourly forecast view'
          },
          {
            type: 'image',
            url: '/uploads/projects/weather-screenshot-2.jpg',
            caption: 'Interactive map showing precipitation patterns'
          }
        ]),
        meta_title: 'Weather Forecast PWA | Vue.js & D3.js Visualization Project',
        meta_description: 'A progressive web app for weather forecasts with geolocation, interactive maps, and data visualizations built with Vue.js and D3.js.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('projects', projects, {});

    // Add project categories
    const [projectCategories] = await queryInterface.sequelize.query(
      `SELECT id FROM projects WHERE user_id = '${adminId}';`
    );

    if (projectCategories && projectCategories.length > 0) {
      // Create categories first
      await queryInterface.bulkInsert('categories', [
        { name: 'Web Development', slug: 'web-development', created_at: new Date(), updated_at: new Date() },
        { name: 'Mobile Apps', slug: 'mobile-apps', created_at: new Date(), updated_at: new Date() },
        { name: 'UI/UX Design', slug: 'ui-ux-design', created_at: new Date(), updated_at: new Date() },
        { name: 'Frontend', slug: 'frontend', created_at: new Date(), updated_at: new Date() },
        { name: 'Backend', slug: 'backend', created_at: new Date(), updated_at: new Date() }
      ], {});

      // Get category IDs
      const [categories] = await queryInterface.sequelize.query(
        `SELECT id, name FROM categories;`
      );

      // Create project_categories relationships
      if (categories && categories.length > 0) {
        const projectCategoriesRelations = [];
        
        // E-Commerce Platform: Web Development, Frontend, Backend
        const ecommerce = projectCategories.find(p => p.title === 'E-Commerce Platform' || p.slug === 'e-commerce-platform');
        if (ecommerce) {
          ['Web Development', 'Frontend', 'Backend'].forEach(catName => {
            const category = categories.find(c => c.name === catName);
            if (category) {
              projectCategoriesRelations.push({
                project_id: ecommerce.id,
                category_id: category.id,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
          });
        }
        
        // Task Management: Web Development, UI/UX Design, Frontend
        const taskManager = projectCategories.find(p => p.title === 'Task Management Dashboard' || p.slug === 'task-management-dashboard');
        if (taskManager) {
          ['Web Development', 'UI/UX Design', 'Frontend'].forEach(catName => {
            const category = categories.find(c => c.name === catName);
            if (category) {
              projectCategoriesRelations.push({
                project_id: taskManager.id,
                category_id: category.id,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
          });
        }
        
        // Weather App: Web Development, Mobile Apps, Frontend
        const weatherApp = projectCategories.find(p => p.title === 'Weather Forecast Application' || p.slug === 'weather-forecast-app');
        if (weatherApp) {
          ['Web Development', 'Mobile Apps', 'Frontend'].forEach(catName => {
            const category = categories.find(c => c.name === catName);
            if (category) {
              projectCategoriesRelations.push({
                project_id: weatherApp.id,
                category_id: category.id,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
          });
        }
        
        if (projectCategoriesRelations.length > 0) {
          await queryInterface.bulkInsert('project_categories', projectCategoriesRelations, {});
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (adminUser && adminUser.length > 0) {
      const adminId = adminUser[0].id;
      
      // Get projects to delete related records
      const [projects] = await queryInterface.sequelize.query(
        `SELECT id FROM projects WHERE user_id = '${adminId}';`
      );
      
      if (projects && projects.length > 0) {
        // Delete project categories relationships
        for (const project of projects) {
          await queryInterface.bulkDelete('project_categories', { project_id: project.id }, {});
        }
      }
      
      // Delete projects
      await queryInterface.bulkDelete('projects', { user_id: adminId }, {});
    }
    
    // Delete categories (optional, as they might be shared with other users' projects)
    // await queryInterface.bulkDelete('categories', null, {});
  }
}; 