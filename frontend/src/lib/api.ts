import axios from 'axios';
import { browser } from '$app/environment';

const api = axios.create({
  baseURL: '/api'
});

export function setAuthToken(t: string | null) {
  if (t) {
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// On client start, set header from localStorage if present
if (browser) {
  const t = localStorage.getItem('token');
  if (t) setAuthToken(t);
}

export default api;
