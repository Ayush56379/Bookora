// URL validation and security utility for Bookora

export function validateExternalUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'Please provide a valid sales page URL.' };
  }

  const trimmed = inputUrl.trim();

  // Strict security checks: reject unsafe schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.includes('<script')
  ) {
    return { valid: false, error: 'Security violation: Unsafe URL protocol detected.' };
  }

  try {
    const urlObj = new URL(trimmed);
    
    // Require HTTPS or HTTP (prefer HTTPS)
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return { valid: false, error: 'URL must begin with https:// or http://' };
    }

    const hostname = urlObj.hostname.toLowerCase();
    if (!hostname || !hostname.includes('.')) {
      return { valid: false, error: 'Please enter a complete domain name (e.g. leanpub.com/book).' };
    }

    return {
      valid: true,
      cleanUrl: urlObj.href,
      domain: hostname.replace('www.', ''),
      protocol: urlObj.protocol
    };
  } catch (err) {
    return { valid: false, error: 'Malformed URL. Please check the address and try again.' };
  }
}
