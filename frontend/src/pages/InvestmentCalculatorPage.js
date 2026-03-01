import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calculator as CalcIcon, TrendingUp } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

export default function InvestmentCalculatorPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    city: '',
    district: '',
    neighborhood: '',
    ada: '',
    parsel: '',
    land_size_sqm: '',
    emsal: '',
    construction_cost_per_sqm: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        land_size_sqm: parseFloat(formData.land_size_sqm),
        emsal: parseFloat(formData.emsal),
        construction_cost_per_sqm: parseFloat(formData.construction_cost_per_sqm),
      };
      const { data } = await api.post('/investment/calculate', payload);
      setResult(data);
      toast.success('Hesaplama tamamlandı');
    } catch (error) {
      toast.error('Hesaplama başarısız');
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
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
              <CalcIcon className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Yatırım Simülatörü</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="p-6 border-slate-200" data-testid="calculator-form">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Yatırım Bilgileri</h2>
            <form onSubmit={handleCalculate} className="space-y-4">
              <div>
                <Label htmlFor="city">İl</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} required className="mt-1.5" data-testid="city-input" />
              </div>
              <div>
                <Label htmlFor="district">İlçe</Label>
                <Input id="district" name="district" value={formData.district} onChange={handleChange} required className="mt-1.5" data-testid="district-input" />
              </div>
              <div>
                <Label htmlFor="neighborhood">Mahalle</Label>
                <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} required className="mt-1.5" data-testid="neighborhood-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ada">Ada</Label>
                  <Input id="ada" name="ada" value={formData.ada} onChange={handleChange} required className="mt-1.5" data-testid="ada-input" />
                </div>
                <div>
                  <Label htmlFor="parsel">Parsel</Label>
                  <Input id="parsel" name="parsel" value={formData.parsel} onChange={handleChange} required className="mt-1.5" data-testid="parsel-input" />
                </div>
              </div>
              <div>
                <Label htmlFor="land_size_sqm">Arsa Büyüklüğü (m²)</Label>
                <Input id="land_size_sqm" name="land_size_sqm" type="number" step="0.01" value={formData.land_size_sqm} onChange={handleChange} required className="mt-1.5" data-testid="land-size-input" />
              </div>
              <div>
                <Label htmlFor="emsal">Emsal / KAKS</Label>
                <Input id="emsal" name="emsal" type="number" step="0.01" value={formData.emsal} onChange={handleChange} required className="mt-1.5" data-testid="emsal-input" />
              </div>
              <div>
                <Label htmlFor="construction_cost_per_sqm">İnşaat Maliyeti (TL/m²)</Label>
                <Input id="construction_cost_per_sqm" name="construction_cost_per_sqm" type="number" step="0.01" value={formData.construction_cost_per_sqm} onChange={handleChange} required className="mt-1.5" data-testid="construction-cost-input" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-purple-500 hover:bg-purple-600" data-testid="calculate-button">
                <CalcIcon className="w-4 h-4 mr-2" />
                {loading ? 'Hesaplanıyor...' : 'Hesapla'}
              </Button>
            </form>
          </Card>

          {/* Results */}
          <Card className="p-6 border-slate-200 bg-gradient-to-br from-purple-50 to-white" data-testid="calculator-results">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Sonuçlar
            </h2>
            {!result ? (
              <p className="text-center text-slate-600 py-12">Hesaplama için formu doldurun</p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-purple-100">
                  <p className="text-sm text-slate-500 mb-1">Toplam İnşaat Alanı</p>
                  <p className="text-2xl font-bold text-slate-900">{result.total_construction_area.toLocaleString('tr-TR')} m²</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-purple-100">
                  <p className="text-sm text-slate-500 mb-1">Tahmini Daire Sayısı</p>
                  <p className="text-2xl font-bold text-slate-900">{result.estimated_apartments} adet</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-purple-100">
                  <p className="text-sm text-slate-500 mb-1">Toplam İnşaat Maliyeti</p>
                  <p className="text-2xl font-bold text-slate-900">{result.total_construction_cost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-purple-100">
                  <p className="text-sm text-slate-500 mb-1">Tahmini Proje Değeri</p>
                  <p className="text-2xl font-bold text-slate-900">{result.estimated_project_value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-purple-100">
                  <p className="text-sm text-slate-500 mb-1">Potansiyel Kar</p>
                  <p className="text-2xl font-bold text-green-600">{result.potential_profit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg">
                  <p className="text-sm text-purple-100 mb-1">Yatırım Getirisi (ROI)</p>
                  <p className="text-3xl font-bold text-white">%{result.roi_percentage}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
