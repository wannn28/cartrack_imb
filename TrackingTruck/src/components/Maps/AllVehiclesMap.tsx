import React, { useState, useEffect } from 'react';
import GoogleMaps from './GoogleMaps';
import DirectionsTest from './DirectionsTest';
import { vehicleAPI, locationAPI } from '../../services/api';
import { directionsJSService } from '../../services/directions-js';
import type { Vehicle, LocationLog } from '../../types';
import type { MapLocation, RouteOptions, RoutePath } from '../../types/google-maps';
import { Route, Navigation, Truck, RefreshCw, Eye, EyeOff, Calendar, Clock } from 'lucide-react';

// Color palette for different vehicles
const VEHICLE_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#008000', // Dark Green
  '#FFC0CB', // Pink
];

interface VehicleRouteData {
  vehicle: Vehicle;
  locationLogs: LocationLog[];
  locations: MapLocation[];
  routeOptions: RouteOptions;
  routePath?: RoutePath; // Google Directions API route
  color: string;
  isVisible: boolean;
}

const AllVehiclesMap: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allLocationLogs, setAllLocationLogs] = useState<LocationLog[]>([]);
  const [vehicleRoutes, setVehicleRoutes] = useState<VehicleRouteData[]>([]);
  const [mapCenter, setMapCenter] = useState<MapLocation>({ lat: -6.200000, lng: 106.816666 });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [error, setError] = useState('');
  const [directionsStatus, setDirectionsStatus] = useState<'idle' | 'working' | 'success' | 'failed'>('idle');
  const [showAllRoutes, setShowAllRoutes] = useState(false);

  // Date range functionality
  const [selectedDateRange, setSelectedDateRange] = useState<'today' | 'yesterday' | 'day_before_yesterday'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Time range functionality
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [timeMode, setTimeMode] = useState<'single' | 'range'>('single');
  const [singleTime, setSingleTime] = useState<string>('');

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
    fetchAllLocationLogs();
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

  // Fetch all location logs when vehicles are loaded or date range changes
  useEffect(() => {
    if (vehicles.length > 0) {
      fetchAllLocationLogs();
    }
  }, [vehicles, selectedDateRange, customStartDate, customEndDate, startTime, endTime, singleTime, timeMode, showAllRoutes]);

  // Process location logs into vehicle routes
  useEffect(() => {
    if (vehicles.length > 0 && allLocationLogs.length > 0) {
      processVehicleRoutes();
    }
  }, [vehicles, allLocationLogs]);

  const processVehicleRoutes = async () => {
    setIsLoadingRoutes(true);
    setDirectionsStatus('working');
    try {
      const routes: VehicleRouteData[] = [];
      
      // Group location logs by vehicle_id and get unique vehicles
      const vehicleGroups = new Map();
      
      allLocationLogs.forEach(log => {
        if (!vehicleGroups.has(log.vehicle_id)) {
          vehicleGroups.set(log.vehicle_id, {
            vehicle: log.vehicle || { id: log.vehicle_id, plate_number: 'Unknown', model: 'Unknown' }, // Use vehicle data from response
            logs: []
          });
        }
        vehicleGroups.get(log.vehicle_id).logs.push(log);
      });
      
      // Create routes for each vehicle
      let colorIndex = 0;
      
      // Process each vehicle group
      for (const [, group] of vehicleGroups) {
        const { vehicle, logs } = group;
        
        if (logs.length > 0) {
          // Sort logs by timestamp
          const sortedLogs = logs.sort((a: any, b: any) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          // Convert to map locations
          const mapLocations: MapLocation[] = sortedLogs.map((log: any, logIndex: number) => ({
            lat: log.latitude,
            lng: log.longitude,
            title: `${vehicle.plate_number} - Point ${logIndex + 1}`,
            address: `${new Date(log.created_at).toLocaleString('id-ID')}`
          }));

          // Create route options
          const routeOptions: RouteOptions = {
            origin: mapLocations[0],
            destination: mapLocations[mapLocations.length - 1],
            waypoints: mapLocations.slice(1, -1),
            travelMode: 'DRIVING' as any
          };

          // Get Google Directions API route
          let routePath: RoutePath | undefined;
          try {
            if (mapLocations.length >= 2) {
              console.log(`Getting directions for vehicle ${vehicle.plate_number} with ${mapLocations.length} points`);
              const directionsResult = await directionsJSService.getRouteForPoints(mapLocations);
              routePath = directionsResult || undefined;
              
              if (routePath) {
                console.log(`Successfully got route for ${vehicle.plate_number}:`, {
                  distance: routePath.distance,
                  duration: routePath.duration,
                  pathPoints: routePath.path.length
                });
              } else {
                console.warn(`Failed to get route for ${vehicle.plate_number}, using direct path`);
              }
            }
          } catch (error) {
            console.error(`Error getting directions for ${vehicle.plate_number}:`, error);
          }

          const routeData = {
            vehicle,
            locationLogs: sortedLogs,
            locations: mapLocations,
            routeOptions,
            routePath, // Google Directions API route
            color: VEHICLE_COLORS[colorIndex % VEHICLE_COLORS.length],
            isVisible: true
          };
          
          console.log(`Final route data for ${vehicle.plate_number}:`, {
            hasRoutePath: !!routePath,
            routePathLength: routePath?.path?.length || 0,
            routePathDistance: routePath?.distance || 0,
            routePathDuration: routePath?.duration || 0
          });
          
          routes.push(routeData);
          
          colorIndex++;
        }
      }

      console.log('Processed vehicle routes:', routes);
      setVehicleRoutes(routes);

      // Set map center to first vehicle's first location
      if (routes.length > 0 && routes[0].locations.length > 0) {
        setMapCenter(routes[0].locations[0]);
      }

      // Check if any routes have Google Directions data
      const hasDirectionsRoutes = routes.some(route => route.routePath);
      setDirectionsStatus(hasDirectionsRoutes ? 'success' : 'failed');
      
      if (!hasDirectionsRoutes) {
        console.warn('⚠️ No routes have Google Directions data - using direct paths');
      }
    } catch (error) {
      console.error('Error processing vehicle routes:', error);
      setError('Failed to process vehicle routes');
      setDirectionsStatus('failed');
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setIsLoadingVehicles(true);
      const response = await vehicleAPI.getMyVehicles();
      if (response.meta.code === 200 && response.data) {
        setVehicles(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const fetchAllLocationLogs = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get date range parameters
      const customRange = getCustomDateRange();
      const dateRange = customRange || getDateRange();
      
      console.log(`📅 Fetching data for date range: ${dateRange.start_date} to ${dateRange.end_date}`);
      
      // Validate time range - prevent API call if start and end time are the same
      if (startTime && endTime && startTime === endTime) {
        console.log('⚠️ Start and end time are the same, clearing data');
        setAllLocationLogs([]);
        setVehicleRoutes([]);
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
      
      const response = await locationAPI.getAllLocationLogsForAllVehicles({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        start_time: apiStartTime,
        end_time: apiEndTime,
        limit: showAllRoutes ? 10000000000000 : 100, // Use showAllRoutes state
        offset: 0
      });
      
      if (response.meta.code === 200 && response.data) {
        console.log('API Response:', response.data);
        console.log('Number of location logs:', response.data.length);
        
        // Sort by timestamp ascending (oldest first for route)
        const sortedLogs = response.data.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setAllLocationLogs(sortedLogs);
        
        // Clear vehicle routes if no logs found
        if (sortedLogs.length === 0) {
          setVehicleRoutes([]);
        }
      } else {
        setError('No location data found');
        setAllLocationLogs([]);
        setVehicleRoutes([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch location logs');
      setAllLocationLogs([]);
      setVehicleRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };



  const handleRefresh = () => {
    fetchAllLocationLogs();
  };

  const toggleVehicleVisibility = (vehicleId: string) => {
    setVehicleRoutes(prev => 
      prev.map(route => 
        route.vehicle.id === vehicleId 
          ? { ...route, isVisible: !route.isVisible }
          : route
      )
    );
  };

  const getVisibleRoutes = () => vehicleRoutes.filter(route => route.isVisible);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Peta Semua Kendaraan</h1>
        <p className="text-gray-600">Tampilkan semua kendaraan dengan rute berbeda</p>
      </div>

      {/* Google Directions API Test */}
      <DirectionsTest />
      
      {/* Directions Status */}
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

      {/* Vehicle Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            <label className="text-sm font-medium text-gray-700">Kendaraan ({vehicleRoutes.length})</label>
          </div>
          
          <div className="flex gap-2">
            {/* Route Display Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tampilkan:</label>
              <select
                value={showAllRoutes ? 'all' : 'limited'}
                onChange={(e) => setShowAllRoutes(e.target.value === 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="limited">Rute Terbaru</option>
                <option value="all">Semua Rute  (Garis Lurus)</option>
              </select>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                directionsJSService.clearCache();
                handleRefresh();
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              title="Clear cache and refresh routes"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Cache
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
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500"
                    placeholder="Start Time"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500"
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

        {/* Vehicle List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {vehicleRoutes.map((route) => (
            <div 
              key={route.vehicle.id}
              className="flex items-center justify-between p-3 border rounded-lg"
              style={{ borderColor: route.color, backgroundColor: route.isVisible ? `${route.color}10` : '#f3f4f6' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: route.color }}
                />
                <div>
                  <div className="font-medium text-sm">
                    {route.vehicle.model} - {route.vehicle.plate_number}
                  </div>
                  <div className="text-xs text-gray-500">
                    {route.locationLogs.length} points
                    {route.routePath && (
                      <div className="text-xs text-blue-600">
                        {Math.round(route.routePath.distance / 1000 * 10) / 10} km
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => toggleVehicleVisibility(route.vehicle.id)}
                className="p-1 rounded hover:bg-gray-200"
                title={route.isVisible ? 'Hide vehicle' : 'Show vehicle'}
              >
                {route.isVisible ? (
                  <Eye className="w-4 h-4 text-gray-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Map Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Peta Semua Kendaraan
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({getVisibleRoutes().length} vehicles visible)
            </span>
          </h2>
        </div>
        
        {isLoading || isLoadingRoutes ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-gray-600">
                {isLoadingRoutes ? 'Processing routes with Google Directions API...' : 'Loading location data...'}
              </p>
            </div>
          </div>
        ) : vehicleRoutes.length === 0 ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <Truck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 font-medium">No Vehicle Data</p>
              <p className="text-sm text-gray-500 mt-1">No vehicles with location data found</p>
            </div>
          </div>
        ) : (
          <GoogleMaps
            center={mapCenter}
            zoom={13}
            height="600px"
            locations={[]} // Hide individual markers
            showRoute={true}
            routeOptions={getVisibleRoutes()[0]?.routeOptions} // Pass first route as base
            onLocationClick={() => {}}
            vehicleInfo={{
              plateNumber: getVisibleRoutes()[0]?.vehicle.plate_number || 'Multiple Vehicles',
              currentSpeed: getVisibleRoutes()[0]?.locationLogs[getVisibleRoutes()[0].locationLogs.length - 1]?.speed || 0
            }}
            allVehicleRoutes={getVisibleRoutes()} // Pass all visible routes
          />
        )}
        
        {vehicleRoutes.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-blue-700">
                  <Navigation className="w-4 h-4 inline mr-1" />
                  {vehicleRoutes.reduce((total, route) => total + route.locationLogs.length, 0)} total tracking points
                </span>
                <span className="text-blue-700">
                  <Route className="w-4 h-4 inline mr-1" />
                  {getVisibleRoutes().length} vehicles visible
                </span>
                {vehicleRoutes.some(route => route.routePath) && (
                  <span className="text-green-700">
                    <Truck className="w-4 h-4 inline mr-1" />
                    {Math.round(vehicleRoutes.reduce((total, route) => 
                      total + (route.routePath?.distance || 0), 0) / 1000 * 10) / 10} km total route distance
                  </span>
                )}
                                  <span className="text-purple-700">
                    <Route className="w-4 h-4 inline mr-1" />
                    {directionsJSService.getCacheSize()} cached routes
                  </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllVehiclesMap; 