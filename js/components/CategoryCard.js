// CategoryCard Component
export function renderCategoryCard(cat) {
  return `
    <a href="#/category/${cat.slug}" class="category-card animate-fade-in" data-slug="${cat.slug}">
      <div class="category-icon-box">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      </div>
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
          ${cat.name}
        </h4>
        <span style="font-size: 0.78rem; color: var(--text-muted);">
          ${cat.count} Publications
        </span>
      </div>
      <div class="category-arrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </a>
  `;
}
