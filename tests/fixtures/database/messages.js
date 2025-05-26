/**
 * Message fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-c26614174000',
    conversation_id: '1', // Admin-Client direct conversation
    sender_id: '1', // Admin user
    content: 'Hello! How can I assist you with your project today?',
    created_at: new Date('2023-01-15T10:00:00'),
    updated_at: new Date('2023-01-15T10:00:00'),
    is_read: true,
    is_deleted: false,
    has_attachments: false
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-c26614174001',
    conversation_id: '1', // Admin-Client direct conversation
    sender_id: '3', // Client user
    content: 'Hi, I wanted to discuss some changes to the e-commerce website project.',
    created_at: new Date('2023-01-15T10:05:00'),
    updated_at: new Date('2023-01-15T10:05:00'),
    is_read: true,
    is_deleted: false,
    has_attachments: false
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-c26614174002',
    conversation_id: '2', // E-commerce Website group
    sender_id: '1', // Admin user
    content: 'Team, I\'ve created this group to discuss the e-commerce website project. Let\'s coordinate our efforts here.',
    created_at: new Date('2023-01-20T14:00:00'),
    updated_at: new Date('2023-01-20T14:00:00'),
    is_read: true,
    is_deleted: false,
    has_attachments: false
  },
  {
    id: '4',
    uuid: '423e4567-e89b-12d3-a456-c26614174003',
    conversation_id: '1', // Admin-Client direct conversation
    sender_id: '1', // Admin user
    content: 'Sure, what specific changes did you have in mind?',
    created_at: new Date('2023-01-15T10:10:00'),
    updated_at: new Date('2023-01-15T10:10:00'),
    is_read: true,
    is_deleted: false,
    has_attachments: false
  },
  {
    id: '5',
    uuid: '523e4567-e89b-12d3-a456-c26614174004',
    conversation_id: '1', // Admin-Client direct conversation
    sender_id: '3', // Client user
    content: 'I\'d like to add a new feature for product recommendations. Can we schedule a call to discuss this in detail?',
    created_at: new Date('2023-03-20T09:30:00'),
    updated_at: new Date('2023-03-20T09:30:00'),
    is_read: true, // Read by admin
    is_deleted: false,
    has_attachments: false
  },
  {
    id: '6',
    uuid: '623e4567-e89b-12d3-a456-c26614174005',
    conversation_id: '3', // Admin-Regular User direct conversation
    sender_id: '2', // Regular user
    content: 'Hi, I\'ve finished the initial design for the CMS project. Do you have time to review it?',
    created_at: new Date('2023-02-10T16:45:00'),
    updated_at: new Date('2023-02-10T16:45:00'),
    is_read: true,
    is_deleted: false,
    has_attachments: true // Has an attachment
  },
  {
    id: '7',
    uuid: '723e4567-e89b-12d3-a456-c26614174006',
    conversation_id: '2', // E-commerce Website group
    sender_id: '2', // Regular user
    content: 'I\'ve pushed the latest UI changes to the repository. Please check and provide feedback.',
    created_at: new Date('2023-01-22T11:20:00'),
    updated_at: new Date('2023-01-22T11:20:00'),
    is_read: false, // Unread by client
    is_deleted: false,
    has_attachments: false
  },
  {
    id: '8',
    uuid: '823e4567-e89b-12d3-a456-c26614174007',
    conversation_id: '2', // E-commerce Website group
    sender_id: '3', // Client user
    content: 'The new product catalog looks great! Just a few minor tweaks needed on the category filters.',
    created_at: new Date('2023-01-23T09:15:00'),
    updated_at: new Date('2023-01-23T09:15:00'),
    is_read: true,
    is_deleted: false,
    has_attachments: false
  }
]; 