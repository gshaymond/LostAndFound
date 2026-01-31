import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import api, { setAuthToken } from '../api';

export const user = writable(null);
export const token = writable<string | null>(browser ? localStorage.getItem('token') : null);

// Update token in localStorage and API header when it changes (only in browser)
if (browser) {
	token.subscribe(value => {
		if (value) {
			localStorage.setItem('token', value);
			setAuthToken(value);
		} else {
			localStorage.removeItem('token');
			setAuthToken(null);
		}
	});
}

// Initialize - if token exists, fetch current user (run on client only)
export const initAuth = async () => {
	if (!browser) return;
	const t = localStorage.getItem('token');
	if (!t) return;
	token.set(t);
	setAuthToken(t);
	try {
		const res = await api.get('/auth/me');
		user.set(res.data.user);
	} catch (err) {
		console.error('Failed to fetch user during init', err);
		token.set(null);
		user.set(null);
		setAuthToken(null);
	}
};

export const login = async (email: string, password: string) => {
	const res = await api.post('/auth/login', { email, password });
	if (res.data?.token) {
		token.set(res.data.token);
		user.set(res.data.user || null);
	}
	return res.data;
};

export const register = async (payload: Record<string, any>) => {
	const res = await api.post('/auth/register', payload);
	if (res.data?.token) {
		token.set(res.data.token);
		user.set(res.data.user || null);
	}
	return res.data;
};

export const logout = () => {
	token.set(null);
	user.set(null);
};