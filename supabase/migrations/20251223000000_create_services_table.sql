-- Create services table for managing services dynamically
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Icon name from lucide-react
  features TEXT[] NOT NULL, -- Array of features
  category TEXT NOT NULL CHECK (category IN ('consultation', 'agency')),
  color_class TEXT NOT NULL, -- CSS class for styling (primary, secondary, accent)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Services policies (public read, admin write)
CREATE POLICY "Services are viewable by everyone"
  ON public.services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert services"
  ON public.services FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update services"
  ON public.services FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Add updated_at trigger
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default services data
INSERT INTO public.services (title, description, icon, features, category, color_class) VALUES
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
  'primary'
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
  'secondary'
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
  'accent'
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
  'primary'
);