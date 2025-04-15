import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { supabase } from '../index.js';

const router = express.Router();

// Get all branches
router.get('/', async (req, res) => {
  try {
    const { data: branches, error } = await supabase
      .from('branches')
      .select('*')
      .order('id');

    if (error) throw error;
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get branch by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: branch, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    res.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

// Create new branch (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, state } = req.body;

    const { data: newBranch, error } = await supabase
      .from('branches')
      .insert([{ name, state }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newBranch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

// Update branch (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, state } = req.body;

    const { data: updatedBranch, error } = await supabase
      .from('branches')
      .update({ name, state })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedBranch) return res.status(404).json({ error: 'Branch not found' });

    res.json(updatedBranch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

// Delete branch (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

export default router;