import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Building2, MapPin, FileText, Image as ImageIcon,
  Video, Layers, Home, Calendar, Ruler, ChevronDown, ChevronRight,
  ExternalLink, Play
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

function StatCard({ value, label, icon: Icon, color }) {
  if (!value || value === 0) return null;
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl bg-white border shadow-sm`} data-testid={`stat-${label}`}>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value.toLocaleString('tr-TR')}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function ProgressBar({ project }) {
  const pct = project.progress_percentage || 0;
  return (
    <div className="p-4 rounded-xl bg-white border shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">Insaat Ilerleme Durumu</span>
        <span className="text-lg font-bold text-emerald-600">%{pct}</span>
      </div>
      <Progress value={pct} className="h-3" />
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        {project.start_date && <span>Baslangic: {project.start_date}</span>}
        {project.planned_end_date && <span>Planlanan Bitis: {project.planned_end_date}</span>}
      </div>
    </div>
  );
}

function AdaParselView({ projectId }) {
  const [adas, setAdas] = useState([]);
  const [parsels, setParsels] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${projectId}/adas`),
      api.get(`/projects/${projectId}/parsels`),
    ]).then(([a, p]) => { setAdas(a.data); setParsels(p.data); });
  }, [projectId]);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const getParselsByAda = (adaId) => parsels.filter(p => p.ada_id === adaId);

  if (adas.length === 0) return <p className="text-center text-slate-400 py-8">Bu projede ada/parsel bilgisi bulunmuyor.</p>;

  return (
    <div className="space-y-3">
      {adas.map(ada => (
        <Card key={ada.id} className="overflow-hidden">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50" onClick={() => toggle(ada.id)} data-testid={`user-ada-${ada.ada_no}`}>
            <div className="flex items-center gap-3">
              {expanded[ada.id] ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
              <span className="font-bold text-lg text-slate-800">Ada {ada.ada_no}</span>
              {ada.description && <span className="text-sm text-slate-500">- {ada.description}</span>}
            </div>
            <Badge className="bg-blue-100 text-blue-700">{getParselsByAda(ada.id).length} Parsel</Badge>
          </div>
          {expanded[ada.id] && (
            <div className="px-4 pb-4 border-t bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-3">
                {getParselsByAda(ada.id).map(p => (
                  <div key={p.id} className="p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                    <p className="font-mono font-bold text-sm text-slate-800">Parsel {p.parsel_no}</p>
                    {p.area_sqm && <p className="text-xs text-slate-500 mt-1">{p.area_sqm.toLocaleString('tr-TR')} m2</p>}
                    {p.note && <p className="text-xs text-slate-400 mt-1">{p.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function MapView({ project, projectId }) {
  const [layers, setLayers] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    api.get(`/projects/${projectId}/map-layers`).then(({ data }) => setLayers(data));
  }, [projectId]);

  useEffect(() => {
    if (!project?.location) return;
    const loadMap = async () => {
      // Dynamic import for leaflet
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      const container = document.getElementById('project-map');
      if (!container || container._leaflet_id) return;

      const map = L.map(container).setView([project.location.lat, project.location.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Fix default marker icon
      const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41]
      });

      L.marker([project.location.lat, project.location.lng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(project.project_name);

      // Load GeoJSON layers
      for (const layer of layers) {
        if (layer.file_type === 'GEOJSON' || layer.file_type === 'JSON') {
          try {
            const { data } = await api.get(`/projects/${projectId}/map-layers/${layer.id}/data`);
            L.geoJSON(data, {
              style: { color: '#3b82f6', weight: 2, fillOpacity: 0.2 }
            }).addTo(map);
          } catch {}
        }
      }
      setMapLoaded(true);
    };
    loadMap();
  }, [project, projectId, layers]);

  return (
    <div className="space-y-3">
      <div id="project-map" className="h-[500px] w-full rounded-xl overflow-hidden border shadow-sm" data-testid="project-map" />
      {layers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {layers.map(l => (
            <Badge key={l.id} variant="outline" className="text-xs">
              <Layers className="w-3 h-3 mr-1" />{l.original_filename}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryView({ projectId }) {
  const [media, setMedia] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    api.get(`/projects/${projectId}/media`).then(({ data }) => setMedia(data));
  }, [projectId]);

  const categories = ['all', ...new Set(media.map(m => m.category))];
  const filtered = selectedCategory === 'all' ? media : media.filter(m => m.category === selectedCategory);

  if (media.length === 0) return <p className="text-center text-slate-400 py-8">Bu proje icin henuz gorsel eklenmemis.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm"
            onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? 'bg-blue-600' : ''}>
            {cat === 'all' ? 'Tumu' : cat}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(m => (
          <div key={m.id} className="cursor-pointer group rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow"
            onClick={() => setLightbox(m)} data-testid={`gallery-item-${m.id}`}>
            <img src={`${API_BASE}/api/files/${m.storage_path}`} alt={m.original_filename} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
            <div className="p-2 bg-white">
              <Badge className="text-[10px] bg-slate-100 text-slate-600">{m.category}</Badge>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={`${API_BASE}/api/files/${lightbox.storage_path}`} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}

function VideosView({ videos }) {
  if (!videos || videos.length === 0) return <p className="text-center text-slate-400 py-8">Bu proje icin henuz video eklenmemis.</p>;

  const getYoutubeId = (u) => {
    const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
    return m ? m[1] : null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {videos.map((v, i) => {
        const vid = getYoutubeId(v);
        if (!vid) return null;
        return (
          <div key={i} className="rounded-xl overflow-hidden border shadow-sm" data-testid={`video-player-${i}`}>
            <iframe src={`https://www.youtube.com/embed/${vid}`} className="w-full aspect-video" allowFullScreen title={`Video ${i + 1}`} />
          </div>
        );
      })}
    </div>
  );
}

function DocumentsView({ projectId }) {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    api.get(`/projects/${projectId}/documents`).then(({ data }) => setDocs(data));
  }, [projectId]);

  if (docs.length === 0) return <p className="text-center text-slate-400 py-8">Bu proje icin henuz belge eklenmemis.</p>;

  return (
    <div className="space-y-2">
      {docs.map(doc => (
        <div key={doc.id} className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-sm transition-shadow" data-testid={`doc-item-${doc.id}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{doc.title}</p>
              <p className="text-xs text-slate-500">{doc.doc_type} - {doc.original_filename}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(`${API_BASE}/api/files/${doc.storage_path}`, '_blank')} data-testid={`view-doc-${doc.id}`}>
            <ExternalLink className="w-4 h-4 mr-1" />Goruntule
          </Button>
        </div>
      ))}
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // Try new collection first, fall back to old
        try {
          const { data } = await api.get(`/projects/${id}`);
          setProject(data);
        } catch {
          const { data } = await api.get(`/toki/projects/${id}`);
          setProject(data);
        }
      } catch {
        toast.error('Proje yuklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-lg text-slate-600 mb-4">Proje bulunamadi</p>
        <Button onClick={() => navigate(-1)}>Geri Don</Button>
      </div>
    </div>
  );

  const stats = [
    { value: project.total_housing, label: 'Konut', icon: Home, color: 'bg-blue-600' },
    { value: project.commercial_count, label: 'Ticari Alan', icon: Building2, color: 'bg-emerald-600' },
    { value: project.school_count, label: 'Okul', icon: Building2, color: 'bg-amber-500' },
    { value: project.mosque_count, label: 'Cami', icon: Building2, color: 'bg-purple-600' },
    { value: project.social_facility_count, label: 'Sosyal Tesis', icon: Building2, color: 'bg-teal-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900" data-testid="project-title">{project.project_name}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-3 h-3" />
              <span>{project.city} / {project.district}{project.neighborhood ? ` / ${project.neighborhood}` : ''}</span>
              {project.project_type && <Badge className="bg-blue-100 text-blue-700 text-xs ml-2">{project.project_type}</Badge>}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        {stats.some(s => s.value > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" data-testid="stats-grid">
            {stats.map((s, i) => <StatCard key={i} {...s} />)}
          </div>
        )}

        {/* Progress Bar */}
        {(project.progress_percentage > 0 || project.start_date) && <ProgressBar project={project} />}

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full bg-white border rounded-xl p-1">
            <TabsTrigger value="info" data-testid="tab-info">Genel Bilgi</TabsTrigger>
            <TabsTrigger value="parcels" data-testid="tab-parcels">Ada/Parsel</TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map">Harita</TabsTrigger>
            <TabsTrigger value="gallery" data-testid="tab-gallery">Galeri</TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">Videolar</TabsTrigger>
            <TabsTrigger value="docs" data-testid="tab-docs">Belgeler</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Proje Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Proje Adi" value={project.project_name} />
                <InfoRow label="Proje Tipi" value={project.project_type} />
                <InfoRow label="Il" value={project.city} />
                <InfoRow label="Ilce" value={project.district} />
                <InfoRow label="Mahalle" value={project.neighborhood} />
                <InfoRow label="Proje Alani" value={project.project_area_sqm ? `${project.project_area_sqm.toLocaleString('tr-TR')} m2` : null} />
                <InfoRow label="Baslangic Tarihi" value={project.start_date} />
                <InfoRow label="Planlanan Bitis" value={project.planned_end_date} />
              </div>
              {project.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-slate-500 mb-1">Aciklama</p>
                  <p className="text-slate-700">{project.description}</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="parcels" className="mt-4">
            <AdaParselView projectId={project.id} />
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <MapView project={project} projectId={project.id} />
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            <GalleryView projectId={project.id} />
          </TabsContent>

          <TabsContent value="videos" className="mt-4">
            <VideosView videos={project.youtube_videos} />
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            <DocumentsView projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
