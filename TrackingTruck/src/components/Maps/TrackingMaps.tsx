import React, { useState, useEffect, useRef } from 'react';
import GoogleMaps from './GoogleMaps';
import { vehicleAPI, locationAPI } from '../../services/api';
import { directionsJSService } from '../../services/directions-js';
import type { Vehicle, LocationLog } from '../../types';
import type { MapLocation, RouteOptions, RoutePath } from '../../types/google-maps';
import { 
  Route, 
  Navigation, 
  Truck, 
  RefreshCw, 
  Calendar,
  Clock,
  BarChart3,
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Zap,
  Car
} from 'lucide-react';

const TrackingMaps: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [locationLogs, setLocationLogs] = useState<LocationLog[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [showRoute, setShowRoute] = useState(true);
  const [routeOptions, setRouteOptions] = useState<RouteOptions | undefined>();
  const [routePath, setRoutePath] = useState<RoutePath | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<MapLocation>({ lat: -6.200000, lng: 106.816666 });
  const [directionsStatus, setDirectionsStatus] = useState<'idle' | 'working' | 'success' | 'failed'>('idle');
  const [dataStats, setDataStats] = useState({
    totalLogs: 0,
    dateRange: { start: '', end: '' },
    avgSpeed: 0,
    totalDistance: 0
  });

  // Replay controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(1);
  const [totalCheckpoints, setTotalCheckpoints] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showReplay, setShowReplay] = useState(false);
  
  const intervalRef = useRef<number | null>(null);

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
    
    // Test Google Directions API
    directionsJSService.testDirectionsAPI().then((isWorking: boolean) => {
      if (!isWorking) {
        console.warn('⚠️ Google Directions API is not working properly');
      }
    });
  }, []);

  // Fetch location logs when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      // Reset all vehicle-related state when selecting a new vehicle
      setLocationLogs([]);
      setMapLocations([]);
      setRouteOptions(undefined);
      setRoutePath(undefined);
      setShowRoute(true);
      setDirectionsStatus('idle');
      setCurrentCheckpoint(1);
      setIsPlaying(false);
      setShowReplay(false);
      
      // Fetch location logs for the selected vehicle
      fetchLocationLogs(selectedVehicle);
    }
  }, [selectedVehicle]);

  // Update map locations when location logs change
  useEffect(() => {
    if (locationLogs.length > 0) {
      // Sort logs by timestamp ascending (oldest first for route) - same as AllVehiclesMap
      const sortedLogs = locationLogs.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const locations: MapLocation[] = sortedLogs.map((log, index) => ({
        lat: log.latitude,
        lng: log.longitude,
        title: `Lokasi ${index + 1}`,
        address: `${new Date(log.timestamp).toLocaleString('id-ID')} - ${log.speed || 0} km/h`
      }));
      
      setMapLocations(locations);
      setTotalCheckpoints(locationLogs.length);
      
      // Set map center to the latest location (last in sorted array)
      const latestLog = sortedLogs[sortedLogs.length - 1];
      setMapCenter({
        lat: latestLog.latitude,
        lng: latestLog.longitude
      });

      // Calculate statistics
      calculateDataStats(locationLogs);
      
      // Handle different cases based on number of locations
      if (locations.length === 0) {
        // No locations - clear route data
        setRouteOptions(undefined);
        setRoutePath(undefined);
        setShowRoute(false);
        setDirectionsStatus('idle');
        console.log('📍 No locations available');
      } else if (locations.length === 1) {
        // Single location - show marker only, no route
        setRouteOptions(undefined);
        setRoutePath(undefined);
        setShowRoute(false);
        setDirectionsStatus('idle');
        console.log('📍 Single location - showing marker only');
      } else {
        // Multiple locations - process route
        console.log(`📍 ${locations.length} locations - processing route`);
        processRouteForVehicle(locations);
      }
    }
  }, [locationLogs]);

  // Handle replay playback
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying && locationLogs.length > 0) {
      // Calculate interval based on playback speed
      const intervalMs = 1000 / playbackSpeed;
      
      const interval = setInterval(() => {
        setCurrentCheckpoint(prev => {
          const next = prev + 1;
          if (next > totalCheckpoints) {
            setIsPlaying(false);
            return totalCheckpoints;
          }
          return next;
        });
      }, intervalMs);
      
      intervalRef.current = interval;
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isPlaying, totalCheckpoints, playbackSpeed, locationLogs.length]);

  const fetchVehicles = async () => {
    try {
      setIsLoadingVehicles(true);
      const response = await vehicleAPI.getMyVehicles();
      if (response.meta.code === 200 && response.data) {
        setVehicles(response.data);
        if (response.data.length > 0) {
          setSelectedVehicle(response.data[0].id);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const fetchLocationLogs = async (vehicleId: string) => {
    try {
      console.log(`🚗 Fetching location logs for vehicle ID: ${vehicleId}`);
      setIsLoading(true);
      setError('');
      
      // Use the enhanced API method with high limit
      const response = await locationAPI.getAllLocationLogs(vehicleId);
      
      if (response.meta.code === 200 && response.data) {
        console.log(`✅ Successfully fetched ${response.data.length} location logs for vehicle ${vehicleId}`);
        
        // Sort by timestamp descending (newest first)
        const sortedLogs = response.data.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLocationLogs(sortedLogs);
      } else {
        console.warn(`⚠️ No location data found for vehicle ${vehicleId}`);
        setError('No location data found for this vehicle');
        setLocationLogs([]);
      }
    } catch (err: any) {
      console.error(`❌ Error fetching location logs for vehicle ${vehicleId}:`, err);
      setError(err.response?.data?.message || 'Failed to fetch location logs');
      setLocationLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDataStats = (logs: LocationLog[]) => {
    if (logs.length === 0) return;

    const totalLogs = logs.length;
    const dates = logs.map(log => new Date(log.timestamp));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const speeds = logs.filter(log => log.speed && log.speed > 0).map(log => log.speed || 0);
    const avgSpeed = speeds.length > 0 ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length : 0;
    
    // Simple distance calculation between consecutive points
    let totalDistance = 0;
    for (let i = 1; i < logs.length; i++) {
      const lat1 = logs[i-1].latitude;
      const lon1 = logs[i-1].longitude;
      const lat2 = logs[i].latitude;
      const lon2 = logs[i].longitude;
      
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      totalDistance += distance;
    }

    setDataStats({
      totalLogs,
      dateRange: {
        start: startDate.toLocaleDateString('id-ID'),
        end: endDate.toLocaleDateString('id-ID')
      },
      avgSpeed: Math.round(avgSpeed * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100
    });
  };

  const processRouteForVehicle = async (locations: MapLocation[]) => {
    console.log('🔍 processRouteForVehicle called with locations:', locations.length);
    
    if (locations.length >= 2) {
      setIsLoading(true);
      setDirectionsStatus('working');
      
      try {
        // Create route options for fallback - same logic as AllVehiclesMap
        const origin = locations[0]; // First location (oldest)
        const destination = locations[locations.length - 1]; // Last location (newest)
        const waypoints = locations.slice(1, -1).slice(0, 8); // Max 8 waypoints for Google Maps

        console.log('📍 Route points:', {
          origin: `${origin.lat}, ${origin.lng}`,
          destination: `${destination.lat}, ${destination.lng}`,
          waypointsCount: waypoints.length
        });

        setRouteOptions({
          origin,
          destination,
          waypoints,
          travelMode: google.maps?.TravelMode?.DRIVING || 'DRIVING' as any
        });

        // Get Google Directions API route
        console.log(`🚗 Getting directions for vehicle ${selectedVehicleData?.plate_number} with ${locations.length} points`);
        const directionsResult = await directionsJSService.getRouteForPoints(locations);
        
        if (directionsResult) {
          setRoutePath(directionsResult);
          setDirectionsStatus('success');
          console.log(`✅ Successfully got route for ${selectedVehicleData?.plate_number}:`, {
            distance: directionsResult.distance,
            duration: directionsResult.duration,
            pathPoints: directionsResult.path.length
          });
        } else {
          setRoutePath(undefined);
          setDirectionsStatus('failed');
          console.warn(`❌ Failed to get route for ${selectedVehicleData?.plate_number}, using direct path`);
        }
        
        setShowRoute(true);
        console.log('🎯 Route display enabled');
      } catch (error) {
        console.error(`💥 Error getting directions for ${selectedVehicleData?.plate_number}:`, error);
        setRoutePath(undefined);
        setDirectionsStatus('failed');
        setShowRoute(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('⚠️ Not enough locations for route:', locations.length);
    }
  };

  const handleShowRoute = async () => {
    // This is now just a wrapper for the button click
    await processRouteForVehicle(mapLocations);
  };

  const handleRefresh = () => {
    if (selectedVehicle) {
      fetchLocationLogs(selectedVehicle);
    }
  };

  const handleExportData = () => {
    if (locationLogs.length === 0) return;
    
    const csvContent = [
      ['Timestamp', 'Latitude', 'Longitude', 'Speed (km/h)', 'Direction'],
      ...locationLogs.map(log => [
        new Date(log.timestamp).toLocaleString('id-ID'),
        log.latitude.toString(),
        log.longitude.toString(),
        (log.speed || 0).toString(),
        (log.direction || 0).toString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vehicle_tracking_${selectedVehicleData?.plate_number || 'data'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Replay controls
  const toggleReplay = () => {
    setShowReplay(!showReplay);
    if (!showReplay) {
      setCurrentCheckpoint(1);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetReplay = () => {
    setCurrentCheckpoint(1);
    setIsPlaying(false);
  };

  const skipToEnd = () => {
    setCurrentCheckpoint(totalCheckpoints);
    setIsPlaying(false);
  };

  const changePlaybackSpeed = () => {
    const speeds = [1, 2, 4, 8];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  // Get current positions for replay
  const getCurrentPositions = () => {
    if (locationLogs.length === 0) return [];

    // Sort logs by timestamp ascending (oldest first) - same as AllVehiclesMap
    const sortedLogs = locationLogs.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (currentCheckpoint === 1) {
      const firstLog = sortedLogs[0]; // First log (oldest)
      return [{
        vehicle: selectedVehicleData,
        position: { lat: firstLog.latitude, lng: firstLog.longitude },
        speed: firstLog.speed || 0,
        color: '#FF0000',
        timestamp: firstLog.timestamp,
        direction: firstLog.direction || 0,
        checkpoint: 1,
        time: new Date(firstLog.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }];
    }
    
    // Return positions up to the current checkpoint (from oldest to newest)
    const relevantLogs = sortedLogs.slice(0, currentCheckpoint);
    
    return relevantLogs.map((log, index) => ({
      vehicle: selectedVehicleData,
      position: { lat: log.latitude, lng: log.longitude },
      speed: log.speed || 0,
      color: '#FF0000',
      timestamp: log.timestamp,
      direction: log.direction || 0,
      checkpoint: index + 1,
      time: new Date(log.timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }));
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  if (isLoadingVehicles) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-gray-600">Loading vehicles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-Time Vehicle Tracking</h1>
        <p className="text-gray-600">Monitor vehicle movements and analyze tracking data</p>
      </div>

      {/* Google Directions API Status */}
      {directionsStatus !== 'idle' && (
        <div className={`mb-4 p-3 rounded-lg border ${
          directionsStatus === 'working' ? 'bg-blue-50 border-blue-200' :
          directionsStatus === 'success' ? 'bg-green-50 border-green-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {directionsStatus === 'working' && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            )}
            {directionsStatus === 'success' && (
              <div className="w-4 h-4 bg-green-500 rounded-full" />
            )}
            {directionsStatus === 'failed' && (
              <div className="w-4 h-4 bg-red-500 rounded-full" />
            )}
            <span className={`text-sm font-medium ${
              directionsStatus === 'working' ? 'text-blue-700' :
              directionsStatus === 'success' ? 'text-green-700' :
              'text-red-700'
            }`}>
              {directionsStatus === 'working' && 'Processing Google Directions API...'}
              {directionsStatus === 'success' && '✅ Google Directions API working - routes follow roads'}
              {directionsStatus === 'failed' && '❌ Google Directions API failed - using direct paths'}
            </span>
          </div>
        </div>
      )}

      {/* Vehicle Selection & Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-500" />
              <label className="text-sm font-medium text-gray-700">Select Vehicle:</label>
            </div>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Choose a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.model} - {vehicle.plate_number}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={!selectedVehicle || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={toggleReplay}
              disabled={!selectedVehicle || locationLogs.length === 0}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                showReplay 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              <Car className="w-4 h-4" />
              {showReplay ? 'Hide Replay' : 'Show Replay'}
            </button>
            
            <button
              onClick={handleExportData}
              disabled={locationLogs.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Replay Controls */}
      {showReplay && locationLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={resetReplay}
                disabled={!selectedVehicle}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Reset to beginning"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentCheckpoint(Math.max(1, currentCheckpoint - 1))}
                disabled={!selectedVehicle || currentCheckpoint <= 1}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Previous checkpoint"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <button
                onClick={togglePlayPause}
                disabled={!selectedVehicle}
                className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              
              <button
                onClick={() => setCurrentCheckpoint(Math.min(totalCheckpoints, currentCheckpoint + 1))}
                disabled={!selectedVehicle || currentCheckpoint >= totalCheckpoints}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Next checkpoint"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              
              <button
                onClick={skipToEnd}
                disabled={!selectedVehicle}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Skip to end"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {currentCheckpoint} / {totalCheckpoints}
                </span>
              </div>
              
              <button
                onClick={changePlaybackSpeed}
                disabled={!selectedVehicle}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                title="Change playback speed"
              >
                <Zap className="w-4 h-4" />
                {playbackSpeed}x
              </button>
            </div>
          </div>
          
          {/* Checkpoint Dropdown */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Checkpoint 1</span>
              <span>Checkpoint {totalCheckpoints}</span>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pilih Checkpoint:
              </label>
              <select
                value={currentCheckpoint}
                onChange={(e) => setCurrentCheckpoint(Number(e.target.value))}
                disabled={!selectedVehicle}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {Array.from({ length: totalCheckpoints }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Checkpoint {i + 1}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Checkpoint Visual Dividers */}
            {totalCheckpoints > 0 && (
              <div className="flex items-center justify-between mb-2">
                {Array.from({ length: totalCheckpoints }, (_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div 
                      className={`w-3 h-3 rounded-full border-2 ${
                        i + 1 <= currentCheckpoint 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'bg-gray-200 border-gray-300'
                      }`}
                    />
                    <span className="text-xs text-gray-500 mt-1">{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Connecting Lines */}
            {totalCheckpoints > 1 && (
              <div className="relative mb-2">
                <div className="flex justify-between">
                  {Array.from({ length: totalCheckpoints - 1 }, (_, i) => (
                    <div 
                      key={i} 
                      className={`h-0.5 flex-1 mx-2 ${
                        i + 1 < currentCheckpoint 
                          ? 'bg-blue-500' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Statistics Cards */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{dataStats.totalLogs.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Speed</p>
                <p className="text-2xl font-bold text-gray-900">{dataStats.avgSpeed} km/h</p>
              </div>
              <Navigation className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900">{dataStats.totalDistance} km</p>
              </div>
              <Route className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Date Range</p>
                <p className="text-sm font-medium text-gray-900">{dataStats.dateRange.start}</p>
                <p className="text-sm font-medium text-gray-900">to {dataStats.dateRange.end}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Map Display */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Vehicle Tracking Map
                {selectedVehicleData && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({selectedVehicleData.plate_number})
                  </span>
                )}
              </h2>
                             <div className="flex gap-2">
                 <button
                   onClick={handleShowRoute}
                   disabled={mapLocations.length < 2}
                   className={`px-3 py-2 rounded-md text-sm font-medium ${
                     showRoute 
                       ? 'bg-green-100 text-green-700 border border-green-200' 
                       : mapLocations.length >= 2
                         ? 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                         : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                   }`}
                 >
                   <Route className="w-4 h-4 inline mr-1" />
                   Route
                 </button>
               </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-gray-600">Loading location data...</p>
                </div>
              </div>
            ) : (
              <GoogleMaps
                center={mapCenter}
                zoom={13}
                height="500px"
                locations={showReplay ? [] : mapLocations}
                showRoute={showReplay ? false : showRoute}
                routeOptions={routeOptions}
                routePath={routePath}
                replayData={showReplay ? {
                  currentPositions: getCurrentPositions(),
                  isPlaying,
                  currentTime: currentCheckpoint,
                  totalTime: totalCheckpoints
                } : undefined}
              />
            )}
            
                         {!isLoading && mapLocations.length === 0 && selectedVehicle && (
               <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                 <div className="text-center">
                   <Navigation className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                   <p className="text-gray-600 font-medium">No Location Data</p>
                   <p className="text-sm text-gray-500 mt-1">No tracking data found for this vehicle</p>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Location History */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Locations ({locationLogs.length})
            </h3>
                         <div className="space-y-2 max-h-96 overflow-y-auto">
               {locationLogs
                 .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                 .slice(0, 50)
                 .map((log, index) => (
                 <div key={log.id} className="p-3 bg-gray-50 rounded-md">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center">
                       <Navigation className="w-4 h-4 text-blue-500 mr-2" />
                       <span className="font-medium text-sm">#{index + 1}</span>
                     </div>
                     {log.speed && (
                       <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                         {log.speed} km/h
                       </span>
                     )}
                   </div>
                   <div className="mt-1">
                     <p className="text-xs text-gray-600">
                       <Clock className="w-3 h-3 inline mr-1" />
                       {new Date(log.timestamp).toLocaleString('id-ID')}
                     </p>
                     <p className="text-xs text-gray-500 mt-1">
                       Lat: {log.latitude.toFixed(6)}<br />
                       Lng: {log.longitude.toFixed(6)}
                     </p>
                   </div>
                 </div>
               ))}
              {locationLogs.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No location logs available
                </p>
              )}
              {locationLogs.length > 50 && (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500">
                    Showing first 50 of {locationLogs.length} locations
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingMaps;