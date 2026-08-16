// CreatorDashboardPage Component (Real Data Mode)
import { state } from '../state.js';
import { formatPrice } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderCreatorDashboardPage() {
  updateSEO({
    title: 'Creator Studio & Analytics',
    description: 'Manage your eBook publications, track royalties, and request Cashfree payouts.'
  });

  const user = state.currentUser;
  const myBooks = state.books.filter(b => b.creator_id === user.id);
  const pendingCount = myBooks.filter(b => b.status === 'pending').length;
  const approvedCount = myBooks.filter(b => b.status === 'approved').length;
  const myOrders = state.orders.filter(o => myBooks.some(b => b.id === o.book_id));
  const totalSalesCount = myOrders.length;
  const totalRevenue = myOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalEarnings = totalRevenue * 0.85;

  return `
    <div class="creator-dashboard animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container">
        
        <!-- Header -->
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; gap: 1rem;">
          <div>
            <div class="badge badge-external" style="margin-bottom: 0.5rem;">Creator Hub</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              Welcome, ${user.name}
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Track real-time royalties, sales velocity, and publication statuses.
            </p>
          </div>

          <div style="display: flex; gap: 0.75rem;">
            <a href="#/publish" class="btn btn-primary btn-sm">
              + Publish Bookora eBook
            </a>
            <a href="#/publish/external" class="btn btn-secondary btn-sm">
              + Add External Sales Page
            </a>
          </div>
        </div>

        <!-- Metric Cards Grid (Real Values) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
          
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Available Balance</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #059669; font-family: var(--font-display); margin: 0.4rem 0;">
              ${formatPrice(totalEarnings)}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">85% creator payout rate</div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Sales</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display); margin: 0.4rem 0;">
              ${totalSalesCount} copies
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Real completed purchases</div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Published eBooks</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent); font-family: var(--font-display); margin: 0.4rem 0;">
              ${approvedCount} Active
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${pendingCount} under review</div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Payment Environment</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #1E3A8A; font-family: var(--font-display); margin: 0.4rem 0;">
              Cashfree Sandbox
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Sandbox test mode</div>
          </div>

        </div>

        <!-- My Publications Table -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); margin-bottom: 2.5rem;">
          <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
              My Publications
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${myBooks.length} Titles</span>
          </div>

          ${myBooks.length > 0 ? `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                <thead>
                  <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">
                    <th style="padding: 1rem 1.25rem;">eBook</th>
                    <th style="padding: 1rem 1.25rem;">Type</th>
                    <th style="padding: 1rem 1.25rem;">Category</th>
                    <th style="padding: 1rem 1.25rem;">Price</th>
                    <th style="padding: 1rem 1.25rem;">Status</th>
                    <th style="padding: 1rem 1.25rem; text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${myBooks.map(b => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 38px; height: 50px; border-radius: 4px; background: ${b.cover_gradient}; flex-shrink: 0;"></div>
                        <div>
                          <strong style="color: var(--text-primary); display: block;">${b.title}</strong>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">${b.pages ? `${b.pages} pages` : b.source_domain}</span>
                        </div>
                      </td>
                      <td style="padding: 1rem 1.25rem;">
                        <span class="badge ${b.source_type === 'internal' ? 'badge-bookora' : 'badge-external'}" style="font-size: 0.65rem;">
                          ${b.source_type === 'internal' ? 'BOOKORA' : 'EXTERNAL'}
                        </span>
                      </td>
                      <td style="padding: 1rem 1.25rem; color: var(--text-secondary);">${b.category}</td>
                      <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--text-primary);">${formatPrice(b.sale_price || b.price)}</td>
                      <td style="padding: 1rem 1.25rem;">
                        <span class="badge ${b.status === 'approved' ? 'badge-featured' : b.status === 'pending' ? 'badge-new' : ''}" style="font-size: 0.65rem;">
                          ${b.status}
                        </span>
                      </td>
                      <td style="padding: 1rem 1.25rem; text-align: right;">
                        <a href="#/book/${b.slug || b.id}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;">
                          View
                        </a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="padding: 3rem 2rem; text-align: center; color: var(--text-secondary);">
              <p style="margin-bottom: 1rem;">You have not published or submitted any eBooks yet.</p>
              <a href="#/publish" class="btn btn-primary btn-sm">Publish Your First eBook</a>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}

export function initCreatorDashboardEvents() {}
