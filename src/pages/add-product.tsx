import React from 'react';
import AddProduct from '@/components/AddProduct';
import { AdminProtected } from '@/components/AdminProtected';
import Navbar from '@/components/Navbar';
import AdminNavbar from '@/components/AdminNavbar';

export default function AddProductPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <AdminProtected>
        <AdminNavbar />
        <div className="container mx-auto pt-32 pb-20 px-4 ml-64">
          <h1 className="text-3xl font-bold mb-8">Tambah Produk Baru</h1>
          <AddProduct />
        </div>
      </AdminProtected>
    </div>
  );
}