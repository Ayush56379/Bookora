// Bookora runtime settings bridge.
// Firestore-backed branding is applied through explicit branding slots only.
// IMPORTANT: Never replace arbitrary page text with the site description.
import { state } from './state.js';

const DEFAULTS = {
  general: {
    website_name: 'Bookora',
    tagline: 'Discover. Read. Publish.',
    description: 'Bookora is a modern digital eBook marketplace.',
    support_email: 'support@bookora.com',
    contact_email: 'contact@bookora.com'
  },
  branding: