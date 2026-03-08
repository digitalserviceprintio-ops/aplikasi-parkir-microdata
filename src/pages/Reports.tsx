import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Car, DollarSign, Download } from 'lucide-react';
import { toast } from 'sonner';

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
    payment_method: string | null;
    parking_cards?: { card_code: string; owner_name: string | null } | null;
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
        .select('*, parking_cards(card_code, owner_name)')
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

  const formatFullDateTime = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  const periodLabel = period === 'daily' ? 'Harian' : period === 'weekly' ? 'Mingguan' : 'Bulanan';

  const handleExportExcel = () => {
    if (report.transactions.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }

    const BOM = '\uFEFF';
    const headers = ['No', 'Plat Nomor', 'Jenis Kendaraan', 'Waktu Masuk', 'Waktu Keluar', 'Durasi', 'Tarif', 'Metode Bayar', 'Status', 'Kartu', 'Pemilik'];

    const rows = report.transactions.map((tx, i) => {
      const entry = new Date(tx.entry_time);
      const exit = tx.exit_time ? new Date(tx.exit_time) : null;
      let duration = '-';
      if (exit) {
        const diffMs = exit.getTime() - entry.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        duration = `${hours}j ${mins}m`;
      }

      const card = tx.parking_cards as any;
      return [
        i + 1,
        tx.plate_number,
        tx.vehicle_type,
        formatFullDateTime(tx.entry_time),
        tx.exit_time ? formatFullDateTime(tx.exit_time) : '-',
        duration,
        tx.total_price ?? 0,
        tx.payment_method || '-',
        tx.payment_status === 'paid' ? 'Lunas' : 'Belum',
        card?.card_code || '-',
        card?.owner_name || '-',
      ];
    });

    // Summary rows
    rows.push([]);
    rows.push(['', '', '', '', '', 'Total Kendaraan', report.totalVehicles, '', '', '', '']);
    rows.push(['', '', '', '', '', 'Total Pendapatan', report.totalRevenue, '', '', '', '']);

    const csvContent = BOM + [
      headers.join('\t'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join('\t'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `Laporan_Parkir_${periodLabel}_${dateStr}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Laporan berhasil di-export!');
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Laporan</h1>
        <Button
          onClick={handleExportExcel}
          variant="outline"
          size="sm"
          className="h-9 sm:h-10 text-xs sm:text-sm font-semibold shrink-0"
          disabled={report.transactions.length === 0}
        >
          <Download className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Export Excel</span>
          <span className="sm:hidden">Excel</span>
        </Button>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="daily" className="flex-1 text-xs sm:text-sm">Harian</TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1 text-xs sm:text-sm">Mingguan</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 text-xs sm:text-sm">Bulanan</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 text-center">
          <Car className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-primary" />
          <p className="text-xl sm:text-2xl font-bold">{report.totalVehicles}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Total Kendaraan</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 text-center">
          <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-success" />
          <p className="text-sm sm:text-lg font-bold">{formatCurrency(report.totalRevenue)}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Total Pendapatan</p>
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block">
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Riwayat Transaksi</h3>
        {report.transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Belum ada transaksi</p>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Plat Nomor</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Jenis</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Waktu Masuk</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">Pemilik</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.map((tx: any) => {
                    const card = tx.parking_cards;
                    return (
                      <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/10 transition-colors">
                        <td className="p-3 font-bold">{tx.plate_number}</td>
                        <td className="p-3 capitalize text-muted-foreground">{tx.vehicle_type}</td>
                        <td className="p-3 text-muted-foreground">{formatTime(tx.entry_time)}</td>
                        <td className="p-3 text-muted-foreground">{card?.owner_name || '-'}</td>
                        <td className="p-3 text-right">
                          {tx.exit_time ? (
                            <span className="font-bold text-success">{formatCurrency(tx.total_price || 0)}</span>
                          ) : (
                            <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">Aktif</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground">Riwayat Transaksi</h3>
        {report.transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Belum ada transaksi</p>
        ) : (
          report.transactions.map((tx: any) => (
            <div key={tx.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{tx.plate_number}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{tx.vehicle_type} · {formatTime(tx.entry_time)}</p>
                {tx.parking_cards?.owner_name && (
                  <p className="text-[11px] text-muted-foreground truncate">Pemilik: {tx.parking_cards.owner_name}</p>
                )}
                {tx.parking_cards?.card_code && (
                  <p className="text-[10px] text-muted-foreground font-mono truncate">Kartu: {tx.parking_cards.card_code}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {tx.exit_time ? (
                  <p className="font-bold text-sm text-success">{formatCurrency(tx.total_price || 0)}</p>
                ) : (
                  <span className="text-[11px] bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">Aktif</span>
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
