import React from 'react';
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

function ShoppingCart({ cartItems, onRemoveFromCart, onUpdateQuantity, onCheckout }) {
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const handleCheckout = () => {
    // Group items by their associated branch
    const itemsByBranch = cartItems.reduce((acc, item) => {
      const branchId = item.branch_id;
      if (!acc[branchId]) {
        acc[branchId] = [];
      }
      acc[branchId].push(item);
      return acc;
    }, {});

    // Pass the grouped items to the checkout handler
    onCheckout(itemsByBranch);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Shopping Cart</h3>
      {cartItems.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Your cart is empty.</p>
      ) : (
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-2">
          {cartItems.map(item => (
            <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
              <div className="flex items-center space-x-3">
                <img 
                  src={item.photo || 'https://via.placeholder.com/50?text=No+Image'} 
                  alt={item.name} 
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/50?text=No+Image'; }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate w-32">{item.name}</p>
                  <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{item.branch_name || 'Default Branch'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                <button 
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  aria-label="Increase quantity"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onRemoveFromCart(item.id)}
                  className="p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-700"
                  aria-label="Remove item"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {cartItems.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium text-gray-900">Total:</span>
            <span className="text-xl font-bold text-indigo-600">${calculateTotal()}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}

export default ShoppingCart;