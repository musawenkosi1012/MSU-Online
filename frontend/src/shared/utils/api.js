export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};
