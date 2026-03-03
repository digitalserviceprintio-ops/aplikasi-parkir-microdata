import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Car, LayoutDashboard, LogIn as LogInIcon, LogOut as LogOutIcon, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'attendant', 'owner'] },
  { path: '/entry', label: 'Masuk', icon: LogInIcon, roles: ['admin', 'attendant'] },
  { path: '/exit', label: 'Keluar', icon: LogOutIcon, roles: ['admin', 'attendant'] },
  { path: '/reports', label: 'Laporan', icon: FileText, roles: ['admin', 'owner'] },
  { path: '/settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredNav = navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">ParkEasy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-1 rounded-full">
            {profile?.role}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOutIcon className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-50">
        <div className="flex justify-around max-w-lg mx-auto">
          {filteredNav.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
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
