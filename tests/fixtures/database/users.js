/**
 * User fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@example.com',
    password_hash: '$2a$10$PrPd41n9sHM7h4JefeHk/OYA17DQxgC0vj9jMp/Hh/y7.jvNwQQOK', // hashed 'Password123!'
    name: 'Admin User',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    is_active: true,
    is_verified: true,
    role_id: '1' // Admin role
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-426614174001',
    email: 'user@example.com',
    password_hash: '$2a$10$PrPd41n9sHM7h4JefeHk/OYA17DQxgC0vj9jMp/Hh/y7.jvNwQQOK', // hashed 'Password123!'
    name: 'Regular User',
    created_at: new Date('2023-01-02'),
    updated_at: new Date('2023-01-02'),
    is_active: true,
    is_verified: true,
    role_id: '2' // User role
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-426614174002',
    email: 'client@example.com',
    password_hash: '$2a$10$PrPd41n9sHM7h4JefeHk/OYA17DQxgC0vj9jMp/Hh/y7.jvNwQQOK', // hashed 'Password123!'
    name: 'Client User',
    created_at: new Date('2023-01-03'),
    updated_at: new Date('2023-01-03'),
    is_active: true,
    is_verified: true,
    role_id: '3' // Client role
  },
  {
    id: '4',
    uuid: '423e4567-e89b-12d3-a456-426614174003',
    email: 'unverified@example.com',
    password_hash: '$2a$10$PrPd41n9sHM7h4JefeHk/OYA17DQxgC0vj9jMp/Hh/y7.jvNwQQOK', // hashed 'Password123!'
    name: 'Unverified User',
    created_at: new Date('2023-01-04'),
    updated_at: new Date('2023-01-04'),
    is_active: true,
    is_verified: false,
    role_id: '2' // User role
  },
  {
    id: '5',
    uuid: '523e4567-e89b-12d3-a456-426614174004',
    email: 'inactive@example.com',
    password_hash: '$2a$10$PrPd41n9sHM7h4JefeHk/OYA17DQxgC0vj9jMp/Hh/y7.jvNwQQOK', // hashed 'Password123!'
    name: 'Inactive User',
    created_at: new Date('2023-01-05'),
    updated_at: new Date('2023-01-05'),
    is_active: false,
    is_verified: true,
    role_id: '2' // User role
  }
]; 