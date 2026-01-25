-- Menghapus batasan CHECK yang ada pada kolom status di tabel orders
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Menambahkan batasan CHECK baru yang menyertakan status 'cancelled'
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'paid', 'completed', 'failed', 'cancelled'));