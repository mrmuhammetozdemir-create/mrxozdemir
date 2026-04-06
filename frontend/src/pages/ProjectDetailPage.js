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
} from 'lucide-react';import api from '@/utils/api';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// ========== STAT CARD ==========
function StatCard({ value, label, icon: Icon, color, bgColor }) {
  if (!value || value === 0) return null;
  return (
    <div className={`relative overflow-hidden rounded-2xl ${bgColor} shadow-lg flex-1 min-w-[100px]`} data-testid={`stat-${label}`}>
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 -mr-3 -mt-3 bg-white" />
      <div className="p-4 flex flex-col gap-2">
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shadow-md`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <p className="text-2xl font-black text-white leading-none">{value.toLocaleString('tr-TR')}</p>
        <p className="text-xs font-medium opacity-80 text-white whitespace-nowrap">{label}</p>
      </div>
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

// ========== VIDEO HELPERS ==========
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&\s]+)/);
  return m ? m[1] : null;
}

function VideoCard({ url, index }) {
  const id = getYouTubeId(url);
  if (!id) return null;
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black group">
      <div className="relative" style={{paddingTop: '56.25%'}}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${id}`}
          title={`Video ${index + 1}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

// ========== ADA PARSEL VIEW ==========
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
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    api.get(`/projects/${projectId}/map-layers`).then(({ data }) => setLayers(data)).catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let destroyed = false;

    const loadMap = async () => {
      // Dynamic imports for OpenLayers
      const ol = await import('ol');
      const { Tile: TileLayer, Vector: VectorLayer } = await import('ol/layer');
      const { XYZ, Vector: VectorSource } = await import('ol/source');
      const { KML, GeoJSON } = await import('ol/format');
      const { fromLonLat, transformExtent } = await import('ol/proj');
      const { Style, Fill, Stroke, Circle: CircleStyle } = await import('ol/style');
      await import('ol/ol.css');

      if (destroyed || !mapContainerRef.current) return;

      // Cleanup previous
      if (mapInstanceRef.current) { mapInstanceRef.current.setTarget(undefined); mapInstanceRef.current = null; }

      const center = project?.location
        ? fromLonLat([project.location.lng, project.location.lat])
        : fromLonLat([28.9784, 41.0082]); // Istanbul default

      // Google Maps Hybrid (Satellite + Labels) — most up-to-date imagery
      const satelliteLayer = new TileLayer({
        source: new XYZ({
          tileUrlFunction: (tileCoord) => {
            const [z, x, y] = tileCoord;
            const s = Math.abs(x + y) % 4;
            return `https://mt${s}.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;
          },
          maxZoom: 20,
          crossOrigin: 'anonymous'
        })
      });

      const map = new ol.Map({
        target: mapContainerRef.current,
        layers: [satelliteLayer],
        view: new ol.View({ center, zoom: 14 })
      });
      mapInstanceRef.current = map;

      // Google Earth style
      const kmlStyle = new Style({
        fill: new Fill({ color: 'rgba(0, 229, 255, 0.30)' }),
        stroke: new Stroke({ color: '#ff00ff', width: 3 }),
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: '#00e5ff' }),
          stroke: new Stroke({ color: '#ff00ff', width: 2 })
        })
      });

      const allExtents = [];

      for (const layer of layers) {
        if (destroyed) break;
        try {
          let vectorSource;

          if (layer.file_type === 'KML' || layer.file_type === 'KMZ') {
            // OpenLayers KML format — read raw KML text
            const resp = await fetch(`${API_BASE}/api/projects/${projectId}/map-layers/${layer.id}/data`);
            const kmlText = await resp.text();
            const kmlFormat = new KML({ extractStyles: false });
            const features = kmlFormat.readFeatures(kmlText, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857'
            });
            vectorSource = new VectorSource({ features });

          } else if (layer.file_type === 'GEOJSON' || layer.file_type === 'JSON') {
            const { data } = await api.get(`/projects/${projectId}/map-layers/${layer.id}/data`);
            const geojsonFormat = new GeoJSON();
            const features = geojsonFormat.readFeatures(data, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857'
            });
            vectorSource = new VectorSource({ features });
          }

          if (vectorSource && !destroyed) {
            const vectorLayer = new VectorLayer({ source: vectorSource, style: kmlStyle });
            map.addLayer(vectorLayer);
            const extent = vectorSource.getExtent();
            if (extent && !extent.some(v => !isFinite(v))) {
              allExtents.push(extent);
            }
          }
        } catch (e) { console.warn('Layer load error:', layer.original_filename, e); }
      }

      if (destroyed) return;

      // Auto-zoom to all features
      if (allExtents.length > 0) {
        const combined = allExtents.reduce((acc, ext) => [
          Math.min(acc[0], ext[0]), Math.min(acc[1], ext[1]),
          Math.max(acc[2], ext[2]), Math.max(acc[3], ext[3])
        ]);
        map.getView().fit(combined, { padding: [40, 40, 40, 40], maxZoom: 18, duration: 800 });
      }
    };

    loadMap();
    return () => {
      destroyed = true;
      if (mapInstanceRef.current) { mapInstanceRef.current.setTarget(undefined); mapInstanceRef.current = null; }
    };
  }, [project, projectId, layers]);

  return (
    <div className="space-y-2">
      <div ref={mapContainerRef} className="h-[520px] w-full rounded-xl overflow-hidden shadow-md" data-testid="project-map" />
      {layers.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {layers.map(l => (
            <Badge key={l.id} variant="outline" className="text-xs gap-1">
              <Layers className="w-3 h-3" /> {l.original_filename} <span className="text-slate-400">({l.file_type})</span>
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

  useEffect(() => {
    api.get(`/projects/${projectId}/media`)
      .then(({ data }) => setMedia(data.filter(m => m.media_type === 'IMAGE' || !m.media_type)))
      .catch(() => {});
  }, [projectId]);

  if (media.length === 0) return null;

  const goLightbox = (dir) => setLightboxIdx(prev => (prev + dir + media.length) % media.length);

  // Layout: first image big, rest in a 2-column right grid
  const first = media[0];
  const rest = media.slice(1, 5);

  return (
    <>
      <div className="w-full bg-slate-900" data-testid="top-gallery-banner">
        <div className="max-w-7xl mx-auto">
          <div className="flex h-64 md:h-80 lg:h-96">
            {/* Featured image */}
            <div
              className="relative cursor-pointer overflow-hidden group flex-1"
              onClick={() => setLightboxIdx(0)}
            >
              <img
                src={`${API_BASE}/api/files/${first.storage_path}`}
                alt="Ana Görsel"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3" /> {media.length} Fotoğraf
              </div>
            </div>

            {/* Side grid — up to 4 thumbs */}
            {rest.length > 0 && (
              <div className={`grid gap-0.5 ml-0.5 w-72 lg:w-96 ${rest.length <= 2 ? 'grid-rows-2' : 'grid-rows-2 grid-cols-2'}`}>
                {rest.map((m, i) => (
                  <div
                    key={m.id}
                    onClick={() => setLightboxIdx(i + 1)}
                    className="relative cursor-pointer overflow-hidden group"
                    style={{ gridColumn: rest.length === 1 ? 'span 2' : undefined }}
                  >
                    <img
                      src={`${API_BASE}/api/files/${m.storage_path}`}
                      alt={`Görsel ${i + 2}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                    {i === 3 && media.length > 5 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+{media.length - 5}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4" onClick={() => setLightboxIdx(null)}>
          <button onClick={(e) => { e.stopPropagation(); goLightbox(-1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img src={`${API_BASE}/api/files/${media[lightboxIdx]?.storage_path}`} alt="" className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); goLightbox(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white">
            <ChevronRight className="w-6 h-6" />
          </button>
          <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{lightboxIdx + 1} / {media.length}</div>
        </div>
      )}
    </>
  );
}

// ========== PROJECT INFO BAR (overlays gallery) ==========
function ProjectInfoBar({ project }) {
  const items = [
    { label: 'Proje Adı', value: project.project_name },
    { label: 'Proje Tipi', value: project.project_type },
    { label: 'İl', value: project.city },
    { label: 'İlçe', value: project.district },
    { label: 'Mahalle', value: project.neighborhood },
    { label: 'Proje Alanı', value: project.project_area_sqm ? `${project.project_area_sqm.toLocaleString('tr-TR')} m²` : null },
    { label: 'Başlangıç', value: project.start_date },
    { label: 'Bitiş', value: project.planned_end_date },
  ].filter(i => i.value);

  if (items.length === 0) return null;

  return (
    <div className="bg-white border-b border-slate-100 shadow-sm" data-testid="project-info-bar">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-stretch justify-center gap-0 overflow-x-auto" style={{scrollbarWidth:'none'}}>
          {items.map((item, i) => (
            <div key={i} className={`flex flex-col items-center justify-center px-5 py-3 min-w-[100px] ${i < items.length - 1 ? 'border-r border-slate-100' : ''}`}>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap mb-1">{item.label}</span>
              <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');

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

  const videos = project.youtube_videos || [];
  const stats = [
    { value: project.total_housing, label: 'Konut', icon: Home, color: 'bg-yellow-400', bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-500' },
    { value: project.commercial_count, label: 'Ticari Alan', icon: Building2, color: 'bg-red-500', bgColor: 'bg-gradient-to-br from-red-500 to-red-600' },
    { value: project.school_count, label: 'Okul', icon: Building2, color: 'bg-sky-400', bgColor: 'bg-gradient-to-br from-sky-400 to-sky-500' },
    { value: project.mosque_count, label: 'Cami', icon: Building2, color: 'bg-blue-700', bgColor: 'bg-gradient-to-br from-blue-700 to-blue-800' },
    { value: project.social_facility_count, label: 'Sosyal Tesis', icon: Building2, color: 'bg-indigo-900', bgColor: 'bg-gradient-to-br from-indigo-900 to-slate-900' },
    { value: videos.length, label: 'Video', icon: Play, color: 'bg-rose-500', bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600' },
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

      {/* Project Info Bar — overlays gallery bottom */}
      <ProjectInfoBar project={project} />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">

        {/* Stats Grid - horizontal scroll on mobile */}
        {stats.some(s => s.value > 0) && (
          <div className="flex gap-3 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}} data-testid="stats-grid">
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
                    { value: 'map',     label: 'Harita',       testId: 'tab-map',     emoji: '🗺️', color: '#14b8a6' },
                    { value: 'parcels', label: 'Ada/Parsel',   testId: 'tab-parcels', emoji: '🗂️', color: '#10b981' },
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
                <TabsContent value="map" className="mt-0">
                  <MapView project={project} projectId={project.id} />
                </TabsContent>

                <TabsContent value="parcels" className="mt-0">
                  <AdaParselView projectId={project.id} />
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

        {/* Bottom Video Section — always visible */}
        {videos.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 rounded-full px-4 py-1.5 shadow-md">
                <Play className="w-3 h-3 text-white fill-white" />
                <span className="text-white text-xs font-bold tracking-wide">Proje Videoları</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{videos.length}</span>
              </div>
            </div>
            <div className={`grid gap-4 ${videos.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
              {videos.map((url, i) => <VideoCard key={i} url={url} index={i} />)}
            </div>
          </div>
        )}

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