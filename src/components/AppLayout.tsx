import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { Car, LayoutDashboard, LogIn as LogInIcon, LogOut as LogOutIcon, FileText, Settings, Users, CreditCard, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageTransition from '@/components/PageTransition';
import { motion } from 'framer-motion';
import bgSplash from '@/assets/bg-splash.jpg';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'attendant', 'owner'] },
  { path: '/entry', label: 'Masuk', icon: LogInIcon, roles: ['admin', 'attendant'] },
  { path: '/exit', label: 'Keluar', icon: LogOutIcon, roles: ['admin', 'attendant'] },
  { path: '/cards', label: 'Kartu', icon: CreditCard, roles: ['admin', 'attendant'] },
  { path: '/reports', label: 'Laporan', icon: FileText, roles: ['admin', 'owner'] },
  { path: '/users', label: 'Users', icon: Users, roles: ['admin'] },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
          <motion.div
            whileHover={{ rotate: [0, -15, 15, 0] }}
            whileTap={{ scale: 0.85 }}
            transition={{ duration: 0.4 }}
            className="w-8 h-8 rounded-lg bg-primary shadow-md flex items-center justify-center"
          >
            <Car className="w-4 h-4 text-primary-foreground" />
          </motion.div>
          <span className="font-bold text-lg">ParkEasy</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground capitalize bg-secondary/80 px-2 py-1 rounded-full">
            {profile?.role}
          </span>
          {profile?.role === 'admin' && (
            <motion.div whileTap={{ scale: 0.85 }}>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
          <motion.div whileTap={{ scale: 0.85 }} whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.85 }}>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={signOut}>
              <LogOutIcon className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 max-w-lg mx-auto w-full relative z-10">
        <PageTransition key={location.pathname}>
          {children}
        </PageTransition>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card px-2 py-2 z-50 rounded-none border-x-0 border-b-0">
        <div className="flex justify-around max-w-lg mx-auto">
          {filteredNav.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.85, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl shadow-sm"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="text-[10px] font-medium relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
