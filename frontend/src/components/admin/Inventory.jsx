import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ product_id: '', branch_id: '', quantity: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentInventoryId, setCurrentInventoryId] = useState(null);
  const [filterBranch, setFilterBranch] = useState('');

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

  // Fetch all branches for dropdown
  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/branches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const data = await response.json();
      setBranches(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch all products for dropdown
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/products');

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchBranches();
    fetchProducts();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value }));
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? `http://localhost:3000/inventory/${currentInventoryId}` 
        : 'http://localhost:3000/inventory';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'add'} inventory`);
      }

      // Reset form and refresh inventory
      setFormData({ product_id: '', branch_id: '', quantity: 0 });
      setShowForm(false);
      setIsEditing(false);
      setCurrentInventoryId(null);
      fetchInventory();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle edit inventory
  const handleEdit = (item) => {
    setFormData({ 
      product_id: item.product_id, 
      branch_id: item.branch_id, 
      quantity: item.quantity 
    });
    setCurrentInventoryId(item.id);
    setIsEditing(true);
    setShowForm(true);
  };

  // Handle delete inventory
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/inventory/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete inventory item');
        }

        fetchInventory();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Filter inventory by branch
  const filteredInventory = filterBranch
    ? inventory.filter(item => item.branch_id.toString() === filterBranch)
    : inventory;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header with add button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Manage Inventory</h2>
        <button
          onClick={() => {
            setFormData({ product_id: '', branch_id: '', quantity: 0 });
            setIsEditing(false);
            setCurrentInventoryId(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {showForm ? 'Cancel' : 'Add Inventory'}
        </button>
      </div>

      {/* Branch filter */}
      <div className="mb-6">
        <label htmlFor="filterBranch" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Branch
        </label>
        <select
          id="filterBranch"
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id.toString()}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory form */}
      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {isEditing ? 'Edit Inventory' : 'Add New Inventory'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                  Product
                </label>
                <select
                  id="product_id"
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="branch_id" className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <select
                  id="branch_id"
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                {isEditing ? 'Update Inventory' : 'Add to Inventory'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Loading inventory...</div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-4 text-center">No inventory items found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.products?.name || 'Unknown Product'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.branches?.name || 'Unknown Branch'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Inventory;