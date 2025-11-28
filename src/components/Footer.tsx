import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

import logo from "@/assets/logo.png";
import ModyAvatar from "@/assets/mody-avatar.png";


export function Footer() {

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com/moodlab.idn', label: 'Instagram', color: 'hover:text-pink-500' },
    { icon: Facebook, href: 'https://facebook.com/moodlab', label: 'Facebook', color: 'hover:text-blue-500' },
    { icon: Linkedin, href: 'https://linkedin.com/company/moodlab', label: 'LinkedIn', color: 'hover:text-blue-600' },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-foreground py-16 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & About */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src={logo} alt="MoodLab Logo" className="h-12 mr-3" />
              <h3 className="text-2xl font-bold gradient-text">MoodLab</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Solusi digital terbaik untuk kebutuhan bisnis dan kreatif Anda.
            </p>

            {/* Social Media */}
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-110 hover:shadow-lg ${social.color}`}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full"></span>
              Tautan Cepat
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Beranda' },
                { to: '/produk', label: 'Produk Digital' },
                { to: '/layanan', label: 'Layanan' },
                { to: '/about', label: 'Tentang Kami' },
                { to: '/kontak', label: 'Kontak' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-muted group-hover:bg-primary transition-colors"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="h-1 w-8 bg-gradient-to-r from-secondary to-accent rounded-full"></span>
              Hubungi Kami
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <a
                    href="mailto:moodlab.idn@gmail.com"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    moodlab.idn@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                  <Phone className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Telepon</p>
                  <a
                    href="https://wa.me/6281341277339"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-secondary transition-colors"
                  >
                    081341277339
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Alamat</p>
                  <a
                    href="https://maps.google.com/?q=Jl. AP. Pettarani Makassar, Sulawesi Selatan, 90222"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-accent transition-colors"
                  >
                    Jl. AP. Pettarani Makassar, Sulawesi Selatan
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter & Mody */}
          <div className="space-y-6">


            {/* Mody CTA */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <img
                  src={ModyAvatar}
                  alt="Mody"
                  className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Ada pertanyaan?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chat dengan Mody, AI assistant kami!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} MoodLab. Hak Cipta Dilindungi.
            </p>

          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;