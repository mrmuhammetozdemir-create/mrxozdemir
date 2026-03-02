import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, FileText, Image as ImageIcon, MapPin, File } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function LandDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(null);

  useEffect(() => {
    fetchParcel();
  }, [id]);

  const fetchParcel = async () => {
    try {
      const { data } = await api.get(`/land/parcels/${id}`);
      setParcel(data);
    } catch (error) {
      toast.error('Parsel yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
        <div className="text-lg text-slate-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
        <div className="text-lg text-slate-600">Parsel bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/land')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">
            Ada: {parcel.ada} Parsel: {parcel.parsel}
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Card className="p-6 border-slate-200 bg-white" data-testid="parcel-info">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Parsel Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">İl</p>
              <p className="text-base font-medium text-slate-900">{parcel.city}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">İlçe</p>
              <p className="text-base font-medium text-slate-900">{parcel.district}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Mahalle</p>
              <p className="text-base font-medium text-slate-900">{parcel.neighborhood}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Büyüklük</p>
              <p className="text-base font-medium text-slate-900">{parcel.size_sqm} m²</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">İmar Durumu</p>
              <p className="text-base font-medium text-slate-900">{parcel.zoning_info}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Gelişim Potansiyeli</p>
              <p className="text-base font-medium text-slate-900">{parcel.development_potential}</p>
            </div>
          </div>
        </Card>

        {/* Big Action Button */}
        <button
          onClick={() => setActiveView('report')}
          className="w-full rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 p-8 shadow-lg hover:shadow-xl transition-all"
        >
          <h2 className="text-3xl font-bold text-white text-center">Parsel Analizini Başlat</h2>
        </button>

        {/* 2x2 Button Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Arazi Raporu */}
          <button
            onClick={() => setActiveView('documents')}
            className="rounded-3xl border-4 border-orange-400 bg-white p-8 hover:bg-orange-50 transition-all shadow-md hover:shadow-lg"
            data-testid="btn-documents"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-600" />
              <h3 className="text-2xl font-bold text-orange-600">Arazi Raporu</h3>
            </div>
          </button>

          {/* Haritada Görüntüle */}
          <button
            onClick={() => setActiveView('map')}
            className="rounded-3xl border-4 border-cyan-400 bg-cyan-50 p-8 hover:bg-cyan-100 transition-all shadow-md hover:shadow-lg"
            data-testid="btn-map"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-cyan-700" />
              <h3 className="text-2xl font-bold text-cyan-700">Haritada Görüntüle</h3>
            </div>
          </button>

          {/* Plan Notları */}
          <button
            onClick={() => setActiveView('images')}
            className="rounded-3xl border-4 border-blue-400 bg-blue-50 p-8 hover:bg-blue-100 transition-all shadow-md hover:shadow-lg"
            data-testid="btn-images"
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-blue-700" />
              <h3 className="text-2xl font-bold text-blue-700">Plan Notları</h3>
            </div>
          </button>

          {/* PDF Oluştur */}
          <button
            onClick={() => toast.info('PDF oluşturma özelliği yakında eklenecek')}
            className="rounded-3xl border-4 border-green-400 bg-green-50 p-8 hover:bg-green-100 transition-all shadow-md hover:shadow-lg"
            data-testid="btn-pdf"
          >
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-green-700" />
              <h3 className="text-2xl font-bold text-green-700">PDF Oluştur</h3>
            </div>
          </button>
        </div>

        {/* Content Display Area */}
        {activeView === 'documents' && (
          <Card className="p-6 border-slate-200 bg-white">
            <h3 className="text-xl font-semibold mb-4">Arazi Raporu</h3>
            {parcel.documents.length === 0 ? (
              <p className="text-center text-slate-600 py-8">Henüz belge eklenmemiş</p>
            ) : (
              <div className="space-y-2">
                {parcel.documents.map((doc, index) => (
                  <a key={index} href={doc} target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    Belge {index + 1}
                  </a>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeView === 'images' && (
          <Card className="p-6 border-slate-200 bg-white">
            <h3 className="text-xl font-semibold mb-4">Plan Notları</h3>
            {parcel.images.length === 0 ? (
              <p className="text-center text-slate-600 py-8">Henüz resim eklenmemiş</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parcel.images.map((img, index) => (
                  <img key={index} src={img} alt={`Parsel ${index + 1}`} className="w-full h-48 object-cover rounded-lg" />
                ))}
              </div>
            )}
          </Card>
        )}

        {activeView === 'map' && (
          <Card className="p-0 overflow-hidden border-slate-200 bg-white">
            <div className="h-[500px] w-full">
              <MapContainer
                center={[parcel.location.lat, parcel.location.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[parcel.location.lat, parcel.location.lng]}>
                  <Popup>Ada: {parcel.ada} Parsel: {parcel.parsel}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
