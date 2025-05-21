import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  HomeIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import CustomerStorefront from './customer/CustomerStorefront';
import UserProfile from './customer/UserProfile';
import TransactionHistory from './TransactionHistory';

const navigation = [
  { name: 'Dashboard', icon: HomeIcon },
  { name: 'Products', icon: ShoppingBagIcon },
  { name: 'My Profile', icon: UserCircleIcon },
  { name: 'Order History', icon: ClockIcon },
];

function CustomerDashboard() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState('Dashboard');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/inventory', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const inventoryData = await response.json();
        const productsWithStock = inventoryData
          .filter(item => item.quantity > 0)
          .map(item => ({
            id: item.product_id,
            name: item.products.name,
            price: item.products.price,
            photo: item.products.photo_url,
            stock: item.quantity,
            branch_name: item.branches?.name || 'Unknown Branch'
          }));
        
        setProducts(productsWithStock);
      } catch (err) {
        setError('Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
    <div className="min-h-screen bg-white">
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
            {/* Product Banner */}
            {currentSection === 'Dashboard' && (
              <div className="w-full h-[48rem] overflow-hidden mb-6">
                <div className="flex space-x-10 p-10 overflow-x-auto">
                  {products && products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex-none w-[36rem]">
                      <div className="relative h-[44rem] w-full rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">

                        <img
                          src={product.photo || 'https://via.placeholder.com/400?text=No+Image'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-6">
                          <p className="text-lg font-semibold truncate">{product.name}</p>
                          <p className="text-base mt-1">${product.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="py-4">
                  {currentSection === 'Products' && (
                    // Replace placeholder with the actual storefront component
                    <CustomerStorefront />
                  )}
                  {currentSection === 'My Profile' && <UserProfile />}
                  {currentSection === 'Order History' && <TransactionHistory />}
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