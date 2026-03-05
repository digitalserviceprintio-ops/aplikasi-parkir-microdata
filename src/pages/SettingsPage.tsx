import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Building2, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Rate {
  id: string;
  vehicle_type: string;
  rate_type: string;
  rate_amount: number;
}

type Tab = 'rates' | 'business';

const SettingsPage = () => {
  const { profile, user } = useAuth();
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('rates');

  // Business profile state
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [businessLoading, setBusinessLoading] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      const { data } = await supabase.from('parking_rates').select('*').order('vehicle_type');
      if (data) setRates(data);
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setBusinessName(data.business_name || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
      }
    };
    fetchBusiness();
  }, [user]);

  const updateRate = (id: string, amount: number) => {
    setRates(prev => prev.map(r => r.id === id ? { ...r, rate_amount: amount } : r));
  };

  const handleSaveRates = async () => {
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

  const handleSaveBusiness = async () => {
    if (!user) return;
    setBusinessLoading(true);
    try {
      const { data: existing } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('business_profiles')
          .update({ business_name: businessName, address, phone, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_profiles')
          .insert({ user_id: user.id, business_name: businessName, address, phone });
        if (error) throw error;
      }
      toast.success('Profil usaha berhasil disimpan!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan profil usaha');
    } finally {
      setBusinessLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Akses hanya untuk admin</p>;
  }

  const tabs: { key: Tab; label: string; icon: typeof DollarSign }[] = [
    { key: 'rates', label: 'Tarif Parkir', icon: DollarSign },
    { key: 'business', label: 'Profil Usaha', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Pengaturan</h1>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-secondary/50 p-1 rounded-xl">
        {tabs.map(tab => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors relative ${
              activeTab === tab.key ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="settings-tab"
                className="absolute inset-0 bg-primary rounded-lg"
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
            <tab.icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'rates' && (
          <motion.div
            key="rates"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {rates.map((rate, i) => (
              <motion.div
                key={rate.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 space-y-2"
              >
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
              </motion.div>
            ))}

            <Button onClick={handleSaveRates} className="w-full h-12 font-semibold" disabled={loading}>
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Tarif'}
            </Button>
          </motion.div>
        )}

        {activeTab === 'business' && (
          <motion.div
            key="business"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              <div className="space-y-1">
                <Label>Nama Usaha</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Contoh: Parkir Aman Sejahtera" />
              </div>
              <div className="space-y-1">
                <Label>Alamat</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Contoh No. 1" />
              </div>
              <div className="space-y-1">
                <Label>Telepon</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
              </div>
            </div>

            <Button onClick={handleSaveBusiness} className="w-full h-12 font-semibold" disabled={businessLoading}>
              <Save className="w-5 h-5 mr-2" />
              {businessLoading ? 'Menyimpan...' : 'Simpan Profil Usaha'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
