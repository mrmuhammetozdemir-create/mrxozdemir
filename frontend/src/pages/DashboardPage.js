import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Building2, Map, Calculator, MapPin, GraduationCap, Users, TrendingUp, Target, Shield } from 'lucide-react';
import { toast } from 'sonner';

const modules = [
  {
    id: 'toki',
    title: 'e-TOKİ',
    subtitle: 'TOKİ Proje Analizi',
    icon: Building2,
    color: 'bg-blue-500',
    path: '/toki',
    testId: 'module-toki'
  },
  {
    id: 'land',
    title: 'e-İPAT',
    subtitle: 'Arsa Parsel Analizi',
    icon: Map,
    color: 'bg-green-500',
    path: '/land',
    testId: 'module-land'
  },
  {
    id: 'investment',
    title: 'Yatırım Simülatörü',
    subtitle: 'ROI Hesaplama',
    icon: Calculator,
    color: 'bg-purple-500',
    path: '/investment',
    testId: 'module-investment'
  },
  {
    id: 'mega',
    title: 'Mega Proje Haritası',
    subtitle: 'Altın Koridorlar',
    icon: MapPin,
    color: 'bg-red-500',
    path: '/mega-projects',
    testId: 'module-mega'
  },
  {
    id: 'education',
    title: 'Eğitim Merkezi',
    subtitle: 'Kurslar & Seminerler',
    icon: GraduationCap,
    color: 'bg-amber-500',
    path: '/education',
    testId: 'module-education'
  },
  {
    id: 'community',
    title: 'Topluluk',
    subtitle: 'Tartışma & Paylaşım',
    icon: Users,
    color: 'bg-cyan-500',
    path: '/community',
    testId: 'module-community'
  },
  {
    id: 'opportunities',
    title: 'Arsa Fırsatları',
    subtitle: 'Analiz Edilmiş Arsalar',
    icon: Target,
    color: 'bg-emerald-600',
    path: '/opportunities',
    testId: 'module-opportunities'
  },
  {
    id: 'market',
    title: 'Piyasa Analizi',
    subtitle: 'Fiyat Trendleri',
    icon: TrendingUp,
    color: 'bg-indigo-500',
    path: '/market',
    testId: 'module-market'
  },
];

export default function DashboardPage({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Çıkış başarılı');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-['Manrope']">PropTech Turkey</h1>
              <p className="text-xs text-slate-500">Hoş geldiniz, {user.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="admin-panel-button"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </Button>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg" data-testid="banner">
          <h2 className="text-2xl font-bold mb-2 font-['Manrope']">PropTech Potansiyelini Açığa Çıkar</h2>
          <p className="text-indigo-100">Akıllı gayrimenkul yatırımı için araçlarımızı keşfedin.</p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                onClick={() => navigate(module.path)}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col items-center text-center"
                data-testid={module.testId}
              >
                <div className={`w-16 h-16 ${module.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1 font-['Manrope']">{module.title}</h3>
                <p className="text-sm text-slate-600">{module.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
