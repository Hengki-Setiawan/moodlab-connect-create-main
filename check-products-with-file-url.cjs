// Script untuk mengecek produk yang sudah memiliki file_url di Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://gowtvvaijekpgozygrzj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdvd3R2dmFpamVrcGdvenlncnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzM3ODIsImV4cCI6MjA3NjcwOTc4Mn0.hgA7ppBnfiXEBDT4VATPpmqCa08rtaBlaT44G3KGexs";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductsWithFileUrl() {
  try {
    console.log('🔍 Mengecek produk yang memiliki file_url...\n');
    
    // Cari produk "Paket E-book E-commerce" secara spesifik
    const { data: ecommerceEbook, error: ecommerceError } = await supabase
      .from('products')
      .select('id, name, file_url, type, category, price, created_at')
      .ilike('name', '%E-book E-commerce%');
    
    if (ecommerceError) {
      console.error('❌ Error mencari produk E-book E-commerce:', ecommerceError);
    } else {
      console.log('🔍 PENCARIAN PRODUK "E-book E-commerce":');
      console.log('=' .repeat(80));
      if (ecommerceEbook && ecommerceEbook.length > 0) {
        ecommerceEbook.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name}`);
          console.log(`   ID: ${product.id}`);
          console.log(`   Type: ${product.type || 'N/A'}`);
          console.log(`   Category: ${product.category || 'N/A'}`);
          console.log(`   Price: Rp ${product.price?.toLocaleString('id-ID') || 'N/A'}`);
          console.log(`   File URL: ${product.file_url || 'TIDAK ADA'}`);
          console.log(`   Created: ${new Date(product.created_at).toLocaleDateString('id-ID')}`);
          console.log('-'.repeat(80));
        });
      } else {
        console.log('❌ Produk "E-book E-commerce" tidak ditemukan');
      }
      console.log('\n');
    }
    
    // Query untuk mendapatkan semua produk yang memiliki file_url (tidak null dan tidak kosong)
    const { data: productsWithFile, error: fileError } = await supabase
      .from('products')
      .select('id, name, file_url, type, category, price, created_at')
      .not('file_url', 'is', null)
      .neq('file_url', '');
    
    if (fileError) {
      console.error('❌ Error mengambil produk dengan file_url:', fileError);
      return;
    }
    
    // Query untuk mendapatkan total semua produk
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('id, name, file_url, type, category');
    
    if (allError) {
      console.error('❌ Error mengambil semua produk:', allError);
      return;
    }
    
    console.log(`📊 RINGKASAN:`);
    console.log(`Total produk: ${allProducts?.length || 0}`);
    console.log(`Produk dengan file_url: ${productsWithFile?.length || 0}`);
    console.log(`Produk tanpa file_url: ${(allProducts?.length || 0) - (productsWithFile?.length || 0)}\n`);
    
    if (productsWithFile && productsWithFile.length > 0) {
      console.log('✅ PRODUK YANG SUDAH MEMILIKI FILE_URL:');
      console.log('=' .repeat(80));
      
      productsWithFile.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Type: ${product.type || 'N/A'}`);
        console.log(`   Category: ${product.category || 'N/A'}`);
        console.log(`   Price: Rp ${product.price?.toLocaleString('id-ID') || 'N/A'}`);
        console.log(`   File URL: ${product.file_url}`);
        console.log(`   Created: ${new Date(product.created_at).toLocaleDateString('id-ID')}`);
        console.log('-'.repeat(80));
      });
    } else {
      console.log('❌ Tidak ada produk yang memiliki file_url');
    }
    
    // Tampilkan juga produk yang belum memiliki file_url
    const productsWithoutFile = allProducts?.filter(product => 
      !product.file_url || product.file_url.trim() === ''
    );
    
    if (productsWithoutFile && productsWithoutFile.length > 0) {
      console.log('\n⚠️  PRODUK YANG BELUM MEMILIKI FILE_URL:');
      console.log('=' .repeat(80));
      
      productsWithoutFile.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Type: ${product.type || 'N/A'}`);
        console.log(`   Category: ${product.category || 'N/A'}`);
        console.log('-'.repeat(40));
      });
    }
    
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
  }
}

// Jalankan fungsi
checkProductsWithFileUrl();