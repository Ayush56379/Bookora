import { apiFetch } from '../config.js';
// PricingPage & Subscription Components
import { state } from '../state.js';
import { formatPrice } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderPricingPage() {
  updateSEO({
    title: 'Subscription Plans & Pricing',
    description: 'Explore Bookora Reader Pro & Annual Membership plans for unlimited eBook reading.'
  });

  const plans = state.subscriptionPlans || [];
  const currentSub = state.currentSubscription;

  return `
    <div class="pricing-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0;">
      <div class="container" style="max-width: 1080px;">
        
        <!-- Header -->
        <div style="text-align: center; max-width: 720px; margin: 0 auto 3.5rem auto;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Transparent Memberships</div>
          <h1 style="font-family: var(--font-display); font-size: clamp(2.2rem, 4vw, 3rem); font-weight: 800; color: var(--text-primary); margin-bottom: 0.75rem;">
            Simple, Accessible Reading Plans
          </h1>
          <p style="font-size: 1.05rem; color: var(--text-secondary); line-height: 1.6;">
            Buy individual eBooks permanently or subscribe for unlimited access to eligible publications.
          </p>
        </div>

        <!-- Plans Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 4rem;">
          ${plans.map(plan => {
            const isCurrent = currentSub && currentSub.plan_id === plan.id && currentSub.status === 'ACTIVE';
            return `
              <div class="book-card animate-slide-up" style="background: #FFFFFF; border: ${plan.is_popular ? '2px solid var(--accent)' : '1px solid var(--border-subtle)'}; padding: 2.5rem 2rem; display: flex; flex-direction: column; position: relative; box-shadow: ${plan.is_popular ? 'var(--shadow-lg)' : 'var(--shadow-sm)'};">
                
                ${plan.is_popular ? `
                  <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #FFFFFF; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 12px; border-radius: 99px;">
                    Most Popular
                  </div>
                ` : ''}

                <div style="margin-bottom: 1.5rem;">
                  <h3 style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
                    ${plan.name}
                  </h3>
                  <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; min-height: 2.5rem;">
                    ${plan.description}
                  </p>
                </div>

                <div style="margin-bottom: 1.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
                  <div style="display: flex; align-items: baseline; gap: 4px;">
                    <span style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 900; color: var(--text-primary);">
                      ${formatPrice(plan.price, plan.currency)}
                    </span>
                    <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
                      ${plan.interval === 'free' ? 'forever' : `/${plan.interval}`}
                    </span>
                  </div>
                </div>

                <!-- Features List -->
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 2rem; flex: 1;">
                  ${plan.features.map(f => `
                    <li style="display: flex; align-items: flex-start; gap: 0.5rem;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" style="flex-shrink: 0; margin-top: 2px;"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>${f}</span>
                    </li>
                  `).join('')}
                </ul>

                <!-- Plan Action Button -->
                ${isCurrent ? `
                  <button class="btn btn-secondary btn-lg" disabled style="width: 100%; font-weight: 700;">
                    ✓ Current Active Plan
                  </button>
                ` : plan.price === 0 ? `
                  <a href="#/explore" class="btn btn-secondary btn-lg" style="width: 100%; font-weight: 700;">
                    Start Reading Free
                  </a>
                ` : `
                  <button class="btn btn-primary btn-lg subscribe-plan-btn" data-plan-id="${plan.id}" data-plan-price="${plan.price}" style="width: 100%; font-weight: 800;">
                    Subscribe via Cashfree
                  </button>
                `}

              </div>
            `;
          }).join('')}
        </div>

        <!-- Plan Comparison & FAQ -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
            Subscription FAQs
          </h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; font-size: 0.9rem;">
            <div>
              <strong style="display: block; color: var(--text-primary); margin-bottom: 0.25rem;">Can I buy individual eBooks without subscribing?</strong>
              <p style="color: var(--text-secondary); line-height: 1.5;">Yes. Individual purchases are permanent and independent of subscriptions. You own lifetime access and DRM downloads.</p>
            </div>
            <div>
              <strong style="display: block; color: var(--text-primary); margin-bottom: 0.25rem;">How do I cancel my subscription?</strong>
              <p style="color: var(--text-secondary); line-height: 1.5;">You can cancel auto-renewal anytime in your Subscription Dashboard. Access continues until the current billing period expires.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function renderSubscriptionManagePage() {
  updateSEO({
    title: 'Manage Subscription',
    description: 'Manage your active Bookora subscription, renewal status, and billing history.'
  });

  const sub = state.currentSubscription;

  return `
    <div class="subscription-manage-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 780px;">
        
        <div style="margin-bottom: 2.5rem;">
          <a href="#/dashboard" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">← Back to Dashboard</a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            My Subscription
          </h1>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          ${sub && sub.status === 'ACTIVE' ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
              <div>
                <span class="badge badge-featured" style="font-size: 0.7rem; margin-bottom: 4px;">ACTIVE MEMBERSHIP</span>
                <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary);">${sub.plan_name}</h3>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent);">${formatPrice(sub.amount, sub.currency)}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; font-size: 0.875rem; margin-bottom: 2rem;">
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                <span style="color: var(--text-muted); display: block;">Start Date</span>
                <strong style="color: var(--text-primary);">${sub.start_date ? sub.start_date.split('T')[0] : 'Today'}</strong>
              </div>
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                <span style="color: var(--text-muted); display: block;">Next Expiry / Renewal</span>
                <strong style="color: var(--text-primary);">${sub.end_date ? sub.end_date.split('T')[0] : 'N/A'}</strong>
              </div>
            </div>

            <div style="display: flex; gap: 1rem;">
              <a href="#/pricing" class="btn btn-secondary btn-sm">Change Plan</a>
              <button id="cancel-sub-btn" class="btn btn-ghost btn-sm" style="color: #DC2626;">Cancel Subscription</button>
            </div>
          ` : `
            <div style="text-align: center; padding: 3rem 1rem;">
              <div style="width: 56px; height: 56px; border-radius: 99px; background: var(--accent-light); color: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              </div>
              <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">No Active Subscription</h3>
              <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 440px; margin: 0 auto 1.5rem auto;">
                Subscribe to Reader Pro for unlimited access to eligible eBooks and special member discounts.
              </p>
              <a href="#/pricing" class="btn btn-primary btn-lg">Explore Reading Plans</a>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}

export function initPricingEvents() {
  document.querySelectorAll('.subscribe-plan-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!state.isAuthenticated) {
        Toast.show('Please sign in to choose a subscription plan.', 'info');
        window.location.hash = '#/login?returnTo=' + encodeURIComponent('/pricing');
        return;
      }

      const planId = btn.dataset.planId;
      btn.disabled = true;
      btn.textContent = 'Creating Cashfree Order...';

      try {
        const res = await apiFetch('/api/subscriptions/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
          },
          body: JSON.stringify({ plan_id: planId })
        });
        const orderData = await res.json();
        if (res.ok && orderData.success) {
          // Verify & activate payment in Cashfree Sandbox
          btn.textContent = 'Verifying Sandbox Payment...';
          const vRes = await apiFetch('/api/subscriptions/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ order_id: orderData.order.id })
          });
          const vData = await vRes.json();
          if (vRes.ok && vData.success) {
            state.currentSubscription = vData.subscription;
            Toast.show(`Subscription activated! Welcome to ${vData.subscription.plan_name}.`, 'success');
            window.location.hash = '#/subscription/manage';
          }
        }
      } catch (err) {
        Toast.show('Subscription order error.', 'error');
        btn.disabled = false;
        btn.textContent = 'Subscribe via Cashfree';
      }
    });
  });

  document.getElementById('cancel-sub-btn')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to cancel your subscription renewal?')) {
      try {
        const res = await apiFetch('/api/subscriptions/cancel', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (res.ok) {
          state.currentSubscription = null;
          Toast.show('Subscription renewal cancelled.', 'info');
          window.dispatchEvent(new Event('hashchange'));
        }
      } catch (e) {
        Toast.show('Error cancelling subscription.', 'error');
      }
    }
  });
}
