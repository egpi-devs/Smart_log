// ──────────────────────────────────────────────
//  API Service Layer
// ──────────────────────────────────────────────

const API_BASE = '/api';

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

    ////////////////////////////////////////////////////
    startAutoLogoutTimer() {
        if (this.logoutTimer) {
            clearTimeout(this.logoutTimer);
        }

        this.logoutTimer = setTimeout(() => {
            // Directly logout and navigate to login
            App.logout();
        }, 10 * 60 * 1000); // 1 minutes
    },
    //     startAutoLogoutTimer() {
    //     // clear any existing timer
    //     if (this.logoutTimer) {
    //         clearTimeout(this.logoutTimer);
    //     }

    //     // ⏱️ 1 minute = 60000 ms
    //     this.logoutTimer = setTimeout(() => {
    //         this.logout();
    //         router.navigate('/login'); // or '/login'
    //     }, 60 * 1000);
    // },
    ////////////////////////////////////////////////////

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
            console.log("STATUS:", res.status);
            // ✅ 🔥 ADD THIS BLOCK
            if (res.status === 401) {
                App.logout();
                return;
            }
            // if (res.status === 401) {
            //     this.logout();
            //     router.navigate('/login');
            //     // window.location.href = '/auth/login/'; // ✅ frontend route
            //     return;
            // }
            // ✅ 🔥 ADD THIS BLOCK
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
                throw new Error(data.error || data.detail || 'Request failed');
            }

            ///////////////// ✅ HERE (important)
            this.startAutoLogoutTimer();
            //////////////////////////////////
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
        /////
        // ✅ HERE
        this.startAutoLogoutTimer();
        /////
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
        const user = this.getUser();
        const role = user?.roles?.[0] || '';
        return this.request(`/users/?role=${encodeURIComponent(role)}`);
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
        const q = new URLSearchParams(params).toString();
        return this.request(`/audit-trail/?${q}`);
    },

    async getProductionAuditTrail(params = {}) {
        const q = new URLSearchParams(params).toString();
        return this.request(`/production-audit-trail/?${q}`);
    },

    // Yearly Reports
    async getYearlyReport(category, year, offset = 0, limit = 30) {
        return this.request(`/yearly-reports/${category}/?year=${year}&offset=${offset}&limit=${limit}`);
    },

    // Product Names for dropdowns
    async getProductNames(category = '', search = '') {
        return this.request(`/product-names/?category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}`);
    },

    // Server time (for pre-filling entry forms with server datetime)
    async getServerTime() {
        return this.request('/server-time/');
    },

    // ──────────────────────────────────────────────
    // Production Audit (Machines & Sections)
    // ──────────────────────────────────────────────

    async getProductionMachines() {
        return this.request('/production/machines/');
    },

    async addProductionMachine(data) {
        const user = this.getUser();
        return this.request('/production/machines/', {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async deleteProductionMachine(id) {
        const user = this.getUser();
        return this.request('/production/machines/', {
            method: 'DELETE',
            body: JSON.stringify({ id, username: user?.username })
        });
    },

    async getProductionSections() {
        return this.request('/production/sections/');
    },

    async addProductionSection(data) {
        const user = this.getUser();
        return this.request('/production/sections/', {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async deleteProductionSection(id) {
        const user = this.getUser();
        return this.request('/production/sections/', {
            method: 'DELETE',
            body: JSON.stringify({ id, username: user?.username })
        });
    },

    // ──────────────────────────────────────────────
    // Production Products
    // ──────────────────────────────────────────────

    async getProductionProducts(search = '') {
        return this.request(`/production/products/?search=${encodeURIComponent(search)}`);
    },

    async addProductionProduct(data) {
        return this.request('/production/products/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateProductionProduct(id, data) {
        return this.request(`/production/products/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteProductionProduct(id) {
        return this.request(`/production/products/${id}/`, {
            method: 'DELETE'
        });
    },

    // ──────────────────────────────────────────────
    // Production Audit (Logbooks)
    // ──────────────────────────────────────────────

    async getCleaningLogbooks(machine = '', section = '', dateFrom = '', dateTo = '') {
        let url = `/production/cleaning/?machine=${encodeURIComponent(machine)}&section=${encodeURIComponent(section)}`;
        if (dateFrom) url += `&date_from=${encodeURIComponent(dateFrom)}`;
        if (dateTo) url += `&date_to=${encodeURIComponent(dateTo)}`;
        return this.request(url);
    },

    async addCleaningLogbook(data) {
        const user = this.getUser();
        return this.request('/production/cleaning/', {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async updateCleaningLogbook(id, data) {
        const user = this.getUser();
        return this.request(`/production/cleaning/${id}/`, {
            method: 'PUT',
            body: JSON.stringify({ ...data, username: user?.username, roles: user?.roles || [] })
        });
    },

    async deleteCleaningLogbook(id) {
        const user = this.getUser();
        return this.request(`/production/cleaning/${id}/`, {
            method: 'DELETE',
            body: JSON.stringify({ username: user?.username, roles: user?.roles || [] })
        });
    },

    async getOperationLogbooks(machine = '', section = '', dateFrom = '', dateTo = '') {
        let url = `/production/operation/?machine=${encodeURIComponent(machine)}&section=${encodeURIComponent(section)}`;
        if (dateFrom) url += `&date_from=${encodeURIComponent(dateFrom)}`;
        if (dateTo) url += `&date_to=${encodeURIComponent(dateTo)}`;
        return this.request(url);
    },

    async addOperationLogbook(data) {
        const user = this.getUser();
        return this.request('/production/operation/', {
            method: 'POST',
            body: JSON.stringify({ ...data, username: user?.username })
        });
    },

    async updateOperationLogbook(id, data) {
        const user = this.getUser();
        return this.request(`/production/operation/${id}/`, {
            method: 'PUT',
            body: JSON.stringify({ ...data, username: user?.username, roles: user?.roles || [] })
        });
    },

    async deleteOperationLogbook(id) {
        const user = this.getUser();
        return this.request(`/production/operation/${id}/`, {
            method: 'DELETE',
            body: JSON.stringify({ username: user?.username, roles: user?.roles || [] })
        });
    }
};
/////////////////////////////////added//////////
if (api.getToken()) {
    api.startAutoLogoutTimer();
}
/////////////////////////////////added//////////

