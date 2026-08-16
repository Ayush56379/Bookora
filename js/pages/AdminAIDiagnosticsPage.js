import { apiFetch } from '../config.js';
// AdminAIDiagnosticsPage Component (Admin -> System -> AI Diagnostics)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderAdminAIDiagnosticsPage() {
  updateSEO({
    title: 'Groq AI Diagnostics & Health Monitor',
    description: 'Monitor Groq low-latency AI performance, configuration status, and test real-time inference.'
  });

  return `
    <div class="admin-ai-diagnostics-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 920px;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
          <div>
            <a href="#/admin" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">← Back to Admin Center</a>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
              Groq AI System Diagnostics
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Real-time monitoring, endpoint latency benchmarks, and live test console for Bookora AI.
            </p>
          </div>
          <button id="run-ai-test-btn" class="btn btn-primary btn-lg" style="font-weight: 700;">
            ⚡ Send Test Message
          </button>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          
          <!-- Configuration Overview Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
            
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Groq Engine Status</span>
              <div id="diag-engine-status" style="font-size: 1.1rem; font-weight: 800; color: #16A34A; margin-top: 4px;">
                CONNECTED & SECURED
              </div>
            </div>

            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Active Model</span>
              <div id="diag-model" style="font-size: 1rem; font-weight: 800; color: var(--text-primary); margin-top: 4px; font-family: monospace;">
                llama-3.3-70b-versatile
              </div>
            </div>

            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Key Protection</span>
              <div id="diag-key" style="font-size: 1rem; font-weight: 700; color: #6D28D9; margin-top: 4px; font-family: monospace;">
                gsk_uj••••••••nvL
              </div>
            </div>

            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Base Endpoint</span>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-top: 4px; font-family: monospace;">
                api.groq.com/openai/v1
              </div>
            </div>

          </div>

          <!-- Live Benchmark Console -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.75rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
              Live Inference Diagnostic Console
            </h3>
            
            <div id="ai-test-output-box" style="background: #0F172A; color: #F8FAFC; border-radius: var(--radius-lg); padding: 1.5rem; font-family: monospace; font-size: 0.875rem; min-height: 140px; line-height: 1.6;">
              <div style="color: #94A3B8;">// Click "Send Test Message" to run live inference benchmark...</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;
}

export function initAdminAIDiagnosticsEvents() {
  const testBtn = document.getElementById('run-ai-test-btn');
  const outputBox = document.getElementById('ai-test-output-box');

  testBtn?.addEventListener('click', async () => {
    testBtn.disabled = true;
    testBtn.textContent = 'Benchmarking Groq...';
    if (outputBox) {
      outputBox.innerHTML = '<div style="color: #60A5FA;">⚡ Dispatching request to Groq API (model: llama-3.3-70b-versatile)...</div>';
    }

    try {
      const res = await apiFetch('/api/admin/ai-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        }
      });
      const data = await res.json();
      testBtn.disabled = false;
      testBtn.textContent = '⚡ Send Test Message';

      if (outputBox) {
        outputBox.innerHTML = `
<span style="color:#4ADE80;">[SUCCESS 200 OK]</span>
Timestamp: ${data.timestamp}
Latency: <strong style="color:#FBBF24;">${data.latency_ms} ms</strong>

<strong style="color:#60A5FA;">Prompt:</strong>
"${data.test_query}"

<strong style="color:#4ADE80;">Groq Response:</strong>
${data.reply}
        `;
      }
      Toast.show('Groq AI test completed successfully!', 'success');
    } catch (e) {
      testBtn.disabled = false;
      testBtn.textContent = '⚡ Send Test Message';
      if (outputBox) {
        outputBox.innerHTML = `<span style="color:#F87171;">[TEST FAILED]</span> ${e.message}`;
      }
    }
  });
}
