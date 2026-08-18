/* Bookora AI click hotfix.
   Keeps the floating AI assistant above page layers and gives its trigger
   a capture-phase handler so stale delegated click handlers cannot cancel it. */
import { BookoraAI } from './components/BookoraAIEnhanced.js';

function installAIClickFix() {
  const root = document.getElementById('bookora-ai-root');
  const trigger = document.getElementById('bookora-ai-trigger-btn');
  const drawer = document.getElementById('bookora-ai-drawer');

  if (!root || !trigger || !drawer) return false;

  // The root previously used pointer-events:none and relied on child overrides.
  // Make the assistant root itself hit-testable so Chrome never loses the click.
  root.style.position = 'fixed';
  root.style.zIndex = '2147483647';
  root.style.pointerEvents = 'auto';
  trigger.style.pointerEvents = 'auto';
  trigger.style.zIndex = '2147483647';
  drawer.style.zIndex = '2147483646';
  drawer.style.pointerEvents = BookoraAI.isOpen ? 'auto' : 'none';

  if (trigger.dataset.aiClickFixInstalled === '1') return true;
  trigger.dataset.aiClickFixInstalled = '1';

  // Capture phase + stopImmediatePropagation prevents another global click
  // bridge from toggling the assistant back immediately after this handler.
  trigger.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    BookoraAI.toggle();
  }, true);

  return true;
}

if (!installAIClickFix()) {
  const observer = new MutationObserver(() => {
    if (installAIClickFix()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
