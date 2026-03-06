import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PasswordInput from '@/components/PasswordInput';
import { Car, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import bgSplash from '@/assets/bg-splash.jpg';

const LoginPage = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Login berhasil!');
    } catch (err: any) {
      toast.error(err.message || 'Login gagal');
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
      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/90 shadow-lg mb-4">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ParkEasy</h1>
          <p className="text-muted-foreground text-sm">Sistem parkir sederhana & mudah</p>
        </div>

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

        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">Daftar</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
