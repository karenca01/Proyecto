import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { supabase, supabaseAdmin } from '../index.js';

const router = express.Router();

// Get all inventory or filter by branch_id
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = supabase
      .from('inventory')
      .select(`
        *,
        products (name, price, size, photo_url),
        branches (name)
      `);
    
    // Apply branch_id filter if provided
    if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }
    
    const { data: inventory, error } = await query.order('id');

    if (error) throw error;
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get inventory for specific product
router.get('/product/:productId', authenticateToken, async (req, res) => {
  try {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        *,
        products (name, price, size, photo_url),
        branches (name)
      `)
      .eq('product_id', req.params.productId);

    if (error) throw error;
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({ error: 'Failed to fetch product inventory' });
  }
});

// Add stock to branch (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { product_id, branch_id, quantity } = req.body;

    // Check if inventory entry already exists
    const { data: existingInventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', product_id)
      .eq('branch_id', branch_id)
      .single();

    let result;
    if (existingInventory) {
      // Update existing inventory
      const newQuantity = existingInventory.quantity + quantity;
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', existingInventory.id)
        .select()
        .single();
      
      result = { data, error };
    } else {
      // Create new inventory entry using admin client to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .insert([{ product_id, branch_id, quantity }])
        .select()
        .single();
      
      result = { data, error };
    }

    if (result.error) throw result.error;
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Error adding inventory:', error);
    res.status(500).json({ error: 'Failed to add inventory' });
  }
});

// Update inventory quantity (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { quantity } = req.body;

    const { data: updatedInventory, error } = await supabaseAdmin
      .from('inventory')
      .update({ quantity })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedInventory) return res.status(404).json({ error: 'Inventory entry not found' });

    res.json(updatedInventory);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Delete inventory entry (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('inventory')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ error: 'Failed to delete inventory' });
  }
});

export default router;