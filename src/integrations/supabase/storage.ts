import { supabase } from './client';


/**
 * Kompres gambar sebelum upload
 * @param {File} file - File gambar yang akan dikompres
 * @param {number} maxWidth - Lebar maksimum (default: 1200px)
 * @param {number} quality - Kualitas kompresi 0-1 (default: 0.8)
 * @returns {Promise<Blob>} - Blob gambar yang sudah dikompres
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize jika lebih besar dari maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Upload gambar ke Supabase Storage dengan kompresi otomatis
 * @param {File} file - File gambar yang akan diupload
 * @param {string} bucket - Nama bucket di Supabase Storage (default: 'Gambar')
 * @param {string} folder - Nama folder di dalam bucket (default: 'products')
 * @param {boolean} compress - Apakah gambar perlu dikompres (default: true)
 * @returns {Promise<{path: string, url: string}>} - Path dan URL gambar jika berhasil
 * @throws {Error} - Jika upload gagal
 */
export const uploadImage = async (
  file: File,
  bucket: string = 'Gambar',
  folder: string = 'products',
  customFileName: string | null = null,
  compress: boolean = true
) => {
  try {
    if (!file) throw new Error('No file provided');

    // Kompres gambar jika diperlukan dan file adalah gambar
    let uploadFile: File | Blob = file;
    if (compress && file.type.startsWith('image/')) {
      try {
        uploadFile = await compressImage(file);
        console.log(`Image compressed: ${file.size} -> ${uploadFile.size} bytes`);
      } catch (e) {
        console.warn('Compression failed, using original file:', e);
        uploadFile = file;
      }
    }

    // Membuat nama file yang unik dengan timestamp jika tidak ada customFileName
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = customFileName || `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file ke Supabase Storage
    // Use regular client - bucket must have public INSERT policy
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(filePath, uploadFile, {
        cacheControl: '3600',
        contentType: compress ? 'image/jpeg' : file.type
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Mendapatkan URL publik dari file yang diupload
    const { data: urlData } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('Image uploaded successfully:', urlData.publicUrl);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Menghapus gambar dari Supabase Storage
 * @param {string} path - Path gambar di Supabase Storage
 * @param {string} bucket - Nama bucket di Supabase Storage (default: 'Gambar')
 * @returns {Promise<boolean>} - true jika berhasil
 * @throws {Error} - Jika hapus gagal
 */
export const deleteImage = async (path: string, bucket: string = 'Gambar') => {
  try {
    if (!path) return false;

    // Use supabase client instead of admin if possible, or ensure admin is configured
    // Using supabase client allows RLS to work if policy allows delete
    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Mendapatkan URL publik dari path gambar di Supabase Storage
 * @param {string} path - Path gambar di Supabase Storage
 * @param {string} bucket - Nama bucket di Supabase Storage (default: 'Gambar')
 * @returns {string | null} - URL publik gambar jika berhasil, null jika gagal
 */
export const getImageUrl = (path: string | null, bucket: string = 'Gambar'): string | null => {
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

/**
 * Resolve image URL dari berbagai format (full URL, path relatif, dll)
 * @param {string | null} url - URL atau path gambar
 * @param {string} bucket - Nama bucket (default: 'Gambar')
 * @returns {string} - URL lengkap gambar atau placeholder
 */
export const resolveImageUrl = (url: string | null, bucket: string = 'Gambar'): string => {
  if (!url) return '/placeholder.svg';

  // Jika sudah full URL (http/https)
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  // Jika path dimulai dengan bucket name (e.g., "Gambar/products/...")
  if (url.startsWith(`${bucket}/`)) {
    const pathWithoutBucket = url.substring(bucket.length + 1);
    return getImageUrl(pathWithoutBucket, bucket) || '/placeholder.svg';
  }

  // Jika path relatif (e.g., "products/filename.jpg")
  return getImageUrl(url, bucket) || '/placeholder.svg';
};