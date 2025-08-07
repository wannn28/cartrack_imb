// Environment configuration
export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://trackerapi/api/v1',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'CarTrack',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DEFAULT_FUEL_CAPACITY: parseInt(import.meta.env.VITE_DEFAULT_FUEL_CAPACITY || '50'),
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyD7F5Hp142kNUwP2vr8dVsqGDZ6vrZ73Vs',
} as const;