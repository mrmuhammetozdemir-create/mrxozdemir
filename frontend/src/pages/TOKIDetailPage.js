import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, FileText, Image as ImageIcon, MapPin, File } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function TOKIDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/toki/projects/${id}`);
      setProject(data);
    } catch (error) {
      toast.error('Proje yüklenemedi');
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

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
        <div className="text-lg text-slate-600">Proje bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/toki')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">{project.project_name}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Card className="p-6 border-slate-200 bg-white" data-testid="project-info">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Proje Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">İl</p>
              <p className="text-base font-medium text-slate-900">{project.city}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">İlçe</p>
              <p className="text-base font-medium text-slate-900">{project.district}</p>
            </div>
            {project.region && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Bölge/Etap</p>
                <p className="text-base font-medium text-slate-900">{project.region}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500 mb-1">İnşaat Durumu</p>
              <p className="text-base font-medium text-slate-900">{project.construction_status}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500 mb-1">Açıklama</p>
            <p className="text-base text-slate-700">{project.description}</p>
          </div>
        </Card>

        {/* Big Action Button */}
        <button
          onClick={() => setActiveView('report')}
          className="w-full rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 p-8 shadow-lg hover:shadow-xl transition-all"
        >
          <h2 className="text-3xl font-bold text-white text-center">Proje Analizi Başlat</h2>
        </button>

        {/* 2x2 Button Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Belgeler */}
          <button
            onClick={() => setActiveView('documents')}
            className="rounded-3xl border-4 border-orange-400 bg-white p-8 hover:bg-orange-50 transition-all shadow-md hover:shadow-lg"
            data-testid="btn-documents"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-600" />
              <h3 className="text-2xl font-bold text-orange-600">Belgeler</h3>
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

          {/* Proje Resimleri */}
          <button
            onClick={() => setActiveView('images')}
            className="rounded-3xl border-4 border-blue-400 bg-blue-50 p-8 hover:bg-blue-100 transition-all shadow-md hover:shadow-lg"
            data-testid="btn-images"
          >
            <div className="flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-blue-700" />
              <h3 className="text-2xl font-bold text-blue-700">Proje Resimleri</h3>
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
            <h3 className="text-xl font-semibold mb-4">Belgeler</h3>
            {project.documents.length === 0 ? (
              <p className="text-center text-slate-600 py-8">Henüz belge eklenmemiş</p>
            ) : (
              <div className="space-y-2">
                {project.documents.map((doc, index) => (
                  <a key={doc} href={doc} target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    Belge {index + 1}
                  </a>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeView === 'images' && (
          <Card className="p-6 border-slate-200 bg-white">
            <h3 className="text-xl font-semibold mb-4">Proje Resimleri</h3>
            {project.images.length === 0 ? (
              <p className="text-center text-slate-600 py-8">Henüz resim eklenmemiş</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.images.map((img, index) => (
                  <img key={img} src={img} alt={`Proje ${index + 1}`} className="w-full h-48 object-cover rounded-lg" />
                ))}
              </div>
            )}
          </Card>
        )}

        {activeView === 'map' && (
          <Card className="p-0 overflow-hidden border-slate-200 bg-white">
            <div className="h-[500px] w-full">
              <MapContainer
                center={[project.location.lat, project.location.lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[project.location.lat, project.location.lng]}>
                  <Popup>{project.project_name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
