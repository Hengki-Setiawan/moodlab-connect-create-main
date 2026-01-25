import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AdminModal } from './AdminModal';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  parent_id?: string;
  is_active?: boolean;
}

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (category: Partial<Category>) => Promise<void>;
  loading?: boolean;
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parent_id: '',
    is_active: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        slug: category.slug || '',
        parent_id: category.parent_id || '',
        is_active: category.is_active ?? true,
      });
    }
  }, [category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    const updatedCategory: Partial<Category> = {
      id: category.id,
      name: formData.name,
      description: formData.description,
      slug: formData.slug,
      parent_id: formData.parent_id || null,
      is_active: formData.is_active,
    };

    await onSave(updatedCategory);
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Kategori</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            placeholder="contoh: nama-kategori"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parent_id">ID Kategori Induk</Label>
          <Input
            id="parent_id"
            name="parent_id"
            value={formData.parent_id}
            onChange={handleInputChange}
            placeholder="Kosongkan jika kategori utama"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={(e) => handleCheckboxChange('is_active', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is_active">Aktif</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Kategori'}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};

export default EditCategoryModal;