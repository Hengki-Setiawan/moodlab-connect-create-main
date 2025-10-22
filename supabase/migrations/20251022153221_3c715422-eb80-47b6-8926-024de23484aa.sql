-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create cart_items table
CREATE TABLE public.cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, product_id)
);

-- Enable RLS on cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for cart_items
CREATE POLICY "Users can view their own cart items"
ON public.cart_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
ON public.cart_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
ON public.cart_items
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
ON public.cart_items
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for cart_items updated_at
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('8d0c210f-b07e-4b36-83cc-df3fdb2de6f7', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert all products with images
INSERT INTO public.products (name, description, price, type, category, stock, image_url) VALUES
-- Layanan Konsultasi
('Optimalisasi Media Sosial', 'Layanan ini berupa sesi konsultasi terstruktur di mana tim Moodlab akan menganalisis kinerja akun media sosial Anda (Instagram, TikTok, Facebook, dll.). Kami akan mengidentifikasi kelemahan, merancang strategi konten yang lebih efektif, menentukan audiens yang tepat, dan memberikan rekomendasi praktis untuk meningkatkan engagement, reach, dan potensi konversi sesuai dengan tujuan bisnis Anda.', 0, 'template', 'Konsultasi Pemasaran', -1, 'optimalisasi-media-sosial.jpg'),
('Optimalisasi Website dan SEO', 'Ini adalah layanan konsultasi yang berfokus pada peninjauan dan perbaikan struktur serta performa website Anda. Kami menganalisis secara mendalam aspek User Experience (UX), User Interface (UI), kecepatan loading, dan mengoreksi dasar-dasar SEO on-page. Tujuannya adalah memastikan website Anda berfungsi maksimal sebagai marketing funnel dan memberikan pengalaman yang efisien bagi setiap pengunjung.', 0, 'template', 'Konsultasi Pemasaran', -1, 'optimalisasi-website-seo.jpg'),

-- Layanan Kerjasama Agensi
('Layanan Pembuatan Konten', 'Layanan kerjasama agensi adalah solusi end-to-end (menyeluruh) di mana Moodlab bertindak sebagai mitra Anda untuk mengeksekusi kebutuhan pemasaran digital.', 0, 'template', 'Kerjasama Agensi', -1, 'pembuatan-konten.jpg'),
('Pembuatan Media Sosial', 'Layanan end-to-end untuk produksi konten visual dan tekstual yang berkualitas dan konsisten. Ini mencakup seluruh proses, mulai dari perencanaan ide, penulisan copywriting persuasif, desain grafis (statis/carousel), hingga produksi video singkat yang sesuai dengan identitas brand Anda. Konten dibuat siap digunakan di berbagai platform media sosial.', 0, 'template', 'Kerjasama Agensi', -1, 'pembuatan-media-sosial.jpg'),
('Pembuatan Website', 'Jasa pengembangan dan pembangunan website yang profesional, responsif di berbagai perangkat, dan fungsional. Kami menggunakan tech stack modern seperti Next.js dan Node.js untuk menjamin kecepatan dan skalabilitas. Layanan ini mencakup perancangan struktur, desain UI/UX, implementasi fitur khusus (seperti e-commerce dengan Midtrans), dan integrasi backend (Supabase) sesuai dengan kebutuhan bisnis spesifik Anda.', 0, 'template', 'Kerjasama Agensi', -1, 'pembuatan-website.jpg'),

-- Bahan Konten
('Paket Template Polosan Meme', 'Koleksi eksklusif template meme siap pakai yang bersifat "polosan" atau netral. Template ini telah dioptimalkan untuk berbagai platform dan memungkinkan pengguna untuk dengan cepat menambahkan teks atau elemen visual khas brand mereka sendiri. Sempurna untuk menghasilkan konten yang ringan, relatable, dan berpotensi viral untuk meningkatkan engagement media sosial secara instan.', 50000, 'template', 'Bahan Konten', 100, 'template-meme.jpg'),
('Paket Bahan Edit Video', 'Kumpulan aset digital premium yang sangat dibutuhkan untuk proses video editing yang profesional. Paket ini mencakup berbagai elemen seperti footage stok berkualitas tinggi, motion graphics, efek suara, transisi, dan overlay. Ideal bagi content creator atau bisnis yang ingin memperkaya visual video promosi, edukasi, atau review agar terlihat lebih dinamis dan menarik perhatian penonton.', 75000, 'template', 'Bahan Konten', 100, 'bahan-edit-video.jpg'),
('Paket Template Carousel Canva', 'Ratusan template desain carousel profesional yang dapat sepenuhnya diedit menggunakan Canva. Template ini telah disusun secara berurutan dan estetis, sangat ideal untuk membuat konten informatif, tips & trik, atau storytelling yang memecah informasi menjadi beberapa slide. Memastikan konten Anda terlihat konsisten, brandable, dan mudah dicerna tanpa harus memiliki keahlian desain grafis yang kompleks.', 65000, 'template', 'Bahan Konten', 100, 'template-carousel-canva.jpg'),

-- E-books
('Paket E-book E-commerce', 'Kumpulan panduan digital yang membahas secara mendalam tentang strategi end-to-end dalam menjalankan dan mengoptimalkan bisnis e-commerce. Materi mencakup riset niche, cara membangun toko online yang konversif, strategi penetapan harga, manajemen logistik, hingga taktik untuk meningkatkan penjualan dan loyalitas pelanggan di platform e-commerce.', 80000, 'ebook', 'E-book', 100, 'ebook-ecommerce.jpg'),
('Paket E-book Pemasaran', 'Panduan komprehensif yang fokus pada prinsip-prinsip dan taktik inti pemasaran digital modern. E-book ini mencakup strategi utama di berbagai saluran (seperti SEO, Email Marketing, Paid Ads), analisis perilaku konsumen, cara membuat marketing funnel yang efektif, dan penggunaan metrik untuk mengukur keberhasilan setiap kampanye pemasaran.', 80000, 'ebook', 'E-book', 100, 'ebook-pemasaran.jpg'),
('Paket E-book Konten', 'Panduan strategis yang mengajarkan seni dan ilmu di balik pembuatan konten yang memiliki nilai dan berdampak. Anda akan mempelajari cara merencanakan kalender konten, menyusun copywriting yang menarik dan persuasif, teknik visual storytelling, dan cara memanfaatkan konten untuk membangun otoritas brand dan mendominasi niche pasar Anda.', 80000, 'ebook', 'E-book', 100, 'ebook-konten.jpg');