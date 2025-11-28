-- Add benefits column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS benefits TEXT[];
