import React from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

function ProductCard({ product, onAddToCart }) {
  const { name, description, price, photo, stock } = product;

  console.log('ProductCard:', product);

  // Fallback image if image_url is missing or invalid
  const imageUrl = photo || 'https://via.placeholder.com/150?text=No+Image';

  const handleAddToCartClick = () => {
    onAddToCart(product);
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white flex flex-col">
      <img 
        src={imageUrl} 
        alt={name} 
        className="w-full h-48 object-cover" 
        onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150?text=No+Image'; }} // Handle broken image links
      />
      <div className="p-4 flex flex-col flex-grow">
        <h4 className="text-lg font-semibold text-gray-800 mb-1 truncate">{name}</h4>
        <p className="text-sm text-gray-600 mb-2 flex-grow min-h-[40px]">{description || 'No description available.'}</p>
        <div className="flex justify-between items-center mt-auto pt-2">
          <span className="text-lg font-bold text-indigo-600">${price ? price.toFixed(2) : 'N/A'}</span>
          <button
            onClick={handleAddToCartClick}
            disabled={stock <= 0} // Disable if out of stock
            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${stock > 0 ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            <ShoppingCartIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
            {stock > 0 ? 'Add' : 'Out of Stock'}
          </button>
        </div>
         {stock > 0 && <p className="text-xs text-gray-500 mt-1">Stock: {stock}</p>}
      </div>
    </div>
  );
}

export default ProductCard;