import { writable } from 'svelte/store';

export const user = writable(null);
export const token = writable(localStorage.getItem('token') || null);

// Update token in localStorage when it changes
token.subscribe(value => {
	if (value) {
		localStorage.setItem('token', value);
	} else {
		localStorage.removeItem('token');
	}
});