import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Car, UserPlus, Shield, Eye, Users } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import bgSplash from '@/assets/bg-splash.jpg';

const roles = [
  { value: 'attendant', label: 'Petugas Parkir', icon: Users, desc: 'Catat kendaraan masuk & keluar' },
  { value: 'owner', label: 'Owner', icon: Eye, desc: 'Lihat laporan saja' },
  { value: 'admin', label: 'Admin', icon: Shield, desc: 'Akses penuh ke semua fitur' },
];

const RegisterPage = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendant');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Nama minimal 2 karakter');
      return;
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name.trim(), role);
      toast.success('Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgSplash})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="w-full max-w-sm space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/90 shadow-lg mb-4">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar Akun</h1>
          <p className="text-muted-foreground text-sm">Buat akun baru untuk ParkEasy</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 glass-card rounded-2xl p-6">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" required className="h-12 bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required className="h-12 bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 karakter" required className="h-12 bg-background/50" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="space-y-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    role === r.value ? 'border-primary bg-primary/10' : 'border-border/50 bg-card/50'
                  }`}
                >
                  <r.icon className={`w-5 h-5 ${role === r.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-semibold">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg" disabled={loading}>
            <UserPlus className="w-5 h-5 mr-2" />
            {loading ? 'Mendaftar...' : 'Daftar'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
