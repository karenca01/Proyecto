import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { supabase, supabaseAdmin } from '../index.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('id');

    if (error) throw error;
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    const { data: newCategory, error } = await supabaseAdmin
      .from('categories')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;