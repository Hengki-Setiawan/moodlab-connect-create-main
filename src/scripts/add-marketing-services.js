// Script untuk menambahkan layanan pemasaran digital ke database Supabase
const { createClient } = require('@supabase/supabase-js');

// Konfigurasi Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Data layanan pemasaran digital
const marketingServices = [
  {
    name: 'Paket Manajemen Media Sosial',
    description: 'Layanan pengelolaan media sosial lengkap termasuk pembuatan konten, penjadwalan posting, analisis performa, dan interaksi dengan audiens. Paket ini mencakup pengelolaan hingga 3 platform media sosial dengan 15 posting per bulan.',
    price: 2500000,
    type: 'service',
    category: 'marketing',
    image_url: 'https://img.freepik.com/free-vector/social-media-marketing-mobile-phone-concept_23-2148431798.jpg',
    stock: -1
  },
  {
    name: 'Optimasi SEO Website',
    description: 'Layanan optimasi mesin pencari (SEO) untuk meningkatkan peringkat website Anda di hasil pencarian Google. Termasuk audit website, riset kata kunci, optimasi on-page, dan pembuatan backlink berkualitas untuk meningkatkan trafik organik.',
    price: 3500000,
    type: 'service',
    category: 'marketing',
    image_url: 'https://img.freepik.com/free-vector/seo-analytics-team-concept-illustration_114360-9205.jpg',
    stock: -1
  },
  {
    name: 'Strategi Pemasaran Digital Komprehensif',
    description: 'Layanan konsultasi dan implementasi strategi pemasaran digital menyeluruh yang disesuaikan dengan kebutuhan bisnis Anda. Mencakup analisis pasar, identifikasi target audiens, pemilihan kanal pemasaran, dan pengembangan konten yang efektif untuk meningkatkan brand awareness dan konversi.',
    price: 5000000,
    type: 'service',
    category: 'marketing',
    image_url: 'https://img.freepik.com/free-vector/digital-marketing-concept-illustration_114360-7638.jpg',
    stock: -1
  }
];

// Fungsi untuk menambahkan layanan ke database
async function addMarketingServices() {
  try {
    for (const service of marketingServices) {
      const { data, error } = await supabase
        .from('products')
        .insert([service]);
      
      if (error) {
        console.error(`Error adding service ${service.name}:`, error);
      } else {
        console.log(`Service added successfully: ${service.name}`);
      }
    }
    console.log('All marketing services have been added to the database');
  } catch (error) {
    console.error('Error in script execution:', error);
  }
}

// Jalankan fungsi
addMarketingServices();