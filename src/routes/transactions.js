import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { supabase, supabaseAdmin } from '../index.js';

const router = express.Router();

// Get all transactions (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        users (email),
        products (name, price, size),
        branches (name)
      `)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get user's purchase history
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    // Users can only view their own transactions unless they're admin
    if (req.user.user_type !== 'admin' && req.user.id !== parseInt(req.params.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        products (name, price, size),
        branches (name)
      `)
      .eq('user_id', req.params.userId)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ error: 'Failed to fetch user transactions' });
  }
});

// Record a new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, branch_id } = req.body;
    const user_id = req.user.id;

    // Check if product is available in branch inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', product_id)
      .eq('branch_id', branch_id)
      .single();

    if (inventoryError || !inventory) {
      return res.status(404).json({ error: 'Product not available in this branch' });
    }

    if (inventory.quantity < 1) {
      return res.status(400).json({ error: 'Product out of stock' });
    }

    // Start transaction using admin client to bypass RLS
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert([{ user_id, product_id, branch_id }])
      .select(`
        *,
        products (name, price, size),
        branches (name)
      `)
      .single();

    if (transactionError) throw transactionError;

    // Update inventory using admin client to bypass RLS
    const { error: updateError } = await supabaseAdmin
      .from('inventory')
      .update({ quantity: inventory.quantity - 1 })
      .eq('product_id', product_id)
      .eq('branch_id', branch_id);

    if (updateError) throw updateError;

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

export default router;