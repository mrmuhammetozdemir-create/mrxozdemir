import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Building2, MapPin, Info, TrendingUp } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import LoginRequiredModal from '@/components/LoginRequiredModal';

const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale',
  'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye',
  'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
];

const ISTANBUL_DISTRICTS = [
  'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy',
  'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece',
  'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa',
  'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik',
  'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli',
  'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'
];

export default function TOKISearchPage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [allProjectNames, setAllProjectNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isLoggedIn = () => !!(localStorage.getItem('app_user') || localStorage.getItem('admin_token'));

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/toki/projects');
      setProjects(data);
      const uniqueNames = [...new Set(data.map(p => p.project_name))];
      setAllProjectNames(uniqueNames);
    } catch (error) {
      toast.error('Projeler yüklenemedi');
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
      if (projectName) params.append('project_name', projectName);
      const { data } = await api.get(`/toki/projects?${params}`);
      setProjects(data);
    } catch (error) {
      toast.error('Arama başarısız');
    } finally {
      setLoading(false);
    }
  };

  const getProjectPath = (project) => {
    return project.project_type ? `/project/${project.id}` : `/toki/${project.id}`;
  };

  const handleCityChange = (value) => {
    setCity(value);
    setDistrict('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} data-testid="back-button" className="hover:bg-slate-100 rounded-full w-9 h-9 p-0">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div className="flex items-center gap-3">
            {/* Professional e-Konut Logo Icon */}
            <div className="w-10 h-10 rounded-xl bg-[#1a3a6e] flex items-center justify-center shadow-md flex-shrink-0" style={{background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 10.5L12 3L21 10.5V21H15V15H9V21H3V10.5Z" fill="white" fillOpacity="0.95"/>
                <rect x="9.5" y="15.5" width="5" height="5" rx="0.5" fill="#2a5298"/>
                <path d="M6 19.5V17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M18 19.5V17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="19" cy="8" r="4" fill="#f97316"/>
                <path d="M17 8.5L18.5 10L21 7" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">e-Konut</h1>
              <p className="text-xs text-slate-500 leading-tight">Toplu Konut ve Proje Analiz Sistemi</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">Konut Projelerini Keşfet</h2>
              <p className="text-blue-100 text-sm md:text-base">Türkiye genelinde toplu konut ve yapı projelerini filtrele, incele, analiz et.</p>
            </div>
            <div className="flex gap-5 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-blue-200 text-xs">Proje</p>
              </div>
              <div className="w-px bg-blue-400/40" />
              <div className="text-center">
                <p className="text-2xl font-bold">81</p>
                <p className="text-blue-200 text-xs">İl</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search Card */}
        <Card className="p-5 border border-slate-200 shadow-md bg-white" data-testid="search-form">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Proje Ara</h2>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-slate-700 font-medium text-sm">İl</Label>
                <Select value={city} onValueChange={handleCityChange}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="city-select">
                    <SelectValue placeholder="İl seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TURKISH_CITIES.map((cityName) => (
                      <SelectItem key={cityName} value={cityName}>{cityName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="district" className="text-slate-700 font-medium text-sm">İlçe</Label>
                <Select value={district} onValueChange={setDistrict} disabled={!city}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="district-select">
                    <SelectValue placeholder={city ? "İlçe seçiniz" : "Önce il seçiniz"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {city === 'İstanbul' && ISTANBUL_DISTRICTS.map((districtName) => (
                      <SelectItem key={districtName} value={districtName}>{districtName}</SelectItem>
                    ))}
                    {city && city !== 'İstanbul' && (
                      <SelectItem value={city}>Tüm İlçeler</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="projectName" className="text-slate-700 font-medium text-sm">Proje Adı</Label>
                <Select value={projectName} onValueChange={setProjectName}>
                  <SelectTrigger className="mt-1.5 h-10" data-testid="project-name-select">
                    <SelectValue placeholder="Proje seçiniz" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {allProjectNames.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 h-10 rounded-lg shadow-sm" data-testid="search-button">
              <Search className="w-4 h-4 mr-2" />
              Proje Ara
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Projeler</h2>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{projects.length}</span>
          </div>
          
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-slate-500 text-sm">Projeler yükleniyor...</p>
            </div>
          ) : projects.length === 0 ? (
            <Card className="p-12 text-center border border-slate-200">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">Henüz proje bulunmuyor</p>
              <p className="text-slate-400 text-sm mt-1">Arama kriterlerinizi değiştirerek tekrar deneyin</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-blue-400 bg-white group"
                  onClick={() => navigate(getProjectPath(project))}
                  data-testid={`project-card-${project.id}`}
                >
                  {/* Card top accent */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 transition-colors" />
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
                        <Building2 className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                          {project.project_name}
                        </h3>
                        {project.project_type && (
                          <span className="inline-block mt-1 text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                            {project.project_type}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{project.city}{project.district ? ` / ${project.district}` : ''}</span>
                      </div>
                      {project.construction_status && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{project.construction_status}</span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white text-xs h-8 rounded-lg transition-colors font-medium">
                      Detayları İncele
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-0.5">Önemli Bilgilendirme</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Bu platform resmi bir kuruma bağlı değildir. Veriler; kamuya açık kaynaklar ve proje geliştiricilerinin paylaşımlarından derlenmektedir.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
