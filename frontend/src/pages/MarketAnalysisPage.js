import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, TrendingUp as TrendIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/utils/api';
import { toast } from 'sonner';

export default function MarketAnalysisPage() {
  const navigate = useNavigate();
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const { data } = await api.get('/market/data');
      setMarketData(data);
    } catch (error) {
      toast.error('Piyasa verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const chartData = marketData.map((item) => ({
    name: item.neighborhood,
    fiyat: item.avg_price_per_sqm,
    değişim: item.price_change_percentage,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <TrendIcon className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Piyasa Analizi</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-slate-600">Yükleniyor...</div>
        ) : marketData.length === 0 ? (
          <Card className="p-12 text-center border-slate-200">
            <p className="text-slate-600">Henüz piyasa verisi eklenmemiş</p>
          </Card>
        ) : (
          <>
            <Card className="p-6 border-slate-200" data-testid="price-chart">
              <h2 className="text-xl font-semibold mb-6 text-slate-900">Mahalle Bazında m² Fiyatları</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Line type="monotone" dataKey="fiyat" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketData.map((item) => (
                <Card key={item.id} className="p-6 border-slate-200" data-testid={`market-card-${item.id}`}>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">{item.neighborhood}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-500">İl / İlçe</p>
                      <p className="text-base font-medium text-slate-900">
                        {item.city} / {item.district}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Ortalama m² Fiyatı</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {item.avg_price_per_sqm.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Yıllık Değişim</p>
                      <p className={`text-xl font-semibold ${item.price_change_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.price_change_percentage > 0 ? '+' : ''}{item.price_change_percentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
