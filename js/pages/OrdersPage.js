// OrdersPage Component
import { state } from '../state.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderOrdersPage() {
  updateSEO({
    title: 'Order History & Receipts',
    description: 'View all your verified Cashfree eBook purchases on Bookora.'
  });

  const orders = state.orders;

  return `
    <div class="orders-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 960px;">
        
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Billing History</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Order History
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Review your receipts, order IDs, and verified Cashfree transaction details.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
          ${orders.length > 0 ? `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                  <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">
                    <th style="padding: 1rem 1.25rem;">Order ID</th>
                    <th style="padding: 1rem 1.25rem;">Publication</th>
                    <th style="padding: 1rem 1.25rem;">Date</th>
                    <th style="padding: 1rem 1.25rem;">Amount</th>
                    <th style="padding: 1rem 1.25rem;">Gateway</th>
                    <th style="padding: 1rem 1.25rem;">Status</th>
                    <th style="padding: 1rem 1.25rem; text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${orders.map(order => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 1.25rem; font-family: monospace; font-weight: 700; color: var(--text-primary);">${order.id}</td>
                      <td style="padding: 1.25rem;">
                        <strong style="color: var(--text-primary); display: block;">${order.book_title}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Txn: ${order.transaction_id || 'CF_88192'}</span>
                      </td>
                      <td style="padding: 1.25rem; color: var(--text-secondary);">${formatDate(order.date)}</td>
                      <td style="padding: 1.25rem; font-weight: 700; color: var(--text-primary);">${formatPrice(order.amount)}</td>
                      <td style="padding: 1.25rem;">
                        <span class="badge badge-bookora" style="font-size: 0.65rem;">Cashfree</span>
                      </td>
                      <td style="padding: 1.25rem;">
                        <span class="badge badge-featured" style="font-size: 0.65rem;">✓ ${order.status}</span>
                      </td>
                      <td style="padding: 1.25rem; text-align: right;">
                        <a href="#/library" class="btn btn-primary btn-sm" style="font-size: 0.75rem; padding: 4px 10px;">
                          Read Book
                        </a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="padding: 4rem 2rem; text-align: center;">
              <p style="color: var(--text-muted); margin-bottom: 1rem;">No transactions found in this account.</p>
              <a href="#/explore" class="btn btn-primary btn-sm">Explore Catalog</a>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}
