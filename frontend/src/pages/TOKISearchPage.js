import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Building2 } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/toki/projects');
      setProjects(data);
    } catch (error) {
      toast.error('Projeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
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

  const handleCityChange = (value) => {
    setCity(value);
    setDistrict('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="bg-white border-b-4 border-blue-600 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button" className="hover:bg-blue-50">
            <ArrowLeft className="w-5 h-5 text-blue-600" />
          </Button>
          <div className="flex items-center gap-4 flex-1">
            <img src="https://customer-assets.emergentagent.com/job_toki-analyzer/artifacts/ufdkg7dn_Toki_logo.png" alt="TOKİ Logo" className="h-16 w-auto" />
            <div className="border-l-2 border-blue-600 pl-4">
              <h1 className="text-2xl font-bold text-blue-700">TOKİ Proje Sorgulama</h1>
              <p className="text-sm text-green-600">T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Card className="p-6 border-2 border-blue-200 shadow-lg bg-white" data-testid="search-form">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-500">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center">
              <Search className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-blue-800">Proje Arama</h2>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-blue-700 font-semibold">İl</Label>
                <Select value={city} onValueChange={handleCityChange}>
                  <SelectTrigger className="mt-1.5 border-2 border-blue-200 focus:border-blue-500 h-11" data-testid="city-select">
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
                <Label htmlFor="district" className="text-blue-700 font-semibold">İlçe</Label>
                <Select value={district} onValueChange={setDistrict} disabled={!city}>
                  <SelectTrigger className="mt-1.5 border-2 border-blue-200 focus:border-blue-500 h-11" data-testid="district-select">
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
                <Label htmlFor="projectName" className="text-blue-700 font-semibold">Proje Adı</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Proje adı girin"
                  className="mt-1.5 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 h-11"
                  data-testid="project-name-input"
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-8 py-6 text-lg shadow-lg" data-testid="search-button">
              <Search className="w-5 h-5 mr-2" />
              Proje Ara
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-blue-800">Bulunan Projeler ({projects.length})</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-green-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-blue-600 font-semibold">Yükleniyor...</p>
            </div>
          ) : projects.length === 0 ? (
            <Card className="p-12 text-center border-2 border-blue-200 bg-blue-50">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-blue-700 font-semibold text-lg">Henüz proje bulunmuyor</p>
              <p className="text-blue-600 mt-2">Arama kriterlerinizi değiştirerek tekrar deneyin</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 cursor-pointer hover:shadow-xl transition-all border-2 border-blue-200 hover:border-green-500 bg-white group"
                  onClick={() => navigate(`/toki/${project.id}`)}
                  data-testid={`project-card-${project.id}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-800 group-hover:text-green-600 transition-colors line-clamp-2">
                        {project.project_name}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="space-y-2 bg-gradient-to-br from-blue-50 to-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">İL</span>
                      <span className="text-sm text-slate-700 font-medium">{project.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">İLÇE</span>
                      <span className="text-sm text-slate-700 font-medium">{project.district}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">DURUM</span>
                      <span className="text-sm text-slate-700 font-medium">{project.construction_status}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <Button className="w-full bg-blue-600 hover:bg-green-600 transition-colors text-white font-semibold">
                      Detayları Görüntüle
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
