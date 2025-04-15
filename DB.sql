-- Create table for store branches
CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL
);

-- Create table for categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Create table for products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  size TEXT NOT NULL,
  photo_url TEXT
);

-- Create table for inventory
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  branch_id INTEGER REFERENCES branches(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 0)
);

-- Create table for users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'customer'))
);

-- Create table for transactions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  branch_id INTEGER REFERENCES branches(id),
  date TIMESTAMP DEFAULT NOW()
);
