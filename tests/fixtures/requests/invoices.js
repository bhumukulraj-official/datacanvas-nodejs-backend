/**
 * Invoice request fixtures for testing
 */
module.exports = {
  // Create invoice requests
  create: {
    valid: {
      client_id: '3', // Client user ID
      project_id: '1', // E-commerce website project
      invoice_number: 'INV-2023-005',
      amount: 2500.00,
      tax: 250.00,
      issue_date: '2023-05-01',
      due_date: '2023-05-15',
      notes: 'Payment for e-commerce website development work - May 2023',
      items: [
        {
          description: 'Frontend development',
          quantity: 40,
          rate: 50.00,
          amount: 2000.00
        },
        {
          description: 'SEO optimization',
          quantity: 5,
          rate: 100.00,
          amount: 500.00
        }
      ]
    },
    missingClient: {
      project_id: '1',
      invoice_number: 'INV-2023-005',
      amount: 2500.00,
      tax: 250.00,
      issue_date: '2023-05-01',
      due_date: '2023-05-15',
      notes: 'Payment for e-commerce website development work - May 2023',
      items: [
        {
          description: 'Frontend development',
          quantity: 40,
          rate: 50.00,
          amount: 2000.00
        },
        {
          description: 'SEO optimization',
          quantity: 5,
          rate: 100.00,
          amount: 500.00
        }
      ]
    },
    invalidDates: {
      client_id: '3',
      project_id: '1',
      invoice_number: 'INV-2023-005',
      amount: 2500.00,
      tax: 250.00,
      issue_date: '2023-05-20', // Issue date after due date
      due_date: '2023-05-15',
      notes: 'Payment for e-commerce website development work - May 2023',
      items: [
        {
          description: 'Frontend development',
          quantity: 40,
          rate: 50.00,
          amount: 2000.00
        }
      ]
    },
    itemAmountMismatch: {
      client_id: '3',
      project_id: '1',
      invoice_number: 'INV-2023-005',
      amount: 2500.00, // Total doesn't match item amounts
      tax: 250.00,
      issue_date: '2023-05-01',
      due_date: '2023-05-15',
      notes: 'Payment for e-commerce website development work - May 2023',
      items: [
        {
          description: 'Frontend development',
          quantity: 40,
          rate: 50.00,
          amount: 1500.00 // Should be 2000.00
        },
        {
          description: 'SEO optimization',
          quantity: 5,
          rate: 100.00,
          amount: 500.00
        }
      ]
    },
    duplicateInvoiceNumber: {
      client_id: '3',
      project_id: '1',
      invoice_number: 'INV-2023-001', // Already exists
      amount: 2500.00,
      tax: 250.00,
      issue_date: '2023-05-01',
      due_date: '2023-05-15',
      notes: 'Payment for e-commerce website development work - May 2023',
      items: [
        {
          description: 'Frontend development',
          quantity: 40,
          rate: 50.00,
          amount: 2000.00
        }
      ]
    }
  },

  // Update invoice requests
  update: {
    valid: {
      id: '2', // Sent invoice ID
      status_code: 'PAID',
      paid_date: '2023-05-10',
      notes: 'Invoice paid in full on May 10, 2023'
    },
    invalidStatus: {
      id: '2',
      status_code: 'INVALID_STATUS', // Invalid status
      paid_date: '2023-05-10'
    },
    invalidTransition: {
      id: '5', // Cancelled invoice ID
      status_code: 'PAID', // Cannot transition from CANCELLED to PAID
      paid_date: '2023-05-10'
    },
    inconsistentPaidDate: {
      id: '2',
      status_code: 'PAID',
      paid_date: null // Paid status should have a paid date
    }
  },

  // Send invoice requests
  send: {
    valid: {
      id: '3', // Draft invoice ID
      recipient_email: 'client@example.com',
      subject: 'Invoice for Inventory Management System',
      message: 'Please find attached the invoice for our work on the inventory management system. Payment is due by June 15, 2023.'
    },
    alreadySent: {
      id: '2', // Already sent invoice
      recipient_email: 'client@example.com',
      subject: 'Invoice for Mobile Banking App',
      message: 'Please find attached the invoice for our work on the mobile banking app.'
    },
    invalidEmail: {
      id: '3',
      recipient_email: 'not-an-email',
      subject: 'Invoice for Inventory Management System',
      message: 'Please find attached the invoice for our work.'
    }
  },

  // Invoice query parameters
  query: {
    allInvoices: {},
    filterByClient: {
      client_id: '3' // Client user ID
    },
    filterByProject: {
      project_id: '1' // E-commerce website project
    },
    filterByStatus: {
      status_code: 'SENT'
    },
    filterByDateRange: {
      start_date: '2023-01-01',
      end_date: '2023-06-30'
    },
    pagination: {
      page: 1,
      limit: 10
    },
    sorting: {
      sort_by: 'due_date',
      sort_direction: 'asc'
    },
    complexFilter: {
      client_id: '3',
      status_code: 'OVERDUE',
      start_date: '2023-01-01',
      end_date: '2023-12-31',
      page: 1,
      limit: 25,
      sort_by: 'amount',
      sort_direction: 'desc'
    }
  }
}; 