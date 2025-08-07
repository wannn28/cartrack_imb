import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vehicleAPI, fuelAPI } from '../../services/api';
import { env } from '../../config/environment';
import type { Vehicle, FuelLog, FuelStatistics } from '../../types';
import { 
  Fuel, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  BarChart3
} from 'lucide-react';

const FuelDashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [currentFuel, setCurrentFuel] = useState<FuelLog | null>(null);
  const [fuelHistory, setFuelHistory] = useState<FuelLog[]>([]);
  const [fuelStats, setFuelStats] = useState<FuelStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      fetchCurrentFuel(selectedVehicle);
      fetchFuelHistory(selectedVehicle);
      fetchFuelStats(selectedVehicle);
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

  const fetchCurrentFuel = async (vehicleId: string) => {
    try {
      const response = await vehicleAPI.getCurrentFuel(vehicleId);
      if (response.meta.code === 200 && response.data) {
        setCurrentFuel(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch current fuel:', err);
      setCurrentFuel(null);
    }
  };

  const fetchFuelHistory = async (vehicleId: string) => {
    try {
      const response = await fuelAPI.getByVehicleId(vehicleId);
      if (response.meta.code === 200 && response.data) {
        setFuelHistory(response.data.slice(0, 10)); // Last 10 fuel logs
      }
    } catch (err: any) {
      console.error('Failed to fetch fuel history:', err);
      setFuelHistory([]);
    }
  };

  const fetchFuelStats = async (vehicleId: string) => {
    try {
      const response = await vehicleAPI.getFuelStats(vehicleId);
      if (response.meta.code === 200 && response.data) {
        setFuelStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch fuel stats:', err);
      setFuelStats(null);
    }
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  // Use default fuel capacity from environment config
  const fuelPercentage = currentFuel 
    ? (currentFuel.fuel_level / env.DEFAULT_FUEL_CAPACITY) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Fuel Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor fuel levels, consumption, and efficiency.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/fuel/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Fuel Log
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <Fuel className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add vehicles to start tracking their fuel consumption.
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
              {/* Current Fuel Status */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Current Fuel Status</h3>
                {currentFuel ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fuel Gauge */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-48 h-48">
                        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-gray-200"
                          />
                          {/* Fuel level circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${fuelPercentage * 2.51} 251`}
                            className={`${
                              fuelPercentage > 50 
                                ? 'text-green-500' 
                                : fuelPercentage > 25 
                                ? 'text-yellow-500' 
                                : 'text-red-500'
                            } transition-all duration-300`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-gray-900">
                            {fuelPercentage.toFixed(1)}%
                          </span>
                          <span className="text-sm text-gray-500">
                            {currentFuel.fuel_level}L / {env.DEFAULT_FUEL_CAPACITY}L
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-600 text-center">
                        Last updated: {new Date(currentFuel.timestamp).toLocaleString()}
                      </p>
                    </div>

                    {/* Fuel Info */}
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Fuel className="h-6 w-6 text-blue-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-900">Current Level</p>
                            <p className="text-lg font-semibold text-blue-700">
                              {currentFuel.fuel_level} Liters
                            </p>
                          </div>
                        </div>
                      </div>

                      {currentFuel.fuel_consumed !== undefined && currentFuel.fuel_consumed !== null && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <TrendingDown className="h-6 w-6 text-red-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-red-900">Recent Consumption</p>
                              <p className="text-lg font-semibold text-red-700">
                                {currentFuel.fuel_consumed} Liters
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentFuel.distance_traveled !== undefined && currentFuel.distance_traveled !== null && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <Activity className="h-6 w-6 text-green-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-900">Distance Traveled</p>
                              <p className="text-lg font-semibold text-green-700">
                                {currentFuel.distance_traveled} km
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Fuel className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No fuel data</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No recent fuel data available for this vehicle.
                    </p>
                  </div>
                )}
              </div>

              {/* Fuel Statistics */}
              {fuelStats && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Fuel Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-900">Total Consumed</p>
                          <p className="text-lg font-semibold text-purple-700">
                            {fuelStats.total_fuel_consumed.toFixed(1)}L
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Activity className="h-8 w-8 text-indigo-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-indigo-900">Total Distance</p>
                          <p className="text-lg font-semibold text-indigo-700">
                            {fuelStats.total_distance_traveled.toFixed(1)} km
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-yellow-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-900">Avg Consumption</p>
                          <p className="text-lg font-semibold text-yellow-700">
                            {fuelStats.average_fuel_consumption.toFixed(2)}L
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Fuel className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-900">Efficiency</p>
                          <p className="text-lg font-semibold text-green-700">
                            {fuelStats.fuel_efficiency.toFixed(2)} km/L
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fuel History */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Fuel Logs</h3>
                {fuelHistory.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fuel Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Consumed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Distance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fuelHistory.map((log, index) => (
                          <tr key={log.id} className={index === 0 ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.fuel_level}L
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.fuel_consumed !== undefined && log.fuel_consumed !== null 
                                ? `${log.fuel_consumed}L` 
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.distance_traveled !== undefined && log.distance_traveled !== null 
                                ? `${log.distance_traveled} km` 
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Fuel className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No fuel history</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No fuel history available for this vehicle.
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

export default FuelDashboard;