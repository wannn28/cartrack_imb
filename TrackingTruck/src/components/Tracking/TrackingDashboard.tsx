import React, { useState, useEffect } from 'react';
import { vehicleAPI, locationAPI } from '../../services/api';
import type { Vehicle, LocationLog } from '../../types';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Gauge,
  Target,
  Calendar
} from 'lucide-react';

const TrackingDashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [latestLocation, setLatestLocation] = useState<LocationLog | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      fetchLatestLocation(selectedVehicle);
      fetchLocationHistory(selectedVehicle);
    }
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    try {
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
      setIsLoading(false);
    }
  };

  const fetchLatestLocation = async (vehicleId: string) => {
    try {
      const response = await vehicleAPI.getLatestLocation(vehicleId);
      if (response.meta.code === 200 && response.data) {
        setLatestLocation(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch latest location:', err);
      setLatestLocation(null);
    }
  };

  const fetchLocationHistory = async (vehicleId: string) => {
    try {
      const response = await locationAPI.getByVehicleId(vehicleId);
      if (response.meta.code === 200 && response.data) {
        setLocationHistory(response.data.slice(0, 10)); // Last 10 locations
      }
    } catch (err: any) {
      console.error('Failed to fetch location history:', err);
      setLocationHistory([]);
    }
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Vehicle Tracking</h1>
        <p className="mt-2 text-sm text-gray-700">
          Monitor real-time location and track vehicle movements.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add vehicles to start tracking their locations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Vehicle Selector */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Vehicle</h3>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {vehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.model} - {vehicle.plate_number}
              </option>
              ))}
            </select>
          </div>

          {selectedVehicleData && (
            <>
              {/* Current Location Card */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Location</h3>
                {latestLocation ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <MapPin className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-900">Coordinates</p>
                          <p className="text-lg font-semibold text-blue-700">
                            {latestLocation.latitude.toFixed(6)}, {latestLocation.longitude.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {latestLocation.speed !== undefined && latestLocation.speed !== null && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Gauge className="h-8 w-8 text-green-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-900">Speed</p>
                            <p className="text-lg font-semibold text-green-700">
                              {latestLocation.speed.toFixed(1)} km/h
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {latestLocation.direction !== undefined && latestLocation.direction !== null && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Navigation className="h-8 w-8 text-purple-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-purple-900">Direction</p>
                            <p className="text-lg font-semibold text-purple-700">
                              {latestLocation.direction.toFixed(0)}°
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-8 w-8 text-orange-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-orange-900">Last Update</p>
                          <p className="text-lg font-semibold text-orange-700">
                            {new Date(latestLocation.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No location data</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No recent location data available for this vehicle.
                    </p>
                  </div>
                )}
              </div>

              {/* Location History */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Locations</h3>
                {locationHistory.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Coordinates
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Speed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Direction
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {locationHistory.map((location, index) => (
                          <tr key={location.id} className={index === 0 ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                {new Date(location.timestamp).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {location.speed !== undefined && location.speed !== null 
                                ? `${location.speed.toFixed(1)} km/h` 
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {location.direction !== undefined && location.direction !== null 
                                ? `${location.direction.toFixed(0)}°` 
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No location history</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No location history available for this vehicle.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingDashboard;