import { apiFetch } from '../config.js';
// AdminSecurityPage Component (Live Audit Log)
import { state } from '../state.js';
import { formatDate } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';

export function renderAdminSecurityPage() {
  updateSEO({
    title: 'Platform Security & Audit Logs',
    description: 'Review security audit logs, access records, and admin events on Bookora.'
  });

  return `
    <div class="admin-security-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <div style="margin-bottom: 2rem;">
          <a href="#/admin" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">
            ← Back to Admin Panel
          </a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            Security Audit Trail
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Immutable audit records of administrative events, authentications, role modifications, and payment settings.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
          <div id="security-logs-container" style="padding: 1.5rem;">
            <div style="text-align: center; padding: 2rem 0; color: var(--text-muted);">
              Loading security audit records...
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export async function initAdminSecurityEvents() {
  const container = document.getElementById('security-logs-container');
  if (!container) return;

  try {
    const res = await apiFetch('/api/admin/security-logs', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const logs = await res.json();

    if (res.ok && Array.isArray(logs) && logs.length > 0) {
      container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">
              <th style="padding: 0.85rem 1rem;">Timestamp</th>
              <th style="padding: 0.85rem 1rem;">Event Type</th>
              <th style="padding: 0.85rem 1rem;">Initiated By</th>
              <th style="padding: 0.85rem 1rem;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 1rem; color: var(--text-secondary); font-family: monospace; font-size: 0.8rem;">
                  ${log.timestamp ? log.timestamp.replace('T', ' ').replace('Z', '') : ''}
                </td>
                <td style="padding: 1rem;">
                  <span class="badge ${log.event_type.includes('ADMIN') ? 'badge-bookora' : log.event_type.includes('UNAUTHORIZED') ? 'badge' : 'badge-featured'}" style="font-size: 0.65rem;">
                    ${log.event_type}
                  </span>
                </td>
                <td style="padding: 1rem; font-weight: 600; color: var(--text-primary); font-size: 0.8rem;">
                  ${log.user_email || 'System'}
                </td>
                <td style="padding: 1rem; color: var(--text-secondary);">
                  ${log.details || ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 0; color: var(--text-muted);">
          No security alerts recorded. Platform operating normally.
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<div style="color: #DC2626; text-align: center; padding: 2rem;">Failed to retrieve security logs. Admin verification required.</div>`;
  }
}
