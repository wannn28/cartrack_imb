import React, { useState, useEffect, useRef } from 'react';
import GoogleMaps from './GoogleMaps';
import { vehicleAPI, locationAPI } from '../../services/api';
import type { Vehicle, LocationLog } from '../../types';
import type { MapLocation, RouteOptions } from '../../types/google-maps';
import { MapPin, Route, Navigation, Truck, RefreshCw, Play, Pause, SkipBack, SkipForward, Clock, Zap, Car } from 'lucide-react';

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

interface VehicleReplayData {
  vehicle: Vehicle;
  locationLogs: LocationLog[];
  locations: MapLocation[];
  color: string;
  isVisible: boolean;
  currentIndex: number;
}

const LiveTrackingReplay: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [locationLogs, setLocationLogs] = useState<LocationLog[]>([]);
  const [vehicleReplay, setVehicleReplay] = useState<VehicleReplayData | null>(null);
  const [mapCenter, setMapCenter] = useState<MapLocation>({ lat: -6.200000, lng: 106.816666 });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [error, setError] = useState('');
  
  // Replay controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(1); // Current checkpoint (1-based)
  const [totalCheckpoints, setTotalCheckpoints] = useState(0); // Total number of checkpoints
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x, 8x
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const minTimestampRef = useRef<number>(Infinity); // Store the earliest timestamp for the selected vehicle

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch location logs when a vehicle is selected
  useEffect(() => {
    if (selectedVehicleId) {
      fetchLocationLogs(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  // Process location logs into vehicle replay
  useEffect(() => {
    if (selectedVehicleId && locationLogs.length > 0) {
      processVehicleReplay();
    }
  }, [selectedVehicleId, locationLogs]);

  // Handle replay playback
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying && vehicleReplay) {
      // Calculate interval based on playback speed
      // For 1x speed: 1000ms interval, for 2x: 500ms, for 4x: 250ms, for 8x: 125ms
      const intervalMs = 1000 / playbackSpeed;
      
      console.log(`Starting replay with ${playbackSpeed}x speed, interval: ${intervalMs}ms`);
      
      const interval = setInterval(() => {
        setCurrentCheckpoint(prev => {
          const next = prev + 1; // Always increment by 1 checkpoint
          console.log(`Replay tick: ${prev} -> ${next} (${playbackSpeed}x speed)`);
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
          console.log('Clearing replay interval');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isPlaying, totalCheckpoints, playbackSpeed, vehicleReplay]);

  const fetchVehicles = async () => {
    try {
      setIsLoadingVehicles(true);
      const response = await vehicleAPI.getMyVehicles();
      if (response.meta.code === 200 && response.data) {
        setVehicles(response.data);
        // Auto-select first vehicle if available
        if (response.data.length > 0) {
          setSelectedVehicleId(response.data[0].id);
        }
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
      
      const response = await locationAPI.getByVehicleId(vehicleId, 50, 0);
      
      if (response.meta.code === 200 && response.data) {
        console.log('API Response for vehicle', vehicleId, ':', response.data);
        console.log('Number of location logs:', response.data.length);
        
        // Sort by created_at ascending (oldest first for replay)
        const sortedLogs = response.data.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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

  const processVehicleReplay = () => {
    if (locationLogs.length === 0) {
      setVehicleReplay(null);
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!selectedVehicle) {
      setVehicleReplay(null);
      return;
    }

    // Sort logs by created_at
    const sortedLogs = locationLogs.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const startTime = new Date(sortedLogs[0].created_at).getTime();
    const endTime = new Date(sortedLogs[sortedLogs.length - 1].created_at).getTime();

    // Convert to map locations
    const mapLocations: MapLocation[] = sortedLogs.map((log: any, logIndex: number) => ({
      lat: log.latitude,
      lng: log.longitude,
      title: `${selectedVehicle.plate_number} - Point ${logIndex + 1}`,
      address: `${new Date(log.created_at).toLocaleString('id-ID')}`
    }));

    const replayData: VehicleReplayData = {
      vehicle: selectedVehicle,
      locationLogs: sortedLogs,
      locations: mapLocations,
      color: VEHICLE_COLORS[0], // Use first color for single vehicle
      isVisible: true,
      currentIndex: 0
    };

    console.log('Processed vehicle replay:', replayData);
    console.log('Start time:', startTime);
    console.log('End time:', endTime);
    console.log('Total time span:', endTime - startTime);
    
    setVehicleReplay(replayData);
    
    // Calculate total time as the span from the earliest to the latest log
    setTotalCheckpoints(sortedLogs.length); // Total checkpoints is the number of logs
    setCurrentCheckpoint(1); // Reset replay to start
    minTimestampRef.current = startTime; // Store the earliest timestamp

    // Set map center to first location or a default if no logs
    if (mapLocations.length > 0) {
      setMapCenter(mapLocations[0]);
    } else {
      setMapCenter({ lat: -6.200000, lng: 106.816666 }); // Default to Jakarta
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setCurrentCheckpoint(1);
    setIsPlaying(false);
    setVehicleReplay(null);
  };

  const handleRefresh = () => {
    if (selectedVehicleId) {
      fetchLocationLogs(selectedVehicleId);
    }
  };

  // Replay controls
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
    const newSpeed = speeds[nextIndex];
    
    console.log(`Changing playback speed from ${playbackSpeed}x to ${newSpeed}x`);
    setPlaybackSpeed(newSpeed);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  // Get current positions based on replay checkpoint
  const getCurrentPositions = () => {
    if (!vehicleReplay) return [];

    if (currentCheckpoint === 1) {
      // If replay hasn't started, return initial position
      const firstLog = vehicleReplay.locationLogs[0];
      return [{
        vehicle: vehicleReplay.vehicle,
        position: { lat: firstLog.latitude, lng: firstLog.longitude },
        speed: firstLog.speed || 0,
        color: vehicleReplay.color,
        timestamp: firstLog.created_at,
        direction: firstLog.direction || 0,
        checkpoint: 1,
        time: new Date(firstLog.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }];
    }
    
    // Return positions up to the current checkpoint
    const relevantLogs = vehicleReplay.locationLogs.slice(0, currentCheckpoint);
    
    console.log(`Vehicle ${vehicleReplay.vehicle.plate_number}: Added ${relevantLogs.length} positions for checkpoint ${currentCheckpoint}`);
    
    return relevantLogs.map((log, index) => ({
      vehicle: vehicleReplay.vehicle,
      position: { lat: log.latitude, lng: log.longitude },
      speed: log.speed || 0,
      color: vehicleReplay.color,
      timestamp: log.created_at,
      direction: log.direction || 0,
      checkpoint: index + 1,
      time: new Date(log.created_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }));
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Tracking Replay</h1>
        <p className="text-gray-600">Tonton pergerakan kendaraan dengan fitur replay</p>
      </div>

      {/* Vehicle Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-500" />
            <label className="text-sm font-medium text-gray-700">Pilih Kendaraan</label>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading || !selectedVehicleId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Vehicle Dropdown */}
        <div className="mb-4">
          <select
            value={selectedVehicleId}
            onChange={(e) => handleVehicleChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Pilih kendaraan...</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.model} - {vehicle.plate_number}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Vehicle Info */}
        {vehicleReplay && (
          <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: vehicleReplay.color }}
              />
              <div>
                <div className="font-medium text-sm">
                  {vehicleReplay.vehicle.model} - {vehicleReplay.vehicle.plate_number}
                </div>
                <div className="text-xs text-gray-500">
                  {vehicleReplay.locationLogs.length} tracking points
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Replay Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={resetReplay}
              disabled={!vehicleReplay}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              title="Reset to beginning"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setCurrentCheckpoint(Math.max(1, currentCheckpoint - 1))}
              disabled={!vehicleReplay || currentCheckpoint <= 1}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              title="Previous checkpoint"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button
              onClick={togglePlayPause}
              disabled={!vehicleReplay}
              className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <button
              onClick={() => setCurrentCheckpoint(Math.min(totalCheckpoints, currentCheckpoint + 1))}
              disabled={!vehicleReplay || currentCheckpoint >= totalCheckpoints}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              title="Next checkpoint"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            
            <button
              onClick={skipToEnd}
              disabled={!vehicleReplay}
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
              disabled={!vehicleReplay}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              title="Change playback speed"
            >
              <Zap className="w-4 h-4" />
              {playbackSpeed}x
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Checkpoint 1</span>
            <span>Checkpoint {totalCheckpoints}</span>
          </div>
          
          {/* Checkpoint Dropdown */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Pilih Checkpoint:
            </label>
            <select
              value={currentCheckpoint}
              onChange={(e) => setCurrentCheckpoint(Number(e.target.value))}
              disabled={!vehicleReplay}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {vehicleReplay && Array.from({ length: totalCheckpoints }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Checkpoint {i + 1}
                </option>
              ))}
            </select>
          </div>
          
          {/* Checkpoint Visual Dividers */}
          {vehicleReplay && totalCheckpoints > 0 && (
            <div className="flex items-center justify-between mb-2">
              {Array.from({ length: totalCheckpoints }, (_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div 
                    className={`w-3 h-3 rounded-full border-2 ${
                      i + 1 <= currentCheckpoint 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-gray-200 border-gray-300'
                    }`}
                  />
                  <span className="text-xs text-gray-500 mt-1">{i + 1}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Connecting Lines */}
          {vehicleReplay && totalCheckpoints > 1 && (
            <div className="relative mb-2">
              <div className="flex justify-between">
                {Array.from({ length: totalCheckpoints - 1 }, (_, i) => (
                  <div 
                    key={i} 
                    className={`h-0.5 flex-1 mx-2 ${
                      i + 1 < currentCheckpoint 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
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
            Live Tracking Replay
            <span className="text-sm font-normal text-gray-500 ml-2">
              {vehicleReplay ? vehicleReplay.vehicle.plate_number : 'No vehicle selected'}
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
        ) : !selectedVehicleId ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <Car className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 font-medium">No Vehicle Selected</p>
              <p className="text-sm text-gray-500 mt-1">Please select a vehicle to start replay</p>
            </div>
          </div>
        ) : !vehicleReplay ? (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <div className="text-center">
              <Truck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 font-medium">No Tracking Data</p>
              <p className="text-sm text-gray-500 mt-1">No location data found for this vehicle</p>
            </div>
          </div>
        ) : (
          <GoogleMaps
            center={mapCenter}
            zoom={13}
            height="600px"
            locations={[]}
            showRoute={false} // Routes are not shown in replay, only current positions
            onLocationClick={() => {}}
            replayData={{
              currentPositions: getCurrentPositions(),
              isPlaying,
              currentTime: currentCheckpoint, // Pass currentCheckpoint as currentTime
              totalTime: totalCheckpoints // Pass totalCheckpoints as totalTime
            }}
          />
        )}
        
        {vehicleReplay && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-blue-700">
                  <Navigation className="w-4 h-4 inline mr-1" />
                  {vehicleReplay.locationLogs.length} total checkpoints
                </span>
                <span className="text-blue-700">
                  <Route className="w-4 h-4 inline mr-1" />
                  {vehicleReplay.vehicle.plate_number}
                </span>
                <span className="text-blue-700">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Checkpoint {currentCheckpoint} / {totalCheckpoints}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingReplay; 