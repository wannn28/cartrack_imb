import React, { useState, useEffect } from 'react';
import GoogleMaps from './GoogleMaps';
import { vehicleAPI, locationAPI } from '../../services/api';
import type { Vehicle, LocationLog } from '../../types';
import type { MapLocation, RouteOptions } from '../../types/google-maps';
import { MapPin, Route, Navigation, Truck, RefreshCw } from 'lucide-react';

const MapsPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [locationLogs, setLocationLogs] = useState<LocationLog[]>([]);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [routeOptions, setRouteOptions] = useState<RouteOptions | undefined>();
  const [mapCenter, setMapCenter] = useState<MapLocation>({ lat: -6.200000, lng: 106.816666 });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [error, setError] = useState('');

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch location logs when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      fetchLocationLogs(selectedVehicle);
    } else {
      setLocations([]);
      setLocationLogs([]);
      setShowRoute(false);
    }
  }, [selectedVehicle]);

  // Update map locations when location logs change
  useEffect(() => {
    if (locationLogs.length > 0) {
      const mapLocations: MapLocation[] = locationLogs.map((log, index) => ({
        lat: log.latitude,
        lng: log.longitude,
        title: `Point ${index + 1}`,
        address: `${new Date(log.timestamp).toLocaleString('id-ID')}`
      }));
      
      setLocations(mapLocations);
      
      // Set map center to the first location
      setMapCenter({
        lat: locationLogs[0].latitude,
        lng: locationLogs[0].longitude
      });

      // Auto-show route if we have locations (simplified without Directions API)
      if (mapLocations.length >= 2) {
        const origin = mapLocations[0];
        const destination = mapLocations[mapLocations.length - 1];
        const waypoints = mapLocations.slice(1, -1); // All intermediate points

        setRouteOptions({
          origin,
          destination,
          waypoints,
          travelMode: 'DRIVING' as any // Simple string since we're not using Directions API
        });
        setShowRoute(true);
      }
    }
  }, [locationLogs]);

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

  const fetchLocationLogs = async (vehicleId: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Use the enhanced API method with high limit
      const response = await locationAPI.getByVehicleId(vehicleId, 10000000, 0);
      
      if (response.meta.code === 200 && response.data) {
        // Sort by timestamp ascending (oldest first for route)
        const sortedLogs = response.data.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setLocationLogs(sortedLogs);
      } else {
        setError('No location data found for this vehicle');
        setLocationLogs([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch location logs');
      setLocationLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedVehicle) {
      fetchLocationLogs(selectedVehicle);
    }
  };

  const handleLocationClick = (location: MapLocation) => {
    setMapCenter(location);
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  
  // Debug: Check vehicle data
  console.log('=== DEBUG VEHICLE DATA ===');
  console.log('Selected Vehicle ID:', selectedVehicle);
  console.log('All Vehicles:', vehicles);
  console.log('Selected Vehicle Data:', selectedVehicleData);
  console.log('Plate Number from Vehicle:', selectedVehicleData?.plate_number);
  console.log('Vehicle Data Type:', typeof selectedVehicleData?.plate_number);
  console.log('Is Plate Number Empty?', !selectedVehicleData?.plate_number);
  console.log('=== END DEBUG ===');

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Peta & Rute Kendaraan</h1>
        <p className="text-gray-600">Pilih kendaraan untuk melihat rute perjalanan</p>
      </div>

      {/* Vehicle Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-500" />
              <label className="text-sm font-medium text-gray-700">Pilih Kendaraan:</label>
            </div>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Pilih kendaraan...</option>
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
          </div>
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
            Rute Perjalanan
            {selectedVehicleData && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({selectedVehicleData.plate_number})
              </span>
            )}
          </h2>
          {locations.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowRoute(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  !showRoute 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-1" />
                Points
              </button>
              <button
                onClick={() => setShowRoute(true)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  showRoute 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                <Route className="w-4 h-4 inline mr-1" />
                Route
              </button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-gray-600">Loading location data...</p>
            </div>
          </div>
        ) : !selectedVehicle ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <Truck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 font-medium">Pilih Kendaraan</p>
              <p className="text-sm text-gray-500 mt-1">Pilih kendaraan untuk melihat rute perjalanan</p>
            </div>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 font-medium">No Location Data</p>
              <p className="text-sm text-gray-500 mt-1">No tracking data found for this vehicle</p>
            </div>
          </div>
        ) : (
          <GoogleMaps
            center={mapCenter}
            zoom={13}
            height="500px"
            locations={showRoute ? [] : locations} // Hide markers when showing route
            showRoute={showRoute}
            routeOptions={routeOptions}
            onLocationClick={handleLocationClick}
            vehicleInfo={{
              plateNumber: selectedVehicleData?.plate_number || 'BP 9921 DE',
              currentSpeed: locationLogs.length > 0 ? locationLogs[locationLogs.length - 1]?.speed || 45.5 : 45.5
            }}
          />
        )}
        
        {locations.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-blue-700">
                  <Navigation className="w-4 h-4 inline mr-1" />
                  {locations.length} tracking points
                </span>
                {routeOptions && (
                  <span className="text-blue-700">
                    <Route className="w-4 h-4 inline mr-1" />
                    Route: {routeOptions.origin.title} → {routeOptions.destination.title}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapsPage;