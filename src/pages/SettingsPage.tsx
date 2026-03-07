import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Building2, DollarSign, Bell, Info, HelpCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Rate {
  id: string;
  vehicle_type: string;
  rate_type: string;
  rate_amount: number;
}

type Tab = 'rates' | 'business' | 'notifications' | 'about' | 'faq';

const faqData = [
  {
    q: 'Bagaimana cara mencatat kendaraan masuk?',
    a: 'Buka menu "Masuk" lalu scan QR code kartu parkir atau input plat nomor secara manual. Sistem akan otomatis mencatat waktu masuk.',
  },
  {
    q: 'Bagaimana cara menghitung tarif parkir?',
    a: 'Tarif dihitung otomatis berdasarkan jenis kendaraan dan durasi parkir. Admin dapat mengatur tarif di menu Pengaturan → Tarif Parkir.',
  },
  {
    q: 'Apa itu kartu parkir?',
    a: 'Kartu parkir adalah kartu dengan QR code unik yang diberikan kepada pelanggan saat masuk area parkir. Kartu ini digunakan untuk mencatat keluar dan menghitung tarif.',
  },
  {
    q: 'Bagaimana cara melihat laporan pendapatan?',
    a: 'Buka menu "Laporan" untuk melihat ringkasan transaksi harian, mingguan, atau bulanan beserta total pendapatan.',
  },
  {
    q: 'Siapa yang bisa mengakses fitur tertentu?',
    a: 'Admin memiliki akses penuh. Petugas (attendant) bisa mencatat kendaraan masuk/keluar. Owner bisa melihat dashboard dan laporan.',
  },
  {
    q: 'Bagaimana cara mengaktifkan notifikasi parkir terlalu lama?',
    a: 'Buka Pengaturan → Notifikasi, atur batas waktu parkir (jam), lalu izinkan notifikasi browser saat diminta.',
  },
];

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

  // Notification settings
  const [overtimeHours, setOvertimeHours] = useState(() =>
    Number(localStorage.getItem('parking_overtime_hours')) || 3
  );

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

  const handleSaveNotifications = () => {
    localStorage.setItem('parking_overtime_hours', String(overtimeHours));
    toast.success('Pengaturan notifikasi disimpan!');

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  if (profile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Akses hanya untuk admin</p>;
  }

  const tabs: { key: Tab; label: string; icon: typeof DollarSign }[] = [
    { key: 'rates', label: 'Tarif', icon: DollarSign },
    { key: 'business', label: 'Usaha', icon: Building2 },
    { key: 'notifications', label: 'Notifikasi', icon: Bell },
    { key: 'about', label: 'Tentang', icon: Info },
    { key: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Pengaturan</h1>

      {/* Tab switcher - scrollable on small screens */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap ${
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
            <tab.icon className="w-4 h-4 relative z-10 shrink-0" />
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

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Notifikasi Parkir Lama</h3>
                  <p className="text-xs text-muted-foreground">Peringatan untuk kendaraan yang parkir melebihi batas waktu</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Batas Waktu Parkir (Jam)</Label>
                <Input
                  type="number"
                  min={1}
                  max={48}
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  className="h-12 text-lg font-bold"
                />
                <p className="text-xs text-muted-foreground">Notifikasi akan muncul jika kendaraan parkir lebih dari {overtimeHours} jam</p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium">Status Notifikasi Browser</p>
                <p className="text-xs text-muted-foreground">
                  {'Notification' in window
                    ? Notification.permission === 'granted'
                      ? '✅ Notifikasi browser diizinkan'
                      : Notification.permission === 'denied'
                        ? '❌ Notifikasi browser diblokir. Aktifkan di pengaturan browser.'
                        : '⚠️ Izin notifikasi belum diminta. Klik Simpan untuk meminta izin.'
                    : '⚠️ Browser tidak mendukung notifikasi push'}
                </p>
              </div>
            </div>

            <Button onClick={handleSaveNotifications} className="w-full h-12 font-semibold">
              <Save className="w-5 h-5 mr-2" />
              Simpan Pengaturan Notifikasi
            </Button>
          </motion.div>
        )}

        {activeTab === 'about' && (
          <motion.div
            key="about"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-5 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center shadow-lg">
                <span className="text-2xl text-primary-foreground font-bold">P</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">ParkEasy</h2>
                <p className="text-xs text-muted-foreground">Versi 1.0.0</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sistem manajemen parkir digital yang memudahkan pencatatan kendaraan masuk & keluar, penghitungan tarif otomatis, dan pelaporan pendapatan secara real-time.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h3 className="font-semibold text-sm">Fitur Utama</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  '📱 Scan QR Code & input manual plat nomor',
                  '💰 Perhitungan tarif otomatis (flat/per jam)',
                  '📊 Dashboard & laporan pendapatan real-time',
                  '🔔 Notifikasi kendaraan parkir terlalu lama',
                  '👥 Manajemen pengguna multi-role',
                  '🌙 Mode gelap & terang',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-semibold text-sm">Dibuat dengan ❤️</h3>
              <p className="text-xs text-muted-foreground">Dibangun menggunakan React, Tailwind CSS, dan Lovable Cloud.</p>
              <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ParkEasy. All rights reserved.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'faq' && (
          <motion.div
            key="faq"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Pertanyaan Umum (FAQ)
              </h3>
              <Accordion type="single" collapsible className="space-y-1">
                {faqData.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/50 last:border-0">
                    <AccordionTrigger className="text-sm font-medium text-left py-3 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
