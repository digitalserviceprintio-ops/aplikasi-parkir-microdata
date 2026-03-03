import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, DollarSign } from 'lucide-react';

interface ReportData {
  totalVehicles: number;
  totalRevenue: number;
  transactions: {
    id: string;
    plate_number: string;
    vehicle_type: string;
    entry_time: string;
    exit_time: string | null;
    total_price: number | null;
    payment_status: string | null;
  }[];
}

const Reports = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [report, setReport] = useState<ReportData>({ totalVehicles: 0, totalRevenue: 0, transactions: [] });

  useEffect(() => {
    const fetchReport = async () => {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .gte('entry_time', startDate.toISOString())
        .order('entry_time', { ascending: false });

      if (data) {
        const totalRevenue = data
          .filter(t => t.payment_status === 'paid')
          .reduce((sum, t) => sum + (t.total_price || 0), 0);

        setReport({
          totalVehicles: data.length,
          totalRevenue,
          transactions: data,
        });
      }
    };

    fetchReport();
  }, [period]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Laporan</h1>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="daily" className="flex-1">Harian</TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1">Mingguan</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1">Bulanan</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <Car className="w-6 h-6 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{report.totalVehicles}</p>
          <p className="text-xs text-muted-foreground">Total Kendaraan</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <DollarSign className="w-6 h-6 mx-auto mb-1 text-success" />
          <p className="text-lg font-bold">{formatCurrency(report.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Total Pendapatan</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground">Riwayat Transaksi</h3>
        {report.transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Belum ada transaksi</p>
        ) : (
          report.transactions.map((tx) => (
            <div key={tx.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{tx.plate_number}</p>
                <p className="text-xs text-muted-foreground capitalize">{tx.vehicle_type} · {formatTime(tx.entry_time)}</p>
              </div>
              <div className="text-right">
                {tx.exit_time ? (
                  <p className="font-bold text-sm text-success">{formatCurrency(tx.total_price || 0)}</p>
                ) : (
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">Aktif</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
