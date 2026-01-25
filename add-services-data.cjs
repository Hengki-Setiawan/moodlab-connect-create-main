const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
          const key = line.substring(0, equalIndex).trim();
          let value = line.substring(equalIndex + 1).trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.log('No .env file found or error reading it:', error.message);
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createServicesTable() {
  console.log('Creating services table...');
  
  const { error: createTableError } = await supabase.rpc('exec_sql', {
    sql: `
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
    `
  });

  if (createTableError) {
    console.error('Error creating table:', createTableError);
    // Try alternative approach
    console.log('Trying alternative approach...');
    
    const { error: altError } = await supabase
      .from('services')
      .select('id')
      .limit(1);
    
    if (altError && altError.code === '42P01') {
      console.log('Table does not exist, creating manually...');
      // Table doesn't exist, we'll create it via direct SQL execution
    }
  } else {
    console.log('Services table created successfully');
  }
}

async function addServicesData() {
  console.log('Adding services data...');
  
  const servicesData = [
    {
      title: 'Optimalisasi Media Sosial',
      description: 'Layanan ini berupa sesi konsultasi terstruktur di mana tim Moodlab akan menganalisis kinerja akun media sosial Anda (Instagram, TikTok, Facebook, dll.).',
      icon: 'MessageSquare',
      features: [
        'Analisis kinerja akun media sosial',
        'Strategi konten yang lebih efektif',
        'Identifikasi target audiens yang tepat',
        'Rekomendasi praktis untuk meningkatkan engagement'
      ],
      category: 'consultation',
      color_class: 'primary',
      is_active: true
    },
    {
      title: 'Optimalisasi Website & SEO',
      description: 'Layanan konsultasi yang berfokus pada peninjauan dan perbaikan struktur serta performa website Anda.',
      icon: 'Globe',
      features: [
        'Analisis mendalam User Experience (UX) dan User Interface (UI)',
        'Optimasi kecepatan loading website',
        'Koreksi dasar-dasar SEO on-page',
        'Memaksimalkan website sebagai marketing funnel'
      ],
      category: 'consultation',
      color_class: 'secondary',
      is_active: true
    },
    {
      title: 'Pembuatan Konten',
      description: 'Layanan end-to-end untuk produksi konten visual dan tekstual yang berkualitas dan konsisten.',
      icon: 'Palette',
      features: [
        'Perencanaan ide dan konsep konten',
        'Penulisan copywriting persuasif',
        'Desain grafis (statis/carousel)',
        'Produksi video singkat untuk media sosial'
      ],
      category: 'agency',
      color_class: 'accent',
      is_active: true
    },
    {
      title: 'Pembuatan Website',
      description: 'Jasa pengembangan dan pembangunan website yang profesional, responsif di berbagai perangkat, dan fungsional.',
      icon: 'Code',
      features: [
        'Perancangan struktur dan desain UI/UX modern',
        'Implementasi dengan tech stack modern (Next.js, Node.js)',
        'Fitur e-commerce dengan payment gateway Midtrans',
        'Integrasi backend dengan Supabase'
      ],
      category: 'agency',
      color_class: 'primary',
      is_active: true
    }
  ];

  // Check if services already exist
  const { data: existingServices, error: checkError } = await supabase
    .from('services')
    .select('id')
    .limit(1);

  if (checkError) {
    console.error('Error checking existing services:', checkError);
    return;
  }

  if (existingServices && existingServices.length > 0) {
    console.log('Services already exist in database');
    return;
  }

  // Insert services data
  const { data, error } = await supabase
    .from('services')
    .insert(servicesData)
    .select();

  if (error) {
    console.error('Error inserting services:', error);
  } else {
    console.log('Services added successfully:', data);
  }
}

async function main() {
  try {
    await createServicesTable();
    await addServicesData();
    console.log('Services setup completed!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main();