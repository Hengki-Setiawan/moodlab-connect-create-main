-- Migration: Add price column to services table
-- This enables services to be transactable like products

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

COMMENT ON COLUMN public.services.price IS 'Harga layanan dalam Rupiah';

-- Update existing services with sample prices if needed
UPDATE public.services SET price = 500000 WHERE price = 0 OR price IS NULL;
