
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Auth/Profile';

// Dashboard
import Dashboard from './components/Dashboard/Dashboard';

// Vehicle Components
import VehicleList from './components/Vehicles/VehicleList';
import VehicleForm from './components/Vehicles/VehicleForm';

// Tracking Components
import TrackingDashboard from './components/Tracking/TrackingDashboard';
import AddLocationLog from './components/Tracking/AddLocationLog';

// Fuel Components
import FuelDashboard from './components/Fuel/FuelDashboard';
import AddFuelLog from './components/Fuel/AddFuelLog';

// API Key Components
import ApiKeyList from './components/ApiKeys/ApiKeyList';

// Admin Components
import AdminDashboard from './components/Admin/AdminDashboard';

// Maps Components
import MapsPage from './components/Maps/MapsPage';
import TrackingMaps from './components/Maps/TrackingMaps';
import AllVehiclesMap from './components/Maps/AllVehiclesMap';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/dashboard" replace />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Vehicle Routes */}
          <Route path="/vehicles" element={
            <ProtectedRoute>
              <Layout>
                <VehicleList />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/vehicles/new" element={
            <ProtectedRoute>
              <Layout>
                <VehicleForm />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/vehicles/:id/edit" element={
            <ProtectedRoute>
              <Layout>
                <VehicleForm />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Tracking Routes */}
          <Route path="/tracking" element={
            <ProtectedRoute>
              <Layout>
                <TrackingDashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/tracking/new" element={
            <ProtectedRoute>
              <Layout>
                <AddLocationLog />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Fuel Routes */}
          <Route path="/fuel" element={
            <ProtectedRoute>
              <Layout>
                <FuelDashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/fuel/new" element={
            <ProtectedRoute>
              <Layout>
                <AddFuelLog />
              </Layout>
            </ProtectedRoute>
          } />

          {/* API Key Routes */}
          <Route path="/api-keys" element={
            <ProtectedRoute>
              <Layout>
                <ApiKeyList />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Maps Routes */}
          <Route path="/maps" element={
            <ProtectedRoute>
              <Layout>
                <MapsPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/tracking-maps" element={
            <ProtectedRoute>
              <Layout>
                <TrackingMaps />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/all-vehicles" element={
            <ProtectedRoute>
              <Layout>
                <AllVehiclesMap />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
