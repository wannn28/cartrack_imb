import { env } from '../config/environment';
import type { MapLocation } from '../types/google-maps';

export interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      steps: Array<{
        polyline: {
          points: string;
        };
        start_location: {
          lat: number;
          lng: number;
        };
        end_location: {
          lat: number;
          lng: number;
        };
      }>;
      distance?: {
        value: number;
        text: string;
      };
      duration?: {
        value: number;
        text: string;
      };
    }>;
  }>;
  status: string;
}

export interface RoutePath {
  path: Array<{ lat: number; lng: number }>;
  distance: number;
  duration: number;
}

class DirectionsService {
  private apiKey: string;
  private cache: Map<string, RoutePath> = new Map();

  constructor() {
    this.apiKey = env.GOOGLE_MAPS_API_KEY;
    console.log('DirectionsService initialized with API key:', this.apiKey ? 'Present' : 'Missing');
  }

  /**
   * Generate cache key for route
   */
  private generateCacheKey(points: MapLocation[]): string {
    return points.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');
  }

  /**
   * Get directions between two points using Google Directions API
   */
  async getDirections(
    origin: MapLocation,
    destination: MapLocation,
    waypoints?: MapLocation[]
  ): Promise<RoutePath | null> {
    try {
      // Use Google Maps JavaScript API DirectionsService instead of REST API
      // This avoids CORS issues since it's part of the Google Maps library
      
      if (typeof google === 'undefined' || !google.maps) {
        console.error('Google Maps API not loaded');
        return null;
      }

      const directionsService = new google.maps.DirectionsService();
      
      // Build waypoints array
      const waypointsArray: google.maps.DirectionsWaypoint[] = [];
      if (waypoints && waypoints.length > 0) {
        waypoints.forEach(wp => {
          waypointsArray.push({
            location: new google.maps.LatLng(wp.lat, wp.lng),
            stopover: true
          });
        });
      }

      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        waypoints: waypointsArray,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      };

      console.log('Requesting directions via JavaScript API:', request);

      return new Promise((resolve) => {
        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            console.log('Directions API response:', result);
            const routePath = this.processDirectionsResult(result);
            resolve(routePath);
          } else {
            console.error('Directions API error:', status);
            resolve(null);
          }
        });
      });

    } catch (error) {
      console.error('Error fetching directions:', error);
      return null;
    }
  }



  /**
   * Process directions result from JavaScript API
   */
  private processDirectionsResult(result: google.maps.DirectionsResult): RoutePath | null {
    if (!result.routes || result.routes.length === 0) {
      console.error('No routes found');
      return null;
    }

    // Get the first route
    const route = result.routes[0];
    const path: Array<{ lat: number; lng: number }> = [];

    // Extract path from the route
    if (route.overview_path) {
      route.overview_path.forEach(latLng => {
        path.push({ lat: latLng.lat(), lng: latLng.lng() });
      });
    }

    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;

    route.legs.forEach(leg => {
      if (leg.distance) {
        totalDistance += leg.distance.value;
      }
      if (leg.duration) {
        totalDuration += leg.duration.value;
      }
    });

    return {
      path,
      distance: totalDistance,
      duration: totalDuration
    };
  }

  /**
   * Get directions for multiple waypoints (optimized route)
   */
  async getOptimizedDirections(
    waypoints: MapLocation[]
  ): Promise<RoutePath | null> {
    if (waypoints.length < 2) {
      return null;
    }

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediateWaypoints = waypoints.slice(1, -1);

    return this.getDirections(origin, destination, intermediateWaypoints);
  }

  /**
   * Get directions for a series of points with optimization
   */
  async getRouteForPoints(
    points: MapLocation[]
  ): Promise<RoutePath | null> {
    if (points.length < 2) {
      return null;
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(points);
    if (this.cache.has(cacheKey)) {
      console.log('Using cached route');
      return this.cache.get(cacheKey) || null;
    }

    // If we have too many waypoints, Google Directions API has limits
    // We'll optimize by using fewer waypoints for better performance
    const maxWaypoints = 23; // Google Directions API limit is 23 waypoints
    
    let routePath: RoutePath | null;
    
    if (points.length <= maxWaypoints + 2) {
      // Use all points if within limit
      const origin = points[0];
      const destination = points[points.length - 1];
      const waypoints = points.slice(1, -1);
      
      routePath = await this.getDirections(origin, destination, waypoints);
    } else {
      // For routes with many points, we'll sample key points
      console.log(`Route has ${points.length} points, sampling to ${maxWaypoints} waypoints`);
      
      const origin = points[0];
      const destination = points[points.length - 1];
      
      // Sample waypoints evenly across the route
      const step = Math.floor((points.length - 2) / maxWaypoints);
      const waypoints: MapLocation[] = [];
      
      for (let i = 1; i < points.length - 1; i += step) {
        waypoints.push(points[i]);
        if (waypoints.length >= maxWaypoints) break;
      }
      
      routePath = await this.getDirections(origin, destination, waypoints);
    }

    // Cache the result
    if (routePath) {
      this.cache.set(cacheKey, routePath);
      console.log(`Cached route with ${routePath.path.length} points`);
    }

    return routePath;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Directions cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Test function to verify API is working
   */
  async testDirectionsAPI(): Promise<boolean> {
    try {
      const testOrigin: MapLocation = { lat: -6.200000, lng: 106.816666 }; // Jakarta
      const testDestination: MapLocation = { lat: -6.2088, lng: 106.8456 }; // Jakarta nearby
      
      console.log('Testing Google Directions API...');
      const result = await this.getDirections(testOrigin, testDestination);
      
      if (result) {
        console.log('✅ Google Directions API test successful:', {
          pathLength: result.path.length,
          distance: result.distance,
          duration: result.duration
        });
        return true;
      } else {
        console.log('❌ Google Directions API test failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Google Directions API test error:', error);
      return false;
    }
  }
}

export const directionsService = new DirectionsService();
