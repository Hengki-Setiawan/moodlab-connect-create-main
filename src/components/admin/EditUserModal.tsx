import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminModal } from './AdminModal';

interface User {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role?: 'admin' | 'moderator' | 'user';
  is_active?: boolean;
  created_at?: string;
  last_sign_in_at?: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: Partial<User>) => Promise<void>;
  loading?: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role: 'user' as 'admin' | 'moderator' | 'user',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        role: user.role || 'user',
        is_active: user.is_active ?? true,
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser: Partial<User> = {
      id: user.id,
      full_name: formData.full_name,
      phone: formData.phone,
      role: formData.role,
      is_active: formData.is_active,
    };

    await onSave(updatedUser);
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            value={user?.email || ''}
            disabled
            className="w-full bg-gray-100"
          />
          <p className="text-sm text-gray-500">Email tidak dapat diubah</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Nama Lengkap</Label>
          <Input
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Telepon</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleSelectChange('role', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
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

        <div className="space-y-2">
          <Label>Informasi Akun</Label>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Dibuat: {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}</p>
            <p>Terakhir login: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('id-ID') : '-'}</p>
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
            {loading ? 'Menyimpan...' : 'Simpan Pengguna'}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};

export default EditUserModal;