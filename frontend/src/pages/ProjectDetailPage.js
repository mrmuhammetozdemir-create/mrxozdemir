import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Building2, MapPin, FileText, Image as ImageIcon,
  Video, Layers, Home, Calendar, Ruler, ChevronDown, ChevronRight,
  ExternalLink, Play, ChevronLeft, X
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// ========== STAT CARD ==========
function StatCard({ value, label, icon: Icon, color, bgColor }) {
  if (!value || value === 0) return null;
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 ${bgColor} shadow-lg`} data-testid={`stat-${label}`}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -mr-4 -mt-4" style={{background: 'white'}} />
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3 shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-3xl font-black text-white leading-none">{value.toLocaleString('tr-TR')}</p>
      <p className="text-xs font-medium mt-1 opacity-80 text-white">{label}</p>
    </div>
  );
}

// ========== DRAMATIC PROGRESS BAR ==========
function ProgressBar({ project }) {
  const pct = project.progress_percentage || 0;
  const getColor = (p) => p < 30 ? '#ef4444' : p < 60 ? '#f97316' : p < 85 ? '#eab308' : '#22c55e';
  const color = getColor(pct);
  const statusText = pct < 30 ? 'Başlangıç Aşaması' : pct < 60 ? 'İnşaat Devam Ediyor' : pct < 85 ? 'İlerleme Hızlandı' : pct < 100 ? 'Tamamlanmak Üzere' : 'Tamamlandı';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-xl">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -mr-16 -mt-16" />
      </div>

      <div className="relative">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-0.5">İnşaat İlerleme Durumu</p>
            <p className="text-white font-semibold text-sm">{statusText}</p>
          </div>
          {/* Big percentage badge */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{background: color}}>
              <div className="text-center">
                <span className="text-white font-black text-xl leading-none">%{pct}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress track */}
        <div className="relative h-4 rounded-full bg-white/10 overflow-hidden shadow-inner mb-3">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-40"
              style={{background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                      backgroundSize: '200% 100%', animation: 'shimmer 2s infinite'}} />
          </div>
          {/* Milestone dots */}
          {[25, 50, 75].map(m => (
            <div key={m} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
              style={{ left: `${m}%`, background: pct >= m ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>

        {/* Dates row */}
        <div className="flex justify-between text-xs text-white/50">
          {project.start_date && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span>Başlangıç: {project.start_date}</span>
            </div>
          )}
          {project.planned_end_date && (
            <div className="flex items-center gap-1">
              <span>Bitiş: {project.planned_end_date}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
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

// ========== TOP GALLERY BANNER ==========
function TopGalleryBanner({ projectId }) {
  const [media, setMedia] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get(`/projects/${projectId}/media`)
      .then(({ data }) => setMedia(data.filter(m => m.media_type === 'IMAGE' || !m.media_type)))
      .catch(() => {});
  }, [projectId]);

  if (media.length === 0) return null;

  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const goLightbox = (dir) => {
    setLightboxIdx(prev => (prev + dir + media.length) % media.length);
  };

  return (
    <>
      {/* Gallery Strip */}
      <div className="relative bg-slate-900 w-full overflow-hidden" data-testid="top-gallery-banner">
        <div className="flex items-center">
          {media.length > 3 && (
            <button onClick={() => scroll(-1)} className="absolute left-2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide p-2 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
            {media.map((m, i) => (
              <div
                key={m.id}
                onClick={() => setLightboxIdx(i)}
                className="flex-shrink-0 cursor-pointer rounded-xl overflow-hidden group relative"
                style={{ width: i === 0 ? 420 : 200, height: 260 }}
                data-testid={`top-gallery-thumb-${i}`}
              >
                <img
                  src={`${API_BASE}/api/files/${m.storage_path}`}
                  alt={m.original_filename || `Gorsel ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                {i === 0 && media.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    <ImageIcon className="w-3 h-3 inline mr-1" />{media.length} Fotograf
                  </div>
                )}
              </div>
            ))}
          </div>
          {media.length > 3 && (
            <button onClick={() => scroll(1)} className="absolute right-2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxIdx(null)}>
          <button onClick={(e) => { e.stopPropagation(); goLightbox(-1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img
            src={`${API_BASE}/api/files/${media[lightboxIdx]?.storage_path}`}
            alt=""
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); goLightbox(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white">
            <ChevronRight className="w-6 h-6" />
          </button>
          <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightboxIdx + 1} / {media.length}
          </div>
        </div>
      )}
    </>
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
    { value: project.total_housing, label: 'Konut', icon: Home, color: 'bg-blue-500', bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700' },
    { value: project.commercial_count, label: 'Ticari Alan', icon: Building2, color: 'bg-emerald-500', bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700' },
    { value: project.school_count, label: 'Okul', icon: Building2, color: 'bg-amber-500', bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600' },
    { value: project.mosque_count, label: 'Cami', icon: Building2, color: 'bg-purple-500', bgColor: 'bg-gradient-to-br from-purple-600 to-purple-700' },
    { value: project.social_facility_count, label: 'Sosyal Tesis', icon: Building2, color: 'bg-teal-500', bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} data-testid="back-button" className="rounded-full w-9 h-9 p-0 hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate" data-testid="project-title">{project.project_name}</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{project.city} / {project.district}{project.neighborhood ? ` / ${project.neighborhood}` : ''}</span>
              {project.project_type && <Badge className="bg-blue-100 text-blue-700 text-[10px] ml-1 shrink-0">{project.project_type}</Badge>}
            </div>
          </div>
        </div>
      </header>

      {/* Top Gallery Banner */}
      <TopGalleryBanner projectId={project.id} />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">

        {/* Stats Grid */}
        {stats.some(s => s.value > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" data-testid="stats-grid">
            {stats.map((s, i) => <StatCard key={i} {...s} />)}
          </div>
        )}

        {/* Divider */}
        {stats.some(s => s.value > 0) && (project.progress_percentage > 0 || project.start_date) && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">İlerleme</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
        )}

        {/* Dramatic Progress Bar */}
        {(project.progress_percentage > 0 || project.start_date) && <ProgressBar project={project} />}

        {/* Tabs Section */}
        <div>
          {/* Colorful section label */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 rounded-full px-4 py-1.5 shadow-md">
              <span className="text-white text-xs font-bold tracking-wide">Aşağıda proje detaylarını tek tek inceleyebilirsiniz</span>
            </div>
          </div>

          {/* Single unified card — tabs + content together */}
          <div className="rounded-2xl shadow-md overflow-hidden border border-slate-200">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Colorful tab bar — flush top, no gap */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-3 pt-3 pb-0">
                <div className="flex gap-1.5 overflow-x-auto" style={{scrollbarWidth:'none'}}>
                  {[
                    { value: 'info',    label: 'Genel Bilgi',  testId: 'tab-info',    emoji: '📋', color: '#3b82f6' },
                    { value: 'parcels', label: 'Ada/Parsel',   testId: 'tab-parcels', emoji: '🗂️', color: '#10b981' },
                    { value: 'map',     label: 'Harita',       testId: 'tab-map',     emoji: '🗺️', color: '#14b8a6' },
                    { value: 'gallery', label: 'Galeri',       testId: 'tab-gallery', emoji: '🖼️', color: '#a855f7' },
                    { value: 'videos',  label: 'Videolar',     testId: 'tab-videos',  emoji: '▶️', color: '#f43f5e' },
                    { value: 'docs',    label: 'Belgeler',     testId: 'tab-docs',    emoji: '📄', color: '#f59e0b' },
                  ].map(tab => (
                    <button
                      key={tab.value}
                      data-testid={tab.testId}
                      onClick={() => setActiveTab(tab.value)}
                      className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-all duration-200 flex-shrink-0"
                      style={{
                        background: activeTab === tab.value ? tab.color : 'transparent',
                        color: activeTab === tab.value ? 'white' : 'rgba(255,255,255,0.45)',
                        boxShadow: activeTab === tab.value ? `0 -2px 12px ${tab.color}55` : 'none',
                      }}
                    >
                      <span>{tab.emoji}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content — white, flush bottom */}
              <div className="bg-white p-5">
                <TabsContent value="info" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: 'Proje Adı', value: project.project_name },
                      { label: 'Proje Tipi', value: project.project_type },
                      { label: 'İl', value: project.city },
                      { label: 'İlçe', value: project.district },
                      { label: 'Mahalle', value: project.neighborhood },
                      { label: 'Proje Alanı', value: project.project_area_sqm ? `${project.project_area_sqm.toLocaleString('tr-TR')} m²` : null },
                      { label: 'Başlangıç Tarihi', value: project.start_date },
                      { label: 'Planlanan Bitiş', value: project.planned_end_date },
                    ].filter(r => r.value).map((r, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 font-medium">{r.label}</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">{r.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {project.description && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Açıklama</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{project.description}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="parcels" className="mt-0">
                  <AdaParselView projectId={project.id} />
                </TabsContent>

                <TabsContent value="map" className="mt-0">
                  <MapView project={project} projectId={project.id} />
                </TabsContent>

                <TabsContent value="gallery" className="mt-0">
                  <GalleryView projectId={project.id} />
                </TabsContent>

                <TabsContent value="videos" className="mt-0">
                  <VideosView videos={project.youtube_videos} />
                </TabsContent>

                <TabsContent value="docs" className="mt-0">
                  <DocumentsView projectId={project.id} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
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