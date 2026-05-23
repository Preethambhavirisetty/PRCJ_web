import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';
export const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});
// ── Token helpers ──────────────────────────────────────────────────────────
function getAccessToken() {
    if (typeof window === 'undefined')
        return null;
    return localStorage.getItem('prcj_access');
}
function getRefreshToken() {
    if (typeof window === 'undefined')
        return null;
    return localStorage.getItem('prcj_refresh');
}
function setTokens(access, refresh) {
    localStorage.setItem('prcj_access', access);
    localStorage.setItem('prcj_refresh', refresh);
}
export function clearTokens() {
    localStorage.removeItem('prcj_access');
    localStorage.removeItem('prcj_refresh');
}
// ── Request interceptor — attach access token ──────────────────────────────
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
    return config;
});
// ── Response interceptor — auto-refresh on 401 ────────────────────────────
let isRefreshing = false;
let failQueue = [];
function processQueue(error, token = null) {
    failQueue.forEach(({ resolve, reject }) => {
        if (error)
            reject(error);
        else
            resolve(token);
    });
    failQueue = [];
}
api.interceptors.response.use((res) => res, async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failQueue.push({ resolve, reject });
            }).then((token) => {
                original.headers.Authorization = `Bearer ${token}`;
                return api(original);
            });
        }
        original._retry = true;
        isRefreshing = true;
        const refresh = getRefreshToken();
        if (!refresh) {
            clearTokens();
            window.location.href = '/auth/login';
            return Promise.reject(error);
        }
        try {
            const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
                refresh_token: refresh,
            });
            const newAccess = data.data.access_token;
            const newRefresh = data.data.refresh_token;
            setTokens(newAccess, newRefresh);
            processQueue(null, newAccess);
            original.headers.Authorization = `Bearer ${newAccess}`;
            return api(original);
        }
        catch (refreshError) {
            processQueue(refreshError, null);
            clearTokens();
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
        }
        finally {
            isRefreshing = false;
        }
    }
    return Promise.reject(error);
});
// ── API helpers ────────────────────────────────────────────────────────────
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (payload) => api.post('/auth/register', payload),
    logout: () => api.post('/auth/logout'),
    refreshToken: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
    getMe: () => api.get('/auth/me'),
    sendOtp: (email) => api.post('/auth/otp/send', { email }),
    verifyOtp: (email, otp) => api.post('/auth/otp/verify', { email, otp }),
    changePassword: (current, new_password) => api.post('/auth/change-password', { current_password: current, new_password }),
};
export const productsAPI = {
    list: (params) => api.get('/products', { params }),
    get: (slug) => api.get(`/products/${slug}`),
    getModel3D: (slug) => api.get(`/products/${slug}/3d`),
    getFeatured: () => api.get('/products', { params: { is_featured: true, page_size: 8 } }),
    getNewArrivals: () => api.get('/products', { params: { is_new_arrival: true, page_size: 8 } }),
    getBestSellers: () => api.get('/products', { params: { is_best_seller: true, page_size: 8 } }),
};
export const categoriesAPI = {
    tree: () => api.get('/categories'),
    list: () => api.get('/categories'),
    get: (slug) => api.get(`/categories/${slug}`),
};
export const cartAPI = {
    get: () => api.get('/cart'),
    add: (product_id, quantity, variant_id) => api.post('/cart/items', { product_id, quantity, variant_id }),
    update: (item_id, quantity) => api.put(`/cart/items/${item_id}`, { quantity }),
    remove: (item_id) => api.delete(`/cart/items/${item_id}`),
    clear: () => api.delete('/cart'),
    applyCoupon: (code) => api.post('/cart/coupon', { code }),
    removeCoupon: () => api.delete('/cart/coupon'),
};
export const ordersAPI = {
    create: (payload) => api.post('/orders', payload),
    list: (params) => api.get('/orders', { params }),
    get: (id) => api.get(`/orders/${id}`),
    verifyPayment: (payload) => api.post('/orders/verify-payment', payload),
};
export const wishlistAPI = {
    get: () => api.get('/wishlist'),
    add: (product_id) => api.post('/wishlist/items', { product_id }),
    remove: (product_id) => api.delete(`/wishlist/items/${product_id}`),
};
export const reviewsAPI = {
    forProduct: (product_id, params) => api.get(`/reviews/${product_id}`, { params }),
    create: (payload) => api.post('/reviews', payload),
    update: (id, payload) => api.put(`/reviews/${id}`, payload),
    delete: (id) => api.delete(`/reviews/${id}`),
};
export const tryonAPI = {
    createSession: (product_id) => api.post('/tryon/session', { product_id }),
    detectLandmarks: (session_id, frame_b64) => api.post('/tryon/detect', { session_id, frame_base64: frame_b64 }),
    adjustSession: (session_id, adjustments) => api.put(`/tryon/session/${session_id}/adjust`, adjustments),
    saveScreenshot: (session_id, screenshot_url) => api.post(`/tryon/session/${session_id}/screenshot`, { screenshot_url }),
    getHistory: () => api.get('/tryon/history'),
};
export const usersAPI = {
    getProfile: () => api.get('/users/me'),
    updateProfile: (payload) => api.put('/users/me', payload),
    listAddresses: () => api.get('/users/me/addresses'),
    addAddress: (payload) => api.post('/users/me/addresses', payload),
    updateAddress: (id, payload) => api.put(`/users/me/addresses/${id}`, payload),
    deleteAddress: (id) => api.delete(`/users/me/addresses/${id}`),
    setDefaultAddress: (id) => api.post(`/users/me/addresses/${id}/default`),
};
export const adminAPI = {
    dashboard: () => api.get('/admin/dashboard'),
    analytics: {
        sales: (period = '30d') => api.get('/admin/analytics/sales', { params: { period } }),
        topProducts: (period = '30d') => api.get('/admin/analytics/top-products', { params: { period } }),
        topCategories: (period = '30d') => api.get('/admin/analytics/top-categories', { params: { period } }),
    },
    products: {
        list: (params) => api.get('/admin/products', { params }),
        get: (id) => api.get(`/admin/products/${id}`),
        create: (payload) => api.post('/admin/products', payload),
        update: (id, payload) => api.put(`/admin/products/${id}`, payload),
        delete: (id) => api.delete(`/admin/products/${id}`),
        uploadImage: (product_id, formData) => api.post(`/admin/products/${product_id}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    },
    orders: {
        list: (params) => api.get('/admin/orders', { params }),
        get: (id) => api.get(`/admin/orders/${id}`),
        updateStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
    },
    users: {
        list: (params) => api.get('/admin/users', { params }),
        get: (id) => api.get(`/admin/users/${id}`),
        toggleActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
    },
    reviews: {
        list: (params) => api.get('/admin/reviews', { params }),
        approve: (id) => api.patch(`/admin/reviews/${id}/approve`),
        reject: (id) => api.patch(`/admin/reviews/${id}/reject`),
        delete: (id) => api.delete(`/admin/reviews/${id}`),
    },
    coupons: {
        list: () => api.get('/admin/coupons'),
        create: (payload) => api.post('/admin/coupons', payload),
        update: (id, payload) => api.put(`/admin/coupons/${id}`, payload),
        delete: (id) => api.delete(`/admin/coupons/${id}`),
    },
    categories: {
        list: () => api.get('/admin/categories'),
        create: (payload) => api.post('/admin/categories', payload),
        update: (id, payload) => api.put(`/admin/categories/${id}`, payload),
        delete: (id) => api.delete(`/admin/categories/${id}`),
    },
};
