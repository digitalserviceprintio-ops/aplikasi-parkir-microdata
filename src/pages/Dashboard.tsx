import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Car, Bike, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalToday: 0, activeNow: 0, revenueToday: 0, motorToday: 0, mobilToday: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todayTx } = await supabase
        .from('transactions')
        .select('*')
        .gte('entry_time', todayStart.toISOString());

      if (todayTx) {
        const active = todayTx.filter(t => !t.exit_time).length;
        const revenue = todayTx
          .filter(t => t.payment_status === 'paid')
          .reduce((sum, t) => sum + (t.total_price || 0), 0);
        const motor = todayTx.filter(t => t.vehicle_type === 'motor').length;
        const mobil = todayTx.filter(t => t.vehicle_type === 'mobil').length;

        setStats({
          totalToday: todayTx.length,
          activeNow: active,
          revenueToday: revenue,
          motorToday: motor,
          mobilToday: mobil,
        });
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const cards = [
    { label: 'Kendaraan Hari Ini', value: stats.totalToday, icon: Car, color: 'bg-primary/10 text-primary' },
    { label: 'Sedang Parkir', value: stats.activeNow, icon: TrendingUp, color: 'bg-accent/10 text-accent' },
    { label: 'Pendapatan Hari Ini', value: formatCurrency(stats.revenueToday), icon: DollarSign, color: 'bg-success/10 text-success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Halo, {profile?.name} 👋</h1>
        <p className="text-sm text-muted-foreground">Ringkasan parkir hari ini</p>
      </div>

      <div className="grid gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold mb-3">Jenis Kendaraan Hari Ini</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-primary" />
            <span className="text-sm">Motor: <strong>{stats.motorToday}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-accent" />
            <span className="text-sm">Mobil: <strong>{stats.mobilToday}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
