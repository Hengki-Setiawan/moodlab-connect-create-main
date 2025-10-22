// Script untuk menambahkan layanan konsultasi ke database Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL atau Key tidak ditemukan di file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const consultationServices = [
  {
    name: 'Konsultasi Optimalisasi Media Sosial',
    description: 'Layanan ini berupa sesi konsultasi terstruktur di mana tim Moodlab akan menganalisis kinerja akun media sosial Anda (Instagram, TikTok, Facebook, dll.). Kami akan memberikan rekomendasi strategi konten, jadwal posting, dan teknik engagement yang lebih efektif untuk meningkatkan jangkauan dan interaksi dengan audiens Anda.',
    price: 750000,
    type: 'service',
    category: 'consultation',
    image_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop',
    stock: -1 // -1 untuk menandakan stok tidak terbatas
  },
  {
    name: 'Konsultasi Optimalisasi Website & SEO',
    description: 'Layanan konsultasi untuk menganalisis kinerja website Anda dari segi SEO, kecepatan, dan pengalaman pengguna. Tim kami akan memberikan rekomendasi perbaikan untuk meningkatkan peringkat di mesin pencari, mempercepat loading website, dan meningkatkan konversi pengunjung menjadi pelanggan.',
    price: 850000,
    type: 'service',
    category: 'consultation',
    image_url: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?q=80&w=1000&auto=format&fit=crop',
    stock: -1
  },
  {
    name: 'Kerjasama Pengelolaan Media Sosial',
    description: 'Layanan pengelolaan media sosial lengkap di mana tim Moodlab akan menangani seluruh aspek kehadiran online Anda. Mulai dari pembuatan konten, penjadwalan posting, interaksi dengan audiens, hingga analisis performa dan pelaporan bulanan. Paket ini ideal untuk bisnis yang ingin fokus pada operasional tanpa khawatir tentang konsistensi di media sosial.',
    price: 2500000,
    type: 'service',
    category: 'partnership',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop',
    stock: -1
  },
  {
    name: 'Kerjasama Pengembangan Website',
    description: 'Layanan pengembangan dan pemeliharaan website profesional. Tim kami akan merancang, membangun, dan memelihara website yang responsif, cepat, dan SEO-friendly sesuai kebutuhan bisnis Anda. Termasuk pembaruan konten reguler, pemantauan keamanan, dan dukungan teknis.',
    price: 3500000,
    type: 'service',
    category: 'partnership',
    image_url: 'https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=1000&auto=format&fit=crop',
    stock: -1
  }
];

async function addConsultationServices() {
  try {
    for (const service of consultationServices) {
      const { data, error } = await supabase
        .from('products')
        .insert(service);
      
      if (error) {
        console.error(`Error menambahkan layanan ${service.name}:`, error);
      } else {
        console.log(`Berhasil menambahkan layanan: ${service.name}`);
      }
    }
    console.log('Proses penambahan layanan konsultasi selesai');
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

addConsultationServices();