import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

function TransactionForm({ onClose, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [branchInventory, setBranchInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [transactionItems, setTransactionItems] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  // Fetch users, branches, and products on component mount
  useEffect(() => {
    fetchUsers();
    fetchBranches();
    fetchProducts();
  }, []);
  
  // Fetch branch inventory when a branch is selected and products are loaded
  useEffect(() => {
    if (selectedBranch && products.length > 0) {
      fetchBranchInventory(selectedBranch);
    }
  }, [selectedBranch, products]);
  
  // Fetch all users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch all branches
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

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch inventory for a specific branch
  const fetchBranchInventory = async (branchId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch branch inventory
      const response = await fetch(`http://localhost:3000/inventory?branch_id=${branchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branch inventory');
      }

      const inventoryData = await response.json();
      
      // Match inventory with product data
      const inventoryWithProducts = inventoryData.map(item => {
        const product = products.find(p => p.id === item.product_id);
        return { ...item, product: product || {} };
      }).filter(item => item.product && item.product.id); // Filter out items with missing product data
      
      setBranchInventory(inventoryWithProducts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add product to transaction
  const addProduct = (inventoryItem, quantity) => {
    const { product } = inventoryItem;
    
    // Check if product is already in transaction
    const existingItemIndex = transactionItems.findIndex(
      item => item.product_id === product.id
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...transactionItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setTransactionItems(updatedItems);
    } else {
      // Add new product to transaction
      setTransactionItems([
        ...transactionItems,
        {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: quantity,
          max_quantity: inventoryItem.quantity
        }
      ]);
    }
    
    setShowProductSelector(false);
  };

  // Remove product from transaction
  const removeProduct = (index) => {
    const updatedItems = [...transactionItems];
    updatedItems.splice(index, 1);
    setTransactionItems(updatedItems);
  };

  // Update product quantity
  const updateQuantity = (index, newQuantity) => {
    const updatedItems = [...transactionItems];
    updatedItems[index].quantity = Math.min(
      Math.max(1, newQuantity), // Ensure quantity is at least 1
      updatedItems[index].max_quantity // Ensure quantity doesn't exceed available stock
    );
    setTransactionItems(updatedItems);
  };

  // Calculate total for a product
  const calculateItemTotal = (price, quantity) => {
    return price * quantity;
  };

  // Calculate transaction total
  const calculateTotal = () => {
    return transactionItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Submit transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBranch || !selectedUser || transactionItems.length === 0) {
      setError('Please select a branch, user, and add at least one product');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Create transaction with items
      const response = await fetch('http://localhost:3000/transactions/with-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUser,
          branch_id: selectedBranch,
          items: transactionItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      // Success - notify parent component
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">New Transaction</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-6 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setTransactionItems([]);
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Customer</option>
                {users
                  .filter(user => user.user_type === 'customer')
                  .map(user => (
                    <option key={user.id} value={user.id}>{user.email}</option>
                  ))}
              </select>
            </div>
          </div>
          
          {/* Product Selection */}
          {selectedBranch && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Products</h3>
                <button
                  type="button"
                  onClick={() => setShowProductSelector(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Product
                </button>
              </div>
              
              {/* Product Selector Modal */}
              {showProductSelector && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center p-4 border-b">
                      <h3 className="text-lg font-medium">Select Product</h3>
                      <button 
                        onClick={() => setShowProductSelector(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="p-4">
                      {loading ? (
                        <div className="text-center py-4">Loading inventory...</div>
                      ) : branchInventory.length === 0 ? (
                        <div className="text-center py-4">No products available in this branch</div>
                      ) : (
                        <div className="space-y-4">
                          {branchInventory
                            .filter(item => item.quantity > 0)
                            .map(item => (
                              <div key={item.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-medium">{item.product.name}</h4>
                                  <span className="text-sm text-gray-500">
                                    Available: {item.quantity}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-600 font-medium">
                                    {formatCurrency(item.product.price)}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      min="1"
                                      max={item.quantity}
                                      defaultValue="1"
                                      className="w-16 px-2 py-1 border border-gray-300 rounded-md"
                                      id={`quantity-${item.id}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const quantityInput = document.getElementById(`quantity-${item.id}`);
                                        const quantity = parseInt(quantityInput.value, 10);
                                        if (quantity > 0 && quantity <= item.quantity) {
                                          addProduct(item, quantity);
                                        }
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Selected Products List */}
              {transactionItems.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-gray-500">No products added yet. Click "Add Product" to select products.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.price)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="number"
                              min="1"
                              max={item.max_quantity}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value, 10))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md"
                            />
                            <span className="ml-2 text-xs text-gray-500">Max: {item.max_quantity}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(calculateItemTotal(item.price, item.quantity))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan="3" className="px-6 py-4 text-right font-medium">Total:</td>
                        <td colSpan="2" className="px-6 py-4 text-left font-bold">
                          {formatCurrency(calculateTotal())}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || transactionItems.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Processing...' : 'Complete Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;