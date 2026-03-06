import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, X, Keyboard } from 'lucide-react';

interface QrScannerProps {
  onScan: (result: string) => void;
}

const QrScanner = ({ onScan }: QrScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader';

  const startScanner = async () => {
    setCameraError(false);
    setErrorMsg('');
    setScanning(true);

    // Request camera permission explicitly for mobile
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (permErr: any) {
      console.error('Camera permission denied:', permErr);
      setCameraError(true);
      setErrorMsg(
        permErr.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser.'
          : permErr.name === 'NotFoundError'
          ? 'Kamera tidak ditemukan pada perangkat ini.'
          : 'Tidak dapat mengakses kamera.'
      );
      setScanning(false);
      setManualMode(true);
      return;
    }

    try {
      const scanner = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      const cameraId = cameras.length > 0
        ? cameras.find(c => c.label.toLowerCase().includes('back'))?.id || cameras[cameras.length - 1].id
        : undefined;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      if (cameraId) {
        await scanner.start(cameraId, config, (decodedText) => {
          onScan(decodedText);
          stopScanner();
        }, () => {});
      } else {
        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          () => {}
        );
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(true);
      setErrorMsg('Gagal memulai kamera. Coba refresh halaman.');
      setScanning(false);
      setManualMode(true);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      setManualMode(false);
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="space-y-3">
      {!scanning && !manualMode ? (
        <div className="flex gap-2">
          <Button onClick={startScanner} variant="outline" className="flex-1 h-12">
            <Camera className="w-5 h-5 mr-2" />
            Scan QR Code
          </Button>
          <Button onClick={() => setManualMode(true)} variant="outline" className="h-12">
            <Keyboard className="w-5 h-5" />
          </Button>
        </div>
      ) : scanning ? (
        <div className="space-y-2">
          <div id={containerId} className="rounded-xl overflow-hidden border border-border" />
          <Button onClick={stopScanner} variant="outline" className="w-full" size="sm">
            <X className="w-4 h-4 mr-1" />
            Tutup Kamera
          </Button>
        </div>
      ) : manualMode ? (
        <div className="space-y-2">
          {cameraError && (
            <p className="text-xs text-destructive text-center">{errorMsg || 'Kamera tidak tersedia. Masukkan kode kartu secara manual.'}</p>
          )}
          <div className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Masukkan kode kartu..."
              className="h-12 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
            <Button onClick={handleManualSubmit} className="h-12 px-4">OK</Button>
            <Button onClick={() => { setManualMode(false); setCameraError(false); }} variant="ghost" className="h-12 px-3">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default QrScanner;
