import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Car, LayoutDashboard, LogIn as LogInIcon, LogOut as LogOutIcon, FileText, Settings, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import bgSplash from '@/assets/bg-splash.jpg';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'attendant', 'owner'] },
  { path: '/entry', label: 'Masuk', icon: LogInIcon, roles: ['admin', 'attendant'] },
  { path: '/exit', label: 'Keluar', icon: LogOutIcon, roles: ['admin', 'attendant'] },
  { path: '/cards', label: 'Kartu', icon: CreditCard, roles: ['admin', 'attendant'] },
  { path: '/reports', label: 'Laporan', icon: FileText, roles: ['admin', 'owner'] },
  { path: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { path: '/settings', label: 'Setelan', icon: Settings, roles: ['admin'] },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredNav = navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${bgSplash})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card px-4 py-3 flex items-center justify-between rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary shadow-md flex items-center justify-center">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">ParkEasy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground capitalize bg-secondary/80 px-2 py-1 rounded-full">
            {profile?.role}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOutIcon className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 max-w-lg mx-auto w-full relative z-10">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card px-2 py-2 z-50 rounded-none border-x-0 border-b-0">
        <div className="flex justify-around max-w-lg mx-auto">
          {filteredNav.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
