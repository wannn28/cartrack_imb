import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleAPI, locationAPI } from '../../services/api';
import type { Vehicle, CreateLocationLogRequest } from '../../types';
import { MapPin, Save, ArrowLeft, Navigation, Target } from 'lucide-react';

const AddLocationLog: React.FC = () => {
  const navigate = useNavigate();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState<CreateLocationLogRequest>({
    vehicle_id: '',
    latitude: 0,
    longitude: 0,
    speed: undefined,
    direction: undefined,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        setError(`Geolocation error: ${error.message}`);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['latitude', 'longitude', 'speed', 'direction'].includes(name)
        ? value === '' ? undefined : Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await locationAPI.create(formData);
      if (response.meta.code === 200) {
        navigate('/tracking');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add location log');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/tracking')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <MapPin className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Add Location Log
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

            {/* Location Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">Location Data</h4>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    id="latitude"
                    required
                    step="any"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., -6.200000"
                  />
                </div>

                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    id="longitude"
                    required
                    step="any"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 106.816666"
                  />
                </div>

                <div>
                  <label htmlFor="speed" className="block text-sm font-medium text-gray-700">
                    Speed (km/h)
                  </label>
                  <input
                    type="number"
                    name="speed"
                    id="speed"
                    step="any"
                    min="0"
                    value={formData.speed || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 45.5"
                  />
                </div>

                <div>
                  <label htmlFor="direction" className="block text-sm font-medium text-gray-700">
                    Direction (degrees)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      name="direction"
                      id="direction"
                      step="any"
                      min="0"
                      max="360"
                      value={formData.direction || ''}
                      onChange={handleChange}
                      className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., 180"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Navigation className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/tracking')}
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
                {isLoading ? 'Adding...' : 'Add Location Log'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLocationLog;