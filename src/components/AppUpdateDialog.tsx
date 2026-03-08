import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Wrench, ArrowUpCircle, Info } from 'lucide-react';

const APP_VERSION = '1.2.0';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  app_version: string | null;
  created_at: string;
}

const iconMap: Record<string, typeof Info> = {
  info: Info,
  update: ArrowUpCircle,
  maintenance: Wrench,
  warning: Bell,
};

const colorMap: Record<string, string> = {
  info: 'bg-primary/10 text-primary',
  update: 'bg-green-500/10 text-green-600',
  maintenance: 'bg-orange-500/10 text-orange-600',
  warning: 'bg-destructive/10 text-destructive',
};

export function getAppVersion() {
  return APP_VERSION;
}

const AppUpdateDialog = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');

      const { data } = await supabase
        .from('app_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const ann = data[0] as Announcement;
        if (!dismissed.includes(ann.id)) {
          setAnnouncement(ann);
          setOpen(true);
        }
        // Auto-update version display if new version announced
        if (ann.app_version) {
          localStorage.setItem('app_latest_version', ann.app_version);
        }
      }
    };
    check();
    const interval = setInterval(check, 300000); // check every 5 min
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
      dismissed.push(announcement.id);
      localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed));
    }
    setOpen(false);
  };

  if (!announcement) return null;

  const Icon = iconMap[announcement.type] || Info;
  const color = colorMap[announcement.type] || colorMap.info;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader className="items-center text-center space-y-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon className="w-7 h-7" />
          </div>
          <DialogTitle className="text-lg">{announcement.title}</DialogTitle>
          {announcement.app_version && (
            <span className="inline-block text-xs font-mono bg-secondary px-2 py-1 rounded-full">
              v{announcement.app_version}
            </span>
          )}
          <DialogDescription className="text-sm leading-relaxed whitespace-pre-line">
            {announcement.message}
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleDismiss} className="w-full h-11 font-semibold mt-2">
          Mengerti
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AppUpdateDialog;
