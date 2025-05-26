/**
 * Project fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-626614174000',
    title: 'E-commerce Website',
    description: 'Modern e-commerce platform with advanced features',
    status_code: 'published',
    owner_id: '1', // Admin user
    is_featured: true,
    slug: 'e-commerce-website',
    created_at: new Date('2023-01-10'),
    updated_at: new Date('2023-01-15'),
    completion_percentage: 100,
    start_date: new Date('2023-01-01'),
    end_date: new Date('2023-03-01'),
    client_visible: true
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-626614174001',
    title: 'Mobile Banking App',
    description: 'Secure mobile banking application with biometric authentication',
    status_code: 'published',
    owner_id: '1', // Admin user
    is_featured: true,
    slug: 'mobile-banking-app',
    created_at: new Date('2023-02-10'),
    updated_at: new Date('2023-02-15'),
    completion_percentage: 85,
    start_date: new Date('2023-02-01'),
    end_date: new Date('2023-05-01'),
    client_visible: true
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-626614174002',
    title: 'Content Management System',
    description: 'Custom CMS for managing digital content',
    status_code: 'draft',
    owner_id: '2', // Regular user
    is_featured: false,
    slug: 'content-management-system',
    created_at: new Date('2023-03-10'),
    updated_at: new Date('2023-03-15'),
    completion_percentage: 50,
    start_date: new Date('2023-03-01'),
    end_date: null,
    client_visible: false
  },
  {
    id: '4',
    uuid: '423e4567-e89b-12d3-a456-626614174003',
    title: 'Portfolio Website',
    description: 'Personal portfolio website for showcasing projects',
    status_code: 'archived',
    owner_id: '2', // Regular user
    is_featured: false,
    slug: 'portfolio-website',
    created_at: new Date('2022-12-10'),
    updated_at: new Date('2023-01-05'),
    completion_percentage: 100,
    start_date: new Date('2022-12-01'),
    end_date: new Date('2023-01-01'),
    client_visible: true
  },
  {
    id: '5',
    uuid: '523e4567-e89b-12d3-a456-626614174004',
    title: 'Inventory Management System',
    description: 'Real-time inventory tracking and management system',
    status_code: 'published',
    owner_id: '1', // Admin user
    is_featured: false,
    slug: 'inventory-management-system',
    created_at: new Date('2023-04-10'),
    updated_at: new Date('2023-04-15'),
    completion_percentage: 30,
    start_date: new Date('2023-04-01'),
    end_date: null,
    client_visible: true
  }
]; 