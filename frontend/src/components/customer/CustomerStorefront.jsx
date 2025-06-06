import React, { useState, useEffect, useContext } from 'react';
import ProductList from './ProductList';
import ShoppingCart from './ShoppingCart';
import { AuthContext } from '../../App'; // Assuming AuthContext provides user info

function CustomerStorefront() {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:3000/branches');
      if (!response.ok) throw new Error('Failed to fetch branches');
      const data = await response.json();
      setBranches(data);
      // No default branch selection - show all products initially
    } catch (err) {
      setError(`Error fetching branches: ${err.message}`);
      console.error("Error fetching branches:", err);
    }
  };

  // Fetch all products or filter by branch
  const fetchProducts = async (branchId = '') => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const url = 'http://localhost:3000/inventory';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const inventoryData = await response.json();
      
      let productsWithStock = inventoryData
        .filter(item => item.quantity > 0)
        .map(item => ({
          id: item.product_id,
          name: item.products.name,
          size: item.products.size,
          price: item.products.price,
          photo: item.products.photo_url,
          description: item.products.description,
          stock: item.quantity,
          branch_id: item.branch_id,
          branch_name: item.branches?.name || 'Unknown Branch'
        }));

      // Filter by branch if selected
      if (selectedBranchId) {
        productsWithStock = productsWithStock.filter(item => item.branch_id.toString() === selectedBranchId);
      }
      
      setProducts(productsWithStock);
    } catch (err) {
      setError(`Error fetching products: ${err.message}`);
      console.error("Error fetching products:", err);
      setProducts([]); // Clear products on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchProducts(selectedBranchId);
  }, [selectedBranchId]);

  const handleAddToCart = (productToAdd) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === productToAdd.id);
      if (existingItem) {
        // Increase quantity if item already in cart
        return prevItems.map(item =>
          item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item with quantity 1
        return [...prevItems, { ...productToAdd, quantity: 1 }];
      }
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    const newQuantity = parseInt(quantity, 10);
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleCheckout = async (itemsByBranch) => {
    if (!user || !user.id) {
      setError('User not logged in.');
      return;
    }
    if (cartItems.length === 0) {
      setError('Shopping cart is empty.');
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      // Process transactions for each branch
      for (const branchId in itemsByBranch) {
        const branchItems = itemsByBranch[branchId];
        const transactionData = {
          user_id: user.id,
          branch_id: branchId,
          items: branchItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity
          }))
        };

        const response = await fetch('http://localhost:3000/transactions/with-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create transaction');
        }
      }

      alert('Purchase successful!');
      setCartItems([]); // Clear cart after successful purchase
      fetchProducts(selectedBranchId); // Refresh products
    } catch (err) {
      setError(`Checkout failed: ${err.message}`);
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Storefront</h2>

      {/* Branch Filter */}
      <div className="mb-6">
        <label htmlFor="branch-select" className="block text-sm font-medium text-gray-700 mb-2">Filter by Branch:</label>
        <select
          id="branch-select"
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        >
          <option value="">All Branches</option>
          {branches.map(branch => (
            <option key={branch.id} value={branch.id}>{branch.name} - {branch.state}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: {error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product List */}
        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-center text-gray-500">Loading products...</p>
          ) : products.length > 0 ? (
            <ProductList products={products} onAddToCart={handleAddToCart} />
          ) : (
            <p className="text-center text-gray-500">No products available for this branch.</p>
          )}
        </div>

        {/* Shopping Cart */}
        <div className="lg:col-span-1">
          <ShoppingCart
            cartItems={cartItems}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}

export default CustomerStorefront;