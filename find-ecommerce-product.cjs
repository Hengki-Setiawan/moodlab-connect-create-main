// Script untuk mencari produk E-commerce dengan berbagai variasi nama
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://gowtvvaijekpgozygrzj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvd3R2dmFpamVrcGdvenlncnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzM3ODIsImV4cCI6MjA3NjcwOTc4Mn0.hgA7ppBnfiXEBDT4VATPpmqCa08rtaBlaT44G3KGexs";

const supabase = createClient(supabaseUrl, supabaseKey);

async function findEcommerceProduct() {
  try {
    console.log('🔍 Mencari produk E-commerce dengan berbagai variasi nama...\n');
    
    // Cari dengan berbagai variasi nama
    const searchTerms = [
      'E-commerce',
      'ecommerce', 
      'e-commerce',
      'E-book E-commerce',
      'Paket E-book E-commerce',
      'bisnis',
      'strategi'
    ];
    
    for (const term of searchTerms) {
      console.log(`🔍 Mencari dengan kata kunci: "${term}"`);
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, file_url, type, category, price, created_at')
        .ilike('name', `%${term}%`);
      
      if (error) {
        console.error(`❌ Error mencari dengan "${term}":`, error);
      } else if (products && products.length > 0) {
        console.log(`✅ Ditemukan ${products.length} produk:`);
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name}`);
          console.log(`      ID: ${product.id}`);
          console.log(`      File URL: ${product.file_url ? 'ADA' : 'TIDAK ADA'}`);
        });
      } else {
        console.log(`❌ Tidak ditemukan produk dengan "${term}"`);
      }
      console.log('-'.repeat(60));
    }
    
    // Tampilkan semua produk untuk referensi
    console.log('\n📋 SEMUA PRODUK DI DATABASE:');
    console.log('=' .repeat(80));
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('id, name, file_url, type, category, price')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Error mengambil semua produk:', allError);
    } else if (allProducts) {
      allProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Type: ${product.type || 'N/A'}`);
        console.log(`   Category: ${product.category || 'N/A'}`);
        console.log(`   File URL: ${product.file_url ? 'ADA' : 'TIDAK ADA'}`);
        console.log('-'.repeat(40));
      });
    }
    
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
  }
}

// Jalankan fungsi
findEcommerceProduct();