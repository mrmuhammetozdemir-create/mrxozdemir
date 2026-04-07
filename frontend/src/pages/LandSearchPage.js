import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Map as MapIcon } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { useSEO } from '@/hooks/useSEO';

export default function LandSearchPage() {
  const navigate = useNavigate();
  useSEO('ipat', { title: 'e-İPAT Arsa Analizi | mrxakademi' });
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [ada, setAda] = useState('');
  const [parsel, setParsel] = useState('');
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isLoggedIn = () => !!(localStorage.getItem('app_user') || localStorage.getItem('admin_token'));

  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/land/parcels');
      setParcels(data);
    } catch (error) {
      toast.error('Parseller yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) { setShowLoginModal(true); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (district) params.append('district', district);
      if (neighborhood) params.append('neighborhood', neighborhood);
      if (ada) params.append('ada', ada);
      if (parsel) params.append('parsel', parsel);
      const { data } = await api.get(`/land/parcels?${params}`);
      setParcels(data);
    } catch (error) {
      toast.error('Arama başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <MapIcon className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Arsa Parsel Analizi</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Card className="p-6 border-slate-200" data-testid="search-form">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">İl</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="İl" className="mt-1.5" data-testid="city-input" />
              </div>
              <div>
                <Label htmlFor="district">İlçe</Label>
                <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="İlçe" className="mt-1.5" data-testid="district-input" />
              </div>
              <div>
                <Label htmlFor="neighborhood">Mahalle</Label>
                <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Mahalle" className="mt-1.5" data-testid="neighborhood-input" />
              </div>
              <div>
                <Label htmlFor="ada">Ada</Label>
                <Input id="ada" value={ada} onChange={(e) => setAda(e.target.value)} placeholder="Ada" className="mt-1.5" data-testid="ada-input" />
              </div>
              <div>
                <Label htmlFor="parsel">Parsel</Label>
                <Input id="parsel" value={parsel} onChange={(e) => setParsel(e.target.value)} placeholder="Parsel" className="mt-1.5" data-testid="parsel-input" />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto bg-green-500 hover:bg-green-600" data-testid="search-button">
              <Search className="w-4 h-4 mr-2" />
              Ara
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Parseller ({parcels.length})</h2>
          {loading ? (
            <div className="text-center py-12 text-slate-600">Yükleniyor...</div>
          ) : parcels.length === 0 ? (
            <Card className="p-12 text-center border-slate-200">
              <p className="text-slate-600">Henüz parsel bulunmuyor</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parcels.map((parcel) => (
                <Card
                  key={parcel.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-slate-200"
                  onClick={() => navigate(`/land/${parcel.id}`)}
                  data-testid={`parcel-card-${parcel.id}`}
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {parcel.city} - Ada: {parcel.ada} Parsel: {parcel.parsel}
                  </h3>
                  <p className="text-sm text-slate-600 mb-1">
                    <span className="font-medium">İlçe:</span> {parcel.district}
                  </p>
                  <p className="text-sm text-slate-600 mb-1">
                    <span className="font-medium">Mahalle:</span> {parcel.neighborhood}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Büyüklük:</span> {parcel.size_sqm} m²
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
