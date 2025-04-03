// frontend/src/lib/api.js
import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth APIs
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Properties APIs
export const getProperties = async () => {
  const response = await api.get('/properties');
  return response.data;
};

export const getPropertyById = async (id) => {
  const response = await api.get(`/properties/${id}`);
  return response.data;
};

export const createProperty = async (propertyData) => {
  console.log('Sending to API with following entries:');
  for (let pair of propertyData.entries()) {
    console.log(pair[0], pair[1] instanceof File ? pair[1].name : pair[1]);
  }

  const response = await api.post('/properties', propertyData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateProperty = async (id, propertyData) => {
  const response = await api.put(`/properties/${id}`, propertyData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteProperty = async (id) => {
  const response = await api.delete(`/properties/${id}`);
  return response.data;
};

// Tenants APIs
export const createTenant = async (tenantData) => {
  const response = await api.post('/tenants', tenantData);
  return response.data;
};

export const getTenants = async (params = {}) => {
  const queryString = Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join('&');

  const url = `/tenants${queryString ? `?${queryString}` : ''}`;
  const response = await api.get(url);
  return response.data;
};

export const getTenantById = async (id) => {
  const response = await api.get(`/tenants/${id}`);
  return response.data;
};

export const updateTenant = async (id, tenantData) => {
  const response = await api.put(`/tenants/${id}`, tenantData);
  return response.data;
};

// Delete a tenant
export const deleteTenant = async (id) => {
  const response = await api.delete(`/tenants/${id}`);
  return response.data;
};

// Landlords APIs
export const getLandlords = async () => {
  const response = await api.get('/properties/landlords/list');
  return response.data;
};

// Units APIs
export const getUnits = async (filters = {}) => {
  const queryParams = new URLSearchParams();

  if (filters.propertyId) queryParams.append('propertyId', filters.propertyId);
  if (filters.status) queryParams.append('status', filters.status);

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : '';
  const response = await api.get(`/units${queryString}`);
  return response.data;
};

export const getUnitById = async (id) => {
  const response = await api.get(`/units/${id}`);
  return response.data;
};

export const createUnit = async (unitData) => {
  const response = await api.post('/units', unitData);
  return response.data;
};

export const updateUnit = async (id, unitData) => {
  const response = await api.put(`/units/${id}`, unitData);
  return response.data;
};

export const deleteUnit = async (id) => {
  const response = await api.delete(`/units/${id}`);
  return response.data;
};

// Leases APIs
export const getLeases = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/leases${queryParams ? `?${queryParams}` : ''}`;
  const response = await api.get(url);
  return response.data;
};

// Get lease by ID
export const getLeaseById = async (id) => {
  const response = await api.get(`/leases/${id}`);
  return response.data;
};

export const createLease = async (leaseData) => {
  const response = await api.post('/leases', leaseData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateLease = async (id, leaseData) => {
  const response = await api.put(`/leases/${id}`, leaseData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get all maintenance requests (filtered by role automatically)
export const getMaintenanceRequests = async (params = {}) => {
  const queryString = Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join('&');

  const url = `/maintenance${queryString ? `?${queryString}` : ''}`;
  const response = await api.get(url);
  return response.data;
};

// Get maintenance request by ID
export const getMaintenanceRequestById = async (id) => {
  const response = await api.get(`/maintenance/${id}`);
  return response.data;
};

// Create a new maintenance request
export const createMaintenanceRequest = async (data) => {
  const response = await api.post('/maintenance', data);
  return response.data;
};

// Update a maintenance request
export const updateMaintenanceRequest = async (id, data) => {
  const response = await api.put(`/maintenance/${id}`, data);
  return response.data;
};

// Payments APIs
// Get all payments - updated to use axios
export const getPayments = async () => {
  const response = await api.get('/payments');
  return response.data;
};

// Get payment by ID
export const getPaymentById = async (id) => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

// Create a new payment
export const createPayment = async (paymentData) => {
  const response = await api.post('/payments', paymentData);
  return response.data;
};

// Update payment status
export const updatePaymentStatus = async (id, status) => {
  const response = await api.put(`/payments/${id}`, { status });
  return response.data;
};
export default api;
