import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, MapPin, List, Map, Navigation,
  LocateFixed, Loader2, X
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// ============================================================
// Category colors
// ============================================================
const CAT_COLORS = {
  'TOKİ':    '#3b82f6',
  'Ulaşım':  '#8b5cf6',
  'Altyapı': '#f97316',
  'Enerji':  '#eab308',
  'Sağlık':  '#ef4444',
  'Eğitim':  '#10b981',
  'Konut':   '#14b8a6',
  'Turizm':  '#ec4899',
};
const DEFAULT_CAT_COLOR = '#64748b';
const getCatColor = (cat) => CAT_COLORS[cat] || DEFAULT_CAT_COLOR;

// ============================================================
// OpenLayers Map — same as e-Konut
// ============================================================
function OLMegaMap({ projects, selectedProject, onSelectProject }) {
  const mapContainerRef   = useRef(null);
  const mapInstanceRef    = useRef(null);
  const locationOverlayRef = useRef(null);
  const selectedOverlayRef = useRef(null);
  const onSelectRef        = useRef(onSelectProject);

  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  // Keep callback ref up-to-date without triggering map rebuild
  useEffect(() => { onSelectRef.current = onSelectProject; }, [onSelectProject]);

  // Build the map once when projects list is ready
  useEffect(() => {
    if (!mapContainerRef.current || projects.length === 0) return;
    let destroyed = false;

    const loadMap = async () => {
      const ol = await import('ol');
      const { Tile: TileLayer, Vector: VectorLayer } = await import('ol/layer');
      const { XYZ, Vector: VectorSource } = await import('ol/source');
      const { KML, GeoJSON } = await import('ol/format');
      const { fromLonLat } = await import('ol/proj');
      const { Style, Fill, Stroke, Circle: CircleStyle, Text: OlText } = await import('ol/style');
      const { Point } = await import('ol/geom');
      const { Feature } = await import('ol');
      await import('ol/ol.css');

      if (destroyed || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }

      // Google Maps satellite tiles
      const satLayer = new TileLayer({
        source: new XYZ({
          tileUrlFunction: ([z, x, y]) => {
            const s = Math.abs(x + y) % 4;
            return `https://mt${s}.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;
          },
          maxZoom: 20,
          crossOrigin: 'anonymous',
        }),
      });

      const map = new ol.Map({
        target: mapContainerRef.current,
        layers: [satLayer],
        view: new ol.View({ center: fromLonLat([35.0, 39.0]), zoom: 6 }),
      });
      mapInstanceRef.current = map;

      // Project markers
      const valid = projects.filter(p => p.location?.lat && p.location?.lng);
      const features = valid.map(p => {
        const color = getCatColor(p.category);
        const f = new Feature({
          geometry: new Point(fromLonLat([p.location.lng, p.location.lat])),
          projectId: p.id,
        });
        f.setStyle(new Style({
          // Pin marker — teardrop style (large circle + small bottom dot)
          image: new CircleStyle({
            radius: 13,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#ffffff', width: 3 }),
          }),
          // Label — white card with colored left border
          text: new OlText({
            text: p.name.length > 24 ? p.name.substring(0, 21) + '…' : p.name,
            offsetY: -36,
            font: 'bold 12px -apple-system, "Segoe UI", sans-serif',
            fill: new Fill({ color: '#0f172a' }),
            backgroundFill: new Fill({ color: 'rgba(255,255,255,0.97)' }),
            backgroundStroke: new Stroke({ color, width: 2.5 }),
            padding: [4, 8, 4, 8],
            textAlign: 'center',
          }),
        }));
        return f;
      });

      const source = new VectorSource({ features });
      map.addLayer(new VectorLayer({ source, zIndex: 5 }));

      // Click handler
      map.on('singleclick', (evt) => {
        const hit = map.forEachFeatureAtPixel(evt.pixel, f => f);
        if (hit) {
          const pId = hit.get('projectId');
          const proj = valid.find(p => p.id === pId);
          if (proj) onSelectRef.current(proj);
        }
      });

      // Pointer cursor on hover
      map.on('pointermove', (evt) => {
        map.getTargetElement().style.cursor = map.hasFeatureAtPixel(evt.pixel) ? 'pointer' : '';
      });

      // Fit view to markers FIRST (before async KMZ loading)
      const extent = source.getExtent();
      if (extent && !extent.some(v => !isFinite(v))) {
        const [minX, minY, maxX, maxY] = extent;
        // If all markers at same point, animate directly; else fit to extent
        if (Math.abs(maxX - minX) < 100 && Math.abs(maxY - minY) < 100) {
          map.getView().animate({ center: [(minX + maxX) / 2, (minY + maxY) / 2], zoom: 13, duration: 600 });
        } else {
          map.getView().fit(extent, { padding: [60, 60, 60, 60], maxZoom: 13, duration: 600 });
        }
      }

      // ---- Load KML/GeoJSON map layers from projects collection (async, after fit) ----
      const kmlStyle = new Style({
        fill: new Fill({ color: 'rgba(0, 229, 255, 0.22)' }),
        stroke: new Stroke({ color: '#00b4d8', width: 2.5 }),
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: '#00e5ff' }),
          stroke: new Stroke({ color: '#0ea5e9', width: 1.5 }),
        }),
      });

      const fromProjs = valid.filter(p => p.from_projects);
      for (const proj of fromProjs) {
        if (destroyed) break;
        try {
          const { data: layerList } = await api.get(`/projects/${proj.id}/map-layers`);
          for (const layer of layerList) {
            if (destroyed) break;
            try {
              let vectorSource;
              if (layer.file_type === 'KML' || layer.file_type === 'KMZ') {
                const resp = await fetch(`${API_BASE}/api/projects/${proj.id}/map-layers/${layer.id}/data`);
                const kmlText = await resp.text();
                const feats = new KML({ extractStyles: false }).readFeatures(kmlText, {
                  dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857',
                });
                vectorSource = new VectorSource({ features: feats });
              } else if (layer.file_type === 'GEOJSON' || layer.file_type === 'JSON') {
                const resp = await fetch(`${API_BASE}/api/projects/${proj.id}/map-layers/${layer.id}/data`);
                const geoData = await resp.json();
                const feats = new GeoJSON().readFeatures(geoData, {
                  dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857',
                });
                vectorSource = new VectorSource({ features: feats });
              }
              if (vectorSource && !destroyed) {
                map.addLayer(new VectorLayer({ source: vectorSource, style: kmlStyle, zIndex: 3 }));
              }
            } catch (e) { console.warn('Katman yüklenemedi:', layer.original_filename, e); }
          }
        } catch (e) { console.warn('Proje katmanları alınamadı:', proj.id); }
      }
    };

    loadMap();
    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [projects]);

  // Pan to selected project + show white-ring indicator
  useEffect(() => {
    if (!selectedProject?.location || !mapInstanceRef.current) return;
    const { lat, lng } = selectedProject.location;

    const update = async () => {
      const { fromLonLat } = await import('ol/proj');
      const { default: Overlay } = await import('ol/Overlay');
      const coord = fromLonLat([lng, lat]);

      // Remove old ring
      if (selectedOverlayRef.current) {
        mapInstanceRef.current.removeOverlay(selectedOverlayRef.current);
      }

      const ring = document.createElement('div');
      ring.style.cssText = [
        'width:28px', 'height:28px', 'border-radius:50%',
        'border:3px solid #fff',
        'box-shadow:0 0 0 3px rgba(255,255,255,0.4),0 4px 16px rgba(0,0,0,0.3)',
        'pointer-events:none',
      ].join(';');

      const overlay = new Overlay({ position: coord, positioning: 'center-center', element: ring, stopEvent: false });
      selectedOverlayRef.current = overlay;
      mapInstanceRef.current.addOverlay(overlay);

      mapInstanceRef.current.getView().animate({ center: coord, zoom: 13, duration: 600 });
    };
    update();
  }, [selectedProject]);

  // ---- Geolocation ----
  const handleShowLocation = async () => {
    if (!navigator.geolocation) { toast.error('Tarayıcınız konum özelliğini desteklemiyor.'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserCoords({ lat, lng });
        setIsLocating(false);
        if (!mapInstanceRef.current) return;

        const { fromLonLat } = await import('ol/proj');
        const { default: Overlay } = await import('ol/Overlay');
        const coord = fromLonLat([lng, lat]);

        if (locationOverlayRef.current) mapInstanceRef.current.removeOverlay(locationOverlayRef.current);

        if (!document.getElementById('ol-location-pulse-style')) {
          const s = document.createElement('style');
          s.id = 'ol-location-pulse-style';
          s.textContent = `@keyframes ol-loc-pulse{0%{transform:translate(-50%,-50%) scale(0.4);opacity:0.9}100%{transform:translate(-50%,-50%) scale(3);opacity:0}}`;
          document.head.appendChild(s);
        }

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:relative;width:22px;height:22px;pointer-events:none;';
        const pulse = document.createElement('div');
        pulse.style.cssText = 'position:absolute;top:50%;left:50%;width:44px;height:44px;border-radius:50%;background:rgba(66,133,244,0.25);animation:ol-loc-pulse 1.8s ease-out infinite;';
        const dot = document.createElement('div');
        dot.style.cssText = 'width:22px;height:22px;border-radius:50%;background:#4285F4;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.30);';
        wrapper.appendChild(pulse);
        wrapper.appendChild(dot);

        const ov = new Overlay({ position: coord, positioning: 'center-center', element: wrapper, stopEvent: false });
        locationOverlayRef.current = ov;
        mapInstanceRef.current.addOverlay(ov);
        mapInstanceRef.current.getView().animate({ center: coord, zoom: 10, duration: 800 });
        toast.success('Konumunuz haritada gösterildi!');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1)      toast.error('Konum izni reddedildi.');
        else if (err.code === 2) toast.error('Konum alınamadı.');
        else                     toast.error('Zaman aşımı.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  const handleDirections = () => {
    if (!selectedProject?.location) { toast.error('Proje konumu bulunamadı.'); return; }
    const { lat, lng } = selectedProject.location;
    const url = userCoords
      ? `https://www.google.com/maps/dir/${userCoords.lat},${userCoords.lng}/${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      {/* Map container */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full rounded-xl overflow-hidden shadow-md"
          style={{ height: 'clamp(360px, 55vh, 600px)' }}
          data-testid="mega-projects-map"
        />
        {/* Floating locate button (top-right) */}
        <button
          onClick={handleShowLocation}
          disabled={isLocating}
          data-testid="locate-me-floating-btn"
          title="Konumumu Göster"
          className="absolute top-3 right-3 z-10 w-11 h-11 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-all border border-white/60 disabled:opacity-70"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.20)' }}
        >
          {isLocating
            ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            : <LocateFixed className="w-5 h-5 text-blue-600" />
          }
        </button>
      </div>

      {/* Bottom action buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={handleShowLocation}
          disabled={isLocating}
          data-testid="show-location-btn"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 font-semibold text-sm transition-colors border border-blue-200 disabled:opacity-60"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          {isLocating ? 'Konum Alınıyor...' : 'Konumumu Göster'}
        </button>
        {selectedProject?.location && (
          <button
            onClick={handleDirections}
            data-testid="directions-btn"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 font-semibold text-sm transition-colors border border-emerald-200"
          >
            <Navigation className="w-4 h-4" />
            Yol Tarifi Al
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Project card (list view)
// ============================================================
function ProjectCard({ project, isSelected, onClick }) {
  const color = getCatColor(project.category);
  return (
    <div
      onClick={onClick}
      data-testid={`project-card-${project.id}`}
      className={`cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md ${
        isSelected ? 'border-blue-400 shadow-md bg-blue-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {project.images?.[0] && (
        <img src={project.images[0]} alt={project.name} className="w-full h-36 object-cover rounded-xl mb-3" />
      )}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-bold text-slate-900 text-sm leading-tight">{project.name}</h3>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
          style={{ background: color }}
        >
          {project.category}
        </span>
      </div>
      {project.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{project.description}</p>
      )}
      {project.timeline && (
        <p className="text-[11px] text-slate-400 mt-1">{project.timeline}</p>
      )}
      {typeof project.progress_percentage === 'number' && project.progress_percentage > 0 && (
        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>İlerleme</span>
            <span className="font-bold text-slate-700">%{project.progress_percentage}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${project.progress_percentage}%`, background: color }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        {project.location && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <MapPin className="w-3 h-3" />
            {project.location.lat?.toFixed(3)}, {project.location.lng?.toFixed(3)}
          </span>
        )}
        <span className="text-[10px] text-blue-600 font-semibold ml-auto">Haritada Gör →</span>
      </div>
    </div>
  );
}

// ============================================================
// Selected project detail panel (sidebar / mobile card)
// ============================================================
function ProjectDetailPanel({ project, onClose, onDirections }) {
  if (!project) return null;
  const color = getCatColor(project.category);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
      data-testid="project-detail-panel"
    >
      {project.images?.[0] && (
        <img src={project.images[0]} alt={project.name} className="w-full h-44 object-cover" />
      )}
      {!project.images?.[0] && (
        <div className="w-full h-16 flex items-center justify-center" style={{ background: color + '22' }}>
          <MapPin className="w-8 h-8 opacity-40" style={{ color }} />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-slate-900 text-base leading-tight">{project.name}</h2>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: color }}
            >
              {project.category}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
        )}

        {project.timeline && (
          <div className="flex gap-2 text-sm">
            <span className="font-semibold text-slate-700 shrink-0">Zaman Çizelgesi:</span>
            <span className="text-slate-500">{project.timeline}</span>
          </div>
        )}

        {typeof project.progress_percentage === 'number' && project.progress_percentage > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>İnşaat İlerlemesi</span>
              <span className="font-bold text-slate-700">%{project.progress_percentage}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${project.progress_percentage}%`, background: color }}
              />
            </div>
          </div>
        )}

        {project.location && (
          <button
            onClick={onDirections}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm border border-emerald-200 transition-colors"
            data-testid="panel-directions-btn"
          >
            <Navigation className="w-4 h-4" />
            Yol Tarifi Al
          </button>
        )}

        {project.from_projects && (
          <p className="text-[10px] text-center text-slate-400">TOKİ e-Konut koleksiyonundan</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Category legend
// ============================================================
function MapLegend({ categories }) {
  if (!categories.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => (
        <span
          key={cat}
          className="flex items-center gap-1.5 text-xs text-slate-600 bg-white/95 px-2.5 py-1 rounded-full border border-slate-200 shadow-sm"
        >
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getCatColor(cat) }} />
          {cat}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function MegaProjectsPage() {
  const navigate = useNavigate();
  useSEO('mega-projects', { title: 'Mega Projeler Haritası | mrxakademi' });
  const [projects, setProjects]           = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [viewMode, setViewMode]           = useState('map'); // 'map' | 'list'
  const [filterCat, setFilterCat]         = useState('all');

  useEffect(() => {
    api.get('/mega-projects')
      .then(({ data }) => {
        setProjects(data);
        if (data.length > 0) setSelectedProject(data[0]);
      })
      .catch(() => toast.error('Projeler yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(projects.map(p => p.category).filter(Boolean))];
  const filtered   = filterCat === 'all' ? projects : projects.filter(p => p.category === filterCat);

  const handleDirections = () => {
    if (!selectedProject?.location) { toast.error('Konum bulunamadı.'); return; }
    const { lat, lng } = selectedProject.location;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      '_blank'
    );
  };

  const handleCardClick = (project) => {
    setSelectedProject(project);
    setViewMode('map');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ---- Header ---- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost" size="sm"
            onClick={() => navigate('/')}
            data-testid="back-button"
            className="rounded-full w-9 h-9 p-0 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-base font-bold text-slate-900 truncate">Mega Proje Haritası</h1>
            {!loading && projects.length > 0 && (
              <Badge className="bg-slate-100 text-slate-600 text-xs shrink-0">{projects.length}</Badge>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 shrink-0">
            <button
              onClick={() => setViewMode('map')}
              data-testid="view-map-btn"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-white shadow text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Harita</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              data-testid="view-list-btn"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white shadow text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---- Content ---- */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="max-w-xl mx-auto p-8 text-center mt-20">
          <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-500 mb-2">Henüz mega proje eklenmemiş</p>
          <p className="text-sm text-slate-400">Admin panelinden proje ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-4 md:p-5 space-y-4">

          {/* Category filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                data-testid={`filter-${cat}`}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  filterCat === cat && cat === 'all'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : filterCat === cat
                      ? 'text-white border-transparent'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                style={
                  filterCat === cat && cat !== 'all'
                    ? { background: getCatColor(cat), borderColor: getCatColor(cat) }
                    : {}
                }
              >
                {cat === 'all' ? `Tümü (${projects.length})` : `${cat} (${projects.filter(p => p.category === cat).length})`}
              </button>
            ))}
          </div>

          {/* ===== MAP VIEW ===== */}
          {viewMode === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Map col */}
              <div className="lg:col-span-2 space-y-3">
                <OLMegaMap
                  projects={filtered}
                  selectedProject={selectedProject}
                  onSelectProject={setSelectedProject}
                />
                <MapLegend categories={categories.filter(c => c !== 'all')} />
              </div>

              {/* Detail panel — desktop sidebar */}
              <div className="hidden lg:block">
                {selectedProject ? (
                  <div className="sticky top-24">
                    <ProjectDetailPanel
                      project={selectedProject}
                      onClose={() => setSelectedProject(null)}
                      onDirections={handleDirections}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 h-48">
                    <MapPin className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">Haritada bir projeye tıklayın</p>
                  </div>
                )}
              </div>

              {/* Detail panel — mobile (appears below map) */}
              {selectedProject && (
                <div className="lg:hidden">
                  <ProjectDetailPanel
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onDirections={handleDirections}
                  />
                </div>
              )}
            </div>
          )}

          {/* ===== LIST VIEW ===== */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isSelected={selectedProject?.id === project.id}
                  onClick={() => handleCardClick(project)}
                />
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
