import React, { useState, useEffect } from 'react';
import GoogleMaps from './GoogleMaps';
import { vehicleAPI, locationAPI } from '../../services/api';
import type { Vehicle, LocationLog } from '../../types';
import type { MapLocation, RouteOptions } from '../../types/google-maps';
import { Route, Navigation, Truck, RefreshCw, Eye, EyeOff } from 'lucide-react';

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
  const [error, setError] = useState('');

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch all location logs when vehicles are loaded
  useEffect(() => {
    if (vehicles.length > 0) {
      fetchAllLocationLogs();
    }
  }, [vehicles]);

  // Process location logs into vehicle routes
  useEffect(() => {
    if (vehicles.length > 0 && allLocationLogs.length > 0) {
      processVehicleRoutes();
    }
  }, [vehicles, allLocationLogs]);

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
      
      const response = await locationAPI.getAllLocationLogsForAllVehicles();
      
      if (response.meta.code === 200 && response.data) {
        console.log('API Response:', response.data);
        console.log('Number of location logs:', response.data.length);
        
        // Sort by timestamp ascending (oldest first for route)
        const sortedLogs = response.data.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setAllLocationLogs(sortedLogs);
      } else {
        setError('No location data found');
        setAllLocationLogs([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch location logs');
      setAllLocationLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const processVehicleRoutes = () => {
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
    vehicleGroups.forEach((group) => {
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

        routes.push({
          vehicle,
          locationLogs: sortedLogs,
          locations: mapLocations,
          routeOptions,
          color: VEHICLE_COLORS[colorIndex % VEHICLE_COLORS.length],
          isVisible: true
        });
        
        colorIndex++;
      }
    });

    console.log('Processed vehicle routes:', routes);
    setVehicleRoutes(routes);

    // Set map center to first vehicle's first location
    if (routes.length > 0 && routes[0].locations.length > 0) {
      setMapCenter(routes[0].locations[0]);
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

      {/* Vehicle Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            <label className="text-sm font-medium text-gray-700">Kendaraan ({vehicleRoutes.length})</label>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
        
        {isLoading ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-gray-600">Loading location data...</p>
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllVehiclesMap; 