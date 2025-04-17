import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { supabase, supabaseAdmin } from '../index.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .order('id');

    if (error) throw error;
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Users can only access their own data unless they're admin
    if (req.user.user_type !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email, password, user_type } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{ email, password: hashedPassword, user_type }])
      .select('id, email, user_type')
      .single();

    if (error) throw error;
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Users can only update their own data unless they're admin
    if (req.user.user_type !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { email, password, user_type } = req.body;
    const updates = {};

    if (email) updates.email = email;
    if (user_type && req.user.user_type === 'admin') updates.user_type = user_type;
    
    // If password is being updated, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, user_type')
      .single();

    if (error) throw error;
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;