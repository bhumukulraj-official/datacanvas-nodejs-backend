/**
 * Project update fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-726614174000',
    project_id: '1', // E-commerce Website
    title: 'Initial Design Completed',
    content: 'Completed the initial design phase including wireframes and mockups. Client has approved the design direction.',
    author_id: '1', // Admin user
    created_at: new Date('2023-01-05'),
    updated_at: new Date('2023-01-05'),
    is_notified: true
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-726614174001',
    project_id: '1', // E-commerce Website
    title: 'Backend Development Complete',
    content: 'Finished implementing all backend services including payment processing, user authentication, and product management.',
    author_id: '1', // Admin user
    created_at: new Date('2023-02-10'),
    updated_at: new Date('2023-02-10'),
    is_notified: true
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-726614174002',
    project_id: '1', // E-commerce Website
    title: 'Project Completed',
    content: 'All development work has been completed and the site has been deployed to production. Final walkthrough with client scheduled for next week.',
    author_id: '1', // Admin user
    created_at: new Date('2023-03-01'),
    updated_at: new Date('2023-03-01'),
    is_notified: true
  },
  {
    id: '4',
    uuid: '423e4567-e89b-12d3-a456-726614174003',
    project_id: '2', // Mobile Banking App
    title: 'Security Audit Completed',
    content: 'Third-party security audit has been completed with no critical issues found. Minor recommendations have been implemented.',
    author_id: '1', // Admin user
    created_at: new Date('2023-02-20'),
    updated_at: new Date('2023-02-20'),
    is_notified: true
  },
  {
    id: '5',
    uuid: '523e4567-e89b-12d3-a456-726614174004',
    project_id: '2', // Mobile Banking App
    title: 'Beta Testing Started',
    content: 'Beta testing has begun with a small group of users. Initial feedback is positive with some minor UI improvements suggested.',
    author_id: '1', // Admin user
    created_at: new Date('2023-03-15'),
    updated_at: new Date('2023-03-15'),
    is_notified: true
  },
  {
    id: '6',
    uuid: '623e4567-e89b-12d3-a456-726614174005',
    project_id: '3', // Content Management System
    title: 'Initial Framework Setup',
    content: 'Basic application framework has been set up and the development environment is configured.',
    author_id: '2', // Regular user
    created_at: new Date('2023-03-12'),
    updated_at: new Date('2023-03-12'),
    is_notified: false
  },
  {
    id: '7',
    uuid: '723e4567-e89b-12d3-a456-726614174006',
    project_id: '5', // Inventory Management System
    title: 'Requirements Gathering',
    content: 'Completed initial requirements gathering sessions with stakeholders. Detailed specifications document has been created.',
    author_id: '1', // Admin user
    created_at: new Date('2023-04-05'),
    updated_at: new Date('2023-04-05'),
    is_notified: true
  }
]; 