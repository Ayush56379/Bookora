/* Bookora payment result UI hardening.
 * Adds semantic classes for responsive CSS and never exposes raw payment-method
 * payloads (which may contain bank/card metadata) in the confirmation page.
 */
(function () {
  const rootSelector = '.payment-result-page';

  function safeText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function formatPaymentMethod(raw) {
    const value = safeText(raw);
    if (!value || value === '—') return '—';

    // The backend may return a structured payment-method object as a string.
    // Only expose a short, non-sensitive summary on the customer-facing page.
    const upper = value.toUpperCase();
    const network = (value.match(/card_network['\"]?\s*:\s*['\"]([^'\"]+)/i) || [])[1];
    const bank = (value.match(/card_bank_name['\"]?\s*:\s*['\"]([^'\"]+)/i) || [])[1];
    const number = (value.match(/card_number['\"]?\s*:\s*['\"](?:X+|\*+)(\d{4})['\"]/i) || [])[1];
    const channel = (value.match(/channel['\"]?\s*:\s*['\"]([^'\"]+)/i) || [])[1];

    if (upper.includes('CARD') || network || number || bank) {
      const parts = ['Card'];
      if (network) parts.push(network.toUpperCase());
      if (bank) parts.push(bank);
      if (number) parts.push(`•••• ${number}`);
      return parts.join(' • ');
    }

    if (channel) return channel.toUpperCase();
    if (upper.includes('UPI')) return 'UPI';
    if (upper.includes('NETBANKING') || upper.includes('NET BANKING')) return 'Net Banking';
    if (upper.includes('WALLET')) return 'Wallet';
    if (upper.includes('CASH')) return 'Cashfree';

    return value.length > 42 ? `${value.slice(0, 39)}…` : value;
  }

  function enhance(root) {
    if (!root || root.dataset.paymentResponsiveReady === '1') return;
    root.dataset.paymentResponsiveReady = '1';

    const container = root.querySelector('.container');
    const card = container?.firstElementChild;
    if (card) card.classList.add('payment-result-card');

    const icon = card?.firstElementChild;
    if (icon) icon.classList.add('payment-result-icon');

    const title = card?.querySelector('h1');
    if (title) title.classList.add('payment-result-title');

    const message = title?.nextElementSibling;
    if (message) message.classList.add('payment-result-message');

    const details = card?.querySelector('div[style*="border-radius:14px"]');
    if (details) {
      details.classList.add('payment-details');
      details.querySelectorAll(':scope > div').forEach(row => {
        row.classList.add('payment-detail-row');
        row.style.removeProperty('display');
        row.style.removeProperty('justify-content');
        row.style.removeProperty('padding');
        const label = row.querySelector('span');
        const value = row.querySelector('strong');
        if (label) label.classList.add('payment-detail-label');
        if (value) {
          value.classList.add('payment-detail-value');
          if (value.style.fontFamily === 'monospace' || value.style.wordBreak === 'break-all') value.classList.add('mono');
          if (label && safeText(label.textContent).toLowerCase() === 'payment method') {
            value.textContent = formatPaymentMethod(value.textContent);
            value.classList.remove('mono');
          }
        }
      });
    }

    const actionWrap = card?.querySelector('div[style*="flex-wrap"]');
    if (actionWrap) actionWrap.classList.add('payment-actions');
  }

  function scan() {
    document.querySelectorAll(rootSelector).forEach(enhance);
  }

  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
