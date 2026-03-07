import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Car, Bike, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

const COLORS = ['hsl(260, 50%, 60%)', 'hsl(20, 80%, 65%)', 'hsl(160, 50%, 42%)'];

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, type: 'spring' as const, stiffness: 260, damping: 20 },
  }),
};

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalToday: 0, activeNow: 0, revenueToday: 0, motorToday: 0, mobilToday: 0, lainnyaToday: 0 });
  const [weeklyData, setWeeklyData] = useState<{ day: string; count: number; revenue: number }[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

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
    <div className="space-y-4 sm:space-y-6">
      {/* Greeting & Clock */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-card rounded-xl border border-border p-4 sm:p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Halo, {profile?.name} 👋</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Ringkasan parkir hari ini</p>
          </div>
          <div className="flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <div className="text-right">
              <p className="text-base sm:text-lg font-bold tabular-nums leading-tight">{formattedTime}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{formattedDate}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Carousel (mobile) / Grid (desktop) */}
      <div className="block sm:hidden">
        <Carousel opts={{ align: 'start', loop: true }}>
          <CarouselContent className="-ml-2">
            {cards.map((card, i) => (
              <CarouselItem key={card.label} className="pl-2 basis-[85%]">
                <motion.div
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-xl font-bold truncate">{card.value}</p>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 cursor-default"
          >
            <motion.div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.4 }}
            >
              <card.icon className="w-6 h-6" />
            </motion.div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">{card.label}</p>
              <p className="text-lg sm:text-xl font-bold truncate">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Weekly Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <h3 className="font-semibold mb-4 text-sm sm:text-base">Kendaraan 7 Hari Terakhir</h3>
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
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <h3 className="font-semibold mb-3 text-sm sm:text-base">Jenis Kendaraan Hari Ini</h3>
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
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm">{d.name}: <strong>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-muted-foreground py-8">
              <Bike className="w-5 h-5" />
              <span className="text-sm">Belum ada kendaraan hari ini</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
