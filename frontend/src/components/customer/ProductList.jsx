import React from 'react';
import ProductCard from './ProductCard';

function ProductList({ products, onAddToCart }) {
  if (!products || products.length === 0) {
    return <p className="text-center text-gray-500">No products found.</p>;
  }

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">Available Products</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
        ))}
      </div>
    </div>
  );
}

export default ProductList;