/**
 * Conversation fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-b26614174000',
    title: null, // Direct message doesn't need title
    project_id: null, // Not related to a project
    created_at: new Date('2023-01-15'),
    updated_at: new Date('2023-03-20'),
    last_message_id: '5', // Latest message in this conversation
    is_group: false,
    participants: [
      {
        user_id: '1', // Admin user
        joined_at: new Date('2023-01-15'),
        last_read_message_id: '5',
        is_muted: false
      },
      {
        user_id: '3', // Client user
        joined_at: new Date('2023-01-15'),
        last_read_message_id: '4',
        is_muted: false
      }
    ]
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-b26614174001',
    title: 'E-commerce Website Discussion',
    project_id: '1', // E-commerce Website
    created_at: new Date('2023-01-20'),
    updated_at: new Date('2023-01-25'),
    last_message_id: '3', // Latest message in this conversation
    is_group: true,
    participants: [
      {
        user_id: '1', // Admin user
        joined_at: new Date('2023-01-20'),
        last_read_message_id: '3',
        is_muted: false
      },
      {
        user_id: '2', // Regular user
        joined_at: new Date('2023-01-20'),
        last_read_message_id: '3',
        is_muted: false
      },
      {
        user_id: '3', // Client user
        joined_at: new Date('2023-01-20'),
        last_read_message_id: '2',
        is_muted: true
      }
    ]
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-b26614174002',
    title: null, // Direct message doesn't need title
    project_id: null, // Not related to a project
    created_at: new Date('2023-02-10'),
    updated_at: new Date('2023-02-10'),
    last_message_id: '6', // Latest message in this conversation
    is_group: false,
    participants: [
      {
        user_id: '1', // Admin user
        joined_at: new Date('2023-02-10'),
        last_read_message_id: '6',
        is_muted: false
      },
      {
        user_id: '2', // Regular user
        joined_at: new Date('2023-02-10'),
        last_read_message_id: '6',
        is_muted: false
      }
    ]
  },
  {
    id: '4',
    uuid: '423e4567-e89b-12d3-a456-b26614174003',
    title: 'Mobile Banking App Discussion',
    project_id: '2', // Mobile Banking App
    created_at: new Date('2023-03-05'),
    updated_at: new Date('2023-03-05'),
    last_message_id: null, // No messages yet
    is_group: true,
    participants: [
      {
        user_id: '1', // Admin user
        joined_at: new Date('2023-03-05'),
        last_read_message_id: null,
        is_muted: false
      },
      {
        user_id: '3', // Client user
        joined_at: new Date('2023-03-05'),
        last_read_message_id: null,
        is_muted: false
      }
    ]
  }
]; 