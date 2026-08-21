/*
 * External listing submission is owned by PublishExternalPage.js.
 *
 * This module intentionally does not install a capture-phase submit listener.
 * The previous listener called preventDefault()/stopImmediatePropagation(),
 * which could block the page's real PDF-upload + listing handler.
 * Keep this file as a compatibility module so existing imports remain valid.
 */
export function installExternalBookoraCommerce() {
  return true;
}
