// Skeleton loader component
export function renderBookCardSkeleton() {
  return `
    <div class="book-card" style="pointer-events: none;">
      <div class="skeleton" style="width: 100%; aspect-ratio: 3/4.2; margin-bottom: 0.85rem; border-radius: var(--radius-md);"></div>
      <div class="skeleton" style="width: 40%; height: 16px; margin-bottom: 0.5rem;"></div>
      <div class="skeleton" style="width: 90%; height: 20px; margin-bottom: 0.4rem;"></div>
      <div class="skeleton" style="width: 60%; height: 16px; margin-bottom: 0.85rem;"></div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
        <div class="skeleton" style="width: 35%; height: 24px;"></div>
        <div class="skeleton" style="width: 45%; height: 32px; border-radius: var(--radius-md);"></div>
      </div>
    </div>
  `;
}
