/* Bookora — free sample transport guard.
 *
 * The canonical FreeSamplePage now calls the Render backend directly at
 * /api/books/<id-or-slug>/sample. Do not monkey-patch window.fetch here:
 * doing so can delay the real backend request and hide backend HTTP errors.
 * This module intentionally stays side-effect free so the backend is the
 * single source of truth for secure sample generation.
 */
export {};
