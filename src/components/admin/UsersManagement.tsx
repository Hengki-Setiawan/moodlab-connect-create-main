import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseAdmin } from "@/integrations/supabase/admin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EditUserModal } from "./EditUserModal";

interface RoleRow {
  user_id: string;
  role: "admin" | "moderator" | "user";
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean | null;
}

interface AdminAuthUser {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string | null;
}

interface UserCombined {
  id: string;
  email: string;
  profile?: ProfileRow | null;
  role?: RoleRow["role"] | null;
  created_at?: string;
  last_sign_in_at?: string | null;
}

const UsersManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserCombined[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserCombined | null>(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter(u => (
      (u.email && u.email.toLowerCase().includes(s)) ||
      (u.profile?.full_name && u.profile.full_name.toLowerCase().includes(s)) ||
      (u.profile?.phone && u.profile.phone.toLowerCase().includes(s))
    ));
  }, [search, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
      if ((res as any).error) throw (res as any).error;
      const authUsers: AdminAuthUser[] = (res as any).data?.users || [];
      const ids = authUsers.map(u => u.id);

      const { data: profiles } = await supabaseAdmin.from("profiles").select("*").in("id", ids);
      const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids);

      const byIdProfile = new Map<string, ProfileRow>();
      (profiles || []).forEach((p: any) => byIdProfile.set(p.id, p));

      const byIdRole = new Map<string, RoleRow["role"]>();
      (roles || []).forEach((r: any) => byIdRole.set(r.user_id, r.role));

      const combined: UserCombined[] = authUsers.map(u => ({
        id: u.id,
        email: u.email || "",
        profile: byIdProfile.get(u.id) || null,
        role: byIdRole.get(u.id) || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
      }));

      setUsers(combined);
    } catch (err: any) {
      console.error("Error loadUsers:", err);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Modal functions
  const openModal = (user: UserCombined | null = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const saveUser = async (userData: Partial<UserCombined>) => {
    try {
      setSavingId(selectedUser?.id || '');

      // Update profile - handle both nested and flat structure
      const fullName = (userData as any).full_name ?? userData.profile?.full_name ?? selectedUser?.profile?.full_name ?? null;
      const phone = (userData as any).phone ?? userData.profile?.phone ?? selectedUser?.profile?.phone ?? null;

      const profilePayload = {
        id: selectedUser?.id,
        full_name: fullName,
        phone: phone,
      };
      const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profilePayload);
      if (profileError) throw profileError;

      // Update role
      const role = userData.role ?? (userData as any).role;
      if (role) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", selectedUser?.id);
        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
          user_id: selectedUser?.id,
          role: role
        });
        if (roleError) throw roleError;
      }

      toast.success("Data pengguna berhasil disimpan");
      closeModal();
      await loadUsers();
    } catch (err) {
      console.error("saveUser error:", err);
      toast.error("Gagal menyimpan data pengguna");
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Hapus pengguna ini? Tindakan tidak dapat dibatalkan.")) return;
    try {
      setDeletingId(userId);
      const r = await supabaseAdmin.auth.admin.deleteUser(userId);
      if ((r as any).error) throw (r as any).error;
      toast.success("Pengguna dihapus");
      await loadUsers();
    } catch (err) {
      console.error("deleteUser error:", err);
      toast.error("Gagal menghapus pengguna");
    } finally {
      setDeletingId(null);
    }
  };

  const impersonateUser = async (user: UserCombined) => {
    try {
      setSavingId(user.id);
      if (!user.email) {
        toast.error("Pengguna tidak memiliki email valid");
        return;
      }
      const redirectTo = (import.meta as any).env?.VITE_SITE_URL || window.location.origin;
      const res: any = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: user.email, options: { redirectTo } });
      if (res?.error) throw res.error;
      const url: string | undefined = res?.data?.properties?.action_link || res?.data?.action_link;
      const hashedToken: string | undefined = res?.data?.properties?.hashed_token;
      if (hashedToken) {
        const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: hashedToken });
        if (error) throw error;
        toast.success('Berhasil masuk sebagai pengguna');
        navigate('/profile');
        return;
      }
      if (!url) throw new Error('action_link tidak tersedia');
      window.open(url, '_blank');
      toast.success('Membuka sesi sebagai pengguna di tab baru');
    } catch (err: any) {
      console.error('impersonateUser error:', err);
      toast.error(`Gagal membuka sesi pengguna${err?.message ? `: ${err.message}` : ''}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Akun Pengunjung</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Cari email / nama / no. HP"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={loadUsers} disabled={loading}>Refresh</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. HP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terakhir Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.profile?.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.profile?.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-800' :
                          u.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(u)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => impersonateUser(u)}
                          disabled={savingId === u.id}
                          className="text-green-600 hover:text-green-900"
                        >
                          Masuk sebagai
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(u.id)}
                          disabled={deletingId === u.id}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <EditUserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        user={selectedUser}
        onSave={saveUser}
        loading={!!savingId}
      />
    </div>
  );
};

export default UsersManagement;
