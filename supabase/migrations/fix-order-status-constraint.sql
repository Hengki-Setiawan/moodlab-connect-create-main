-- Fix order status constraint to include 'cancelled' status
-- This migration allows users to cancel their orders

-- Drop the existing constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint that includes 'cancelled' status
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'paid', 'completed', 'failed', 'cancelled'));

-- Update the status badge function in Profile.tsx to handle 'cancelled' status
-- Note: This will need to be updated in the frontend code as well