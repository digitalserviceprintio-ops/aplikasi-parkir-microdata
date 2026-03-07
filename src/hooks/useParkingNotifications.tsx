import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEFAULT_THRESHOLD_HOURS = 3;
const CHECK_INTERVAL_MS = 60000; // check every minute

export function useParkingNotifications() {
  const notifiedIds = useRef<Set<string>>(new Set());

  const checkOvertime = useCallback(async () => {
    // Get threshold from localStorage (admin configurable)
    const thresholdHours = Number(localStorage.getItem('parking_overtime_hours')) || DEFAULT_THRESHOLD_HOURS;
    const thresholdMs = thresholdHours * 60 * 60 * 1000;

    const { data: activeVehicles } = await supabase
      .from('transactions')
      .select('id, plate_number, vehicle_type, entry_time')
      .is('exit_time', null);

    if (!activeVehicles) return;

    const now = Date.now();

    activeVehicles.forEach((vehicle) => {
      const entryTime = new Date(vehicle.entry_time).getTime();
      const duration = now - entryTime;

      if (duration > thresholdMs && !notifiedIds.current.has(vehicle.id)) {
        notifiedIds.current.add(vehicle.id);
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        toast.warning(`⏰ Kendaraan parkir terlalu lama!`, {
          description: `${vehicle.plate_number} (${vehicle.vehicle_type}) sudah parkir ${hours}j ${minutes}m`,
          duration: 10000,
        });

        // Browser push notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Parkir Terlalu Lama!', {
            body: `${vehicle.plate_number} (${vehicle.vehicle_type}) sudah parkir ${hours}j ${minutes}m`,
            icon: '/pwa-192x192.png',
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    checkOvertime();
    const interval = setInterval(checkOvertime, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkOvertime]);
}
