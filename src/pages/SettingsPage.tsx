import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface Rate {
  id: string;
  vehicle_type: string;
  rate_type: string;
  rate_amount: number;
}

const SettingsPage = () => {
  const { profile } = useAuth();
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      const { data } = await supabase.from('parking_rates').select('*').order('vehicle_type');
      if (data) setRates(data);
    };
    fetchRates();
  }, []);

  const updateRate = (id: string, amount: number) => {
    setRates(prev => prev.map(r => r.id === id ? { ...r, rate_amount: amount } : r));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const rate of rates) {
        const { error } = await supabase
          .from('parking_rates')
          .update({ rate_amount: rate.rate_amount })
          .eq('id', rate.id);
        if (error) throw error;
      }
      toast.success('Tarif berhasil disimpan!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan tarif');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Akses hanya untuk admin</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Pengaturan Tarif</h1>

      <div className="space-y-4">
        {rates.map((rate) => (
          <div key={rate.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold capitalize">{rate.vehicle_type}</span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full capitalize">{rate.rate_type}</span>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tarif (Rp)</Label>
              <Input
                type="number"
                value={rate.rate_amount}
                onChange={(e) => updateRate(rate.id, Number(e.target.value))}
                className="h-12 text-lg font-bold"
              />
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="w-full h-12 font-semibold" disabled={loading}>
        <Save className="w-5 h-5 mr-2" />
        {loading ? 'Menyimpan...' : 'Simpan Tarif'}
      </Button>
    </div>
  );
};

export default SettingsPage;
