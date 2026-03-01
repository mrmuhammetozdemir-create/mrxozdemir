import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Building2, Map, Calculator, MapPin, GraduationCap, Users, TrendingUp, Target, Shield, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const topModules = [
  {
    id: 'toki',
    title: 'e-TOKİ',
    subtitle: 'Gerçek Zamanlı Konut Piyasası Analizleri',
    icon: Building2,
    color: 'bg-blue-500',
    path: '/toki',
    testId: 'module-toki'
  },
  {
    id: 'land',
    title: 'e-İPAT',
    subtitle: 'Arazi Parsel Veri Erişimi',
    icon: Map,
    color: 'bg-green-600',
    path: '/land',
    testId: 'module-land'
  },
  {
    id: 'investment',
    title: 'Investment Simulator',
    subtitle: 'Proje ROI Tahmini',
    icon: Calculator,
    color: 'bg-amber-500',
    path: '/investment',
    testId: 'module-investment'
  },
  {
    id: 'mega',
    title: 'Mega Project Map',
    subtitle: 'Altyapı Öngörüleri',
    icon: MapPin,
    color: 'bg-cyan-500',
    path: '/mega-projects',
    testId: 'module-mega'
  },
  {
    id: 'education',
    title: 'Real Estate Education',
    subtitle: 'Küratörlü PropTech Kursları',
    icon: GraduationCap,
    color: 'bg-teal-600',
    path: '/education',
    testId: 'module-education'
  },
];

const featureCards = [
  {
    id: 'toki',
    title: 'e-TOKİ',
    subtitle: 'Öğren: Fiyat Trendleri Nasıl Oluşur?',
    description: 'Gerçek Zamanlı Konut Piyasası Analizleri',
    image: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/734282e01767374da9bc679f601f445092a7881c4b10dacf1c3d8a95df28ace5.png',
    bgColor: 'from-blue-600 to-blue-700',
    path: '/toki',
    testId: 'feature-toki'
  },
  {
    id: 'land',
    title: 'e-İPAT',
    subtitle: 'e-İPAT | İmarPlan...',
    description: 'Arazi Parsel Veri Erişimi',
    image: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/7edec0cb91fb852c91fb6400497a6ee104913e28c06a9628ce096af48303cb6a.png',
    bgColor: 'from-emerald-600 to-teal-700',
    path: '/land',
    testId: 'feature-land'
  },
  {
    id: 'investment',
    title: 'Investment Simulator',
    subtitle: 'Keşfet: ROI Nasıl Hesaplanır?',
    description: 'Proje ROI Tahmini',
    image: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/b2c4ff22b8c574ea1d3f66cf1b9ebc0468da47b29dbe1249cc02040edbf75b1c.png',
    bgColor: 'from-slate-300 to-slate-400',
    path: '/investment',
    testId: 'feature-investment'
  },
  {
    id: 'mega',
    title: 'Mega Project Map',
    subtitle: '',
    description: 'Altyapı Öngörüleri',
    image: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/eab64624fef67dada87f9740213e291d5137a4ed123bfd3116d641cc04a2639c.png',
    bgColor: 'from-slate-400 to-slate-500',
    path: '/mega-projects',
    testId: 'feature-mega'
  },
  {
    id: 'education',
    title: 'Gayrimenkul Eğitim Merkezi',
    subtitle: 'Sertifikalı PropTech Kursları',
    description: 'Ders İçeriklerimizi Yatırımlarınızı Hemen İzle',
    image: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/86dedebcca4ac76d1db0aed111fca43e1825812d80d254ca59d8f6e6cc54edfd.png',
    bgColor: 'from-amber-500 via-yellow-600 to-teal-600',
    path: '/education',
    testId: 'feature-education',
    hasButton: true
  },
];

export default function DashboardPage({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Çıkış başarılı');
    navigate('/');
  };

  const handleModuleClick = (path) => {
    if (!user) {
      toast.error('Bu modülü kullanmak için giriş yapmalısınız');
      navigate('/login');
    } else {
      navigate(path);
    }
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
              <p className="text-xs text-slate-500">
                {user ? `Hoş geldiniz, ${user.full_name}` : 'Gayrimenkul ve Arsa Yatırım Platformu'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
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
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="login-header-button"
                >
                  Giriş Yap
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                  data-testid="register-header-button"
                >
                  Kayıt Ol
                </Button>
              </>
            )}
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
                onClick={() => handleModuleClick(module.path)}
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
