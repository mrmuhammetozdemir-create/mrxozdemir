import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Building2 } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">TOKİ Proje Analizi</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <Card className="p-6 border-slate-200" data-testid="search-form">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">İl</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Örn: İstanbul"
                  className="mt-1.5"
                  data-testid="city-input"
                />
              </div>
              <div>
                <Label htmlFor="district">İlçe</Label>
                <Input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Örn: Kadıköy"
                  className="mt-1.5"
                  data-testid="district-input"
                />
              </div>
              <div>
                <Label htmlFor="projectName">Proje Adı</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Proje adı girin"
                  className="mt-1.5"
                  data-testid="project-name-input"
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto bg-blue-500 hover:bg-blue-600" data-testid="search-button">
              <Search className="w-4 h-4 mr-2" />
              Ara
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Projeler ({projects.length})</h2>
          {loading ? (
            <div className="text-center py-12 text-slate-600">Yükleniyor...</div>
          ) : projects.length === 0 ? (
            <Card className="p-12 text-center border-slate-200">
              <p className="text-slate-600">Henüz proje bulunmuyor</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-slate-200"
                  onClick={() => navigate(`/toki/${project.id}`)}
                  data-testid={`project-card-${project.id}`}
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{project.project_name}</h3>
                  <p className="text-sm text-slate-600 mb-1">
                    <span className="font-medium">İl:</span> {project.city}
                  </p>
                  <p className="text-sm text-slate-600 mb-1">
                    <span className="font-medium">İlçe:</span> {project.district}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Durum:</span> {project.construction_status}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
