import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

      // Fetch profiles and user_roles separately to avoid 400 error if relationship is missing
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_roles")
          .select("*")
      ]);

      if (profilesResult.error) {
        // Check for common RLS errors
        if (profilesResult.error.code === 'PGRST301' || profilesResult.error.message?.includes('RLS')) {
          console.error("RLS Policy Error:", profilesResult.error);
          toast.error("Tidak memiliki akses admin. Hubungi administrator untuk menjalankan migration RLS.");
        } else if (profilesResult.error.code === '42501') {
          toast.error("Akses ditolak. Pastikan migration 20260129_add_admin_profiles_policy.sql sudah dijalankan di Supabase.");
        } else {
          toast.error(`Gagal memuat data: ${profilesResult.error.message}`);
        }
        throw profilesResult.error;
      }

      // rolesResult.error might be ignored if we want to show profiles even if roles fail
      if (rolesResult.error) {
        console.warn("Error fetching user roles:", rolesResult.error);
      }

      const profiles = profilesResult.data || [];
      const roles = rolesResult.data || [];

      // Create a map of user_id -> role for faster lookup
      const roleMap = new Map();
      roles.forEach((r: any) => {
        roleMap.set(r.user_id, r.role);
      });

      // Transform to match UserCombined interface
      const combined: UserCombined[] = profiles.map((p: any) => ({
        id: p.id,
        email: p.email || "Email tidak tersedia",
        profile: p,
        role: roleMap.get(p.id) || null,
        created_at: p.created_at,
        last_sign_in_at: null, // Cannot get this from public profile
      }));

      setUsers(combined);

      if (combined.length === 0) {
        toast.info("Belum ada pengguna terdaftar");
      }
    } catch (err: any) {
      console.error("Error loadUsers:", err);
      // Don't show duplicate toast if already shown above
      if (!err.code) {
        toast.error("Gagal memuat data pengguna");
      }
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

      console.log("Updating profile:", profilePayload);
      const { error: profileError } = await supabase.from("profiles").upsert(profilePayload as any);
      if (profileError) {
        console.error("Profile update failed:", profileError);
        throw new Error(`Gagal update profil: ${profileError.message}`);
      }

      // Update role
      const role = userData.role ?? (userData as any).role;
      if (role && selectedUser?.id) {
        console.log("Updating role for:", selectedUser.id, "to", role);

        // Check if role exists
        const { data: existingRole, error: checkError } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", selectedUser.id)
          .maybeSingle();

        if (checkError) {
          console.error("Check role failed:", checkError);
          throw new Error(`Gagal cek role: ${checkError.message}`);
        }

        if (existingRole) {
          // Update existing
          const { error: updateError } = await supabase
            .from("user_roles")
            .update({ role: role } as any)
            .eq("user_id", selectedUser.id);

          if (updateError) throw new Error(`Gagal update role: ${updateError.message}`);
        } else {
          // Insert new
          // @ts-ignore
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({
              user_id: selectedUser.id,
              role: role,
              email: selectedUser.email // Need email for user_roles
            } as any);

          if (insertError) throw new Error(`Gagal tambah role: ${insertError.message}`);
        }
      }

      toast.success("Data pengguna berhasil disimpan");
      closeModal();
      await loadUsers();
    } catch (err: any) {
      console.error("saveUser error:", err);
      toast.error(err.message || "Gagal menyimpan data pengguna");
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    toast.error("Fitur hapus user dinonaktifkan untuk keamanan (membutuhkan backend).");
    // if (!confirm("Hapus pengguna ini? Tindakan tidak dapat dibatalkan.")) return;
    // try {
    //   setDeletingId(userId);
    //   const r = await supabaseAdmin.auth.admin.deleteUser(userId);
    //   if ((r as any).error) throw (r as any).error;
    //   toast.success("Pengguna dihapus");
    //   await loadUsers();
    // } catch (err) {
    //   console.error("deleteUser error:", err);
    //   toast.error("Gagal menghapus pengguna");
    // } finally {
    //   setDeletingId(null);
    // }
  };

  const impersonateUser = async (user: UserCombined) => {
    toast.error("Fitur impersonate dinonaktifkan untuk keamanan (membutuhkan backend).");
    // try {
    //   setSavingId(user.id);
    //   if (!user.email) {
    //     toast.error("Pengguna tidak memiliki email valid");
    //     return;
    //   }
    //   const redirectTo = (import.meta as any).env?.VITE_SITE_URL || window.location.origin;
    //   const res: any = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: user.email, options: { redirectTo } });
    //   if (res?.error) throw res.error;
    //   const url: string | undefined = res?.data?.properties?.action_link || res?.data?.action_link;
    //   const hashedToken: string | undefined = res?.data?.properties?.hashed_token;
    //   if (hashedToken) {
    //     const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: hashedToken });
    //     if (error) throw error;
    //     toast.success('Berhasil masuk sebagai pengguna');
    //     navigate('/profile');
    //     return;
    //   }
    //   if (!url) throw new Error('action_link tidak tersedia');
    //   window.open(url, '_blank');
    //   toast.success('Membuka sesi sebagai pengguna di tab baru');
    // } catch (err: any) {
    //   console.error('impersonateUser error:', err);
    //   toast.error(`Gagal membuka sesi pengguna${err?.message ? `: ${err.message}` : ''}`);
    // } finally {
    //   setSavingId(null);
    // }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Manajemen Akun Pengunjung</h2>
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

      <div className="bg-white dark:bg-card rounded-lg shadow dark:shadow-lg border dark:border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No. HP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terakhir Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-muted-foreground">Tidak ada data</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {u.profile?.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
