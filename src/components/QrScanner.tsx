import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

interface QrScannerProps {
  onScan: (result: string) => void;
}

const QrScanner = ({ onScan }: QrScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader';

  const startScanner = async () => {
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      console.error('Camera error:', err);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="space-y-3">
      {!scanning ? (
        <Button onClick={startScanner} variant="outline" className="w-full h-12">
          <Camera className="w-5 h-5 mr-2" />
          Scan QR Code
        </Button>
      ) : (
        <div className="space-y-2">
          <div id={containerId} className="rounded-xl overflow-hidden border border-border" />
          <Button onClick={stopScanner} variant="outline" className="w-full" size="sm">
            <X className="w-4 h-4 mr-1" />
            Tutup Kamera
          </Button>
        </div>
      )}
    </div>
  );
};

export default QrScanner;
