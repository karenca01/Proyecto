import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { supabase, supabaseAdmin } from '../index.js';

const router = express.Router();

// Get all transactions (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('transactions')
      .select(`
        *,
        users (email),
        products (name, price, size),
        branches (name)
      `);

    // Apply filters if provided
    const { branch_id, start_date, end_date } = req.query;

    if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }

    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      // Add one day to end_date to include the entire day
      const nextDay = new Date(end_date);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('date', nextDay.toISOString());
    }

    // Apply ordering
    query = query.order('date', { ascending: false });

    const { data: transactions, error } = await query;

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

    let query = supabase
      .from('transactions')
      .select(`
        *,
        products (name, price, size),
        branches (name)
      `)
      .eq('user_id', req.params.userId);

    // Apply filters if provided
    const { branch_id, start_date, end_date } = req.query;

    if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }

    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      // Add one day to end_date to include the entire day
      const nextDay = new Date(end_date);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('date', nextDay.toISOString());
    }

    // Apply ordering
    query = query.order('date', { ascending: false });

    const { data: transactions, error } = await query;

    if (error) throw error;
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ error: 'Failed to fetch user transactions' });
  }
});

// Record a new transaction (single product)  
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
      .insert([{ user_id, product_id, branch_id, quantity: 1 }])
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

// Record a new transaction with multiple items
router.post('/with-items', authenticateToken, async (req, res) => {
  try {
    const { user_id, branch_id, items } = req.body;
    
    // Validate request
    if (!user_id || !branch_id || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if all products are available in branch inventory
    const inventoryChecks = await Promise.all(
      items.map(async (item) => {
        const { data: inventory, error } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', item.product_id)
          .eq('branch_id', branch_id)
          .single();
          
        if (error || !inventory) {
          return { 
            product_id: item.product_id, 
            available: false, 
            error: 'Product not available in this branch' 
          };
        }
        
        if (inventory.quantity < item.quantity) {
          return { 
            product_id: item.product_id, 
            available: false, 
            error: 'Insufficient stock', 
            requested: item.quantity, 
            available: inventory.quantity 
          };
        }
        
        return { 
          product_id: item.product_id, 
          available: true, 
          inventory 
        };
      })
    );
    
    // Check if any products are unavailable
    const unavailableItems = inventoryChecks.filter(check => !check.available);
    if (unavailableItems.length > 0) {
      return res.status(400).json({ 
        error: 'Some products are unavailable', 
        details: unavailableItems 
      });
    }
    
    // Start a transaction for each item
    const transactionPromises = items.map(async (item) => {
      // Insert transaction record
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert([{ 
          user_id, 
          product_id: item.product_id, 
          branch_id,
          quantity: item.quantity
        }])
        .select();
      
      if (transactionError) throw transactionError;
      
      // Get the inventory check for this item
      const inventoryCheck = inventoryChecks.find(check => check.product_id === item.product_id);
      
      // Update inventory
      const { error: updateError } = await supabaseAdmin
        .from('inventory')
        .update({ quantity: inventoryCheck.inventory.quantity - item.quantity })
        .eq('product_id', item.product_id)
        .eq('branch_id', branch_id);
      
      if (updateError) throw updateError;
      
      return transaction[0];
    });
    
    // Wait for all transactions to complete
    const completedTransactions = await Promise.all(transactionPromises);
    
    // Fetch complete transaction data with related information
    const { data: transactionsWithDetails, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        *,
        products (name, price, size),
        branches (name)
      `)
      .in('id', completedTransactions.map(t => t.id))
      .order('date', { ascending: false });
    
    if (fetchError) throw fetchError;
    
    res.status(201).json(transactionsWithDetails);
  } catch (error) {
    console.error('Error creating transaction with items:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

export default router;