import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Car, UserPlus, Shield, Users } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import bgSplash from '@/assets/bg-splash.jpg';
import LicenseDialog from '@/components/LicenseDialog';
import { supabase } from '@/integrations/supabase/client';

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
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);

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
    if (!licenseKey.trim()) {
      toast.error('Masukkan kode lisensi untuk mendaftar');
      return;
    }

    setLoading(true);
    try {
      // Validate license key
      const { data: license, error: licErr } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', licenseKey.trim().toUpperCase())
        .maybeSingle();

      if (licErr) throw licErr;
      if (!license) {
        toast.error('Kode lisensi tidak valid');
        return;
      }
      if (license.is_used) {
        toast.error('Kode lisensi sudah digunakan');
        return;
      }

      await signUp(email, password, name.trim(), role);

      // Mark license as used
      await supabase
        .from('licenses')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', license.id);

      // Store license locally
      localStorage.setItem('park_license_key', license.license_key);
      localStorage.setItem('park_license_permanent', String(license.is_permanent));
      localStorage.removeItem('park_trial_start');

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

          {/* License Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Kode Lisensi</Label>
              <button type="button" onClick={() => setShowLicenseDialog(true)} className="text-xs text-primary font-semibold hover:underline">
                Beli lisensi
              </button>
            </div>
            <Input
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              placeholder="PARK-XXXX-XXXX-XXXX"
              required
              className="h-12 bg-background/50 font-mono tracking-wider text-center"
            />
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

      <LicenseDialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog} mode="register" />
    </div>
  );
};

export default RegisterPage;
