import React, { useState } from 'react';
import { directionsJSService } from '../../services/directions-js';
import type { MapLocation } from '../../types/google-maps';

const DirectionsTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testDirections = async () => {
    setIsTesting(true);
    setTestResult('Testing...');
    
    try {
      const isWorking = await directionsJSService.testDirectionsAPI();
      setTestResult(isWorking ? '✅ API Working' : '❌ API Failed');
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testWithRealData = async () => {
    setIsTesting(true);
    setTestResult('Testing with real data...');
    
    try {
      // Test with coordinates from Batam
      const points: MapLocation[] = [
        { lat: 1.0841, lng: 104.0319 }, // Batam coordinates
        { lat: 1.0842, lng: 104.0320 },
        { lat: 1.0843, lng: 104.0321 },
        { lat: 1.0844, lng: 104.0322 },
        { lat: 1.0845, lng: 104.0323 }
      ];
      
      const result = await directionsJSService.getRouteForPoints(points);
      
      if (result) {
        setTestResult(`✅ Route created: ${result.path.length} points, ${Math.round(result.distance)}m`);
      } else {
        setTestResult('❌ Failed to create route');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Google Directions API Test</h3>
      <div className="flex gap-2 mb-2">
        <button
          onClick={testDirections}
          disabled={isTesting}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
        >
          Test API
        </button>
        <button
          onClick={testWithRealData}
          disabled={isTesting}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
        >
          Test Route
        </button>
      </div>
      <div className="text-sm text-gray-700">
        {testResult}
      </div>
    </div>
  );
};

export default DirectionsTest;
