/**
 * Notification fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-c26614174900',
    user_id: '1', // Admin user
    type: 'MESSAGE',
    title: 'New message from client',
    content: 'You have received a new message regarding the e-commerce website project',
    is_read: true,
    entity_type: 'Message',
    entity_id: '2', // ID of the message
    link: '/conversations/1',
    created_at: new Date('2023-01-15T10:05:10'),
    updated_at: new Date('2023-01-15T10:07:30'),
    read_at: new Date('2023-01-15T10:07:30')
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-c26614174901',
    user_id: '3', // Client user
    type: 'MESSAGE',
    title: 'New message from admin',
    content: 'You have received a new message regarding your project',
    is_read: true,
    entity_type: 'Message',
    entity_id: '1', // ID of the message
    link: '/conversations/1',
    created_at: new Date('2023-01-15T10:00:10'),
    updated_at: new Date('2023-01-15T10:03:45'),
    read_at: new Date('2023-01-15T10:03:45')
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-c26614174902',
    user_id: '1', // Admin user
    type: 'PAYMENT',
    title: 'Payment received',
    content: 'You have received a payment of $500.00 for invoice #INV-2023-001',
    is_read: true,
    entity_type: 'Payment',
    entity_id: '1', // ID of the payment
    link: '/invoices/1',
    created_at: new Date('2023-01-10T14:35:22'),
    updated_at: new Date('2023-01-10T15:20:30'),
    read_at: new Date('2023-01-10T15:20:30')
  },
  {
    id: '4',
    uuid: '423e4567-e89b-12d3-a456-c26614174903',
    user_id: '3', // Client user
    type: 'INVOICE',
    title: 'New invoice',
    content: 'You have received a new invoice #INV-2023-002 for $1,200.00',
    is_read: false,
    entity_type: 'Invoice',
    entity_id: '2', // ID of the invoice
    link: '/invoices/2',
    created_at: new Date('2023-02-05T09:15:00'),
    updated_at: new Date('2023-02-05T09:15:00'),
    read_at: null
  },
  {
    id: '5',
    uuid: '523e4567-e89b-12d3-a456-c26614174904',
    user_id: '2', // Regular user
    type: 'TASK',
    title: 'Task assigned',
    content: 'You have been assigned a new task: "Implement product filter component"',
    is_read: true,
    entity_type: 'Task',
    entity_id: '5', // ID of the task
    link: '/tasks/5',
    created_at: new Date('2023-01-21T11:30:00'),
    updated_at: new Date('2023-01-21T13:45:10'),
    read_at: new Date('2023-01-21T13:45:10')
  },
  {
    id: '6',
    uuid: '623e4567-e89b-12d3-a456-c26614174905',
    user_id: '1', // Admin user
    type: 'SYSTEM',
    title: 'Backup completed',
    content: 'Weekly system backup completed successfully',
    is_read: false,
    entity_type: 'System',
    entity_id: null,
    link: '/system/backups',
    created_at: new Date('2023-03-01T02:00:00'),
    updated_at: new Date('2023-03-01T02:00:00'),
    read_at: null
  },
  {
    id: '7',
    uuid: '723e4567-e89b-12d3-a456-c26614174906',
    user_id: '3', // Client user
    type: 'PAYMENT_FAILED',
    title: 'Payment failed',
    content: 'Your payment for invoice #INV-2023-002 failed due to insufficient funds',
    is_read: true,
    entity_type: 'Payment',
    entity_id: '5', // ID of the failed payment
    link: '/invoices/2',
    created_at: new Date('2023-03-15T14:22:35'),
    updated_at: new Date('2023-03-15T14:30:20'),
    read_at: new Date('2023-03-15T14:30:20')
  },
  {
    id: '8',
    uuid: '823e4567-e89b-12d3-a456-c26614174907',
    user_id: '2', // Regular user
    type: 'MESSAGE',
    title: 'New group message',
    content: 'New message in E-commerce Website Discussion group',
    is_read: false,
    entity_type: 'Message',
    entity_id: '3', // ID of the message
    link: '/conversations/2',
    created_at: new Date('2023-01-20T14:00:10'),
    updated_at: new Date('2023-01-20T14:00:10'),
    read_at: null
  }
]; 