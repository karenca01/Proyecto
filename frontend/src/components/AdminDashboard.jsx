import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  HomeIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  TagIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

// Import dashboard sections
import Dashboard from './admin/Dashboard';
import Users from './admin/Users';
import Branches from './admin/Branches';
import Categories from './admin/Categories';
import Products from './admin/Products';
import Inventory from './admin/Inventory';
import Transactions from './admin/Transactions';

const navigation = [
  { name: 'Dashboard', icon: HomeIcon, component: Dashboard },
  { name: 'Users', icon: UsersIcon, component: Users },
  { name: 'Branches', icon: BuildingStorefrontIcon, component: Branches },
  { name: 'Categories', icon: TagIcon, component: Categories },
  { name: 'Products', icon: CubeIcon, component: Products },
  { name: 'Inventory', icon: ClipboardDocumentListIcon, component: Inventory },
  { name: 'Transactions', icon: ClipboardDocumentListIcon, component: Transactions },
];

function AdminDashboard() {
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

  const CurrentComponent = navigation.find(nav => nav.name === currentSection)?.component;

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
                      <item.icon className="sidebar-icon" />
                      {item.name}
                    </button>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-red-600 hover:bg-red-50 hover:text-red-900"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
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
                  {CurrentComponent ? <CurrentComponent /> : (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900">Welcome to the Admin Dashboard</h3>
                      <p className="mt-2 text-sm text-gray-500">Select a section from the sidebar to manage your store.</p>
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

export default AdminDashboard;