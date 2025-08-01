// ──────────────────────────────────────────────
//  API Service Layer
// ──────────────────────────────────────────────

const API_BASE = 'http://10.0.100.175:8002/api';

const api = {
    getToken() {
        return localStorage.getItem('access_token');
    },

    getUser() {
        const data = localStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const res = await fetch(url, { ...options, headers });

            // Guard against non-JSON responses (e.g. Django HTML error pages)
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error(
                    res.ok
                        ? 'Server returned an unexpected response format'
                        : `Server error (${res.status}). Please check the backend logs.`
                );
            }

            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401 && endpoint !== '/auth/login/') {
                    this.logout();
                    if (typeof Router !== 'undefined') {
                        Router.navigate('login');
                    } else {
                        window.location.hash = 'login';
                    }
                }
                throw new Error(data.error || data.detail || 'Request failed');
            }
            return data;
        } catch (err) {
            if (err.message !== 'Failed to fetch') {
                throw err;
            }
            throw new Error('Cannot connect to server. Make sure the Django backend is running.');
        }
    },

    // Auth
    async login(username, password) {
        const data = await this.request('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_data', JSON.stringify({
            username: data.username,
            roles: data.roles
        }));
        return data;
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    },

    async forgotPassword(data) {
        return this.request('/auth/forgot-password/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Raw Materials
    async getRawMaterials(offset = 0, limit = 30) {
        return this.request(`/raw-materials/?offset=${offset}&limit=${limit}`);
    },

    async addRawMaterial(data) {
        const user = this.getUser();
        return this.request('/raw-materials/', {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username, user_roles: user?.roles })
        });
    },

    async updateRawMaterial(qcNo, data) {
        const user = this.getUser();
        return this.request(`/raw-materials/${encodeURIComponent(qcNo)}/`, {
            method: 'PUT',
            body: JSON.stringify({ ...data, username: user?.username, user_roles: user?.roles })
        });
    },

    async searchRawMaterials(filters) {
        return this.request('/raw-materials/search/', {
            method: 'POST',
            body: JSON.stringify(filters)
        });
    },

    async markRawMicro(qcNo, data) {
        const user = this.getUser();
        return this.request(`/raw-materials/${encodeURIComponent(qcNo)}/mark-micro/`, {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async markRawReviewed(qcNo, data) {
        const user = this.getUser();
        return this.request(`/raw-materials/${encodeURIComponent(qcNo)}/mark-reviewed/`, {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async generateRawQC() {
        return this.request('/raw-materials/generate-qc/');
    },

    // Packaging Materials
    async getPackagingMaterials(offset = 0, limit = 30) {
        return this.request(`/packaging-materials/?offset=${offset}&limit=${limit}`);
    },

    async addPackagingMaterial(data) {
        const user = this.getUser();
        return this.request('/packaging-materials/', {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username, user_roles: user?.roles })
        });
    },

    async updatePackagingMaterial(qcNo, data) {
        const user = this.getUser();
        return this.request(`/packaging-materials/${encodeURIComponent(qcNo)}/`, {
            method: 'PUT',
            body: JSON.stringify({ ...data, username: user?.username, user_roles: user?.roles })
        });
    },

    async searchPackagingMaterials(filters) {
        return this.request('/packaging-materials/search/', {
            method: 'POST',
            body: JSON.stringify(filters)
        });
    },

    async markPmMicro(qcNo, data) {
        const user = this.getUser();
        return this.request(`/packaging-materials/${encodeURIComponent(qcNo)}/mark-micro/`, {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async markPmReviewed(qcNo, data) {
        const user = this.getUser();
        return this.request(`/packaging-materials/${encodeURIComponent(qcNo)}/mark-reviewed/`, {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async generatePackagingQC() {
        return this.request('/packaging-materials/generate-qc/');
    },

    // Finished Products
    async getFinishedProducts(offset = 0, limit = 30) {
        return this.request(`/finished-products/?offset=${offset}&limit=${limit}`);
    },

    async addFinishedProduct(data) {
        const user = this.getUser();
        return this.request('/finished-products/', {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async updateFinishedProduct(qcNo, data) {
        const user = this.getUser();
        return this.request(`/finished-products/${encodeURIComponent(qcNo)}/`, {
            method: 'PUT',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async markReviewed(qcNo, data) {
        const user = this.getUser();
        return this.request(`/finished-products/${encodeURIComponent(qcNo)}/mark-reviewed/`, {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async markMicro(qcNo, data) {
        const user = this.getUser();
        return this.request(`/finished-products/${encodeURIComponent(qcNo)}/mark-micro/`, {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async searchFinishedProducts(filters) {
        return this.request('/finished-products/search/', {
            method: 'POST',
            body: JSON.stringify(filters)
        });
    },

    async generateFinishedQC() {
        return this.request('/finished-products/generate-qc/');
    },

    // Products
    async getProducts(search = '', criteria = 'ProductName', category = '') {
        return this.request(`/products/?search=${encodeURIComponent(search)}&criteria=${criteria}&category=${category}`);
    },

    async addProduct(data) {
        return this.request('/products/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateProduct(id, data) {
        return this.request(`/products/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Users
    async getUsers() {
        return this.request('/users/');
    },

    async addUser(data) {
        return this.request('/users/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async deleteUser(id) {
        return this.request(`/users/${id}/`, { method: 'DELETE' });
    },

    // Audit Trail
    async getAuditTrail(params = {}) {
        const q = new URLSearchParams(params);
        return this.request(`/audit-trail/?${q.toString()}`);
    },

    // Yearly Reports
    async getYearlyReport(category, year, offset = 0, limit = 30, search = '') {
        return this.request(`/yearly-reports/${category}/?year=${year}&offset=${offset}&limit=${limit}&search=${encodeURIComponent(search)}`);
    },

    // Product Names for dropdowns
    async getProductNames(category = '', search = '') {
        return this.request(`/product-names/?category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}`);
    },

    // Server time (for pre-filling entry forms with server datetime)
    async getServerTime() {
        return this.request('/server-time/');
    },

    async exportData(filters) {
        const token = localStorage.getItem('access_token');
        const resp = await fetch(`${API_BASE}/export/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(filters)
        });
        if (!resp.ok) {
            const text = await resp.text();
            try {
                const err = JSON.parse(text);
                throw new Error(err.error || 'Export failed');
            } catch {
                throw new Error('Export failed: ' + text.slice(0, 200));
            }
        }
        return resp.blob();
    },

    async exportDataJson(filters) {
        return this.request('/export/', { method: 'POST', body: JSON.stringify(filters) });
    }
};
