import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vehicleAPI, locationAPI, fuelAPI } from '../../services/api';
import type { Vehicle, LocationLog, FuelLog } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Car, 
  MapPin, 
  Fuel, 

  Plus,
  Activity
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentLocations, setRecentLocations] = useState<LocationLog[]>([]);
  const [recentFuelLogs, setRecentFuelLogs] = useState<FuelLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch vehicles
      const vehiclesResponse = await vehicleAPI.getMyVehicles();
      if (vehiclesResponse.meta.code === 200 && vehiclesResponse.data) {
        setVehicles(vehiclesResponse.data);

        // Fetch recent data for each vehicle
        const locationPromises = vehiclesResponse.data.slice(0, 3).map(async (vehicle) => {
          try {
            const response = await locationAPI.getByVehicleId(vehicle.id);
            return response.meta.code === 200 && response.data ? response.data.slice(0, 3) : [];
          } catch (err) {
            return [];
          }
        });

        const fuelPromises = vehiclesResponse.data.slice(0, 3).map(async (vehicle) => {
          try {
            const response = await fuelAPI.getByVehicleId(vehicle.id);
            return response.meta.code === 200 && response.data ? response.data.slice(0, 3) : [];
          } catch (err) {
            return [];
          }
        });

        const [locationResults, fuelResults] = await Promise.all([
          Promise.all(locationPromises),
          Promise.all(fuelPromises)
        ]);

        setRecentLocations(locationResults.flat().slice(0, 5));
        setRecentFuelLogs(fuelResults.flat().slice(0, 5));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your vehicle tracking today.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Vehicles
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {vehicles.length}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3">
              <Link
                to="/vehicles"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Manage vehicles →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Location Updates
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {recentLocations.length}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3">
              <Link
                to="/tracking"
                className="text-sm text-green-600 hover:text-green-500"
              >
                View tracking →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Fuel className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Fuel Logs
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {recentFuelLogs.length}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3">
              <Link
                to="/fuel"
                className="text-sm text-yellow-600 hover:text-yellow-500"
              >
                View fuel data →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Vehicles
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {vehicles.filter(v => recentLocations.some(l => l.vehicle_id === v.id)).length}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm text-purple-600">
                Recently tracked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/vehicles/new"
              className="relative group bg-blue-50 p-6 focus:outline-none rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-600 text-white">
                  <Car className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add Vehicle
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Register a new vehicle to start tracking
                </p>
              </div>
            </Link>

            <Link
              to="/tracking/new"
              className="relative group bg-green-50 p-6 focus:outline-none rounded-lg hover:bg-green-100 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-600 text-white">
                  <MapPin className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Log Location
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add a new location update
                </p>
              </div>
            </Link>

            <Link
              to="/fuel/new"
              className="relative group bg-yellow-50 p-6 focus:outline-none rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-yellow-600 text-white">
                  <Fuel className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Log Fuel
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Record fuel consumption data
                </p>
              </div>
            </Link>

            <Link
              to="/api-keys"
              className="relative group bg-purple-50 p-6 focus:outline-none rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-600 text-white">
                  <Plus className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  API Keys
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Manage API access keys
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Locations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Location Updates
            </h3>
            {recentLocations.length > 0 ? (
              <div className="space-y-3">
                {recentLocations.map((location) => {
                  const vehicle = vehicles.find(v => v.id === location.vehicle_id);
                  return (
                    <div key={location.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {vehicle ? vehicle.model : 'Unknown Vehicle'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          {location.speed && ` • ${location.speed.toFixed(1)} km/h`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(location.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-200">
                  <Link
                    to="/tracking"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    View all tracking data →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <MapPin className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent location updates</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Fuel Logs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Fuel Logs
            </h3>
            {recentFuelLogs.length > 0 ? (
              <div className="space-y-3">
                {recentFuelLogs.map((fuelLog) => {
                  const vehicle = vehicles.find(v => v.id === fuelLog.vehicle_id);
                  return (
                    <div key={fuelLog.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <Fuel className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {vehicle ? vehicle.model : 'Unknown Vehicle'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Fuel Level: {fuelLog.fuel_level}L
                          {fuelLog.fuel_consumed && ` • Consumed: ${fuelLog.fuel_consumed}L`}
                          {fuelLog.distance_traveled && ` • Distance: ${fuelLog.distance_traveled}km`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(fuelLog.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-200">
                  <Link
                    to="/fuel"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    View all fuel data →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Fuel className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent fuel logs</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;