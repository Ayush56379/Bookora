// AdminDashboardPage Component (Real Data Mode)
import { state } from '../state.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderAdminDashboardPage(activeTab = 'overview') {
  updateSEO({
    title: 'Admin Control Center',
    description: 'Platform moderation, users, and orders on Bookora.'
  });

  const pendingBooks = state.books.filter(b => b.status === 'pending');
  const allBooks = state.books;
  const approvedBooks = state.getApprovedBooks();
  const internalBooks = allBooks.filter(b => b.source_type === 'internal');
  const externalBooks = allBooks.filter(b => b.source_type === 'external');
  const users = state.users;
  const orders = state.orders;
  const paidOrders = orders.filter(o => o.status === 'PAID' || o.status === 'Paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  return `
    <div class="admin-dashboard animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
          <div>
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">🛡️ Admin Operations</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              Platform Control Center
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Payment Environment: <strong style="color: #1E3A8A;">Cashfree SANDBOX</strong> • Real Database State
            </p>
          </div>
        </div>

        <!-- Admin Tab Navigation Strip -->
        <div style="display: flex; gap: 0.5rem; overflow-x: auto; background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 0.4rem; margin-bottom: 2rem;">
          ${[
            { id: 'overview', name: 'Overview' },
            { id: 'moderation', name: `Moderation (${pendingBooks.length})` },
            { id: 'books', name: `Books (${allBooks.length})` },
            { id: 'users', name: `Users (${users.length})` },
            { id: 'orders', name: `Orders (${orders.length})` },
            { id: 'categories', name: `Categories (${state.categories.length})` }
          ].map(tab => `
            <a href="#/admin/${tab.id}" class="nav-link ${activeTab === tab.id ? 'active' : ''}" style="font-size: 0.85rem; font-weight: 700; border-radius: var(--radius-md); padding: 0.5rem 1rem;">
              ${tab.name}
            </a>
          `).join('')}
        </div>

        <!-- Dynamic Tab Content -->
        ${activeTab === 'moderation' ? `
          <!-- Moderation Tab Content -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle);">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Pending Submissions (${pendingBooks.length})</h3>
            </div>
            ${pendingBooks.length > 0 ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                  <thead>
                    <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                      <th style="padding: 1rem 1.25rem;">Publication</th>
                      <th style="padding: 1rem 1.25rem;">Type</th>
                      <th style="padding: 1rem 1.25rem;">Category</th>
                      <th style="padding: 1rem 1.25rem;">Price</th>
                      <th style="padding: 1rem 1.25rem;">Target</th>
                      <th style="padding: 1rem 1.25rem; text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pendingBooks.map(b => `
                      <tr style="border-bottom: 1px solid var(--border-subtle);">
                        <td style="padding: 1.25rem;">
                          <strong style="color: var(--text-primary); display: block;">${b.title}</strong>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">by ${b.author}</span>
                        </td>
                        <td style="padding: 1.25rem;">
                          <span class="badge ${b.source_type === 'internal' ? 'badge-bookora' : 'badge-external'}" style="font-size: 0.65rem;">
                            ${b.source_type === 'internal' ? 'BOOKORA' : 'EXTERNAL'}
                          </span>
                        </td>
                        <td style="padding: 1.25rem;">${b.category}</td>
                        <td style="padding: 1.25rem; font-weight: 700;">${formatPrice(b.sale_price || b.price)}</td>
                        <td style="padding: 1.25rem;">
                          ${b.source_url ? `<a href="${b.source_url}" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: underline; font-size: 0.75rem;">${b.source_domain} ↗</a>` : '<span style="color: var(--text-muted); font-size: 0.75rem;">Internal File</span>'}
                        </td>
                        <td style="padding: 1.25rem; text-align: right;">
                          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                            <button class="btn btn-primary btn-sm admin-approve-btn" data-id="${b.id}" style="background: #059669; font-size: 0.75rem; padding: 4px 10px;">Approve</button>
                            <button class="btn btn-secondary btn-sm admin-reject-btn" data-id="${b.id}" style="color: #DC2626; font-size: 0.75rem; padding: 4px 10px;">Reject</button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding: 3.5rem 2rem; text-align: center; color: var(--text-muted);">
                ✓ Moderation queue is empty. No pending submissions.
              </div>
            `}
          </div>
        ` : activeTab === 'books' ? `
          <!-- Books Tab -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle);">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Catalog Publications (${allBooks.length})</h3>
            </div>
            ${allBooks.length > 0 ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                  <thead>
                    <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                      <th style="padding: 1rem 1.25rem;">Title & Author</th>
                      <th style="padding: 1rem 1.25rem;">Type</th>
                      <th style="padding: 1rem 1.25rem;">Category</th>
                      <th style="padding: 1rem 1.25rem;">Price</th>
                      <th style="padding: 1rem 1.25rem;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${allBooks.map(b => `
                      <tr style="border-bottom: 1px solid var(--border-subtle);">
                        <td style="padding: 1rem 1.25rem;">
                          <strong>${b.title}</strong>
                          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${b.author}</span>
                        </td>
                        <td style="padding: 1rem 1.25rem;">
                          <span class="badge ${b.source_type === 'internal' ? 'badge-bookora' : 'badge-external'}" style="font-size: 0.65rem;">
                            ${b.source_type === 'internal' ? 'BOOKORA' : 'EXTERNAL'}
                          </span>
                        </td>
                        <td style="padding: 1rem 1.25rem;">${b.category}</td>
                        <td style="padding: 1rem 1.25rem; font-weight: 700;">${formatPrice(b.sale_price || b.price)}</td>
                        <td style="padding: 1rem 1.25rem;">
                          <span class="badge ${b.status === 'approved' ? 'badge-featured' : b.status === 'pending' ? 'badge-new' : ''}" style="font-size: 0.65rem;">
                            ${b.status}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding: 3rem 2rem; text-align: center; color: var(--text-muted);">
                0 books in database.
              </div>
            `}
          </div>
        ` : activeTab === 'users' ? `
          <!-- Users Tab -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle);">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Registered User Accounts (${users.length})</h3>
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                <thead>
                  <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                    <th style="padding: 1rem 1.25rem;">User</th>
                    <th style="padding: 1rem 1.25rem;">Role</th>
                    <th style="padding: 1rem 1.25rem;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 1rem 1.25rem;">
                        <strong style="display: block;">${u.name}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${u.email}</span>
                      </td>
                      <td style="padding: 1rem 1.25rem;">
                        <span class="badge badge-bookora" style="font-size: 0.7rem;">${u.role.toUpperCase()}</span>
                      </td>
                      <td style="padding: 1rem 1.25rem;">
                        <span class="badge badge-featured" style="font-size: 0.65rem;">✓ Active</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : activeTab === 'orders' ? `
          <!-- Orders Tab -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle);">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Cashfree Orders (${orders.length})</h3>
            </div>
            ${orders.length > 0 ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                  <thead>
                    <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                      <th style="padding: 1rem 1.25rem;">Order ID</th>
                      <th style="padding: 1rem 1.25rem;">Book</th>
                      <th style="padding: 1rem 1.25rem;">Amount</th>
                      <th style="padding: 1rem 1.25rem;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orders.map(o => `
                      <tr style="border-bottom: 1px solid var(--border-subtle);">
                        <td style="padding: 1rem 1.25rem; font-family: monospace;">${o.id}</td>
                        <td style="padding: 1rem 1.25rem;">${o.book_title}</td>
                        <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--accent);">${formatPrice(o.amount)}</td>
                        <td style="padding: 1rem 1.25rem;">
                          <span class="badge badge-featured" style="font-size: 0.65rem;">${o.status}</span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding: 3rem 2rem; text-align: center; color: var(--text-muted);">
                0 orders recorded in database.
              </div>
            `}
          </div>
        ` : activeTab === 'categories' ? `
          <!-- Categories Tab -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Categories (${state.categories.length})</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;">
              ${state.categories.map(c => `
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: var(--text-primary); display: block;">${c.name}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${c.slug}</span>
                  </div>
                  <span class="badge badge-bookora" style="font-size: 0.7rem;">${c.count || 0}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <!-- Overview Tab Default -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
            
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Pending Submissions</div>
              <div style="font-size: 2rem; font-weight: 800; color: #D97706; font-family: var(--font-display); margin: 0.3rem 0;">
                ${pendingBooks.length}
              </div>
              <a href="#/admin/moderation" style="font-size: 0.8rem; font-weight: 700; color: var(--accent);">Review Submissions →</a>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Published Books</div>
              <div style="font-size: 2rem; font-weight: 800; color: var(--accent); font-family: var(--font-display); margin: 0.3rem 0;">
                ${approvedBooks.length}
              </div>
              <a href="#/admin/books" style="font-size: 0.8rem; font-weight: 700; color: var(--accent);">Manage Books →</a>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Platform Orders</div>
              <div style="font-size: 2rem; font-weight: 800; color: #059669; font-family: var(--font-display); margin: 0.3rem 0;">
                ${orders.length}
              </div>
              <a href="#/admin/orders" style="font-size: 0.8rem; font-weight: 700; color: var(--accent);">View Transaction Logs →</a>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Revenue</div>
              <div style="font-size: 2rem; font-weight: 800; color: #1E3A8A; font-family: var(--font-display); margin: 0.3rem 0;">
                ${formatPrice(totalRevenue)}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Real completed payments</div>
            </div>

          </div>
        `}

      </div>
    </div>
  `;
}

export function initAdminDashboardEvents() {
  document.querySelectorAll('.admin-approve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bookId = btn.dataset.id;
      state.moderateBook(bookId, 'approve');
      Toast.show('eBook Approved & Published!', 'success');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  document.querySelectorAll('.admin-reject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bookId = btn.dataset.id;
      const reason = prompt('Please specify rejection reason for author:', 'Incomplete manuscript or formatting.');
      if (reason !== null) {
        state.moderateBook(bookId, 'reject', reason);
        Toast.show('Submission rejected and notification sent.', 'warning');
        window.dispatchEvent(new Event('hashchange'));
      }
    });
  });
}
