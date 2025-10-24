import { useEffect, useMemo, useState } from "react";
import { supabaseAdmin } from "@/integrations/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
  const [users, setUsers] = useState<UserCombined[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const saveProfile = async (user: UserCombined, next: Partial<ProfileRow>) => {
    try {
      setSavingId(user.id);
      const payload = {
        id: user.id,
        full_name: next.full_name ?? user.profile?.full_name ?? null,
        phone: next.phone ?? user.profile?.phone ?? null,
      };
      const { error } = await supabaseAdmin.from("profiles").upsert(payload);
      if (error) throw error;
      toast.success("Profil berhasil disimpan");
      await loadUsers();
    } catch (err) {
      console.error("saveProfile error:", err);
      toast.error("Gagal menyimpan profil");
    } finally {
      setSavingId(null);
    }
  };

  const setRole = async (userId: string, role: RoleRow["role"]) => {
    try {
      setSavingId(userId);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
      toast.success("Role pengguna diperbarui");
      await loadUsers();
    } catch (err) {
      console.error("setRole error:", err);
      toast.error("Gagal memperbarui role");
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manajemen Akun Pengunjung</h2>
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
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Input
                        defaultValue={u.profile?.full_name || ""}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (v !== (u.profile?.full_name || "")) {
                            saveProfile(u, { full_name: v });
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Input
                        defaultValue={u.profile?.phone || ""}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (v !== (u.profile?.phone || "")) {
                            saveProfile(u, { phone: v });
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Select value={u.role || "user"} onValueChange={(val) => setRole(u.id, val as RoleRow["role"]) }>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Pilih Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="destructive" size="sm" onClick={() => deleteUser(u.id)} disabled={deletingId === u.id}>Hapus</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
