import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const THERMAL_PRINTER_SERVICE = '000018f0-0000-1000-8000-00805f9b34fb';
const THERMAL_PRINTER_CHAR = '00002af1-0000-1000-8000-00805f9b34fb';

const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

const encoder = new TextEncoder();

function esc(...cmds: number[]): number[] {
  return cmds;
}

function text(str: string): number[] {
  return Array.from(encoder.encode(str));
}

function line(str: string): number[] {
  return [...text(str), LF];
}

export function buildEntryTicket(opts: {
  businessName: string;
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  cardCode?: string;
  ownerName?: string;
}): Uint8Array {
  const dateStr = new Date(opts.entryTime).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const lines: number[] = [
    // Init
    ...esc(ESC, 0x40),
    // Center
    ...esc(ESC, 0x61, 0x01),
    // Double size + Bold
    ...esc(GS, 0x21, 0x11),
    ...esc(ESC, 0x45, 0x01),
    ...line(opts.businessName || 'ParkEasy'),
    // Normal
    ...esc(GS, 0x21, 0x00),
    ...esc(ESC, 0x45, 0x00),
    ...line('Sistem Parkir Digital'),
    ...line('================================'),
    ...esc(ESC, 0x45, 0x01),
    ...line('TIKET MASUK'),
    ...esc(ESC, 0x45, 0x00),
    ...line('================================'),
    // Double size plate
    ...esc(GS, 0x21, 0x11),
    ...line(opts.plateNumber),
    ...esc(GS, 0x21, 0x00),
    ...line(opts.vehicleType.toUpperCase()),
    ...line('================================'),
    // Left align
    ...esc(ESC, 0x61, 0x00),
    ...line(`Waktu Masuk : ${dateStr}`),
    ...(opts.cardCode ? line(`Kartu       : ${opts.cardCode}`) : []),
    ...(opts.ownerName ? line(`Pemilik     : ${opts.ownerName}`) : []),
    // Center
    ...esc(ESC, 0x61, 0x01),
    ...line('================================'),
    ...line('Simpan tiket ini untuk keluar.'),
    ...line('Powered by ParkEasy'),
    LF, LF, LF,
    // Partial cut
    ...esc(GS, 0x56, 0x01),
  ];

  return new Uint8Array(lines);
}

export function buildExitReceipt(opts: {
  businessName: string;
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  duration: string;
  totalPrice: number;
  paymentMethod: string;
  cardCode?: string;
  ownerName?: string;
}): Uint8Array {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  const currency = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(opts.totalPrice);

  const lines: number[] = [
    ...esc(ESC, 0x40),
    ...esc(ESC, 0x61, 0x01),
    ...esc(GS, 0x21, 0x11),
    ...esc(ESC, 0x45, 0x01),
    ...line(opts.businessName || 'ParkEasy'),
    ...esc(GS, 0x21, 0x00),
    ...esc(ESC, 0x45, 0x00),
    ...line('Sistem Parkir Digital'),
    ...line('================================'),
    ...esc(ESC, 0x45, 0x01),
    ...line('STRUK PARKIR'),
    ...esc(ESC, 0x45, 0x00),
    ...line('================================'),
    ...esc(GS, 0x21, 0x11),
    ...line(opts.plateNumber),
    ...esc(GS, 0x21, 0x00),
    ...line(opts.vehicleType.toUpperCase()),
    ...line('================================'),
    ...esc(ESC, 0x61, 0x00),
    ...line(`Masuk   : ${fmt(opts.entryTime)}`),
    ...line(`Keluar  : ${fmt(opts.exitTime)}`),
    ...line(`Durasi  : ${opts.duration}`),
    ...(opts.cardCode ? line(`Kartu   : ${opts.cardCode}`) : []),
    ...(opts.ownerName ? line(`Pemilik : ${opts.ownerName}`) : []),
    ...line('--------------------------------'),
    ...line(`Metode  : ${opts.paymentMethod.toUpperCase()}`),
    ...esc(ESC, 0x45, 0x01),
    ...esc(GS, 0x21, 0x01),
    ...line(`TOTAL   : ${currency}`),
    ...esc(GS, 0x21, 0x00),
    ...esc(ESC, 0x45, 0x00),
    ...esc(ESC, 0x61, 0x01),
    ...line('================================'),
    ...line('Terima kasih telah parkir!'),
    ...line('Powered by ParkEasy'),
    LF, LF, LF,
    ...esc(GS, 0x56, 0x01),
  ];

  return new Uint8Array(lines);
}

export function useBluetoothPrinter() {
  const [device, setDevice] = useState<any>(null);
  const [printerName, setPrinterName] = useState<string>(() =>
    localStorage.getItem('bt_printer_name') || ''
  );
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [characteristic, setCharacteristic] = useState<any>(null);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in (navigator as any);

  const connect = useCallback(async () => {
    if (!isSupported) {
      toast.error('Browser tidak mendukung Bluetooth.');
      return;
    }
    setConnecting(true);
    try {
      const bt = (navigator as any).bluetooth;
      const dev = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: [THERMAL_PRINTER_SERVICE],
      });

      if (!dev.gatt) throw new Error('GATT tidak tersedia');
      const server = await dev.gatt.connect();
      const service = await server.getPrimaryService(THERMAL_PRINTER_SERVICE);
      const char = await service.getCharacteristic(THERMAL_PRINTER_CHAR);

      setDevice(dev);
      setPrinterName(dev.name || 'Printer Bluetooth');
      setCharacteristic(char);
      setConnected(true);
      localStorage.setItem('bt_printer_name', dev.name || 'Printer Bluetooth');
      toast.success(`Terhubung ke ${dev.name || 'Printer'}`);

      dev.addEventListener('gattserverdisconnected', () => {
        setConnected(false);
        setCharacteristic(null);
        toast.info('Printer terputus');
      });
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        toast.error(err.message || 'Gagal menghubungkan printer');
      }
    } finally {
      setConnecting(false);
    }
  }, [isSupported]);

  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setConnected(false);
    setCharacteristic(null);
    setPrinterName('');
    localStorage.removeItem('bt_printer_name');
    toast.success('Printer diputuskan');
  }, [device]);

  const printData = useCallback(async (data: Uint8Array) => {
    if (!characteristic) {
      toast.error('Printer belum terhubung');
      return false;
    }
    setPrinting(true);
    try {
      const chunkSize = 100;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await characteristic.writeValueWithoutResponse(chunk);
      }
      toast.success('Berhasil dicetak!');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencetak');
      return false;
    } finally {
      setPrinting(false);
    }
  }, [characteristic]);

  return {
    isSupported,
    connected,
    connecting,
    printing,
    printerName,
    connect,
    disconnect,
    printData,
  };
}
