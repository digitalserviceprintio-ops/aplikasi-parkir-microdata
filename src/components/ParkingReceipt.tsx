import { Button } from '@/components/ui/button';
import { Printer, Bluetooth } from 'lucide-react';
import { useBluetoothPrinter, buildExitReceipt } from '@/hooks/useBluetoothPrinter';

interface ReceiptData {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  duration: string;
  totalPrice: number;
  paymentMethod: string;
  cardCode?: string;
  ownerName?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const ParkingReceipt = ({ data, businessName }: { data: ReceiptData; businessName?: string }) => {
  const { connected, connecting, printing, printerName, connect, printData } = useBluetoothPrinter();

  const handleBtPrint = async () => {
    const receipt = buildExitReceipt({
      businessName: businessName || 'Parkir Mikrodata 2R',
      plateNumber: data.plateNumber,
      vehicleType: data.vehicleType,
      entryTime: data.entryTime,
      exitTime: data.exitTime,
      duration: data.duration,
      totalPrice: data.totalPrice,
      paymentMethod: data.paymentMethod,
      cardCode: data.cardCode,
      ownerName: data.ownerName,
    });
    await printData(receipt);
  };

  const handlePrint = () => {
    const name = businessName || 'Parkir Mikrodata 2R';
    const html = `
      <html>
        <head>
          <title>Struk Parkir</title>
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
          </style>
        </head>
        <body>
          <div class="center">
            <h2>${name}</h2>
            <p class="small">Sistem Parkir Digital</p>
          </div>
          <div class="line"></div>
          <div class="center big bold">${data.plateNumber}</div>
          <p class="center small" style="text-transform:capitalize">${data.vehicleType}</p>
          <div class="line"></div>
          <div class="row"><span>Masuk:</span><span>${formatDateTime(data.entryTime)}</span></div>
          <div class="row"><span>Keluar:</span><span>${formatDateTime(data.exitTime)}</span></div>
          <div class="row"><span>Durasi:</span><span>${data.duration}</span></div>
          ${data.cardCode ? `<div class="row"><span>Kartu:</span><span>${data.cardCode}</span></div>` : ''}
          ${data.ownerName ? `<div class="row"><span>Pemilik:</span><span>${data.ownerName}</span></div>` : ''}
          <div class="line"></div>
          <div class="row"><span>Metode:</span><span style="text-transform:uppercase">${data.paymentMethod}</span></div>
          <div class="row bold"><span>TOTAL:</span><span>${formatCurrency(data.totalPrice)}</span></div>
          <div class="line"></div>
          <p class="center small">Terima kasih telah parkir di sini!</p>
          <p class="center small">Powered by ParkEasy</p>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-2 font-mono text-xs">
      <div className="text-center space-y-1">
        <p className="font-bold text-sm">{businessName || 'ParkEasy'}</p>
        <div className="border-t border-dashed border-border my-2" />
        <p className="text-lg font-black tracking-widest text-primary">{data.plateNumber}</p>
        <p className="text-muted-foreground capitalize">{data.vehicleType}</p>
        <div className="border-t border-dashed border-border my-2" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between"><span className="text-muted-foreground">Masuk</span><span>{formatDateTime(data.entryTime)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Keluar</span><span>{formatDateTime(data.exitTime)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Durasi</span><span>{data.duration}</span></div>
        {data.cardCode && <div className="flex justify-between"><span className="text-muted-foreground">Kartu</span><span>{data.cardCode}</span></div>}
        <div className="border-t border-dashed border-border my-2" />
        <div className="flex justify-between"><span className="text-muted-foreground">Metode</span><span className="uppercase">{data.paymentMethod}</span></div>
        <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span className="text-primary">{formatCurrency(data.totalPrice)}</span></div>
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

export default ParkingReceipt;
