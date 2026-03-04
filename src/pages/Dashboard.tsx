import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Car, Bike, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(260, 50%, 60%)', 'hsl(20, 80%, 65%)', 'hsl(160, 50%, 42%)'];

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalToday: 0, activeNow: 0, revenueToday: 0, motorToday: 0, mobilToday: 0, lainnyaToday: 0 });
  const [weeklyData, setWeeklyData] = useState<{ day: string; count: number; revenue: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todayTx } = await supabase
        .from('transactions')
        .select('*')
        .gte('entry_time', todayStart.toISOString());

      if (todayTx) {
        setStats({
          totalToday: todayTx.length,
          activeNow: todayTx.filter(t => !t.exit_time).length,
          revenueToday: todayTx.filter(t => t.payment_status === 'paid').reduce((s, t) => s + (t.total_price || 0), 0),
          motorToday: todayTx.filter(t => t.vehicle_type === 'motor').length,
          mobilToday: todayTx.filter(t => t.vehicle_type === 'mobil').length,
          lainnyaToday: todayTx.filter(t => t.vehicle_type === 'lainnya').length,
        });
      }

      // Weekly data
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const { data: weekTx } = await supabase
        .from('transactions')
        .select('*')
        .gte('entry_time', weekStart.toISOString());

      if (weekTx) {
        const days: { day: string; count: number; revenue: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStr = d.toLocaleDateString('id-ID', { weekday: 'short' });
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          const dayTx = weekTx.filter(t => {
            const et = new Date(t.entry_time);
            return et >= dayStart && et < dayEnd;
          });
          days.push({
            day: dayStr,
            count: dayTx.length,
            revenue: dayTx.filter(t => t.payment_status === 'paid').reduce((s, t) => s + (t.total_price || 0), 0),
          });
        }
        setWeeklyData(days);
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

  const pieData = [
    { name: 'Motor', value: stats.motorToday },
    { name: 'Mobil', value: stats.mobilToday },
    { name: 'Lainnya', value: stats.lainnyaToday },
  ].filter(d => d.value > 0);

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

      {/* Weekly Bar Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold mb-4">Kendaraan 7 Hari Terakhir</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyData}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              formatter={(value: number, name: string) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Pendapatan' : 'Kendaraan']}
            />
            <Bar dataKey="count" fill="hsl(260, 50%, 60%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold mb-3">Jenis Kendaraan Hari Ini</h3>
        {pieData.length > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm">{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-muted-foreground">
            <Bike className="w-5 h-5" />
            <span className="text-sm">Belum ada kendaraan hari ini</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
