// Bookora licensed PDF downloader.
// The real PDF is served only after the backend verifies the purchaser's library access.

export async function downloadEBook(book, user) {
  if (!book) return;

  const access = window.BookoraPurchaseAccess;
  if (!access?.downloadPurchasedPdf) {
    throw new Error('Secure PDF access is still loading. Please try again.');
  }

  if (!user && !window.firebase?.auth?.()?.currentUser) {
    throw new Error('Please sign in to download your purchased eBook.');
  }

  await access.downloadPurchasedPdf(book);
}
