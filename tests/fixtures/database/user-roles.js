/**
 * User role fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-526614174000',
    name: 'admin',
    description: 'Administrator with full access',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    is_active: true
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-526614174001',
    name: 'user',
    description: 'Regular user with standard permissions',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    is_active: true
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-526614174002',
    name: 'client',
    description: 'Client with limited access',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    is_active: true
  },
  {
    id: '4',
    uuid: '423e4567-e89b-12d3-a456-526614174003',
    name: 'guest',
    description: 'Guest with view-only access',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    is_active: true
  },
  {
    id: '5',
    uuid: '523e4567-e89b-12d3-a456-526614174004',
    name: 'deprecated_role',
    description: 'Deprecated role for testing',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    is_active: false
  }
]; 