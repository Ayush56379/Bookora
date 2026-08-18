import { state } from './state.js';

const originalSetUser = state.setUser.bind(state);
state.setUser = function(user, token = '') {
  originalSetUser(user);
  if (token) {
    this.token = token;
    localStorage.setItem('bookora_auth_token', token);
    localStorage.setItem('bookora_backend_token', token);
  }
};

const cachedToken = localStorage.getItem('bookora_auth_token') || localStorage.getItem('bookora_backend_token') || '';
if (cachedToken) state.token = cachedToken;

state.clearLocalSession = ((originalClear) => function() {
  originalClear.call(this);
  localStorage.removeItem('bookora_backend_token');
})(state.clearLocalSession);
