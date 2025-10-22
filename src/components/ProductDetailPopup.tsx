import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  category: string;
  image_url: string | null;
}

interface ProductDetailPopupProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ProductDetailPopup: React.FC<ProductDetailPopupProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const isDigitalProduct = product.type === 'service' || product.type === 'ebook' || product.type === 'template';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
          <DialogDescription className="text-lg text-primary">
            {formatPrice(product.price)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {product.image_url && (
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Deskripsi Produk</h3>
              <div className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {product.description}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {product.type === 'template' ? 'Template' : 
                 product.type === 'ebook' ? 'E-Book' : 
                 product.type === 'service' ? 'Layanan' : 'Produk'}
              </span>
              <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
                {product.category === 'design' ? 'Desain' :
                 product.category === 'education' ? 'Pendidikan' :
                 product.category === 'business' ? 'Bisnis' :
                 product.category === 'technology' ? 'Teknologi' :
                 product.category === 'marketing' ? 'Pemasaran' : 'Lainnya'}
              </span>
            </div>
            
            {isDigitalProduct && (
              <div>
                <h3 className="text-lg font-semibold">Keuntungan</h3>
                <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                  {product.type === 'service' && product.category === 'marketing' && (
                    <>
                      <li>Strategi pemasaran digital yang disesuaikan dengan kebutuhan bisnis Anda</li>
                      <li>Analisis kompetitor dan pasar untuk meningkatkan visibilitas online</li>
                      <li>Optimasi konten dan media sosial untuk menjangkau audiens yang tepat</li>
                      <li>Laporan performa dan analitik secara berkala</li>
                      <li>Dukungan teknis selama periode layanan</li>
                    </>
                  )}
                  {product.type === 'ebook' && (
                    <>
                      <li>Panduan lengkap dalam format PDF</li>
                      <li>Akses seumur hidup ke konten</li>
                      <li>Bisa dibaca di berbagai perangkat</li>
                      <li>Dilengkapi contoh kasus dan studi</li>
                    </>
                  )}
                  {product.type === 'template' && (
                    <>
                      <li>File siap pakai dan mudah disesuaikan</li>
                      <li>Desain profesional dan modern</li>
                      <li>Kompatibel dengan berbagai aplikasi</li>
                      <li>Termasuk panduan penggunaan</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button onClick={() => onAddToCart(product)}>
            Tambahkan ke Keranjang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailPopup;