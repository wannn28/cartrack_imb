import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { env } from '../../config/environment';
import type { GoogleMapsProps } from '../../types/google-maps';

const GoogleMaps: React.FC<GoogleMapsProps> = ({
  center = { lat: -6.200000, lng: 106.816666 }, // Default to Jakarta
  zoom = 13,
  height = '400px',
  width = '100%',
  locations = [],
  showRoute = false,
  routeOptions,
  onLocationClick,
  onMapClick,
  vehicleInfo,
  allVehicleRoutes,
  replayData,
}) => {
  // Debug: Check props received
  console.log('=== GOOGLE MAPS DEBUG ===');
  console.log('GoogleMaps received vehicleInfo prop:', vehicleInfo);
  console.log('Plate Number in vehicleInfo:', vehicleInfo?.plateNumber);
  console.log('Speed in vehicleInfo:', vehicleInfo?.currentSpeed);
  console.log('=== END GOOGLE MAPS DEBUG ===');
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const vehicleMarkersRef = useRef<google.maps.Marker[]>([]);
  const vehicleOverlaysRef = useRef<google.maps.OverlayView[]>([]);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: env.GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['geometry'], // Only geometry for polyline calculations
        });

        await loader.load();

        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
          });

          setMap(mapInstance);
          setIsLoaded(true);

          // Initialize polyline for route visualization
          // No need for Directions API - we'll draw direct routes

          // Add click event listener
          if (onMapClick) {
            mapInstance.addListener('click', onMapClick);
          }
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps. Please check your API key.');
      }
    };

    initializeMap();
  }, [center.lat, center.lng, zoom, onMapClick]);

  // Clear all markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // Clear vehicle markers and overlays
  const clearVehicleMarkers = () => {
    vehicleMarkersRef.current.forEach(marker => marker.setMap(null));
    vehicleMarkersRef.current = [];
    vehicleOverlaysRef.current.forEach(overlay => overlay.setMap(null));
    vehicleOverlaysRef.current = [];
  };

  // Calculate bearing between two points for vehicle icon rotation
  const calculateBearing = (start: {lat: number, lng: number}, end: {lat: number, lng: number}) => {
    const startLat = start.lat * Math.PI / 180;
    const startLng = start.lng * Math.PI / 180;
    const endLat = end.lat * Math.PI / 180;
    const endLng = end.lng * Math.PI / 180;

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  };

  // Create vehicle icon with rotation
  const createVehicleIcon = (rotation: number) => {
    return {
      path: 'M0,-15 L-5,-10 L-5,10 L5,10 L5,-10 Z', // Simple car shape
      fillColor: '#FF0000',
      fillOpacity: 1,
      strokeColor: '#000000',
      strokeWeight: 1,
      scale: 1.2,
      rotation: rotation,
      anchor: new google.maps.Point(0, 0),
    };
  };

  // Create custom vehicle marker with text overlay
  const createVehicleMarkerWithText = (position: google.maps.LatLng | google.maps.LatLngLiteral, rotation: number, plateNumber?: string, speed?: number) => {
    if (!map) return null;

    // Create the vehicle icon
    const vehicleMarker = new google.maps.Marker({
      position: position,
      map: map,
      icon: createVehicleIcon(rotation),
      title: `${plateNumber || 'Vehicle'} - ${speed || 0} km/h - Direction: ${Math.round(rotation)}°`,
      zIndex: 1001,
    });

    // Create custom overlay for text labels
    class VehicleInfoOverlay extends google.maps.OverlayView {
      private position: google.maps.LatLng;
      private plateNumber: string;
      private speed: number;
      private div?: HTMLElement;

      constructor(pos: google.maps.LatLng | google.maps.LatLngLiteral, plate: string, spd: number) {
        super();
        this.position = pos instanceof google.maps.LatLng ? pos : new google.maps.LatLng(pos.lat, pos.lng);
        this.plateNumber = plate || 'N/A';
        this.speed = spd || 0;
        console.log('VehicleInfoOverlay constructor - plate:', plate, 'speed:', spd);
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        this.div.style.border = '2px solid #333';
        this.div.style.borderRadius = '6px';
        this.div.style.padding = '4px 8px';
        this.div.style.fontSize = '11px';
        this.div.style.fontWeight = 'bold';
        this.div.style.color = '#000';
        this.div.style.whiteSpace = 'nowrap';
        this.div.style.pointerEvents = 'none';
        this.div.style.zIndex = '1002';
        this.div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        this.div.innerHTML = `
          <div style="text-align: center;">
            <div style="color: #1a73e8; font-size: 11px; font-weight: bold;">${this.plateNumber}</div>
            <div style="color: #ea4335; font-size: 10px; font-weight: bold;">${this.speed} km/h</div>
          </div>
        `;
        
        console.log('Text overlay HTML created with plate:', this.plateNumber);

        const panes = this.getPanes();
        if (panes) {
          panes.overlayLayer.appendChild(this.div);
        }
      }

      draw() {
        if (this.div) {
          const overlayProjection = this.getProjection();
          if (overlayProjection) {
            const point = overlayProjection.fromLatLngToDivPixel(this.position);
            if (point) {
              this.div.style.left = (point.x - 25) + 'px'; // Center horizontally
              this.div.style.top = (point.y + 20) + 'px';  // Position below the icon
            }
          }
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
        }
        this.div = undefined;
      }
    }

    // Create and attach the text overlay
    console.log('Creating overlay with plateNumber:', plateNumber, 'speed:', speed);
    const infoOverlay = new VehicleInfoOverlay(position, plateNumber || 'N/A', speed || 0);
    infoOverlay.setMap(map);

    return { marker: vehicleMarker, overlay: infoOverlay };
  };

  // Monitor vehicleInfo changes
  useEffect(() => {
    console.log('=== VEHICLE INFO CHANGED ===');
    console.log('New vehicleInfo:', vehicleInfo);
    console.log('Plate Number changed to:', vehicleInfo?.plateNumber);
    console.log('Speed changed to:', vehicleInfo?.currentSpeed);
    console.log('=== END VEHICLE INFO CHANGED ===');
  }, [vehicleInfo]);

  // Add markers to map (only when not showing route)
  useEffect(() => {
    if (!map || !isLoaded) return;

    clearMarkers();

    // Only show markers when not displaying a route
    if (!showRoute && locations.length > 0) {
      locations.forEach((location, index) => {
        const marker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map,
          title: location.title || location.address || `Location ${index + 1}`,
          animation: google.maps.Animation.DROP,
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div>
              <h3 class="font-semibold">${location.title || 'Location'}</h3>
              ${location.address ? `<p class="text-sm text-gray-600">${location.address}</p>` : ''}
              <p class="text-xs text-gray-500">Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}</p>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          if (onLocationClick) {
            onLocationClick(location);
          }
        });

        markersRef.current.push(marker);
      });
    }
  }, [map, isLoaded, locations, onLocationClick, showRoute]);

  // Handle routing with simple polyline and directional vehicle icons
  useEffect(() => {
    if (!map || !isLoaded || !showRoute) {
      return;
    }

    // Clear existing polylines and vehicle markers
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    clearVehicleMarkers();

    // If we have multiple vehicle routes, display them all
    if (allVehicleRoutes && allVehicleRoutes.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      allVehicleRoutes.forEach((routeData) => {
        const { origin, destination, waypoints = [] } = routeData.routeOptions;
        
        // Create path from origin → waypoints → destination
        const path = [
          { lat: origin.lat, lng: origin.lng },
          ...waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
          { lat: destination.lat, lng: destination.lng }
        ];

        // Create polyline for this vehicle's route
        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: routeData.color,
          strokeOpacity: 0.8,
          strokeWeight: 6,
        });

        polyline.setMap(map);
        
        // Add vehicle icon with text for current/latest position (end of route)
        if (path.length > 1) {
          const lastPoint = path[path.length - 1];
          const secondLastPoint = path[path.length - 2];
          const finalBearing = calculateBearing(secondLastPoint, lastPoint);
          
          // Get current speed from the latest location data
          const currentSpeed = routeData.locationLogs[routeData.locationLogs.length - 1]?.speed || 0;
          const plateNumber = routeData.vehicle.plate_number;
          
          console.log(`Creating vehicle marker for ${plateNumber} with color ${routeData.color}`);
          
          const vehicleMarkerInfo = createVehicleMarkerWithText(
            lastPoint, 
            finalBearing, 
            plateNumber, 
            currentSpeed
          );
          
          if (vehicleMarkerInfo) {
            vehicleMarkersRef.current.push(vehicleMarkerInfo.marker);
            vehicleOverlaysRef.current.push(vehicleMarkerInfo.overlay);
          }
        }
        
        // Extend bounds to include this route
        path.forEach(point => bounds.extend(point));
      });
      
      // Fit map to show all routes
      map.fitBounds(bounds);
      
    } else if (routeOptions) {
      // Single route display (original logic)
      const { origin, destination, waypoints = [] } = routeOptions;

      // Create path from origin → waypoints → destination
      const path = [
        { lat: origin.lat, lng: origin.lng },
        ...waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
        { lat: destination.lat, lng: destination.lng }
      ];

      // Create polyline for clean route visualization
      polylineRef.current = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#4285F4', // Google Blue
        strokeOpacity: 1.0, // Back to normal opacity
        strokeWeight: 8, // Back to normal thickness
      });

      polylineRef.current.setMap(map);
      
      // Add vehicle icon with text for current/latest position (end of route)
      if (path.length > 1) {
        const lastPoint = path[path.length - 1];
        const secondLastPoint = path[path.length - 2];
        const finalBearing = calculateBearing(secondLastPoint, lastPoint);
        
        // Debug: Check vehicleInfo data
        console.log('=== ROUTE DEBUG ===');
        console.log('GoogleMaps vehicleInfo:', vehicleInfo);
        console.log('Plate Number:', vehicleInfo?.plateNumber);
        console.log('Current Speed:', vehicleInfo?.currentSpeed);
        console.log('Path length:', path.length);
        console.log('Last point:', lastPoint);
        console.log('=== END ROUTE DEBUG ===');
        
        // Get current speed from the latest location data or vehicleInfo
        let currentSpeed = vehicleInfo?.currentSpeed || 0;
        
        // Try to get speed from routeOptions if available
        if (routeOptions && routeOptions.waypoints && routeOptions.waypoints.length > 0) {
          // Check if the last waypoint has speed info in its address
          const lastWaypoint = routeOptions.waypoints[routeOptions.waypoints.length - 1];
          if (lastWaypoint.address) {
            const speedMatch = lastWaypoint.address.match(/(\d+(?:\.\d+)?)\s*km\/h/);
            if (speedMatch) {
              currentSpeed = parseFloat(speedMatch[1]);
            }
          }
        }
        
        // Ensure we have valid plate number data
        const plateNumber = vehicleInfo?.plateNumber || 'BP 9921 DE'; // Fallback to known plate
        const speed = currentSpeed || 0;
        
        console.log('=== CREATING VEHICLE MARKER ===');
        console.log('Using plateNumber:', plateNumber);
        console.log('Using speed:', speed);
        console.log('=== END CREATING VEHICLE MARKER ===');
        
        const vehicleMarkerInfo = createVehicleMarkerWithText(
          lastPoint, 
          finalBearing, 
          plateNumber, 
          speed
        );
        
        if (vehicleMarkerInfo) {
          vehicleMarkersRef.current.push(vehicleMarkerInfo.marker);
          vehicleOverlaysRef.current.push(vehicleMarkerInfo.overlay);
        }
      }
      
      // Clear regular markers for clean route visualization
      clearMarkers();

      // Fit map to show entire route
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);
    }
    
  }, [map, isLoaded, showRoute, routeOptions, allVehicleRoutes]);

  // Handle replay markers
  useEffect(() => {
    if (!map || !isLoaded || !replayData) return;

    // Clear existing vehicle markers and polylines
    clearVehicleMarkers();
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Create historical route polylines for each vehicle
    const bounds = new google.maps.LatLngBounds();
    
    // Group positions by vehicle to create route polylines
    const vehicleGroups = new Map();
    replayData.currentPositions.forEach(position => {
      if (!vehicleGroups.has(position.vehicle.id)) {
        vehicleGroups.set(position.vehicle.id, {
          vehicle: position.vehicle,
          color: position.color,
          positions: []
        });
      }
      vehicleGroups.get(position.vehicle.id).positions.push(position);
    });

    // Create polylines for each vehicle's historical route
    vehicleGroups.forEach((group) => {
      const { color, positions } = group;
      
      if (positions.length > 1) {
        // Sort positions by timestamp to create proper route
        const sortedPositions = positions.sort((a: any, b: any) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Create polyline for this vehicle's route
        const polyline = new google.maps.Polyline({
          path: sortedPositions.map((pos: any) => pos.position),
          geodesic: true,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeWeight: 4,
        });
        
        polyline.setMap(map);
        
        // Extend bounds to include this route
        sortedPositions.forEach((pos: any) => bounds.extend(pos.position));
      }
    });

    // Create markers for current replay positions
    // Only show vehicle icons at the latest position for each vehicle
    const latestPositions = new Map();
    replayData.currentPositions.forEach((position) => {
      const vehicleId = position.vehicle.id;
      const positionTime = new Date(position.timestamp).getTime();
      
      // Keep only the latest position for each vehicle
      if (!latestPositions.has(vehicleId) || 
          positionTime > new Date(latestPositions.get(vehicleId).timestamp).getTime()) {
        latestPositions.set(vehicleId, position);
      }
    });
    
    // Create markers only for the latest positions
    latestPositions.forEach((position) => {
      // Use direction from position data for rotation, fallback to 0 if not available
      const rotation = position.direction || 0;
      
      // Create tooltip content with time and checkpoint info
      const tooltipContent = position.time && position.checkpoint 
        ? `${position.vehicle.plate_number} - ${position.speed} km/h\nCheckpoint ${position.checkpoint}\nWaktu: ${position.time}`
        : `${position.vehicle.plate_number} - ${position.speed} km/h`;
      
      // Create vehicle icon with rotation
      const vehicleMarker = new google.maps.Marker({
        position: position.position,
        map: map,
        icon: {
          path: 'M0,-15 L-5,-10 L-5,10 L5,10 L5,-10 Z', // Simple car shape
          fillColor: position.color,
          fillOpacity: 1,
          strokeColor: '#000000',
          strokeWeight: 1,
          scale: 1.2,
          anchor: new google.maps.Point(0, 0),
          rotation: rotation, // Apply direction rotation
        },
        title: tooltipContent,
        zIndex: 1001,
      });

      // Create text overlay for vehicle info with checkpoint
      class VehicleInfoOverlay extends google.maps.OverlayView {
        private position: google.maps.LatLng;
        private plateNumber: string;
        private speed: number;
        private checkpoint: number;
        private time: string;
        private div?: HTMLElement;

        constructor(pos: google.maps.LatLng | google.maps.LatLngLiteral, plate: string, spd: number, checkpoint: number, time: string) {
          super();
          this.position = pos instanceof google.maps.LatLng ? pos : new google.maps.LatLng(pos.lat, pos.lng);
          this.plateNumber = plate || 'N/A';
          this.speed = spd || 0;
          this.checkpoint = checkpoint || 1;
          this.time = time || '';
        }

        onAdd() {
          this.div = document.createElement('div');
          this.div.style.position = 'absolute';
          this.div.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
          this.div.style.border = '2px solid #333';
          this.div.style.borderRadius = '6px';
          this.div.style.padding = '4px 8px';
          this.div.style.fontSize = '11px';
          this.div.style.fontWeight = 'bold';
          this.div.style.color = '#000';
          this.div.style.whiteSpace = 'nowrap';
          this.div.style.pointerEvents = 'none';
          this.div.style.zIndex = '1002';
          this.div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          
          this.div.innerHTML = `
            <div style="text-align: center;">
              <div style="color: #1a73e8; font-size: 11px; font-weight: bold;">${this.plateNumber}</div>
              <div style="color: #ea4335; font-size: 10px; font-weight: bold;">${this.speed} km/h</div>
              <div style="color: #34a853; font-size: 9px; font-weight: bold;">CP ${this.checkpoint}</div>
              ${this.time ? `<div style="color: #fbbc04; font-size: 9px; font-weight: bold;">${this.time}</div>` : ''}
            </div>
          `;

          const panes = this.getPanes();
          if (panes) {
            panes.overlayLayer.appendChild(this.div);
          }
        }

        draw() {
          if (this.div) {
            const overlayProjection = this.getProjection();
            if (overlayProjection) {
              const point = overlayProjection.fromLatLngToDivPixel(this.position);
              if (point) {
                this.div.style.left = (point.x - 25) + 'px';
                this.div.style.top = (point.y + 20) + 'px';
              }
            }
          }
        }

        onRemove() {
          if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
          }
          this.div = undefined;
        }
      }

      const infoOverlay = new VehicleInfoOverlay(
        position.position, 
        position.vehicle.plate_number, 
        position.speed,
        position.checkpoint || 1,
        position.time || ''
      );
      infoOverlay.setMap(map);

      vehicleMarkersRef.current.push(vehicleMarker);
      vehicleOverlaysRef.current.push(infoOverlay);
    });

    // Fit map to show all replay positions and routes
    if (bounds.isEmpty()) {
      // If no bounds from routes, use current positions
      replayData.currentPositions.forEach(pos => bounds.extend(pos.position));
    }
    map.fitBounds(bounds);

  }, [map, isLoaded, replayData]);

  // Clear route when showRoute is false
  useEffect(() => {
    if (!showRoute) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      clearVehicleMarkers();
    }
  }, [showRoute]);

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg"
        style={{ height, width }}
      >
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Map Error</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        style={{ height, width }}
        className="rounded-lg border border-gray-300 shadow-sm"
      />
      {!isLoaded && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg"
          style={{ height, width }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading Map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMaps;