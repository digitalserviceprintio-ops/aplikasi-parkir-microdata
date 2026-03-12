import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Users, Shield, Ban, CheckCircle, Plus, Pencil, Trash2, Search, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  kasir: 'Kasir',
};

const UserManagement = () => {
  const { profile, signUp } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('attendant');
  const [formLoading, setFormLoading] = useState(false);

  // Edit form
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
    if (error) toast.error(error.message);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast.error('Semua field harus diisi');
      return;
    }
    if (formPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setFormLoading(true);
    try {
      // Use edge function or direct signup
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: formEmail.trim(), password: formPassword, name: formName.trim(), role: formRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`User ${formName} berhasil ditambahkan!`);
      setAddDialogOpen(false);
      resetAddForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan user');
    } finally {
      setFormLoading(false);
    }
  };

  const resetAddForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('attendant');
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser || !editName.trim()) return;
    setFormLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName.trim(), role: editRole })
        .eq('id', selectedUser.id);
      if (error) throw error;

      toast.success('User berhasil diperbarui');
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id ? { ...u, name: editName.trim(), role: editRole } : u
      ));
      setEditDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui user');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);
    if (error) {
      toast.error('Gagal mengubah status');
    } else {
      toast.success(`Akun ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    }
  };

  const openDeleteDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: selectedUser.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('User berhasil dihapus');
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setDeleteDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus user');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.status !== 'deleted' && (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleLabels[u.role]?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (profile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Akses hanya untuk admin</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">Manajemen User</h1>
        </div>
        <Button onClick={() => { resetAddForm(); setAddDialogOpen(true); }} size="sm" className="h-9 sm:h-10 gap-1.5 font-semibold">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah User</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, email, atau role..."
          className="pl-9 h-10 sm:h-11"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Total User', value: filteredUsers.length, color: 'text-primary' },
          { label: 'Aktif', value: filteredUsers.filter(u => u.status === 'active').length, color: 'text-green-600 dark:text-green-400' },
          { label: 'Nonaktif', value: filteredUsers.filter(u => u.status === 'inactive').length, color: 'text-destructive' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-2.5 sm:p-3 text-center">
            <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {searchQuery ? 'Tidak ada user yang ditemukan' : 'Belum ada user'}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          <AnimatePresence>
            {filteredUsers.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm sm:text-base truncate">{u.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                        u.status === 'active'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] sm:text-xs bg-secondary px-2 py-1 rounded-full font-medium capitalize">
                      {roleLabels[u.role] || u.role}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-1 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex-1 sm:flex-none"
                    onClick={() => openEditDialog(u)}
                    disabled={u.id === profile?.id}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={u.status === 'active' ? 'outline' : 'default'}
                    size="sm"
                    className="h-8 text-xs flex-1 sm:flex-none"
                    onClick={() => toggleStatus(u.id, u.status)}
                    disabled={u.id === profile?.id}
                  >
                    {u.status === 'active' ? (
                      <><Ban className="w-3.5 h-3.5 mr-1" />Nonaktifkan</>
                    ) : (
                      <><CheckCircle className="w-3.5 h-3.5 mr-1" />Aktifkan</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
                    onClick={() => openDeleteDialog(u)}
                    disabled={u.id === profile?.id}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Tambah User Baru
            </DialogTitle>
            <DialogDescription>Buat akun baru untuk petugas parkir atau admin</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs sm:text-sm">Nama Lengkap</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama lengkap" className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs sm:text-sm">Email</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@contoh.com" className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs sm:text-sm">Password</Label>
              <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Minimal 6 karakter" className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs sm:text-sm">Role</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="attendant">Petugas Parkir</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Petugas Parkir hanya bisa mencatat kendaraan masuk/keluar dan kelola kartu member.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddUser} disabled={formLoading}>
              {formLoading ? 'Menyimpan...' : 'Tambah User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit User
            </DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs sm:text-sm">Nama</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs sm:text-sm">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="attendant">Petugas Parkir</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
            <Button onClick={handleEditUser} disabled={formLoading}>
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Hapus User
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedUser?.name}</strong> ({selectedUser?.email})? Akun akan dinonaktifkan secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={formLoading}>
              {formLoading ? 'Menghapus...' : 'Hapus User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
