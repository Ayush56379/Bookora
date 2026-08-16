// Dynamic SEO and Structured Data manager for Bookora

export function updateSEO({ title, description, image, canonical, schemaData }) {
  // Document Title
  const baseTitle = 'Bookora — Discover. Read. Publish.';
  document.title = title ? `${title} | Bookora` : baseTitle;

  // Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description || 'Bookora is a premium eBook marketplace where you can discover, buy, read, and publish world-class eBooks.';

  // Canonical URL
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.rel = 'canonical';
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.href = canonical || window.location.href;

  // OpenGraph Meta Tags
  setMetaTag('og:title', title ? `${title} | Bookora` : baseTitle);
  setMetaTag('og:description', description || metaDesc.content);
  setMetaTag('og:url', window.location.href);
  setMetaTag('og:type', schemaData ? 'book' : 'website');
  if (image) setMetaTag('og:image', image);

  // JSON-LD Structured Data
  let scriptSchema = document.getElementById('json-ld-schema');
  if (!scriptSchema) {
    scriptSchema = document.createElement('script');
    scriptSchema.id = 'json-ld-schema';
    scriptSchema.type = 'application/ld+json';
    document.head.appendChild(scriptSchema);
  }

  if (schemaData) {
    scriptSchema.textContent = JSON.stringify(schemaData);
  } else {
    // Default Organization Schema
    scriptSchema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Bookora',
      'url': 'https://bookora.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': 'https://bookora.com/#/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    });
  }
}

function setMetaTag(property, content) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}
