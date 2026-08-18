import { updateSEO } from '../utils/seo.js';

const P={
help:['Help Center & Support','Support','Bookora help for readers, buyers, creators, publishing, payments and accounts.',[
['Getting started','Bookora is a digital eBook marketplace. Browse public pages freely; sign in when a protected account feature is required.'],
['Buying an eBook','Open a book detail page, review its title, author, description and price, then continue through checkout. A purchase becomes available after successful payment verification.'],
['Library','Verified digital purchases are available from My Library after sign-in.'],
['Publishing','Creators can apply for access and use the publishing workflow to submit book information, a PDF and required cover/details for review.'],
['Technical support','For a broken page or button, refresh and retry. When contacting support, include the page, device, browser, steps and visible error.']]],
'how-it-works':['How Bookora Works','Guide','Understand the Bookora reader and creator journey.',[
['1. Discover','Browse Home, Explore, Categories, Best Sellers, New Releases and Trending.'],
['2. Review','Open a book detail page to review the available metadata, description and pricing.'],
['3. Checkout','Choose a book and complete the available payment flow. The order is treated as complete after successful verification.'],
['4. Read','Verified purchases appear in My Library.'],
['5. Publish','Approved creators can submit publications through the Bookora publishing workflow. Submitted information and assets may be validated before publication.'],
['6. External listings','Authorized creators can submit external sales pages. External checkout, licensing and refunds remain subject to the external publisher.']]],
faq:['Frequently Asked Questions','FAQ','Answers to common Bookora marketplace questions.',[
['Do I need an account to browse?','No. Public catalog and informational pages are available without sign-in. Protected features require authentication.'],
['Where are purchased books?','Verified purchases are available in My Library.'],
['How can I publish?','Use Publish on Bookora or Become a Creator. Creator access may require approval.'],
['Can I list an external eBook?','Yes, when you are authorized to promote the external sales page.'],
['What if payment is not verified?','Do not treat the purchase as complete until Bookora reports successful verification. Contact support if the status is incorrect.'],
['How do I get help?','Use Contact Support and describe the problem. Never send passwords, OTPs or private payment credentials.']]],
contact:['Contact Bookora Support','Contact','Contact Bookora for technical, account, publishing and payment assistance.',[
['Technical support','For broken buttons, loading problems or errors, provide the route, device, browser and exact steps.'],
['Account support','For sign-in, profile, Library or account issues, provide the account email and a clear description. Never send a password or verification code.'],
['Creator support','For PDF, cover, metadata, approval or Creator Studio issues, include the book title and publishing step.'],
['Payment support','Provide the Bookora order/reference information. Never share card numbers, CVV, passwords or OTPs.'],
['Support email','support@bookora.com'],
['Response information','Response time varies by issue. Complete troubleshooting information helps support resolve problems faster.']]],
'refund-policy':['30-Day Buyer Refund Policy','Policy','Refund information for eligible native digital purchases and external listings.',[
['Eligibility','Refund eligibility depends on the purchase type and circumstances. Native Bookora purchases are reviewed under the applicable Bookora refund process.'],
['Requesting a refund','Contact support with the order/reference information and reason for the request. Transaction verification may be required.'],
['Processing','Approved refunds are returned through the applicable payment channel; timing can depend on the provider and banking network.'],
['External purchases','Third-party purchases follow the external publisher’s refund policy. Bookora cannot replace that publisher’s checkout or refund process.'],
['Misuse','Refund requests may be reviewed for fraud or repeated misuse. Access can be affected when a refund is approved.']]],
terms:['Terms of Service','Legal','Bookora terms covering marketplace access, accounts, purchases and publishing.',[
['Platform use','Use Bookora lawfully, respect intellectual-property rights and do not disrupt, abuse or bypass platform security.'],
['Accounts','Keep account information accurate and authentication credentials private. Never share passwords or one-time verification codes.'],
['Digital purchases','Purchased digital publications are provided for permitted personal use. Unauthorized copying, redistribution or resale may violate publisher rights and applicable law.'],
['Creator content','Creators are responsible for having the rights and permissions needed for submitted publications, covers, descriptions and external links.'],
['Availability','Features, pricing and technical behavior may change. Bookora may temporarily restrict features for maintenance, security or operations.'],
['Questions','Use Contact Support for questions about these terms.']]],
privacy:['Privacy & Security','Privacy','Bookora privacy and security information for accounts, purchases and platform usage.',[
['Information used','Bookora may use information needed to operate accounts, authentication, marketplace features, orders, libraries and support.'],
['Authentication','Use the configured Bookora sign-in flow and keep credentials and verification codes private.'],
['Payments','Payment processing is handled through the configured payment provider. Do not send sensitive card credentials through support messages.'],
['Digital security','Access to purchased or creator content can depend on account permissions, order status and platform rules. Do not bypass access controls.'],
['Your responsibility','Use a strong private password, sign out on shared devices and report suspicious activity promptly.'],
['Privacy questions','Contact Bookora Support with enough information to identify your request without unnecessary sensitive data.']]],
'seller-guidelines':['Creator & Author Publishing Guidelines','Creator Guide','Practical publishing requirements for Bookora creators.',[
['Original work','Submit only material you have the legal right to publish or promote. Do not upload pirated, leaked, stolen or unauthorized copies.'],
['Accurate metadata','Use a clear title, author, useful description, correct category and truthful pricing. Metadata should match the publication.'],
['PDF and covers','Provide a valid readable book file and required cover assets. Avoid corrupted files, misleading covers and prohibited content.'],
['Quality review','Bookora may validate submitted information and assets. A submission can require correction or administrative review before publication.'],
['External listings','Submit only external sales pages you are authorized to promote. External checkout and refund rules remain the publisher’s responsibility.'],
['Creator responsibility','Keep listings accurate and respond to legitimate platform requests about ownership, metadata, quality or policy compliance.']]]
};

export function renderStaticPage(pageType){
 const x=P[pageType]||P.help; const [title,badge,desc,sections]=x;
 updateSEO({title,description:desc});
 return `<main class="static-page bookora-doc-page"><div class="container"><article class="bookora-doc-card"><span class="badge badge-bookora">${badge}</span><h1>${title}</h1><p class="bookora-doc-intro">${desc}</p><div class="bookora-doc-sections">${sections.map(s=>`<section><h2>${s[0]}</h2><p>${s[1]}</p></section>`).join('')}</div><div class="bookora-doc-actions"><a href="#/" class="btn btn-secondary btn-sm">← Home</a><a href="#/help" class="btn btn-primary btn-sm">Help Center</a><a href="#/contact" class="btn btn-secondary btn-sm">Contact Support</a></div></article></div></main>`;
}
