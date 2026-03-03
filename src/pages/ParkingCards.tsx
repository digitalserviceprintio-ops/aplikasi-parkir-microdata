import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreditCard, Plus, Trash2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ParkingCard {
  id: string;
  card_code: string;
  owner_name: string | null;
  plate_number: string | null;
  vehicle_type: string;
  is_active: boolean;
  created_at: string;
}

const ParkingCards = () => {
  const { user, profile } = useAuth();
  const [cards, setCards] = useState<ParkingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ParkingCard | null>(null);

  // Form state
  const [cardCode, setCardCode] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('motor');

  const fetchCards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('parking_cards')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCards(data);
    if (error) toast.error(error.message);
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, []);

  const generateCode = () => {
    const code = 'PKE-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    setCardCode(code);
  };

  const handleCreate = async () => {
    if (!cardCode.trim()) { toast.error('Kode kartu harus diisi'); return; }
    const { error } = await supabase.from('parking_cards').insert({
      card_code: cardCode.trim(),
      owner_name: ownerName.trim() || null,
      plate_number: plateNumber.trim().toUpperCase() || null,
      vehicle_type: vehicleType,
      created_by: user?.id,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Kartu berhasil dibuat');
      setDialogOpen(false);
      resetForm();
      fetchCards();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('parking_cards').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Kartu dihapus'); fetchCards(); }
  };

  const resetForm = () => {
    setCardCode('');
    setOwnerName('');
    setPlateNumber('');
    setVehicleType('motor');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Kartu Parkir</h1>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'attendant') && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) generateCode(); else resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" />Baru</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Kartu Parkir Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Kode Kartu</Label>
                  <Input value={cardCode} readOnly className="font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <Label>Nama Pemilik</Label>
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Opsional" />
                </div>
                <div className="space-y-1">
                  <Label>Plat Nomor</Label>
                  <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="Opsional" className="uppercase" />
                </div>
                <div className="space-y-1">
                  <Label>Jenis Kendaraan</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="mobil">Mobil</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center py-2">
                  <QRCodeSVG value={cardCode} size={140} />
                </div>
                <Button onClick={handleCreate} className="w-full">Simpan Kartu</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* QR Code Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code Kartu</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeSVG value={selectedCard.card_code} size={200} />
              <p className="font-mono text-sm font-bold">{selectedCard.card_code}</p>
              {selectedCard.owner_name && <p className="text-sm text-muted-foreground">{selectedCard.owner_name}</p>}
              {selectedCard.plate_number && <p className="text-sm font-semibold">{selectedCard.plate_number}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : cards.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Belum ada kartu parkir</p>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <button onClick={() => setSelectedCard(card)} className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <QrCode className="w-8 h-8" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold truncate">{card.card_code}</p>
                  {card.owner_name && <p className="text-sm text-muted-foreground truncate">{card.owner_name}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {card.plate_number && (
                      <span className="text-xs font-semibold bg-secondary px-2 py-0.5 rounded">{card.plate_number}</span>
                    )}
                    <span className="text-xs capitalize text-muted-foreground">{card.vehicle_type}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${card.is_active ? 'bg-green-100 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                      {card.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                {profile?.role === 'admin' && (
                  <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => handleDelete(card.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParkingCards;
