-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    features text[] NOT NULL DEFAULT '{}',
    category text NOT NULL CHECK (category IN ('consultation', 'agency')),
    color_class text NOT NULL DEFAULT 'primary',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Services are manageable by authenticated users" ON public.services;

-- Create policy for public read access
CREATE POLICY "Services are viewable by everyone" ON public.services
    FOR SELECT USING (is_active = true);

-- Create policy for authenticated users to manage services (admin only)
CREATE POLICY "Services are manageable by authenticated users" ON public.services
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_services_updated ON public.services;

-- Create trigger
CREATE TRIGGER on_services_updated
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert sample services data
INSERT INTO public.services (title, description, icon, features, category, color_class, is_active) VALUES
(
    'Optimalisasi Media Sosial',
    'Layanan ini berupa sesi konsultasi terstruktur di mana tim Moodlab akan menganalisis kinerja akun media sosial Anda (Instagram, TikTok, Facebook, dll.).',
    'MessageSquare',
    ARRAY[
        'Analisis kinerja akun media sosial',
        'Strategi konten yang lebih efektif',
        'Identifikasi target audiens yang tepat',
        'Rekomendasi praktis untuk meningkatkan engagement'
    ],
    'consultation',
    'primary',
    true
),
(
    'Optimalisasi Website & SEO',
    'Layanan konsultasi yang berfokus pada peninjauan dan perbaikan struktur serta performa website Anda.',
    'Globe',
    ARRAY[
        'Analisis mendalam User Experience (UX) dan User Interface (UI)',
        'Optimasi kecepatan loading website',
        'Koreksi dasar-dasar SEO on-page',
        'Memaksimalkan website sebagai marketing funnel'
    ],
    'consultation',
    'secondary',
    true
),
(
    'Pembuatan Konten',
    'Layanan end-to-end untuk produksi konten visual dan tekstual yang berkualitas dan konsisten.',
    'Palette',
    ARRAY[
        'Perencanaan ide dan konsep konten',
        'Penulisan copywriting persuasif',
        'Desain grafis (statis/carousel)',
        'Produksi video singkat untuk media sosial'
    ],
    'agency',
    'accent',
    true
),
(
    'Pembuatan Website',
    'Jasa pengembangan dan pembangunan website yang profesional, responsif di berbagai perangkat, dan fungsional.',
    'Code',
    ARRAY[
        'Perancangan struktur dan desain UI/UX modern',
        'Implementasi dengan tech stack modern (Next.js, Node.js)',
        'Fitur e-commerce dengan payment gateway Midtrans',
        'Integrasi backend dengan Supabase'
    ],
    'agency',
    'primary',
    true
);