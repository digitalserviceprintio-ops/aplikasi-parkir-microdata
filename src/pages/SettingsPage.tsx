import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Building2, DollarSign, Bell, Info, HelpCircle, Printer, Bluetooth, BluetoothOff, FileText, Download, Smartphone, Monitor, ChevronRight } from 'lucide-react';
import { getAppVersion } from '@/components/AppUpdateDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useBluetoothPrinter, buildEntryTicket } from '@/hooks/useBluetoothPrinter';

interface Rate {
  id: string;
  vehicle_type: string;
  rate_type: string;
  rate_amount: number;
}

type Tab = 'rates' | 'business' | 'printer' | 'notifications' | 'install' | 'about' | 'faq';

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
  {
    q: 'Bagaimana cara menghubungkan printer Bluetooth?',
    a: 'Buka Pengaturan → Printer, klik "Hubungkan Printer", lalu pilih perangkat Bluetooth printer dari daftar yang muncul. Pastikan printer sudah menyala dan mode Bluetooth aktif.',
  },
];

// Test receipt builder using shared hook's format
function buildTestReceipt(): Uint8Array {
  return buildEntryTicket({
    businessName: 'Parkir Mikrodata 2R',
    plateNumber: 'TES-1234',
    vehicleType: 'motor',
    entryTime: new Date().toISOString(),
  });
}

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

  // APK download URL
  const [apkUrl, setApkUrl] = useState(() => localStorage.getItem('apk_download_url') || '');
  const [apkUrlEditing, setApkUrlEditing] = useState(false);

  const {
    isSupported: isBtSupported,
    connected: printerConnected,
    connecting: printerConnecting,
    printing: testPrinting,
    printerName,
    connect: handleConnectPrinter,
    disconnect: handleDisconnectPrinter,
    printData,
  } = useBluetoothPrinter();

  const handleTestPrint = async () => {
    const receipt = buildTestReceipt();
    await printData(receipt);
  };

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
    { key: 'printer', label: 'Printer', icon: Printer },
    { key: 'notifications', label: 'Notif', icon: Bell },
    { key: 'install', label: 'Install', icon: Download },
    { key: 'about', label: 'Tentang', icon: Info },
    { key: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold">Pengaturan</h1>

      {/* Tab switcher - responsive */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg text-[11px] sm:text-sm font-semibold transition-colors relative whitespace-nowrap ${
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
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 shrink-0" />
            <span className="relative z-10 truncate">{tab.label}</span>
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
            className="space-y-3 sm:space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rates.map((rate, i) => (
                <motion.div
                  key={rate.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold capitalize text-sm sm:text-base">{rate.vehicle_type}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground bg-secondary px-2 py-0.5 sm:py-1 rounded-full capitalize">{rate.rate_type}</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tarif (Rp)</Label>
                    <Input
                      type="number"
                      value={rate.rate_amount}
                      onChange={(e) => updateRate(rate.id, Number(e.target.value))}
                      className="h-10 sm:h-12 text-base sm:text-lg font-bold"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            <Button onClick={handleSaveRates} className="w-full h-11 sm:h-12 font-semibold" disabled={loading}>
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
            className="space-y-3 sm:space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs sm:text-sm">Nama Usaha</Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Contoh: Parkir Aman Sejahtera" className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm">Alamat</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Contoh No. 1" className="h-10 sm:h-11" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm">Telepon</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="h-10 sm:h-11" />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveBusiness} className="w-full h-11 sm:h-12 font-semibold" disabled={businessLoading}>
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {businessLoading ? 'Menyimpan...' : 'Simpan Profil Usaha'}
            </Button>
          </motion.div>
        )}

        {activeTab === 'printer' && (
          <motion.div
            key="printer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 sm:space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">Printer Bluetooth</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Hubungkan printer thermal Bluetooth untuk cetak tiket</p>
                </div>
              </div>

              {/* Status */}
              <div className="bg-secondary/50 rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">Status Koneksi</span>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2 py-1 rounded-full ${
                    printerConnected
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {printerConnected ? (
                      <><Bluetooth className="w-3 h-3" /> Terhubung</>
                    ) : (
                      <><BluetoothOff className="w-3 h-3" /> Tidak Terhubung</>
                    )}
                  </span>
                </div>

                {printerName && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs text-muted-foreground">Perangkat</span>
                    <span className="text-[11px] sm:text-xs font-medium">{printerName}</span>
                  </div>
                )}
              </div>

              {/* Browser support warning */}
              {!isBtSupported && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs sm:text-sm">
                  ⚠️ Browser ini tidak mendukung Web Bluetooth. Gunakan <strong>Google Chrome</strong> di Android atau desktop untuk menghubungkan printer Bluetooth.
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {!printerConnected ? (
                  <Button
                    onClick={handleConnectPrinter}
                    disabled={printerConnecting || !isBtSupported}
                    className="h-11 sm:h-12 font-semibold sm:col-span-2"
                  >
                    <Bluetooth className="w-4 h-4 mr-2" />
                    {printerConnecting ? 'Menghubungkan...' : 'Hubungkan Printer'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleTestPrint}
                      disabled={testPrinting}
                      className="h-11 sm:h-12 font-semibold"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {testPrinting ? 'Mencetak...' : 'Tes Print'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDisconnectPrinter}
                      className="h-11 sm:h-12 font-semibold"
                    >
                      <BluetoothOff className="w-4 h-4 mr-2" />
                      Putuskan
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Cara Menghubungkan Printer
              </h3>
              <ol className="text-[11px] sm:text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Nyalakan printer Bluetooth thermal Anda</li>
                <li>Pastikan Bluetooth pada perangkat Anda aktif</li>
                <li>Klik tombol <strong>"Hubungkan Printer"</strong> di atas</li>
                <li>Pilih printer dari daftar perangkat yang muncul</li>
                <li>Setelah terhubung, klik <strong>"Tes Print"</strong> untuk mencoba cetak</li>
              </ol>
              <div className="bg-secondary/50 rounded-lg p-2.5 mt-2">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                  💡 <strong>Tips:</strong> Printer thermal 58mm & 80mm umumnya didukung. Pastikan menggunakan browser Chrome untuk kompatibilitas terbaik.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 sm:space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3 sm:space-y-4">
              <div className="flex items-start sm:items-center gap-3 mb-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">Notifikasi Parkir Lama</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Peringatan untuk kendaraan yang parkir melebihi batas waktu</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Batas Waktu Parkir (Jam)</Label>
                <Input
                  type="number"
                  min={1}
                  max={48}
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  className="h-10 sm:h-12 text-base sm:text-lg font-bold"
                />
                <p className="text-[11px] sm:text-xs text-muted-foreground">Notifikasi akan muncul jika kendaraan parkir lebih dari {overtimeHours} jam</p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-2.5 sm:p-3 space-y-1">
                <p className="text-[11px] sm:text-xs font-medium">Status Notifikasi Browser</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
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

            <Button onClick={handleSaveNotifications} className="w-full h-11 sm:h-12 font-semibold">
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
            className="space-y-3 sm:space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center shadow-lg">
                <span className="text-xl sm:text-2xl text-primary-foreground font-bold">P</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Parkir Mikrodata 2R</h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">Versi {localStorage.getItem('app_latest_version') || getAppVersion()}</p>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Sistem manajemen parkir digital yang memudahkan pencatatan kendaraan masuk & keluar, penghitungan tarif otomatis, dan pelaporan pendapatan secara real-time.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-sm">Fitur Utama</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                {[
                  '📱 Scan QR Code & input manual plat nomor',
                  '💰 Perhitungan tarif otomatis (flat/per jam)',
                  '📊 Dashboard & laporan pendapatan real-time',
                  '🔔 Notifikasi kendaraan parkir terlalu lama',
                  '👥 Manajemen pengguna multi-role',
                  '🖨️ Cetak tiket via printer Bluetooth',
                  '🌙 Mode gelap & terang',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-1.5">
              <p className="text-[11px] sm:text-xs text-muted-foreground">© {new Date().getFullYear()} ParkEasy. All rights reserved.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'install' && (
          <motion.div
            key="install"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 sm:space-y-4"
          >
            {/* Android APK */}
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Install di Android (APK)</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Cara install aplikasi ParkEasy di HP Android</p>
                </div>
              </div>
              <ol className="text-[11px] sm:text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Dapatkan file <strong>ParkEasy.apk</strong> dari admin atau link download yang diberikan</li>
                <li>Buka file APK di HP Android Anda</li>
                <li>Jika muncul peringatan keamanan, buka <strong>Pengaturan → Keamanan → Sumber Tidak Dikenal</strong> dan aktifkan</li>
                <li>Ketuk <strong>"Install"</strong> dan tunggu proses selesai</li>
                <li>Buka aplikasi ParkEasy dari layar utama</li>
                <li>Login dengan akun yang sudah terdaftar</li>
              </ol>
              {/* Download Button */}
              {apkUrl ? (
                <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full h-12 sm:h-14 font-bold text-sm sm:text-base gap-2">
                    <Download className="w-5 h-5" />
                    Download APK ParkEasy
                  </Button>
                </a>
              ) : (
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Link download APK belum diatur. Atur di bawah.</p>
                </div>
              )}

              {/* Admin: Set APK URL */}
              <div className="bg-secondary/50 rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                    💡 <strong>Admin:</strong> Atur link download APK
                  </p>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setApkUrlEditing(!apkUrlEditing)}>
                    {apkUrlEditing ? 'Tutup' : 'Ubah'}
                  </Button>
                </div>
                {apkUrlEditing && (
                  <div className="flex gap-2">
                    <Input
                      value={apkUrl}
                      onChange={(e) => setApkUrl(e.target.value)}
                      placeholder="https://link-download-apk.com/parkeasy.apk"
                      className="h-9 text-xs"
                    />
                    <Button size="sm" className="h-9 px-3 shrink-0" onClick={() => {
                      localStorage.setItem('apk_download_url', apkUrl);
                      setApkUrlEditing(false);
                      toast.success('Link APK tersimpan!');
                    }}>
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Browser / PWA */}
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Akses via Browser</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Buka langsung dari browser tanpa install</p>
                </div>
              </div>
              <ol className="text-[11px] sm:text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Buka browser <strong>Google Chrome</strong> di HP atau komputer</li>
                <li>Kunjungi alamat: <strong className="text-foreground select-all">https://aplikasi-parkir-microdata.vercel.app</strong></li>
                <li>Login dengan akun Anda</li>
                <li className="font-medium text-foreground">Opsional — tambah ke layar utama:</li>
              </ol>

              <div className="ml-4 space-y-2">
                <div className="bg-secondary/30 rounded-lg p-2.5 space-y-1">
                  <p className="text-[11px] font-medium flex items-center gap-1"><Smartphone className="w-3 h-3" /> Android:</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Ketuk menu ⋮ → <strong>"Tambahkan ke layar utama"</strong> → Ketuk <strong>"Tambah"</strong></p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2.5 space-y-1">
                  <p className="text-[11px] font-medium flex items-center gap-1"><Smartphone className="w-3 h-3" /> iPhone/iPad:</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Ketuk ikon <strong>Share (↑)</strong> → <strong>"Tambah ke Layar Utama"</strong> → <strong>"Tambah"</strong></p>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Masalah Umum
              </h3>
              <Accordion type="single" collapsible className="space-y-1">
                {[
                  { q: 'APK tidak bisa di-install', a: 'Pastikan opsi "Sumber Tidak Dikenal" sudah diaktifkan di Pengaturan HP. Pada Android 8+, izin per-aplikasi bisa diatur di Pengaturan → Aplikasi → Chrome → Install aplikasi yang tidak dikenal.' },
                  { q: 'Aplikasi tidak bisa login', a: 'Pastikan koneksi internet stabil. Coba bersihkan cache aplikasi di Pengaturan HP → Aplikasi → ParkEasy → Hapus Cache.' },
                  { q: 'Kamera/QR scanner tidak berfungsi', a: 'Pastikan izin kamera sudah diberikan. Buka Pengaturan HP → Aplikasi → ParkEasy → Izin → aktifkan Kamera.' },
                  { q: 'Printer Bluetooth tidak terdeteksi', a: 'Pastikan printer menyala dan mode Bluetooth aktif. Gunakan browser Chrome untuk kompatibilitas Web Bluetooth terbaik.' },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`install-faq-${i}`} className="border-b border-border/50 last:border-0">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-2.5 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-2.5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
            className="space-y-3 sm:space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5">
              <h3 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Pertanyaan Umum (FAQ)
              </h3>
              <Accordion type="single" collapsible className="space-y-1">
                {faqData.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/50 last:border-0">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-2.5 sm:py-3 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-2.5 sm:pb-3">
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
