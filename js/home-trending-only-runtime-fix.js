/* Bookora — remove the old Featured label permanently.
   The existing home catalog already prefers trending books; this runtime
   only relabels that presentation as Trending and keeps View all -> Explore.
   No book data, Firebase logic, wishlist logic, or card behavior is changed. */
(() => {
  const apply = () => {
    if ((window.location.hash || '#/').split('?')[0] !== '#/') return;
    const section = document.querySelector('.kdp-catalog-section');
    if (!section) return;

    const heading = section.querySelector('.kdp-section-head h2');
    if (heading) heading.textContent = 'Trending eBooks';

    const description = section.querySelector('.kdp-section-head p');
    if (description) description.textContent = 'Discover what readers are exploring on Bookora.';

    const tabs = section.querySelector('.kdp-tabs');
    if (tabs) {
      tabs.innerHTML = `
        <a class="kdp-tab active" href="#/trending">Trending</a>
        <a class="kdp-tab" href="#/explore">All eBooks</a>
      `;
    }
  };

  const schedule = () => requestAnimationFrame(() => requestAnimationFrame(apply));
  window.addEventListener('hashchange', schedule);
  window.addEventListener('bookora:catalog-updated', schedule);
  window.addEventListener('bookora:fast-catalog', schedule);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();

  new MutationObserver(() => schedule()).observe(document.body, { childList: true, subtree: true });
})();
