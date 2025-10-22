import { supabase } from './client';
import { supabaseAdmin } from './admin';

/**
 * Upload gambar ke Supabase Storage
 * @param {File} file - File gambar yang akan diupload
 * @param {string} bucket - Nama bucket di Supabase Storage (default: 'products')
 * @param {string} folder - Nama folder di dalam bucket (default: '')
 * @returns {Promise<{path: string, url: string} | null>} - Path dan URL gambar jika berhasil, null jika gagal
 */
export const uploadImage = async (file, bucket = 'products', folder = '') => {
  try {
    if (!file) return null;
    
    // Membuat nama file yang unik dengan timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // Upload file ke Supabase Storage
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Mendapatkan URL publik dari file yang diupload
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

/**
 * Menghapus gambar dari Supabase Storage
 * @param {string} path - Path gambar di Supabase Storage
 * @param {string} bucket - Nama bucket di Supabase Storage (default: 'products')
 * @returns {Promise<boolean>} - true jika berhasil, false jika gagal
 */
export const deleteImage = async (path, bucket = 'products') => {
  try {
    if (!path) return false;
    
    const { error } = await supabaseAdmin
      .storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Mendapatkan URL publik dari path gambar di Supabase Storage
 * @param {string} path - Path gambar di Supabase Storage
 * @param {string} bucket - Nama bucket di Supabase Storage (default: 'products')
 * @returns {string | null} - URL publik gambar jika berhasil, null jika gagal
 */
export const getImageUrl = (path, bucket = 'products') => {
  try {
    if (!path) return null;
    
    const { data } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
};