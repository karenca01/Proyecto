import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../index.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, user_type = 'customer' } = req.body;

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, user_type }])
      .select()
      .single();

    if (error) throw error;

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, user_type: newUser.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received'); // Add this line for debugging
    const { email, password } = req.body;

    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ user: { id: user.id, email: user.email, user_type: user.user_type }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;