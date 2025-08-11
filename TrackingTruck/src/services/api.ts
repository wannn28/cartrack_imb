import axios from 'axios';
import { env } from '../config/environment';
import type { 
  BackendApiResponse,
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  User,
  Vehicle,
  CreateVehicleRequest,
  LocationLog,
  CreateLocationLogRequest,
  FuelLog,
  CreateFuelLogRequest,
  FuelStatistics,
  APIKey,
  CreateAPIKeyRequest,
  DateTimeParams
} from '../types';

// Base API configuration
const API_BASE_URL = env.API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          // Handle backend response structure
          const responseData = response.data.data || response.data;
          const { access_token, refresh_token } = responseData;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: LoginRequest): Promise<BackendApiResponse<LoginResponse>> =>
    api.post('/auth/login', data).then(res => res.data),
    
  register: (data: RegisterRequest): Promise<BackendApiResponse<User>> =>
    api.post('/auth/register', data).then(res => res.data),
    
  refreshToken: (refreshToken: string): Promise<BackendApiResponse<LoginResponse>> =>
    api.post('/auth/refresh', { refresh_token: refreshToken }).then(res => res.data),
    
  getProfile: (): Promise<BackendApiResponse<User>> =>
    api.get('/user/profile').then(res => res.data),
    
  updateProfile: (data: Partial<User>): Promise<BackendApiResponse<User>> =>
    api.put('/user/profile', data).then(res => res.data),
    
  changePassword: (data: { old_password: string; new_password: string }): Promise<BackendApiResponse<any>> =>
    api.post('/user/change-password', data).then(res => res.data),
};

// Vehicle API
export const vehicleAPI = {
  create: (data: CreateVehicleRequest): Promise<BackendApiResponse<Vehicle>> =>
    api.post('/vehicles', data).then(res => res.data),
    
  getMyVehicles: (): Promise<BackendApiResponse<Vehicle[]>> =>
    api.get('/vehicles').then(res => res.data),
    
  getById: (id: string): Promise<BackendApiResponse<Vehicle>> =>
    api.get(`/vehicles/${id}`).then(res => res.data),
    
  update: (id: string, data: Partial<CreateVehicleRequest>): Promise<BackendApiResponse<Vehicle>> =>
    api.put(`/vehicles/${id}`, data).then(res => res.data),
    
  delete: (id: string): Promise<BackendApiResponse<any>> =>
    api.delete(`/vehicles/${id}`).then(res => res.data),
    
  getLatestLocation: (id: string): Promise<BackendApiResponse<LocationLog>> =>
    api.get(`/vehicles/${id}/latest-location`).then(res => res.data),
    
  getCurrentFuel: (id: string): Promise<BackendApiResponse<FuelLog>> =>
    api.get(`/vehicles/${id}/current-fuel`).then(res => res.data),
    
  getFuelStats: (id: string): Promise<BackendApiResponse<FuelStatistics>> =>
    api.get(`/vehicles/${id}/fuel-stats`).then(res => res.data),
};

// Location API
export const locationAPI = {
  create: (data: CreateLocationLogRequest): Promise<BackendApiResponse<LocationLog>> =>
    api.post('/location-logs', data).then(res => res.data),
    
  realTimeTracking: (data: CreateLocationLogRequest): Promise<BackendApiResponse<LocationLog>> =>
    api.post('/tracking/location', data).then(res => res.data),
    
  getByVehicleId: (vehicleId: string, limit?: number, offset?: number): Promise<BackendApiResponse<LocationLog[]>> =>
    api.get(`/location-logs/vehicle`, { 
      params: { 
        vehicle_id: vehicleId,
        limit: limit || 10000000,
        offset: offset || 0
      } 
    }).then(res => res.data),
    
  // Enhanced method for massive data retrieval
  getAllLocationLogs: (vehicleId: string, dateParams?: DateTimeParams): Promise<BackendApiResponse<LocationLog[]>> =>
    api.get('/location-logs/vehicle', {
      params: {
        vehicle_id: vehicleId,
        start_date: dateParams?.start_date,
        end_date: dateParams?.end_date,
        start_time: dateParams?.start_time,
        end_time: dateParams?.end_time,
        limit: dateParams?.limit || 10000000000,
        offset: dateParams?.offset || 0
      }
    }).then(res => res.data),

  getAllLocationLogsForAllVehicles: (dateParams?: DateTimeParams): Promise<BackendApiResponse<LocationLog[]>> =>
    api.get('/location-logs', {
      params: {
        start_date: dateParams?.start_date,
        end_date: dateParams?.end_date,
        start_time: dateParams?.start_time,
        end_time: dateParams?.end_time,
        limit: dateParams?.limit || 1000000,
        offset: dateParams?.offset || 0
      }
    }).then(res => res.data),
};

// Fuel API
export const fuelAPI = {
  create: (data: CreateFuelLogRequest): Promise<BackendApiResponse<FuelLog>> =>
    api.post('/fuel-logs', data).then(res => res.data),
    
  getByVehicleId: (vehicleId: string): Promise<BackendApiResponse<FuelLog[]>> =>
    api.get('/fuel-logs', { params: { vehicle_id: vehicleId } }).then(res => res.data),
};

// API Key API
export const apiKeyAPI = {
  create: (data: CreateAPIKeyRequest): Promise<BackendApiResponse<APIKey>> =>
    api.post('/api-keys', data).then(res => res.data),
    
  getAll: (): Promise<BackendApiResponse<APIKey[]>> =>
    api.get('/api-keys').then(res => res.data),
    
  getById: (id: string): Promise<BackendApiResponse<APIKey>> =>
    api.get(`/api-keys/${id}`).then(res => res.data),
    
  update: (id: string, data: Partial<CreateAPIKeyRequest>): Promise<BackendApiResponse<APIKey>> =>
    api.put(`/api-keys/${id}`, data).then(res => res.data),
    
  delete: (id: string): Promise<BackendApiResponse<any>> =>
    api.delete(`/api-keys/${id}`).then(res => res.data),
    
  getByUserId: (): Promise<BackendApiResponse<APIKey[]>> =>
    api.get('/user/api-keys').then(res => res.data),
};

// Admin API
export const adminAPI = {
  getAllUsers: (): Promise<BackendApiResponse<User[]>> =>
    api.get('/admin/users').then(res => res.data),
    
  getUserById: (id: string): Promise<BackendApiResponse<User>> =>
    api.get(`/admin/users/${id}`).then(res => res.data),
    
  deleteUser: (id: string): Promise<BackendApiResponse<any>> =>
    api.delete(`/admin/users/${id}`).then(res => res.data),
    
  getAllVehicles: (): Promise<BackendApiResponse<Vehicle[]>> =>
    api.get('/admin/vehicles').then(res => res.data),
};

export default api;