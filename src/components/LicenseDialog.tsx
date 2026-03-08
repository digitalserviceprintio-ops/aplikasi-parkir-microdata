import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, MessageCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated?: () => void;
  mode?: 'trial_expired' | 'register';
}

const LICENSE_PRICE = 'Rp 85.000';
const WHATSAPP_NUMBER = '6282186371356';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Halo, saya ingin membeli lisensi aplikasi ParkEasy. Mohon informasi lebih lanjut.'
)}`;

const LicenseDialog = ({ open, onOpenChange, onActivated, mode = 'trial_expired' }: LicenseDialogProps) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.error('Masukkan kode lisensi');
      return;
    }
    setLoading(true);
    try {
      const { data: license, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', licenseKey.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;
      if (!license) {
        toast.error('Kode lisensi tidak valid');
        return;
      }
      if (license.is_used) {
        toast.error('Kode lisensi sudah digunakan');
        return;
      }

      // Store license locally for validation
      localStorage.setItem('park_license_key', license.license_key);
      localStorage.setItem('park_license_permanent', String(license.is_permanent));
      localStorage.removeItem('park_trial_start');

      toast.success('Lisensi berhasil diaktifkan!');
      onActivated?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengaktifkan lisensi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader className="items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-lg">
            {mode === 'trial_expired' ? 'Masa Trial Berakhir' : 'Aktivasi Lisensi'}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {mode === 'trial_expired'
              ? 'Masa percobaan 14 hari Anda telah berakhir. Aktifkan lisensi untuk melanjutkan penggunaan aplikasi.'
              : 'Masukkan kode lisensi untuk mendaftar dan menggunakan aplikasi.'}
          </DialogDescription>
        </DialogHeader>

        {/* Price info */}
        <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Lisensi ParkEasy</span>
            <span className="text-lg font-bold text-primary">{LICENSE_PRICE}</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> Sekali beli, tanpa berlangganan</li>
            <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> Akses penuh semua fitur</li>
            <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> Update gratis selamanya</li>
            <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> Support via WhatsApp</li>
          </ul>
        </div>

        {/* WhatsApp purchase button */}
        <Button
          className="w-full h-11 font-semibold bg-green-600 hover:bg-green-700 text-white"
          onClick={() => window.open(WHATSAPP_URL, '_blank')}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Beli via WhatsApp
        </Button>

        {/* Activate license section */}
        {showInput ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Kode Lisensi</Label>
              <Input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="PARK-XXXX-XXXX-XXXX"
                className="h-11 font-mono text-center tracking-wider"
              />
            </div>
            <Button onClick={handleActivate} className="w-full h-11 font-semibold" disabled={loading}>
              <Shield className="w-4 h-4 mr-2" />
              {loading ? 'Memvalidasi...' : 'Aktifkan Lisensi'}
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full h-10 text-sm" onClick={() => setShowInput(true)}>
            Sudah punya kode lisensi?
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LicenseDialog;
