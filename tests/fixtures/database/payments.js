/**
 * Payment fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-a26614174000',
    invoice_id: '1', // Paid invoice for E-commerce Website
    amount: 5250.00, // Invoice amount + tax
    payment_method: 'credit_card',
    transaction_id: 'txn_123456789abcdef',
    status: 'completed',
    payment_date: new Date('2023-01-25'),
    notes: 'Payment completed via Stripe',
    created_at: new Date('2023-01-25'),
    updated_at: new Date('2023-01-25'),
    payer_id: '3', // Client user
    provider_response: JSON.stringify({
      id: 'ch_123456789abcdef',
      status: 'succeeded',
      card: {
        brand: 'visa',
        last4: '4242'
      }
    })
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-a26614174001',
    invoice_id: '4', // Overdue invoice for Portfolio Website
    amount: 500.00, // Partial payment
    payment_method: 'bank_transfer',
    transaction_id: 'txn_2345678abcdefg',
    status: 'completed',
    payment_date: new Date('2023-01-10'),
    notes: 'Partial payment received',
    created_at: new Date('2023-01-10'),
    updated_at: new Date('2023-01-10'),
    payer_id: '3', // Client user
    provider_response: null
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-a26614174002',
    invoice_id: '2', // Sent invoice for Mobile Banking App
    amount: 7875.00, // Invoice amount + tax
    payment_method: 'credit_card',
    transaction_id: 'txn_3456789abcdefgh',
    status: 'pending',
    payment_date: null,
    notes: 'Payment initiated but not yet confirmed',
    created_at: new Date('2023-03-20'),
    updated_at: new Date('2023-03-20'),
    payer_id: '3', // Client user
    provider_response: JSON.stringify({
      id: 'ch_3456789abcdefgh',
      status: 'pending',
      card: {
        brand: 'mastercard',
        last4: '5678'
      }
    })
  },
  {
    id: '4',
    uuid: '423e4567-e89b-12d3-a456-a26614174003',
    invoice_id: '4', // Overdue invoice for Portfolio Website
    amount: 200.00, // Another partial payment
    payment_method: 'paypal',
    transaction_id: 'txn_4567890abcdefghi',
    status: 'completed',
    payment_date: new Date('2023-01-20'),
    notes: 'Additional partial payment received via PayPal',
    created_at: new Date('2023-01-20'),
    updated_at: new Date('2023-01-20'),
    payer_id: '3', // Client user
    provider_response: JSON.stringify({
      id: 'PAY-4567890abcdefghi',
      status: 'COMPLETED',
      payer: {
        email: 'client@example.com'
      }
    })
  },
  {
    id: '5',
    uuid: '523e4567-e89b-12d3-a456-a26614174004',
    invoice_id: '2', // Sent invoice for Mobile Banking App
    amount: 7875.00, // Invoice amount + tax
    payment_method: 'credit_card',
    transaction_id: 'txn_5678901abcdefghij',
    status: 'failed',
    payment_date: null,
    notes: 'Payment failed due to insufficient funds',
    created_at: new Date('2023-03-18'),
    updated_at: new Date('2023-03-18'),
    payer_id: '3', // Client user
    provider_response: JSON.stringify({
      id: 'ch_5678901abcdefghij',
      status: 'failed',
      error: {
        code: 'insufficient_funds',
        message: 'Your card has insufficient funds.'
      }
    })
  }
]; 