import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleAPI, fuelAPI } from '../../services/api';
import { env } from '../../config/environment';
import type { Vehicle, CreateFuelLogRequest } from '../../types';
import { Fuel, Save, ArrowLeft, Activity, TrendingDown } from 'lucide-react';

const AddFuelLog: React.FC = () => {
  const navigate = useNavigate();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState<CreateFuelLogRequest>({
    vehicle_id: '',
    fuel_level: 0,
    fuel_consumed: undefined,
    distance_traveled: undefined,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getMyVehicles();
      if (response.meta.code === 200 && response.data) {
        setVehicles(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            vehicle_id: response.data![0].id
          }));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch vehicles');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['fuel_level', 'fuel_consumed', 'distance_traveled'].includes(name)
        ? value === '' ? undefined : Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fuelAPI.create(formData);
      if (response.meta.code === 200) {
        navigate('/fuel');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add fuel log');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
  // Use default fuel capacity from environment config
  const fuelPercentage = formData.fuel_level 
    ? (formData.fuel_level / env.DEFAULT_FUEL_CAPACITY) * 100 
    : 0;

  return (
    <div className="w-full mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/fuel')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <Fuel className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Add Fuel Log
              </h3>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700">
                Vehicle
              </label>
              <select
                name="vehicle_id"
                id="vehicle_id"
                required
                value={formData.vehicle_id}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a vehicle</option>
                        {vehicles.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.model} - {vehicle.plate_number}
          </option>
        ))}
              </select>
            </div>

            {/* Fuel Level Preview */}
            {selectedVehicle && formData.fuel_level > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Fuel Level Preview</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full ${
                          fuelPercentage > 50 
                            ? 'bg-green-500' 
                            : fuelPercentage > 25 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(fuelPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-blue-900">
                    {fuelPercentage.toFixed(1)}%
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  {formData.fuel_level}L / {env.DEFAULT_FUEL_CAPACITY}L
                </p>
              </div>
            )}

            {/* Fuel Data Section */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Fuel Information</h4>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fuel_level" className="block text-sm font-medium text-gray-700">
                    Current Fuel Level (Liters) *
                  </label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Fuel className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="fuel_level"
                      id="fuel_level"
                      required
                      step="0.1"
                      min="0"
                      max={env.DEFAULT_FUEL_CAPACITY}
                      value={formData.fuel_level || ''}
                      onChange={handleChange}
                      className="block w-full pl-12 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., 45.5"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum capacity: {env.DEFAULT_FUEL_CAPACITY}L
                  </p>
                </div>

                <div>
                  <label htmlFor="fuel_consumed" className="block text-sm font-medium text-gray-700">
                    Fuel Consumed (Liters)
                  </label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <TrendingDown className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="fuel_consumed"
                      id="fuel_consumed"
                      step="0.1"
                      min="0"
                      value={formData.fuel_consumed || ''}
                      onChange={handleChange}
                      className="block w-full pl-12 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., 5.2"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Amount of fuel consumed since last log
                  </p>
                </div>

                <div>
                  <label htmlFor="distance_traveled" className="block text-sm font-medium text-gray-700">
                    Distance Traveled (km)
                  </label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Activity className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="distance_traveled"
                      id="distance_traveled"
                      step="0.1"
                      min="0"
                      value={formData.distance_traveled || ''}
                      onChange={handleChange}
                      className="block w-full pl-12 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., 120.5"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Distance traveled since last fuel log
                  </p>
                </div>
              </div>

              {/* Fuel Efficiency Calculation */}
              {formData.fuel_consumed && formData.distance_traveled && 
               formData.fuel_consumed > 0 && formData.distance_traveled > 0 && (
                <div className="mt-4 bg-green-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-green-900 mb-2">Calculated Efficiency</h5>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-green-700">
                        {(formData.distance_traveled / formData.fuel_consumed).toFixed(2)} km/L
                      </p>
                      <p className="text-xs text-green-600">
                        {formData.distance_traveled} km ÷ {formData.fuel_consumed} L
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/fuel')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Adding...' : 'Add Fuel Log'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddFuelLog;
