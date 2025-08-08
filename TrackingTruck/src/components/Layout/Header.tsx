import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LogOut, 
  User, 
  Settings,
  Truck,
  Menu,
  X
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-md border-b">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">CarTrack</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex space-x-8">
              <Link 
                to="/dashboard" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link 
                to="/vehicles" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Vehicles
              </Link>
              <Link 
                to="/tracking" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Tracking
              </Link>
              <Link 
                to="/fuel" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Fuel
              </Link>
              <Link 
                to="/maps" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Maps
              </Link>
              <Link 
                to="/tracking-maps" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Live Tracking
              </Link>
              <Link 
                to="/all-vehicles" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                All Vehicles
              </Link>
              <Link 
                to="/api-keys" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                API Keys
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Admin
                </Link>
              )}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Desktop User Info */}
                <div className="hidden md:flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{user?.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {user?.role}
                  </span>
                </div>
                
                {/* Mobile Profile Icon */}
                <div className="md:hidden">
                  <User className="h-6 w-6 text-gray-600" />
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center space-x-2">
                  <Link 
                    to="/profile" 
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Settings className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                  <button
                    onClick={toggleMobileMenu}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isMobileMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              <Link 
                to="/dashboard" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/vehicles" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Vehicles
              </Link>
              <Link 
                to="/tracking" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tracking
              </Link>
              <Link 
                to="/fuel" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Fuel
              </Link>
              <Link 
                to="/maps" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Maps
              </Link>
              <Link 
                to="/tracking-maps" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Live Tracking
              </Link>
              <Link 
                to="/all-vehicles" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                All Vehicles
              </Link>
              <Link 
                to="/api-keys" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                API Keys
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              
              {/* Mobile User Actions */}
              <div className="border-t pt-2 mt-2">
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-red-600 text-sm font-medium"
                >
                  <div className="flex items-center space-x-2">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;