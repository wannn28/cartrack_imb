import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  // Date range functionality
  const [selectedDateRange, setSelectedDateRange] = useState<'today' | 'yesterday' | 'day_before_yesterday'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Time range functionality
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [timeMode, setTimeMode] = useState<'single' | 'range'>('single');
  const [singleTime, setSingleTime] = useState<string>('');

  // Replay controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(1);
  const [totalCheckpoints, setTotalCheckpoints] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showReplay, setShowReplay] = useState(false);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  
  const intervalRef = useRef<number | null>(null);

  // Get date range based on selection
  const getDateRange = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    switch (selectedDateRange) {
      case 'today':
        return {
          start_date: formatDate(today),
          end_date: formatDate(today)
        };
      case 'yesterday':
        return {
          start_date: formatDate(yesterday),
          end_date: formatDate(yesterday)
        };
      case 'day_before_yesterday':
        return {
          start_date: formatDate(dayBeforeYesterday),
          end_date: formatDate(dayBeforeYesterday)
        };
      default:
        return {
          start_date: formatDate(today),
          end_date: formatDate(today)
        };
    }
  };

  // Get custom date range
  const getCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      return {
        start_date: customStartDate,
        end_date: customEndDate
      };
    }
    return null;
  };

  // Clear time filters and reset data
  const clearTimeFilters = () => {
    setStartTime('');
    setEndTime('');
    setSingleTime('');
    setTimeMode('single');
    if (selectedVehicle) {
      fetchLocationLogs(selectedVehicle);
    }
  };

  // Utility function to subtract 7 hours from time string (HH:MM format)
  const subtract7Hours = (timeString: string): string => {
    if (!timeString) return timeString;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    let newHours = hours - 7;
    
    // Handle negative hours (wrap around to previous day)
    if (newHours < 0) {
      newHours += 24;
    }
    
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const selectedVehicleData = useMemo(() => {
    console.log('🔍 Calculating selectedVehicleData:', { 
      vehicles, 
      selectedVehicle, 
      selectedVehicleType: typeof selectedVehicle,
      vehiclesIds: vehicles.map(v => ({ id: v.id, idType: typeof v.id }))
    });
    
    // Try different comparison methods
    let found = vehicles.find(v => v.id === selectedVehicle);
    console.log('🔍 Method 1 (strict):', found);
    
    if (!found) {
      // Try string comparison
      found = vehicles.find(v => String(v.id) === String(selectedVehicle));
      console.log('🔍 Method 2 (string):', found);
    }
    
    if (!found) {
      // Try number comparison
      found = vehicles.find(v => Number(v.id) === Number(selectedVehicle));
      console.log('🔍 Method 3 (number):', found);
    }
    
    console.log('🔍 Final found vehicle:', found);
    return found;
  }, [vehicles, selectedVehicle]);

  // Monitor state changes for debugging
  useEffect(() => {
    console.log('🔄 State changed - vehicles:', vehicles);
    console.log('🔄 State changed - selectedVehicle:', selectedVehicle);
    console.log('🔄 State changed - selectedVehicleData:', selectedVehicleData);
  }, [vehicles, selectedVehicle, selectedVehicleData]);

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

  // Fetch location logs when selected vehicle or date range changes
  useEffect(() => {
    if (selectedVehicle) {
      fetchLocationLogs(selectedVehicle);
    }
  }, [selectedVehicle, selectedDateRange, customStartDate, customEndDate, startTime, endTime, singleTime, timeMode, showAllRoutes]);

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
    } else {
      // If locationLogs becomes empty, clear mapLocations
      setMapLocations([]);
      setTotalCheckpoints(0);
      setRouteOptions(undefined);
      setRoutePath(undefined);
      setShowRoute(false);
      setDirectionsStatus('idle');
      console.log('📍 No location logs, clearing map locations.');
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
      console.log('🚗 Fetching vehicles...');
      setIsLoadingVehicles(true);
      const response = await vehicleAPI.getMyVehicles();
      console.log('📡 Vehicle API response:', response);
      if (response.meta.code === 200 && response.data) {
        console.log('✅ Vehicles data received:', response.data);
        setVehicles(response.data);
        if (response.data.length > 0) {
          console.log('🎯 Setting selectedVehicle to:', response.data[0].id);
          setSelectedVehicle(response.data[0].id);
        }
      } else {
        console.warn('⚠️ No vehicles data in response');
      }
    } catch (err: any) {
      console.error('❌ Error fetching vehicles:', err);
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
      
      // Get date range parameters
      const customRange = getCustomDateRange();
      const dateRange = customRange || getDateRange();
      
      console.log(`📅 Fetching data for date range: ${dateRange.start_date} to ${dateRange.end_date}`);
      
      // Validate time range - prevent API call if start and end time are the same
      if (startTime && endTime && startTime === endTime) {
        console.log('⚠️ Start and end time are the same, clearing data');
        setLocationLogs([]);
        setMapLocations([]);
        setRoutePath(undefined);
        setError('Start time and end time cannot be the same');
        return;
      }
      
      // Handle time parameters based on mode
      let apiStartTime = undefined;
      let apiEndTime = undefined;
      
      if (timeMode === 'single' && singleTime) {
        // Single time mode: from 07:00 to selected time
        apiStartTime = subtract7Hours("07:00"); // 07:00 becomes 00:00 (previous day)
        apiEndTime = subtract7Hours(singleTime);
        console.log(`⏰ Single time mode: ${apiStartTime} to ${apiEndTime} (converted from 07:00 to ${singleTime})`);
      } else if (timeMode === 'range') {
        // Time range mode: use start and end times
        apiStartTime = startTime ? subtract7Hours(startTime) : undefined;
        apiEndTime = endTime ? subtract7Hours(endTime) : undefined;
        console.log(`⏰ Range mode: ${apiStartTime || '00:00'} to ${apiEndTime || '23:59'} (converted from ${startTime || '00:00'} to ${endTime || '23:59'})`);
      }
      
      // Use the enhanced API method with date range and time parameters
      const response = await locationAPI.getAllLocationLogs(vehicleId, {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        start_time: apiStartTime,
        end_time: apiEndTime,
        limit: showAllRoutes ? 100000000 : 100,
        offset: 0
      });
      
      if (response.meta.code === 200 && response.data) {
        console.log(`✅ Successfully fetched ${response.data.length} location logs for vehicle ${vehicleId}`);
        
        // Sort by timestamp descending (newest first)
        const sortedLogs = response.data.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLocationLogs(sortedLogs);
        
        // Clear route data if no logs found
        if (sortedLogs.length === 0) {
          setRoutePath(undefined);
          setMapLocations([]);
        }
      } else {
        console.warn(`⚠️ No location data found for vehicle ${vehicleId}`);
        setError('No location data found for this vehicle');
        setLocationLogs([]);
        setRoutePath(undefined);
        setMapLocations([]);
      }
    } catch (err: any) {
      console.error(`❌ Error fetching location logs for vehicle ${vehicleId}:`, err);
      setError(err.response?.data?.message || 'Failed to fetch location logs');
      setLocationLogs([]);
      setRoutePath(undefined);
      setMapLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDataStats = (logs: LocationLog[]) => {
    if (logs.length === 0) {
      // Clear stats when no logs
      setDataStats({
        totalLogs: 0,
        dateRange: { start: '', end: '' },
        avgSpeed: 0,
        totalDistance: 0
      });
      return;
    }

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

  // Get route data for replay (using Google Directions API)
  const getReplayRouteData = () => {
    if (locationLogs.length === 0) return null;

    // Sort logs by timestamp ascending (oldest first)
    const sortedLogs = locationLogs.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Get positions up to current checkpoint
    const relevantLogs = sortedLogs.slice(0, currentCheckpoint);
    
    if (relevantLogs.length < 2) return null;

    // Convert to MapLocation format
    const locations: MapLocation[] = relevantLogs.map((log, index) => ({
      lat: log.latitude,
      lng: log.longitude,
      title: `Checkpoint ${index + 1}`,
      address: `${new Date(log.timestamp).toLocaleString('id-ID')} - ${log.speed || 0} km/h`
    }));

    // Create route options for Google Directions API
    const origin = locations[0];
    const destination = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1).slice(0, 8); // Max 8 waypoints

    return {
      routeOptions: {
        origin,
        destination,
        waypoints,
        travelMode: google.maps?.TravelMode?.DRIVING || 'DRIVING' as any
      },
      locations
    };
  };

  // Handle checkpoint icon click
  const handleCheckpointClick = (checkpointNumber: number) => {
    setCurrentCheckpoint(checkpointNumber);
  };

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newCheckpoint = Math.max(1, Math.min(totalCheckpoints, Math.round(percentage * totalCheckpoints)));
    setCurrentCheckpoint(newCheckpoint);
  };

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
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
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

        {/* Date Range Selection */}
        <div className="border-t pt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedDateRange('today')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedDateRange === 'today'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDateRange('yesterday')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedDateRange === 'yesterday'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => setSelectedDateRange('day_before_yesterday')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedDateRange === 'day_before_yesterday'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Day Before Yesterday
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">or Custom:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start Date"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="End Date"
              />
            </div>
            
            {/* Time Range Selection */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-500">Time Mode:</span>
              <select
                value={timeMode}
                onChange={(e) => setTimeMode(e.target.value as 'single' | 'range')}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="single">Single Time (07:00 to selected)</option>
                <option value="range">Time Range</option>
              </select>
              
              {timeMode === 'single' ? (
                <>
                  <span className="text-sm text-gray-500">Time:</span>
                  <input
                    type="time"
                    value={singleTime}
                    onChange={(e) => setSingleTime(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Select time"
                  />
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-500">Time Range:</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start Time"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End Time"
                  />
                </>
              )}
              
              {timeMode === 'single' && singleTime && startTime && endTime && startTime === endTime && (
                <span className="text-xs text-red-500 ml-2">
                  ⚠️ Start and end time cannot be the same
                </span>
              )}
              {(timeMode === 'single' && singleTime) || (timeMode === 'range' && (startTime || endTime)) ? (
                <button
                  onClick={clearTimeFilters}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  title="Clear time filters"
                >
                  Clear
                </button>
              ) : null}
            </div>
            
            {/* Route Limit Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Route Limit:</span>
              <select
                value={showAllRoutes ? 'all' : 'limited'}
                onChange={(e) => setShowAllRoutes(e.target.value === 'all')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="limited">Rute Terbaru</option>
                <option value="all">Semua Rute (Garis Lurus)</option>
              </select>
            </div>
          </div>
          
          {/* Current Date Range Display */}
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Current Range:</span>{' '}
            {customStartDate && customEndDate ? (
              <span>{customStartDate} to {customEndDate}</span>
            ) : (
              <span>
                {getDateRange().start_date} to {getDateRange().end_date}
              </span>
            )}
            {(timeMode === 'single' && singleTime) && (
              <span className="ml-4 text-green-600">
                <Clock className="w-4 h-4 inline mr-1" />
                Time: 07:00 to {singleTime} (API: {subtract7Hours("07:00")} to {subtract7Hours(singleTime)})
              </span>
            )}
            {(timeMode === 'range' && (startTime || endTime)) && (
              <span className="ml-4 text-green-600">
                <Clock className="w-4 h-4 inline mr-1" />
                Time: {startTime || '00:00'} to {endTime || '23:59'} (API: {startTime ? subtract7Hours(startTime) : '00:00'} to {endTime ? subtract7Hours(endTime) : '23:59'})
              </span>
            )}
            <span className="ml-4 text-blue-600">
              <Route className="w-4 h-4 inline mr-1" />
              {showAllRoutes ? 'Showing all routes' : 'Showing latest 100 routes'}
            </span>
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
            
            {/* Improved Timeline Navigation */}
            {totalCheckpoints > 0 && (
              <div className="space-y-3">
                {/* Quick Navigation Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setCurrentCheckpoint(1)}
                    disabled={currentCheckpoint === 1}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentCheckpoint(Math.max(1, currentCheckpoint - 10))}
                    disabled={currentCheckpoint <= 10}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => setCurrentCheckpoint(Math.max(1, currentCheckpoint - 1))}
                    disabled={currentCheckpoint <= 1}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    -1
                  </button>
                  <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded font-medium">
                    {currentCheckpoint}
                  </span>
                  <button
                    onClick={() => setCurrentCheckpoint(Math.min(totalCheckpoints, currentCheckpoint + 1))}
                    disabled={currentCheckpoint >= totalCheckpoints}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setCurrentCheckpoint(Math.min(totalCheckpoints, currentCheckpoint + 10))}
                    disabled={currentCheckpoint >= totalCheckpoints - 9}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => setCurrentCheckpoint(totalCheckpoints)}
                    disabled={currentCheckpoint === totalCheckpoints}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    Last
                  </button>
                </div>
                
                {/* Compact Timeline */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>1</span>
                    <span className="text-blue-600 font-medium">Checkpoint {currentCheckpoint}</span>
                    <span>{totalCheckpoints}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${(currentCheckpoint / totalCheckpoints) * 100}%` }}
                    />
                  </div>
                  
                  {/* Clickable Timeline */}
                  <div className="relative mt-2">
                    <div 
                      className="w-full h-4 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={handleTimelineClick}
                      title="Click anywhere on timeline to jump to position"
                    >
                      {/* Current Position Indicator */}
                      <div 
                        className="absolute top-0 w-3 h-4 bg-blue-500 rounded transform -translate-x-1/2 transition-all duration-200"
                        style={{ left: `${(currentCheckpoint / totalCheckpoints) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Jump to Specific Checkpoint */}
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    max={totalCheckpoints}
                    value={currentCheckpoint}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= totalCheckpoints) {
                        setCurrentCheckpoint(value);
                      }
                    }}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">of {totalCheckpoints}</span>
                  <button
                    onClick={() => setCurrentCheckpoint(Math.floor(totalCheckpoints / 2))}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Middle
                  </button>
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
              <>
                <GoogleMaps
                  center={mapCenter}
                  zoom={13}
                  height="500px"
                  locations={showReplay ? (getReplayRouteData()?.locations || []) : mapLocations}
                  showRoute={showReplay ? true : showRoute}
                  routeOptions={showReplay ? getReplayRouteData()?.routeOptions : routeOptions}
                  routePath={routePath}
                  vehicleInfo={{
                    plateNumber: selectedVehicleData?.plate_number,
                    currentSpeed: locationLogs.length > 0 ? locationLogs[0].speed || 0 : 0
                  }}
                  replayData={showReplay ? {
                    currentPositions: getCurrentPositions(),
                    isPlaying,
                    currentTime: currentCheckpoint,
                    totalTime: totalCheckpoints
                  } : undefined}
                />
              
              </>
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
            
            {/* Debug Info */}
          
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {locationLogs.length > 0 ? (
                <>
                  {locationLogs
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .slice(0, showAllRoutes ? locationLogs.length : 50)
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
                  {!showAllRoutes && locationLogs.length > 50 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">
                        Showing first 50 of {locationLogs.length} locations
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No location logs available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingMaps;