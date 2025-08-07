// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Backend API response structure
export interface BackendApiResponse<T> {
  meta: {
    code: number;
    message: string;
  };
  data: T;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone_number: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Vehicle types
export interface Vehicle {
  id: string;
  user_id: string;
  plate_number: string;
  model: string;
  imei: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleRequest {
  plate_number: string;
  model: string;
  imei?: string;
}

// Location types
export interface LocationLog {
  id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  direction?: number;
  timestamp: string;
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle; // Vehicle data included in response
}

export interface CreateLocationLogRequest {
  vehicle_id?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  direction?: number;
}

// Fuel types
export interface FuelLog {
  id: string;
  vehicle_id: string;
  fuel_level: number;
  fuel_consumed?: number;
  distance_traveled?: number;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFuelLogRequest {
  vehicle_id: string;
  fuel_level: number;
  fuel_consumed?: number;
  distance_traveled?: number;
}

export interface FuelStatistics {
  total_fuel_consumed: number;
  total_distance_traveled: number;
  average_fuel_consumption: number;
  fuel_efficiency: number;
}

// API Key types
export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  key: string;
  is_active: boolean;
  vehicle_id?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  description?: string;
  vehicle_id?: string;
}

// Navigation types
export interface NavItem {
  label: string;
  path: string;
  icon: any;
  roles?: string[];
}