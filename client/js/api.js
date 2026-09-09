// Relative path — works locally and on whatever domain this is deployed to,
// since the client is now served by the same Express app as the API.
const API_BASE = '/api/v1';

const api = {
    async get(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error?.message || 'API request failed');
        }
        return data.data;
    },

    async post(endpoint, body) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error?.message || 'API request failed');
        }
        return data.data;
    }
};