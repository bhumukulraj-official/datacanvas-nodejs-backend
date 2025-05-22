'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Insert invoice templates
      await queryInterface.sequelize.query(`
        INSERT INTO billing.invoice_templates (
          name, content, is_default, template_type, variables, styles, footer
        )
        VALUES
          (
            'Standard Invoice', 
            '<div class="invoice">
              <div class="header">
                <h1>INVOICE</h1>
                <div class="invoice-id">{{invoice_number}}</div>
              </div>
              <div class="info">
                <div class="company">
                  <h2>{{company_name}}</h2>
                  <p>{{company_address}}</p>
                  <p>{{company_phone}}</p>
                  <p>{{company_email}}</p>
                </div>
                <div class="client">
                  <h3>Bill To:</h3>
                  <p>{{client_name}}</p>
                  <p>{{client_address}}</p>
                  <p>{{client_email}}</p>
                </div>
                <div class="dates">
                  <p><strong>Issue Date:</strong> {{issue_date}}</p>
                  <p><strong>Due Date:</strong> {{due_date}}</p>
                </div>
              </div>
              <table class="items">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each items}}
                  <tr>
                    <td>{{description}}</td>
                    <td>{{quantity}}</td>
                    <td>{{unit_price}}</td>
                    <td>{{amount}}</td>
                  </tr>
                  {{/each}}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3">Subtotal</td>
                    <td>{{subtotal}}</td>
                  </tr>
                  <tr>
                    <td colspan="3">Tax ({{tax_rate}}%)</td>
                    <td>{{tax_amount}}</td>
                  </tr>
                  <tr class="total">
                    <td colspan="3">Total</td>
                    <td>{{total}}</td>
                  </tr>
                </tfoot>
              </table>
              <div class="notes">
                <h3>Notes</h3>
                <p>{{notes}}</p>
              </div>
              <div class="payment">
                <h3>Payment Details</h3>
                <p>{{payment_details}}</p>
              </div>
            </div>',
            true,
            'html',
            '{"company_name":"Portfolio Backend Inc","company_address":"123 Main St, Suite 100, San Francisco, CA 94105","company_phone":"+1 (555) 123-4567","company_email":"billing@portfoliobackend.com","tax_rate":"8.5","payment_details":"Please make payment within 30 days."}',
            'body { font-family: Arial, sans-serif; color: #333; line-height: 1.5; }
            .invoice { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .header h1 { color: #2c3e50; margin: 0; }
            .invoice-id { font-size: 1.5em; font-weight: bold; color: #3498db; }
            .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items th, .items td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .items th { background-color: #f8f8f8; }
            .total td { font-weight: bold; font-size: 1.1em; }
            .notes, .payment { margin-bottom: 20px; }',
            'This invoice was created automatically. Please contact us if you have any questions.'
          ),
          (
            'Minimal Invoice', 
            '<div class="invoice-minimal">
              <div class="header">
                <div class="logo">{{company_name}}</div>
                <div class="invoice-label">INVOICE #{{invoice_number}}</div>
              </div>
              <div class="billing-info">
                <div>
                  <strong>Billed To:</strong>
                  <div>{{client_name}}</div>
                  <div>{{client_email}}</div>
                </div>
                <div>
                  <strong>Date:</strong> {{issue_date}}<br>
                  <strong>Due:</strong> {{due_date}}
                </div>
              </div>
              <table class="line-items">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each items}}
                  <tr>
                    <td>{{description}}</td>
                    <td>{{amount}}</td>
                  </tr>
                  {{/each}}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td>{{total}}</td>
                  </tr>
                </tfoot>
              </table>
              <div class="thank-you">
                Thank you for your business!
              </div>
            </div>',
            false,
            'html',
            '{"company_name":"Portfolio Backend Inc"}',
            'body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #333; line-height: 1.4; }
            .invoice-minimal { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #000; }
            .invoice-label { font-size: 20px; color: #888; }
            .billing-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .line-items { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .line-items th, .line-items td { padding: 12px 0; text-align: left; border-bottom: 1px solid #eee; }
            .line-items tfoot td { font-weight: bold; border-top: 2px solid #000; border-bottom: none; padding-top: 20px; }
            .thank-you { text-align: center; font-size: 18px; color: #888; }',
            'Payment due within 30 days. Late payments subject to a 1.5% monthly fee.'
          ),
          (
            'Detailed Invoice', 
            '<div class="detailed-invoice">
              <!-- This would be a very detailed invoice template with additional sections -->
              <!-- Header with company logo and information -->
              <header>
                <div class="company-info">
                  <img src="{{company_logo}}" alt="{{company_name}}" />
                  <div>
                    <h1>{{company_name}}</h1>
                    <p>{{company_address}}</p>
                    <p>{{company_phone}} | {{company_email}}</p>
                    <p>{{company_website}}</p>
                  </div>
                </div>
                <div class="document-info">
                  <h1>INVOICE</h1>
                  <table>
                    <tr><th>Invoice #:</th><td>{{invoice_number}}</td></tr>
                    <tr><th>Issue Date:</th><td>{{issue_date}}</td></tr>
                    <tr><th>Due Date:</th><td>{{due_date}}</td></tr>
                    <tr><th>Status:</th><td>{{status}}</td></tr>
                    <tr><th>Project:</th><td>{{project_name}}</td></tr>
                  </table>
                </div>
              </header>
              
              <!-- Client information -->
              <section class="client-info">
                <h2>Bill To:</h2>
                <div>
                  <p><strong>{{client_name}}</strong></p>
                  <p>{{client_company}}</p>
                  <p>{{client_address}}</p>
                  <p>{{client_email}}</p>
                  <p>{{client_phone}}</p>
                </div>
              </section>
              
              <!-- Itemized charges -->
              <section class="items">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {{#each items}}
                    <tr>
                      <td>{{name}}</td>
                      <td>{{description}}</td>
                      <td>{{quantity}}</td>
                      <td>{{unit_price}}</td>
                      <td>{{amount}}</td>
                    </tr>
                    {{/each}}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4">Subtotal</td>
                      <td>{{subtotal}}</td>
                    </tr>
                    <tr>
                      <td colspan="4">Discount ({{discount_rate}}%)</td>
                      <td>{{discount_amount}}</td>
                    </tr>
                    <tr>
                      <td colspan="4">Tax ({{tax_rate}}%)</td>
                      <td>{{tax_amount}}</td>
                    </tr>
                    <tr class="total">
                      <td colspan="4">Total</td>
                      <td>{{total}}</td>
                    </tr>
                    <tr class="amount-due">
                      <td colspan="4">Amount Due</td>
                      <td>{{amount_due}}</td>
                    </tr>
                  </tfoot>
                </table>
              </section>
              
              <!-- Payment information -->
              <section class="payment-info">
                <h2>Payment Information</h2>
                <p><strong>Payment Terms:</strong> {{payment_terms}}</p>
                <p><strong>Payment Method:</strong> {{payment_method}}</p>
                <p><strong>Payment Details:</strong> {{payment_details}}</p>
              </section>
              
              <!-- Notes and terms -->
              <section class="notes">
                <h2>Notes</h2>
                <p>{{notes}}</p>
              </section>
              
              <section class="terms">
                <h2>Terms & Conditions</h2>
                <p>{{terms}}</p>
              </section>
            </div>',
            false,
            'html',
            '{"company_name":"Portfolio Backend Inc","company_logo":"https://portfoliobackend.com/logo.png","company_address":"123 Main St, Suite 100, San Francisco, CA 94105","company_phone":"+1 (555) 123-4567","company_email":"billing@portfoliobackend.com","company_website":"https://portfoliobackend.com","payment_terms":"Net 30","tax_rate":"8.5","discount_rate":"0","terms":"1. Payment is due within 30 days from the date of invoice. 2. Late payment may result in late fees."}',
            'body { font-family: Arial, sans-serif; color: #333; line-height: 1.5; }
            .detailed-invoice { max-width: 900px; margin: 0 auto; padding: 40px; }
            header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .company-info, .document-info { flex-basis: 48%; }
            .document-info h1 { text-align: right; color: #3498db; }
            .document-info table { margin-left: auto; }
            .document-info th { text-align: right; padding-right: 10px; }
            section { margin-bottom: 30px; }
            .items table { width: 100%; border-collapse: collapse; }
            .items th, .items td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .items th { background-color: #f8f8f8; }
            .total td, .amount-due td { font-weight: bold; }
            .amount-due td { font-size: 1.2em; color: #e74c3c; }',
            '© {{year}} Portfolio Backend Inc. All rights reserved.'
          );
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM billing.invoice_templates 
        WHERE name IN ('Standard Invoice', 'Minimal Invoice', 'Detailed Invoice');
      `, { transaction: t });
    });
  }
}; 