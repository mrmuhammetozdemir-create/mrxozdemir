import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Image as ImageIcon, MapPin } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function TOKIDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-600">Proje bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/toki')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">{project.project_name}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Card className="p-6 border-slate-200" data-testid="project-info">
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

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents" data-testid="tab-documents">
              <FileText className="w-4 h-4 mr-2" />
              Belgeler
            </TabsTrigger>
            <TabsTrigger value="images" data-testid="tab-images">
              <ImageIcon className="w-4 h-4 mr-2" />
              Resimler
            </TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map">
              <MapPin className="w-4 h-4 mr-2" />
              Harita
            </TabsTrigger>
          </TabsList>
          <TabsContent value="documents">
            <Card className="p-6 border-slate-200">
              {project.documents.length === 0 ? (
                <p className="text-center text-slate-600 py-8">Henüz belge eklenmemiş</p>
              ) : (
                <div className="space-y-2">
                  {project.documents.map((doc, index) => (
                    <a key={index} href={doc} target="_blank" rel="noopener noreferrer" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      Belge {index + 1}
                    </a>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="images">
            <Card className="p-6 border-slate-200">
              {project.images.length === 0 ? (
                <p className="text-center text-slate-600 py-8">Henüz resim eklenmemiş</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.images.map((img, index) => (
                    <img key={index} src={img} alt={`Proje ${index + 1}`} className="w-full h-48 object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="map">
            <Card className="p-0 overflow-hidden border-slate-200">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
