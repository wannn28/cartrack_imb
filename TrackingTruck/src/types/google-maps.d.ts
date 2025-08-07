// Google Maps type definitions
declare global {
  interface Window {
    google: typeof google;
  }
}

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
  title?: string;
}

export interface RouteOptions {
  origin: MapLocation;
  destination: MapLocation;
  waypoints?: MapLocation[];
  travelMode?: google.maps.TravelMode;
}

export interface RoutePath {
  path: Array<{ lat: number; lng: number }>;
  distance: number;
  duration: number;
}

export interface VehicleRouteData {
  vehicle: any;
  locationLogs: any[];
  locations: MapLocation[];
  routeOptions: RouteOptions;
  routePath?: RoutePath; // New field for Google Directions API route
  color: string;
  isVisible: boolean;
}

export interface ReplayPosition {
  vehicle: any;
  position: { lat: number; lng: number };
  speed: number;
  color: string;
  timestamp: string;
  direction?: number;
  checkpoint?: number;
  time?: string;
}

export interface ReplayData {
  currentPositions: ReplayPosition[];
  isPlaying: boolean;
  currentTime: number;
  totalTime: number;
}

export interface GoogleMapsProps {
  center?: MapLocation;
  zoom?: number;
  height?: string;
  width?: string;
  locations?: MapLocation[];
  showRoute?: boolean;
  routeOptions?: RouteOptions;
  routePath?: RoutePath;
  onLocationClick?: (location: MapLocation) => void;
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  vehicleInfo?: {
    plateNumber?: string;
    currentSpeed?: number;
  };
  allVehicleRoutes?: VehicleRouteData[];
  replayData?: ReplayData;
}

export {};