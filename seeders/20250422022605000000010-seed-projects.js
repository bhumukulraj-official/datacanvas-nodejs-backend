'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('projects', [
      {
        user_id: 1, // admin_user
        title: 'Cloud-Based Task Management System',
        slug: 'cloud-task-management',
        description: 'A scalable task management application built with microservices architecture. Features include task assignment, deadline tracking, notifications, and reporting dashboards. Deployed on Kubernetes with CI/CD pipeline.',
        thumbnail_url: 'https://example.com/thumbnails/task-management.jpg',
        tags: JSON.stringify(['productivity', 'enterprise', 'microservices', 'cloud']),
        technologies: JSON.stringify(['Node.js', 'React', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes']),
        github_url: 'https://github.com/admin-user/task-management',
        live_url: 'https://taskmanagement.example.com',
        start_date: '2021-02-15',
        end_date: '2021-12-10',
        is_featured: true,
        display_order: 1,
        status: 'completed',
        meta_title: 'Cloud-Based Task Management System - Enterprise Solution',
        meta_description: 'A comprehensive task management solution for enterprises with robust features and scalable architecture.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 1, // admin_user
        title: 'Real-Time Analytics Dashboard',
        slug: 'real-time-analytics',
        description: 'A real-time analytics dashboard that processes and visualizes data streams. Built with Node.js and WebSockets for live updates, with a responsive React frontend. Includes customizable charts and filtering options.',
        thumbnail_url: 'https://example.com/thumbnails/analytics-dashboard.jpg',
        tags: JSON.stringify(['analytics', 'real-time', 'dashboard', 'data-visualization']),
        technologies: JSON.stringify(['Node.js', 'WebSockets', 'React', 'D3.js', 'Redis', 'InfluxDB']),
        github_url: 'https://github.com/admin-user/analytics-dashboard',
        live_url: 'https://analytics.example.com',
        start_date: '2020-07-10',
        end_date: '2021-01-25',
        is_featured: true,
        display_order: 2,
        status: 'completed',
        meta_title: 'Real-Time Analytics Dashboard for Data Visualization',
        meta_description: 'Interactive dashboard for visualizing real-time data streams with customizable charts and filters.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 3, // writer_one
        title: 'E-Commerce Platform with Content Management',
        slug: 'ecommerce-cms-platform',
        description: 'A full-featured e-commerce platform with integrated content management system. Includes product catalog, shopping cart, secure checkout, and blog functionality. Optimized for SEO and performance.',
        thumbnail_url: 'https://example.com/thumbnails/ecommerce-cms.jpg',
        tags: JSON.stringify(['e-commerce', 'cms', 'online-store', 'content-management']),
        technologies: JSON.stringify(['React', 'Node.js', 'MongoDB', 'Redux', 'Stripe', 'AWS S3']),
        github_url: 'https://github.com/writer-one/ecommerce-cms',
        live_url: 'https://ecommerce-demo.example.com',
        start_date: '2021-01-05',
        end_date: '2021-07-20',
        is_featured: true,
        display_order: 1,
        status: 'completed',
        meta_title: 'E-Commerce Platform with Integrated CMS',
        meta_description: 'Comprehensive e-commerce solution with integrated content management for small businesses.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 4, // regular_user
        title: 'Accessible UI Component Library',
        slug: 'accessible-ui-components',
        description: 'A library of accessible, reusable UI components designed according to WCAG standards. Includes form elements, navigation components, modals, and more. Thoroughly tested with screen readers and keyboard navigation.',
        thumbnail_url: 'https://example.com/thumbnails/ui-library.jpg',
        tags: JSON.stringify(['accessibility', 'ui-components', 'design-system', 'wcag']),
        technologies: JSON.stringify(['React', 'TypeScript', 'Storybook', 'Jest', 'Sass']),
        github_url: 'https://github.com/regular-user/accessible-ui',
        live_url: 'https://accessible-ui.example.com',
        start_date: '2021-03-10',
        end_date: '2021-09-15',
        is_featured: true,
        display_order: 1,
        status: 'completed',
        meta_title: 'Accessible UI Component Library for Web Applications',
        meta_description: 'WCAG-compliant UI components library designed for maximum accessibility and ease of use.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 5, // content_creator
        title: 'Multimedia Content Platform',
        slug: 'multimedia-content-platform',
        description: 'A platform for creating and sharing multimedia content including articles, videos, and podcasts. Features include content scheduling, analytics, and audience engagement tools.',
        thumbnail_url: 'https://example.com/thumbnails/content-platform.jpg',
        tags: JSON.stringify(['content-creation', 'multimedia', 'publishing', 'social-media']),
        technologies: JSON.stringify(['WordPress', 'PHP', 'MySQL', 'React', 'AWS']),
        github_url: null,
        live_url: 'https://contentplatform.example.com',
        start_date: '2020-11-01',
        end_date: '2021-05-30',
        is_featured: true,
        display_order: 1,
        status: 'completed',
        meta_title: 'Multimedia Content Platform for Creators',
        meta_description: 'Comprehensive platform for creating and distributing multimedia content with audience engagement tools.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 2, // editor_main
        title: 'Technical Documentation System',
        slug: 'technical-documentation-system',
        description: 'A system for creating, managing, and publishing technical documentation. Features include version control, collaboration tools, and support for multiple output formats (PDF, web, ePub).',
        thumbnail_url: 'https://example.com/thumbnails/documentation-system.jpg',
        tags: JSON.stringify(['documentation', 'technical-writing', 'collaboration', 'publishing']),
        technologies: JSON.stringify(['Markdown', 'Git', 'AsciiDoc', 'React', 'Node.js']),
        github_url: 'https://github.com/editor-main/documentation-system',
        live_url: 'https://docs-system.example.com',
        start_date: '2021-04-15',
        end_date: null,
        is_featured: true,
        display_order: 1,
        status: 'in_progress',
        meta_title: 'Technical Documentation System for Development Teams',
        meta_description: 'Comprehensive system for creating and managing technical documentation with collaboration features.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 3, // writer_one
        title: 'Mobile Fitness Application',
        slug: 'mobile-fitness-app',
        description: 'A fitness tracking application for mobile devices. Features include workout plans, progress tracking, nutrition logging, and social sharing functionality.',
        thumbnail_url: 'https://example.com/thumbnails/fitness-app.jpg',
        tags: JSON.stringify(['fitness', 'mobile-app', 'health', 'tracking']),
        technologies: JSON.stringify(['React Native', 'Firebase', 'Node.js', 'Express', 'MongoDB']),
        github_url: 'https://github.com/writer-one/fitness-app',
        live_url: null,
        start_date: '2021-06-01',
        end_date: null,
        is_featured: false,
        display_order: 2,
        status: 'in_progress',
        meta_title: 'Mobile Fitness Application for Health Tracking',
        meta_description: 'Comprehensive fitness tracking app with workout plans, nutrition logging, and progress visualization.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 1, // admin_user
        title: 'Legacy Inventory Management System',
        slug: 'legacy-inventory-system',
        description: 'An inventory management system built for a retail client. Features include stock tracking, order management, and reporting. This project has been replaced by a newer system.',
        thumbnail_url: 'https://example.com/thumbnails/inventory-system.jpg',
        tags: JSON.stringify(['inventory', 'retail', 'management', 'legacy']),
        technologies: JSON.stringify(['PHP', 'MySQL', 'jQuery', 'Bootstrap']),
        github_url: 'https://github.com/admin-user/inventory-system',
        live_url: null,
        start_date: '2018-09-15',
        end_date: '2019-03-30',
        is_featured: false,
        display_order: 5,
        status: 'archived',
        meta_title: 'Retail Inventory Management System',
        meta_description: 'Comprehensive inventory tracking and management system for retail businesses.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('projects', null, {});
  }
}; 