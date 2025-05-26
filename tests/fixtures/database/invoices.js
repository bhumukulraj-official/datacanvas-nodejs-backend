/**
 * Invoice fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-926614174000',
    invoice_number: 'INV-2023-001',
    client_id: '3', // Client user
    project_id: '1', // E-commerce Website
    amount: 5000.00,
    tax: 250.00,
    status_code: 'paid',
    issue_date: new Date('2023-01-15'),
    due_date: new Date('2023-01-30'),
    paid_date: new Date('2023-01-25'),
    notes: 'Final payment for e-commerce website development',
    created_at: new Date('2023-01-15'),
    updated_at: new Date('2023-01-25')
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-926614174001',
    invoice_number: 'INV-2023-002',
    client_id: '3', // Client user
    project_id: '2', // Mobile Banking App
    amount: 7500.00,
    tax: 375.00,
    status_code: 'sent',
    issue_date: new Date('2023-03-15'),
    due_date: new Date('2023-03-30'),
    paid_date: null,
    notes: 'First milestone payment for mobile banking app',
    created_at: new Date('2023-03-15'),
    updated_at: new Date('2023-03-15')
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-926614174002',
    invoice_number: 'INV-2023-003',
    client_id: '3', // Client user
    project_id: '5', // Inventory Management System
    amount: 3000.00,
    tax: 150.00,
    status_code: 'draft',
    issue_date: null,
    due_date: null,
    paid_date: null,
    notes: 'Initial payment for inventory system requirements analysis',
    created_at: new Date('2023-04-10'),
    updated_at: new Date('2023-04-10')
  },
  {
    id: '4',
    uuid: '423e4567-e89b-12d3-a456-926614174003',
    invoice_number: 'INV-2022-012',
    client_id: '3', // Client user
    project_id: '4', // Portfolio Website
    amount: 1200.00,
    tax: 60.00,
    status_code: 'overdue',
    issue_date: new Date('2022-12-15'),
    due_date: new Date('2022-12-30'),
    paid_date: null,
    notes: 'Final payment for portfolio website',
    created_at: new Date('2022-12-15'),
    updated_at: new Date('2023-01-05')
  },
  {
    id: '5',
    uuid: '523e4567-e89b-12d3-a456-926614174004',
    invoice_number: 'INV-2023-004',
    client_id: '3', // Client user
    project_id: '2', // Mobile Banking App
    amount: 8000.00,
    tax: 400.00,
    status_code: 'cancelled',
    issue_date: new Date('2023-02-15'),
    due_date: new Date('2023-03-01'),
    paid_date: null,
    notes: 'Invoice cancelled and replaced with INV-2023-002',
    created_at: new Date('2023-02-15'),
    updated_at: new Date('2023-02-20')
  }
]; 