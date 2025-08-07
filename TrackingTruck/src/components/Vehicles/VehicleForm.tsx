import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vehicleAPI } from '../../services/api';
import type { CreateVehicleRequest } from '../../types';
import { Car, Save, ArrowLeft } from 'lucide-react';

const VehicleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateVehicleRequest>({
    plate_number: '',
    model: '',
    imei: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      fetchVehicle(id);
    }
  }, [isEdit, id]);

  const fetchVehicle = async (vehicleId: string) => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getById(vehicleId);
      if (response.meta.code === 200 && response.data) {
        const vehicle = response.data;
        setFormData({
          plate_number: vehicle.plate_number,
          model: vehicle.model,
          imei: vehicle.imei,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isEdit && id) {
        await vehicleAPI.update(id, formData);
      } else {
        await vehicleAPI.create(formData);
      }
      navigate('/vehicles');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
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
              onClick={() => navigate('/vehicles')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <Car className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h3>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700">
                  License Plate Number
                </label>
                <input
                  type="text"
                  name="plate_number"
                  id="plate_number"
                  required
                  value={formData.plate_number}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., B1234ABC"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  name="model"
                  id="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Toyota Avanza"
                />
              </div>

              <div>
                <label htmlFor="imei" className="block text-sm font-medium text-gray-700">
                  IMEI Number
                </label>
                <input
                  type="text"
                  name="imei"
                  id="imei"
                  value={formData.imei}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., 123456789012345"
                />
                <p className="mt-1 text-xs text-gray-500">
                  IMEI number for GPS device (optional)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/vehicles')}
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
                {isLoading ? 'Saving...' : (isEdit ? 'Update Vehicle' : 'Add Vehicle')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VehicleForm;