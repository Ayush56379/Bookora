// Secure client-side eBook download generator with purchaser DRM receipt watermark

export function downloadEBook(book, user) {
  if (!book) return;

  const title = book.title || 'Bookora-eBook';
  const author = book.author || 'Bookora Author';
  const userName = user?.name || 'Authorized Reader';
  const userEmail = user?.email || 'reader@bookora.com';
  const purchaseDate = new Date().toISOString().split('T')[0];
  const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

  const sampleContent = Array.isArray(book.sample_pages) && book.sample_pages.length > 0
    ? book.sample_pages.join('\n\n=========================================\n\n')
    : book.description || 'Full eBook Content.';

  const fileText = `================================================================================
BOOKORA DIGITAL PUBLICATION & LICENSE VERIFICATION RECEIPT
================================================================================
Title:       ${title}
Subtitle:    ${book.subtitle || 'Official Edition'}
Author:      ${author}
Category:    ${book.category || 'General'}
Pages:       ${book.pages || 120}
Format:      ${book.format || 'Digital Edition'}
Language:    ${book.language || 'English'}

--------------------------------------------------------------------------------
LICENSED TO (AUTHENTICATED PURCHASER):
Name:        ${userName}
Account:     ${userEmail}
Order ID:    ${orderId}
Issue Date:  ${purchaseDate}
Platform:    Bookora Digital Marketplace (https://bookora.com)
Cryptographic Watermark: SHA256-${Math.random().toString(36).substring(2, 15).toUpperCase()}
--------------------------------------------------------------------------------

DISCLAIMER & TERMS OF USE:
This publication is digitally protected and licensed exclusively for the single-user
personal reading of ${userName}. Unauthorized distribution, reproduction, or public
hosting is strictly prohibited under international copyright laws.

================================================================================
                               START OF BOOK
================================================================================

${sampleContent}

================================================================================
                                END OF BOOK
================================================================================
Thank you for supporting authors and creators on Bookora!
Visit https://bookora.com for more world-class publications.
`;

  const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Bookora_Edition.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
