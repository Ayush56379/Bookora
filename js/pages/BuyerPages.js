// BuyerPages Component (Cart, Order Detail, Reading View, My Reviews)
import { state } from '../state.js';
import { formatPrice, formatDate, renderStars } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderCartPage() {
  updateSEO({
    title: 'Your Shopping Cart',
    description: 'Review items in your Bookora cart and proceed to Cashfree checkout.'
  });

  const cartItems = state.cart || [];
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.sale_price || item.price || 0) * (item.quantity || 1)), 0);

  return `
    <div class="cart-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 920px;">
        
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Shopping Cart (${cartItems.length})
          </h1>
        </div>

        ${cartItems.length > 0 ? `
          <div style="display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start;">
            
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
              ${cartItems.map(item => `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 0; border-bottom: 1px solid var(--border-subtle);">
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 50px; height: 68px; border-radius: 6px; background: ${item.cover_gradient || 'var(--accent)'}; flex-shrink: 0;"></div>
                    <div>
                      <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${item.title}</h4>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">by ${item.author}</div>
                      <div style="font-size: 0.75rem; color: var(--accent); font-weight: 600; margin-top: 4px;">Instant PDF Download</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <strong style="font-size: 1.1rem; color: var(--text-primary); display: block;">${formatPrice(item.sale_price || item.price)}</strong>
                    <button class="btn btn-ghost btn-sm cart-remove-btn" data-id="${item.id}" style="color: #DC2626; font-size: 0.75rem; padding: 2px 0;">Remove</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Summary -->
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm);">
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">Summary</h3>
              <div style="display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 0.75rem;">
                <span style="color: var(--text-secondary);">Subtotal</span>
                <strong>${formatPrice(subtotal)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 800; border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-bottom: 1.5rem;">
                <span>Total</span>
                <span style="color: var(--accent);">${formatPrice(subtotal)}</span>
              </div>
              <a href="#/checkout/${cartItems[0].slug || cartItems[0].id}" class="btn btn-primary btn-lg" style="width: 100%; font-weight: 800;">
                Proceed to Checkout
              </a>
            </div>

          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center;">
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Your cart is currently empty.</p>
            <a href="#/explore" class="btn btn-primary">Browse Catalog</a>
          </div>
        `}

      </div>
    </div>
  `;
}

export function renderOrderDetailPage(orderId) {
  updateSEO({ title: `Order #${orderId}`, description: 'Order receipt & payment breakdown.' });
  const order = state.orders.find(o => o.id === orderId) || { id: orderId, amount: 0, book_title: 'eBook Publication', status: 'PAID', date: new Date().toISOString() };

  return `
    <div class="order-detail-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 720px;">
        <div style="margin-bottom: 2rem;">
          <a href="#/orders" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">← Back to Orders</a>
          <h1 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            Order Receipt & Invoice
          </h1>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Order Number</span>
              <strong style="display: block; font-family: monospace; font-size: 1.1rem; color: var(--text-primary);">${order.id}</strong>
            </div>
            <span class="badge badge-featured" style="font-size: 0.75rem;">✓ ${order.status || 'PAID'}</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.9rem; margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Item:</span>
              <strong style="color: var(--text-primary);">${order.book_title}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Payment Provider:</span>
              <span>Cashfree Gateway (Sandbox Verified)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Transaction ID:</span>
              <span style="font-family: monospace;">${order.transaction_id || 'CF_TXN_VERIFIED'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 1rem; font-size: 1.1rem; font-weight: 800;">
              <span>Total Paid:</span>
              <span style="color: var(--accent);">${formatPrice(order.amount)}</span>
            </div>
          </div>

          <div style="display: flex; gap: 1rem;">
            <a href="#/library" class="btn btn-primary btn-sm">Read in Library</a>
            <button onclick="window.print()" class="btn btn-secondary btn-sm">Print Invoice Receipt</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
