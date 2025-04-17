import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { supabase, supabaseAdmin } from '../index.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

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

// Create new product with image upload (admin only)
router.post('/', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { category_id, name, price, size } = req.body;
    let photo_url = null;
    
    // Handle image upload if file is provided
    if (req.file) {
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileName = `${Date.now()}${fileExt}`;
      
      // Upload to Supabase Storage using admin client to bypass RLS
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from(process.env.SUPABASE_BUCKET || 'products')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600'
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(process.env.SUPABASE_BUCKET || 'products')
        .getPublicUrl(fileName);
      
      photo_url = urlData.publicUrl;
    }

    // Create product with image URL using admin client to bypass RLS
    const { data: newProduct, error } = await supabaseAdmin
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
    res.status(500).json({ error: 'Failed to create product: ' + error.message });
  }
});

// Update product with image upload (admin only)
router.put('/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { category_id, name, price, size, photo_url: existingPhotoUrl } = req.body;
    let photo_url = existingPhotoUrl;
    
    // Handle image upload if file is provided
    if (req.file) {
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileName = `${Date.now()}${fileExt}`;
      
      // Upload to Supabase Storage using admin client to bypass RLS
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from(process.env.SUPABASE_BUCKET || 'products')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600'
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(process.env.SUPABASE_BUCKET || 'products')
        .getPublicUrl(fileName);
      
      photo_url = urlData.publicUrl;
    }

    // Update product with new data using admin client to bypass RLS
    const { data: updatedProduct, error } = await supabaseAdmin
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
    res.status(500).json({ error: 'Failed to update product: ' + error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
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