import React from 'react';
import { Link } from 'react-router-dom';
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <img src={logo} alt="MoodLab Logo" className="h-10 mr-3" />
              <h3 className="text-xl font-bold">MoodLab</h3>
            </div>
            <p className="text-gray-400">
              Solusi digital terbaik untuk kebutuhan bisnis dan kreatif Anda.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Tautan</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/produk" className="text-gray-400 hover:text-white transition">
                  Produk
                </Link>
              </li>
              <li>
                <Link to="/layanan" className="text-gray-400 hover:text-white transition">
                  Layanan
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/kontak" className="text-gray-400 hover:text-white transition">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Kontak</h3>
            <p className="text-gray-400 mb-2">Email: info@moodlab.id</p>
            <p className="text-gray-400 mb-2">Telepon: +62 812 3456 7890</p>
            <p className="text-gray-400">
              Alamat: Jl. Kreatif No. 123, Jakarta, Indonesia
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} MoodLab. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;