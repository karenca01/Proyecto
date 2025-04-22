import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  HomeIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', icon: HomeIcon },
  { name: 'Products', icon: ShoppingBagIcon },
  { name: 'My Profile', icon: UserCircleIcon },
  { name: 'Order History', icon: ClockIcon },
];

function CustomerDashboard() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState('Dashboard');
  
  const { setUser } = useContext(AuthContext);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Use the context to reset user state
    setUser(null);
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
              <div className="flex flex-col flex-grow px-4">
                <nav className="flex-1 space-y-1">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setCurrentSection(item.name)}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${currentSection === item.name ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <item.icon className="h-6 w-6 mr-3" />
                      {item.name}
                    </button>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-red-600 hover:bg-red-50 hover:text-red-900"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6 mr-3" />
                    Logout
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">{currentSection}</h1>
              </div>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="py-4">
                  {currentSection === 'Dashboard' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900">Welcome to Your Dashboard</h3>
                      <p className="mt-2 text-sm text-gray-500">Browse our products and manage your orders.</p>
                    </div>
                  )}
                  {currentSection === 'Products' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900">Products</h3>
                      <p className="mt-2 text-sm text-gray-500">Browse our available products.</p>
                    </div>
                  )}
                  {currentSection === 'My Profile' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900">My Profile</h3>
                      <p className="mt-2 text-sm text-gray-500">View and update your profile information.</p>
                    </div>
                  )}
                  {currentSection === 'Order History' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                      <p className="mt-2 text-sm text-gray-500">View your past orders and their status.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;