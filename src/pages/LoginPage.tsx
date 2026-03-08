import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PasswordInput from '@/components/PasswordInput';
import { Car, LogIn, UserCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import bgSplash from '@/assets/bg-splash.jpg';
import LicenseDialog from '@/components/LicenseDialog';

const DEMO_EMAIL = 'demo@parkeasy.app';
const DEMO_PASSWORD = 'demo1234';
const TRIAL_DAYS = 14;

function getTrialDaysLeft(): number | null {
  const start = localStorage.getItem('park_trial_start');
  if (!start) return null;
  const elapsed = Date.now() - Number(start);
  const daysLeft = TRIAL_DAYS - Math.floor(elapsed / (1000 * 60 * 60 * 24));
  return Math.max(0, daysLeft);
}

function isLicensed(): boolean {
  return !!localStorage.getItem('park_license_key');
}

const LoginPage = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (!isLicensed()) {
      const daysLeft = getTrialDaysLeft();
      if (daysLeft !== null && daysLeft <= 0) {
        setTrialExpired(true);
        setShowLicense(true);
      }
    }
  }, []);

  const handleDemoLogin = async () => {
    // Start trial if not started
    if (!localStorage.getItem('park_trial_start') && !isLicensed()) {
      localStorage.setItem('park_trial_start', String(Date.now()));
    }

    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setLoading(true);
    try {
      await signIn(DEMO_EMAIL, DEMO_PASSWORD);
      const daysLeft = getTrialDaysLeft();
      if (daysLeft !== null && daysLeft > 0) {
        toast.success(`Login demo berhasil! Sisa trial: ${daysLeft} hari`);
      } else {
        toast.success('Login demo berhasil!');
      }
    } catch {
      toast.error('Akun demo belum tersedia. Silakan daftar terlebih dahulu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check trial expiry for non-licensed users
    if (!isLicensed()) {
      const daysLeft = getTrialDaysLeft();
      if (daysLeft !== null && daysLeft <= 0) {
        setTrialExpired(true);
        setShowLicense(true);
        return;
      }
    }

    setLoading(true);
    try {
      await signIn(email, password);
      const daysLeft = getTrialDaysLeft();
      if (!isLicensed() && daysLeft !== null && daysLeft <= 3 && daysLeft > 0) {
        toast.warning(`Masa trial tersisa ${daysLeft} hari. Segera aktifkan lisensi.`);
      } else {
        toast.success('Login berhasil!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const trialDaysLeft = getTrialDaysLeft();

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
          <h1 className="text-2xl font-bold tracking-tight">ParkEasy</h1>
          <p className="text-muted-foreground text-sm">Sistem parkir sederhana & mudah</p>
        </div>

        {/* Trial warning banner */}
        {!isLicensed() && trialDaysLeft !== null && trialDaysLeft > 0 && trialDaysLeft <= 5 && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Masa trial tersisa <strong>{trialDaysLeft} hari</strong>. <button className="underline font-semibold" onClick={() => setShowLicense(true)}>Aktifkan lisensi</button></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 glass-card rounded-2xl p-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-12 bg-background/50"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg" disabled={loading}>
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>

        {/* Demo account button */}
        <Button
          variant="outline"
          className="w-full h-11 text-sm font-semibold border-dashed"
          onClick={handleDemoLogin}
          disabled={loading}
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Coba Akun Demo (Trial 14 Hari)
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">Daftar</Link>
        </p>
      </div>

      <LicenseDialog
        open={showLicense}
        onOpenChange={(v) => {
          if (trialExpired) return; // Can't dismiss if expired
          setShowLicense(v);
        }}
        mode={trialExpired ? 'trial_expired' : 'register'}
        onActivated={() => {
          setTrialExpired(false);
        }}
      />
    </div>
  );
};

export default LoginPage;
