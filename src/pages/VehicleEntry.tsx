import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Car, Bike, HelpCircle, LogIn } from 'lucide-react';
import QrScanner from '@/components/QrScanner';
import EntryReceipt from '@/components/EntryReceipt';

const vehicleTypes = [
  { value: 'motor', label: 'Motor', icon: Bike },
  { value: 'mobil', label: 'Mobil', icon: Car },
  { value: 'lainnya', label: 'Lainnya', icon: HelpCircle },
];

const VehicleEntry = () => {
  const { user } = useAuth();
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('motor');
  const [cardCode, setCardCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [cardId, setCardId] = useState<string | null>(null);

  const handleQrScan = async (code: string) => {
    setCardCode(code);
    const { data } = await supabase
      .from('parking_cards')
      .select('*')
      .eq('card_code', code)
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      setCardId(data.id);
      if (data.plate_number) setPlateNumber(data.plate_number);
      setVehicleType(data.vehicle_type);
      toast.success(`Kartu ditemukan: ${data.owner_name || code}`);
    } else {
      setCardId(null);
      toast.info('Kartu tidak ditemukan, isi manual');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) {
      toast.error('Masukkan plat nomor');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        plate_number: plateNumber.toUpperCase().trim(),
        vehicle_type: vehicleType,
        entry_time: new Date().toISOString(),
        created_by: user?.id,
        card_id: cardId,
      });

      if (error) throw error;

      toast.success(`${plateNumber.toUpperCase()} berhasil masuk!`);
      setPlateNumber('');
      setCardId(null);
      setCardCode('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencatat kendaraan masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Kendaraan Masuk</h1>
        <p className="text-sm text-muted-foreground">Catat kendaraan masuk — scan QR atau isi manual</p>
      </div>

      <QrScanner onScan={handleQrScan} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Plat Nomor</Label>
          <Input
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="B 1234 ABC"
            className="h-14 text-xl font-bold text-center uppercase tracking-widest"
          />
        </div>

        <div className="space-y-2">
          <Label>Jenis Kendaraan</Label>
          <div className="grid grid-cols-3 gap-2">
            {vehicleTypes.map((vt) => (
              <button
                key={vt.value}
                type="button"
                onClick={() => setVehicleType(vt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  vehicleType === vt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <vt.icon className="w-8 h-8" />
                <span className="text-sm font-medium">{vt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={loading}>
          <LogIn className="w-5 h-5 mr-2" />
          {loading ? 'Menyimpan...' : 'Catat Masuk'}
        </Button>
      </form>
    </div>
  );
};

export default VehicleEntry;
