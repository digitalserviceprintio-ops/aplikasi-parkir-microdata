import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Bluetooth } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { useBluetoothPrinter, buildEntryTicket } from '@/hooks/useBluetoothPrinter';

interface EntryReceiptData {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  cardCode?: string;
  ownerName?: string;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const EntryReceipt = ({ data, businessName }: { data: EntryReceiptData; businessName?: string }) => {
  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const { connected, connecting, printing, printerName, connect, printData } = useBluetoothPrinter();

  const qrValue = data.plateNumber;

  const handleBtPrint = async () => {
    const ticket = buildEntryTicket({
      businessName: businessName || 'Parkir Mikrodata 2R',
      plateNumber: data.plateNumber,
      vehicleType: data.vehicleType,
      entryTime: data.entryTime,
      cardCode: data.cardCode,
      ownerName: data.ownerName,
    });
    await printData(ticket);
  };

  const handlePrint = () => {
    const name = businessName || 'Parkir Mikrodata 2R';
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    const qrDataUrl = canvas?.toDataURL('image/png') || '';

    const html = `
      <html>
        <head>
          <title>Tiket Masuk Parkir</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; width: 280px; padding: 12px; font-size: 12px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .big { font-size: 18px; letter-spacing: 3px; }
            h2 { font-size: 16px; margin-bottom: 2px; }
            .small { font-size: 10px; color: #666; }
            .label { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
            .qr { margin: 8px auto; }
            .qr img { width: 140px; height: 140px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>${name}</h2>
            <p class="small">Sistem Parkir Digital</p>
          </div>
          <div class="line"></div>
          <div class="center label">TIKET MASUK</div>
          <div class="line"></div>
          <div class="center big bold">${data.plateNumber}</div>
          <p class="center small" style="text-transform:capitalize">${data.vehicleType}</p>
          <div class="center qr"><img src="${qrDataUrl}" alt="QR Code" /></div>
          <div class="line"></div>
          <div class="row"><span>Waktu Masuk:</span><span>${formatDateTime(data.entryTime)}</span></div>
          ${data.cardCode ? `<div class="row"><span>Kartu:</span><span>${data.cardCode}</span></div>` : ''}
          ${data.ownerName ? `<div class="row"><span>Pemilik:</span><span>${data.ownerName}</span></div>` : ''}
          <div class="line"></div>
          <p class="center small">Scan QR untuk proses keluar.</p>
          <p class="center small">Powered by Mikrodata 2R</p>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=320,height=500');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-2 font-mono text-xs">
      <div className="text-center space-y-1">
        <p className="font-bold text-sm">{businessName || 'Parkir Mikrodata 2R'}</p>
        <div className="border-t border-dashed border-border my-2" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tiket Masuk</p>
        <div className="border-t border-dashed border-border my-2" />
        <p className="text-lg font-black tracking-widest text-primary">{data.plateNumber}</p>
        <p className="text-muted-foreground capitalize">{data.vehicleType}</p>
        <div className="border-t border-dashed border-border my-2" />
      </div>

      {/* QR Code display */}
      <div className="flex justify-center py-2">
        <QRCodeSVG value={qrValue} size={140} level="M" />
      </div>
      <p className="text-center text-muted-foreground text-[10px]">Scan QR ini saat keluar</p>

      {/* Hidden canvas for print */}
      <div ref={qrCanvasRef} className="hidden">
        <QRCodeCanvas value={qrValue} size={280} level="M" />
      </div>

      <div className="border-t border-dashed border-border my-2" />
      <div className="space-y-1">
        <div className="flex justify-between"><span className="text-muted-foreground">Waktu Masuk</span><span>{formatDateTime(data.entryTime)}</span></div>
        {data.cardCode && <div className="flex justify-between"><span className="text-muted-foreground">Kartu</span><span>{data.cardCode}</span></div>}
        {data.ownerName && <div className="flex justify-between"><span className="text-muted-foreground">Pemilik</span><span>{data.ownerName}</span></div>}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Button onClick={handlePrint} className="h-11 font-semibold" variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Cetak
        </Button>
        {connected ? (
          <Button onClick={handleBtPrint} className="h-11 font-semibold" disabled={printing}>
            <Bluetooth className="w-4 h-4 mr-2" />
            {printing ? 'Mencetak...' : 'BT Print'}
          </Button>
        ) : (
          <Button onClick={connect} className="h-11 font-semibold" variant="secondary" disabled={connecting}>
            <Bluetooth className="w-4 h-4 mr-2" />
            {connecting ? 'Hubungkan...' : printerName ? `Sambung ${printerName}` : 'BT Printer'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EntryReceipt;
