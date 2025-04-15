import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { supabase } from '../index.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (name)
      `)
      .order('id');

    if (error) throw error;
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (name)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { category_id, name, price, size, photo_url } = req.body;

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([{ category_id, name, price, size, photo_url }])
      .select(`
        *,
        categories (name)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { category_id, name, price, size, photo_url } = req.body;

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({ category_id, name, price, size, photo_url })
      .eq('id', req.params.id)
      .select(`
        *,
        categories (name)
      `)
      .single();

    if (error) throw error;
    if (!updatedProduct) return res.status(404).json({ error: 'Product not found' });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;