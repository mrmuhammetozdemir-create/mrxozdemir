import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Shield, Building2, Map, Target, GraduationCap, TrendingUp } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('toki');

  // TOKİ Project Form
  const [tokiForm, setTokiForm] = useState({
    project_name: '',
    city: '',
    district: '',
    region: '',
    description: '',
    construction_status: '',
    location: { lat: 41.0082, lng: 28.9784 },
    housing_details: {},
  });

  // Land Parcel Form
  const [landForm, setLandForm] = useState({
    city: '',
    district: '',
    neighborhood: '',
    ada: '',
    parsel: '',
    size_sqm: '',
    zoning_info: '',
    development_potential: '',
    location: { lat: 41.0082, lng: 28.9784 },
  });

  // Mega Project Form
  const [megaForm, setMegaForm] = useState({
    name: '',
    category: '',
    description: '',
    timeline: '',
    location: { lat: 41.0082, lng: 28.9784 },
  });

  const handleTokiSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/toki/projects', tokiForm);
      toast.success('TOKİ projesi oluşturuldu');
      setTokiForm({
        project_name: '',
        city: '',
        district: '',
        region: '',
        description: '',
        construction_status: '',
        location: { lat: 41.0082, lng: 28.9784 },
        housing_details: {},
      });
    } catch (error) {
      toast.error('Proje oluşturulamadı');
    }
  };

  const handleLandSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...landForm, size_sqm: parseFloat(landForm.size_sqm) };
      await api.post('/land/parcels', payload);
      toast.success('Arsa parseli oluşturuldu');
      setLandForm({
        city: '',
        district: '',
        neighborhood: '',
        ada: '',
        parsel: '',
        size_sqm: '',
        zoning_info: '',
        development_potential: '',
        location: { lat: 41.0082, lng: 28.9784 },
      });
    } catch (error) {
      toast.error('Parsel oluşturulamadı');
    }
  };

  const handleMegaSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mega-projects', megaForm);
      toast.success('Mega proje oluşturuldu');
      setMegaForm({
        name: '',
        category: '',
        description: '',
        timeline: '',
        location: { lat: 41.0082, lng: 28.9784 },
      });
    } catch (error) {
      toast.error('Mega proje oluşturulamadı');
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
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Admin Panel</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="toki" data-testid="tab-toki">
              <Building2 className="w-4 h-4 mr-2" />
              TOKİ Projesi
            </TabsTrigger>
            <TabsTrigger value="land" data-testid="tab-land">
              <Map className="w-4 h-4 mr-2" />
              Arsa Parseli
            </TabsTrigger>
            <TabsTrigger value="mega" data-testid="tab-mega">
              <Target className="w-4 h-4 mr-2" />
              Mega Proje
            </TabsTrigger>
          </TabsList>

          <TabsContent value="toki" className="mt-6">
            <Card className="p-6 border-slate-200">
              <h2 className="text-xl font-semibold mb-4 text-slate-900">Yeni TOKİ Projesi Ekle</h2>
              <form onSubmit={handleTokiSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project_name">Proje Adı</Label>
                    <Input
                      id="project_name"
                      value={tokiForm.project_name}
                      onChange={(e) => setTokiForm({ ...tokiForm, project_name: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="toki-project-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">İl</Label>
                    <Input
                      id="city"
                      value={tokiForm.city}
                      onChange={(e) => setTokiForm({ ...tokiForm, city: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="toki-city-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">İlçe</Label>
                    <Input
                      id="district"
                      value={tokiForm.district}
                      onChange={(e) => setTokiForm({ ...tokiForm, district: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="toki-district-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Bölge/Etap</Label>
                    <Input
                      id="region"
                      value={tokiForm.region}
                      onChange={(e) => setTokiForm({ ...tokiForm, region: e.target.value })}
                      className="mt-1.5"
                      data-testid="toki-region-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="construction_status">İnşaat Durumu</Label>
                    <Input
                      id="construction_status"
                      value={tokiForm.construction_status}
                      onChange={(e) => setTokiForm({ ...tokiForm, construction_status: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="toki-status-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={tokiForm.description}
                    onChange={(e) => setTokiForm({ ...tokiForm, description: e.target.value })}
                    required
                    rows={4}
                    className="mt-1.5"
                    data-testid="toki-description-input"
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto bg-blue-500 hover:bg-blue-600" data-testid="toki-submit-button">
                  Proje Ekle
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="land" className="mt-6">
            <Card className="p-6 border-slate-200">
              <h2 className="text-xl font-semibold mb-4 text-slate-900">Yeni Arsa Parseli Ekle</h2>
              <form onSubmit={handleLandSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="land_city">İl</Label>
                    <Input
                      id="land_city"
                      value={landForm.city}
                      onChange={(e) => setLandForm({ ...landForm, city: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="land-city-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="land_district">İlçe</Label>
                    <Input
                      id="land_district"
                      value={landForm.district}
                      onChange={(e) => setLandForm({ ...landForm, district: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="land-district-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Mahalle</Label>
                    <Input
                      id="neighborhood"
                      value={landForm.neighborhood}
                      onChange={(e) => setLandForm({ ...landForm, neighborhood: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="land-neighborhood-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ada">Ada</Label>
                    <Input
                      id="ada"
                      value={landForm.ada}
                      onChange={(e) => setLandForm({ ...landForm, ada: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="land-ada-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parsel">Parsel</Label>
                    <Input
                      id="parsel"
                      value={landForm.parsel}
                      onChange={(e) => setLandForm({ ...landForm, parsel: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="land-parsel-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="size_sqm">Büyüklük (m²)</Label>
                    <Input
                      id="size_sqm"
                      type="number"
                      step="0.01"
                      value={landForm.size_sqm}
                      onChange={(e) => setLandForm({ ...landForm, size_sqm: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="land-size-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zoning_info">İmar Durumu</Label>
                    <Input
                      id="zoning_info"
                      value={landForm.zoning_info}
                      onChange={(e) => setLandForm({ ...landForm, zoning_info: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="land-zoning-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="development_potential">Gelişim Potansiyeli</Label>
                    <Input
                      id="development_potential"
                      value={landForm.development_potential}
                      onChange={(e) => setLandForm({ ...landForm, development_potential: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="land-development-input"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto bg-green-500 hover:bg-green-600" data-testid="land-submit-button">
                  Parsel Ekle
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="mega" className="mt-6">
            <Card className="p-6 border-slate-200">
              <h2 className="text-xl font-semibold mb-4 text-slate-900">Yeni Mega Proje Ekle</h2>
              <form onSubmit={handleMegaSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mega_name">Proje Adı</Label>
                    <Input
                      id="mega_name"
                      value={megaForm.name}
                      onChange={(e) => setMegaForm({ ...megaForm, name: e.target.value })}
                      required
                      className="mt-1.5"
                      data-testid="mega-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      value={megaForm.category}
                      onChange={(e) => setMegaForm({ ...megaForm, category: e.target.value })}
                      placeholder="örn: köprü, metro, otoyol"
                      required
                      className="mt-1.5"
                      data-testid="mega-category-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeline">Zaman Çizelgesi</Label>
                    <Input
                      id="timeline"
                      value={megaForm.timeline}
                      onChange={(e) => setMegaForm({ ...megaForm, timeline: e.target.value })}
                      placeholder="örn: 2024-2026"
                      required
                      className="mt-1.5"
                      data-testid="mega-timeline-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="mega_description">Açıklama</Label>
                  <Textarea
                    id="mega_description"
                    value={megaForm.description}
                    onChange={(e) => setMegaForm({ ...megaForm, description: e.target.value })}
                    required
                    rows={4}
                    className="mt-1.5"
                    data-testid="mega-description-input"
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto bg-red-500 hover:bg-red-600" data-testid="mega-submit-button">
                  Mega Proje Ekle
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
