import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout/', { refresh_token: refreshToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
};

// Trucks API
export const trucksAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/trucks/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/trucks/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/trucks/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/trucks/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/trucks/${id}/`);
    return response.data;
  },
};

// Customers API
export const customersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/customers/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/customers/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/customers/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/customers/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/customers/${id}/`);
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/orders/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/orders/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/orders/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/orders/${id}/`);
    return response.data;
  },
};

// Materials API
export const materialsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/materials/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/materials/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/materials/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/materials/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/materials/${id}/`);
    return response.data;
  },
};

// Dispatches API
export const dispatchesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/dispatches/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/dispatches/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/dispatches/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/dispatches/${id}/`, data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.post(`/dispatches/${id}/update_status/`, { status });
    return response.data;
  },

  assignOperator: async (id, operatorId) => {
    const response = await api.post(`/dispatches/${id}/assign_operator/`, { operator_id: operatorId });
    return response.data;
  },
};

// Exceptions API
export const exceptionsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/exceptions/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/exceptions/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/exceptions/', data);
    return response.data;
  },

  resolve: async (id) => {
    const response = await api.post(`/exceptions/${id}/resolve/`);
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getKPI: async () => {
    const response = await api.get('/dashboard/kpi/');
    return response.data;
  },
};

export default api;
