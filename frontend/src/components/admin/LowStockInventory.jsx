import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function LowStockInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all inventory items
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data = await response.json();
      setInventory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filter and group low stock items by branch
  const lowStockByBranch = inventory.reduce((acc, item) => {
    if (item.quantity < 5) {
      const branchName = item.branches?.name || 'Unknown Branch';
      if (!acc[branchName]) {
        acc[branchName] = [];
      }
      acc[branchName].push({
        id: item.id,
        productName: item.products?.name || 'Unknown Product',
        quantity: item.quantity
      });
    }
    return acc;
  }, {});

  // Sort items within each branch by quantity
  Object.keys(lowStockByBranch).forEach(branch => {
    lowStockByBranch[branch].sort((a, b) => a.quantity - b.quantity);
  });

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center mb-4">
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-800">Low Stock Alert</h2>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading inventory...</div>
      ) : error ? (
        <div className="text-red-600 py-4">{error}</div>
      ) : Object.keys(lowStockByBranch).length === 0 ? (
        <div className="text-gray-600 py-4">No low stock items found.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(lowStockByBranch).map(([branch, items]) => (
            <div key={branch} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <h3 className="font-medium text-gray-700 mb-2">{branch}</h3>
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-yellow-50 p-3 rounded-md"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {item.productName}
                    </span>
                    <span className={`text-sm font-medium ${item.quantity === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {item.quantity} in stock
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LowStockInventory;