import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogOut, Search, Clock, DollarSign } from 'lucide-react';

interface ActiveVehicle {
  id: string;
  plate_number: string;
  vehicle_type: string;
  entry_time: string;
  duration: string;
  totalPrice: number;
}

const VehicleExit = () => {
  const [search, setSearch] = useState('');
  const [vehicle, setVehicle] = useState<ActiveVehicle | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const calculateDuration = (entryTime: string) => {
    const entry = new Date(entryTime);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}j ${mins}m`;
  };

  const calculatePrice = async (vehicleType: string, entryTime: string) => {
    const { data: rates } = await supabase
      .from('parking_rates')
      .select('*')
      .eq('vehicle_type', vehicleType)
      .single();

    if (!rates) return 0;

    if (rates.rate_type === 'flat') return rates.rate_amount;

    const entry = new Date(entryTime);
    const now = new Date();
    const hours = Math.ceil((now.getTime() - entry.getTime()) / 3600000);
    return hours * rates.rate_amount;
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('plate_number', search.toUpperCase().trim())
        .is('exit_time', null)
        .order('entry_time', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast.error('Kendaraan tidak ditemukan atau sudah keluar');
        setVehicle(null);
        return;
      }

      const totalPrice = await calculatePrice(data.vehicle_type, data.entry_time);

      setVehicle({
        id: data.id,
        plate_number: data.plate_number,
        vehicle_type: data.vehicle_type,
        entry_time: data.entry_time,
        duration: calculateDuration(data.entry_time),
        totalPrice,
      });
    } catch {
      toast.error('Gagal mencari kendaraan');
    } finally {
      setSearching(false);
    }
  };

  const handleCheckout = async () => {
    if (!vehicle) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          exit_time: new Date().toISOString(),
          total_price: vehicle.totalPrice,
          payment_method: paymentMethod,
          payment_status: 'paid',
        })
        .eq('id', vehicle.id);

      if (error) throw error;

      toast.success(`${vehicle.plate_number} berhasil keluar!`);
      setVehicle(null);
      setSearch('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal checkout');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Kendaraan Keluar</h1>
        <p className="text-sm text-muted-foreground">Proses kendaraan keluar & pembayaran</p>
      </div>

      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari plat nomor..."
          className="h-12 uppercase font-bold tracking-wider"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} className="h-12 px-4" disabled={searching}>
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {vehicle && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="bg-primary/10 p-4 text-center">
            <p className="text-2xl font-black tracking-widest text-primary">{vehicle.plate_number}</p>
            <p className="text-sm text-muted-foreground capitalize mt-1">{vehicle.vehicle_type}</p>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Durasi Parkir</p>
                <p className="font-bold">{vehicle.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Bayar</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(vehicle.totalPrice)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 border-t border-border">
            <Label>Metode Pembayaran</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'qris'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold uppercase transition-all ${
                    paymentMethod === method
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <Button onClick={handleCheckout} className="w-full h-14 text-lg font-bold" disabled={loading}>
              <LogOut className="w-5 h-5 mr-2" />
              {loading ? 'Memproses...' : 'Proses Keluar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleExit;
