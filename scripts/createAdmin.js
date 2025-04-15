import { supabase } from '../src/index.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    // Admin user details
    const adminUser = {
      email: 'admin@example.com',
      password: 'admin123',  // Change this to a secure password
      user_type: 'admin'
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);

    // Insert admin user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email: adminUser.email,
        password: hashedPassword,
        user_type: adminUser.user_type
      }])
      .select('id, email, user_type')
      .single();

    if (error) throw error;
    console.log('Admin user created successfully:', newUser);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdminUser();