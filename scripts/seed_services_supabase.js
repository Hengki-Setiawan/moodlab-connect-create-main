import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const newServices = [
    {
        title: 'Desain Logo & Branding',
        description: 'Jasa pembuatan logo profesional dan identitas visual yang kuat untuk brand Anda. Termasuk panduan penggunaan (brand guidelines).',
        icon: 'Palette',
        features: [
            '3 Pilihan Konsep Logo',
            'Revisi Unlimited',
            'File Master (AI, EPS, PDF)',
            'Brand Guideline & Palet Warna'
        ],
        category: 'agency',
        color_class: 'primary',
        is_active: true
    },
    {
        title: 'Copywriting & Content Planning',
        description: 'Strategi konten dan penulisan copywriting yang persuasif untuk meningkatkan engagement dan konversi penjualan.',
        icon: 'MessageSquare',
        features: [
            'Kalender Konten Bulanan',
            'Copywriting Caption & Headline',
            'Riset Hashtag & Tren',
            'Script Video/Reels'
        ],
        category: 'consultation',
        color_class: 'secondary',
        is_active: true
    },
    {
        title: 'Content Creation (Carousel & Video)',
        description: 'Produksi konten visual menarik berupa carousel Instagram dan video pendek (Reels/TikTok) berkualitas tinggi.',
        icon: 'Megaphone',
        features: [
            'Desain Feed Carousel Premium',
            'Editing Video Reels/TikTok',
            'Aset Visual Berlisensi',
            'Thumbnail Menarik'
        ],
        category: 'agency',
        color_class: 'accent',
        is_active: true
    },
    {
        title: 'Website Landing Page & E-commerce',
        description: 'Pembuatan website profesional untuk landing page produk atau toko online dengan fitur lengkap.',
        icon: 'Globe',
        features: [
            'Desain Responsif (Mobile Friendly)',
            'Optimasi Kecepatan (SEO Basic)',
            'Integrasi Payment Gateway',
            'Dashboard Admin Mudah'
        ],
        category: 'agency',
        color_class: 'primary',
        is_active: true
    },
    {
        title: 'Social Media Setup & Optimization',
        description: 'Pembuatan dan optimasi akun media sosial bisnis agar terlihat profesional dan terpercaya sejak awal.',
        icon: 'Zap',
        features: [
            'Setup Bio & Highlight Cover',
            'Integrasi Link di Bio',
            'Template Pesan Otomatis',
            'Setting Business Manager'
        ],
        category: 'agency',
        color_class: 'secondary',
        is_active: true
    },
    {
        title: 'Desain Mockup Produk',
        description: 'Visualisasi produk Anda dalam bentuk mockup 3D yang realistis untuk kebutuhan promosi dan katalog.',
        icon: 'Briefcase',
        features: [
            'Mockup Kemasan (Packaging)',
            'Mockup Merchandise (Kaos, Mug, dll)',
            'Resolusi Tinggi (4K)',
            'Background Transparan/Custom'
        ],
        category: 'agency',
        color_class: 'accent',
        is_active: true
    }
];

async function seedServices() {
    console.log('Clearing existing services...');
    const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using neq ID check as a workaround for "delete all")

    if (deleteError) {
        // If delete all fails individually, try truncating if RLS allows, or just ignore and warn
        console.warn('Error clearing services:', deleteError);
    }

    console.log('Inserting new services...');
    const { data, error } = await supabase
        .from('services')
        .insert(newServices)
        .select();

    if (error) {
        console.error('Error inserting services:', error);
    } else {
        console.log(`Successfully added ${data.length} services.`);
    }
}

seedServices();
