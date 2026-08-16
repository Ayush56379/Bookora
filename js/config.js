// Bookora - Google Apps Script API

export const API_BASE_URL =
  'https://script.google.com/macros/s/AKfycbzUu9SstSp1ONdUOLb6hAeCtDzlxrvymtf_y2c5ISacPNRYXaJThewGzqbIO0vzQqYfnw/exec';

export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint =
    endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

  const isAbsolute =
    endpoint.startsWith('http://') ||
    endpoint.startsWith('https://');

  const url =
    isAbsolute
      ? endpoint
      : `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (
    options.body &&
    typeof options.body === 'string' &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
}
