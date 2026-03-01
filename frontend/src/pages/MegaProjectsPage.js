import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MapPin as MapPinIcon } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MegaProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/mega-projects');
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0]);
    } catch (error) {
      toast.error('Projeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
              <MapPinIcon className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Mega Proje Haritası</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="text-center py-12 text-slate-600">Yükleniyor...</div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center border-slate-200">
            <p className="text-slate-600">Henüz mega proje eklenmemiş</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="p-0 overflow-hidden border-slate-200" data-testid="mega-projects-map">
                <div className="h-[600px] w-full">
                  <MapContainer
                    center={[39.9334, 32.8597]}
                    zoom={6}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {projects.map((project) => (
                      <Marker
                        key={project.id}
                        position={[project.location.lat, project.location.lng]}
                        eventHandlers={{
                          click: () => setSelectedProject(project),
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-semibold text-slate-900">{project.name}</h3>
                            <p className="text-sm text-slate-600">{project.category}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </Card>
            </div>

            {/* Project Details */}
            <div>
              {selectedProject && (
                <Card className="p-6 border-slate-200 sticky top-24" data-testid="project-detail-card">
                  <h2 className="text-xl font-semibold mb-4 text-slate-900">{selectedProject.name}</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Kategori</p>
                      <p className="text-base font-medium text-slate-900">{selectedProject.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Açıklama</p>
                      <p className="text-base text-slate-700">{selectedProject.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Zaman Çizelgesi</p>
                      <p className="text-base text-slate-700">{selectedProject.timeline}</p>
                    </div>
                    {selectedProject.images.length > 0 && (
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Görseller</p>
                        <div className="space-y-2">
                          {selectedProject.images.map((img, index) => (
                            <img key={index} src={img} alt={`Proje ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
