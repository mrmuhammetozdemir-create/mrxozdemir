import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Target, MapPin } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

export default function OpportunitiesPage() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const { data } = await api.get('/opportunities');
      setOpportunities(data);
    } catch (error) {
      toast.error('Fırsatlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score <= 3) return 'bg-green-100 text-green-700';
    if (score <= 7) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getPotentialColor = (potential) => {
    if (potential === 'yüksek') return 'text-green-600';
    if (potential === 'orta') return 'text-yellow-600';
    return 'text-slate-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Arsa Fırsatları</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="text-center py-12 text-slate-600">Yükleniyor...</div>
        ) : opportunities.length === 0 ? (
          <Card className="p-12 text-center border-slate-200">
            <p className="text-slate-600">Henüz fırsat eklenmemiş</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="p-6 border-slate-200 hover:shadow-lg transition-shadow" data-testid={`opportunity-card-${opp.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-slate-900">{opp.location}</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(opp.risk_score)}`}>
                    Risk: {opp.risk_score}/10
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-slate-500">Parsel Büyüklüğü</p>
                    <p className="text-base font-medium text-slate-900">{opp.parcel_size_sqm} m²</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">İmar Durumu</p>
                    <p className="text-base font-medium text-slate-900">{opp.zoning_type}</p>
                  </div>
                  {opp.price_per_sqm && (
                    <div>
                      <p className="text-sm text-slate-500">m² Fiyatı</p>
                      <p className="text-base font-medium text-slate-900">
                        {opp.price_per_sqm.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">Yatırım Potansiyeli</p>
                    <p className={`text-base font-semibold ${getPotentialColor(opp.investment_potential)}`}>
                      {opp.investment_potential.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Gelişim Potansiyeli</p>
                    <p className="text-sm text-slate-700">{opp.development_potential}</p>
                  </div>
                </div>

                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700" data-testid={`view-opportunity-${opp.id}`}>
                  Detayları Gör
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
