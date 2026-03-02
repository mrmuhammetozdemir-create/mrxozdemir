import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Map, Calculator, MapPin, GraduationCap, ChevronDown } from 'lucide-react';

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleModuleClick = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">MRXTECH - Istanbul</span>
            <span className="text-sm text-slate-600">| Central Portfolio</span>
            <ChevronDown className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-amber-600 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
              MRX
            </div>
          </div>
        </div>
      </div>

      {/* Top Small Modules Row */}
      <div className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {topModules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  onClick={() => handleModuleClick(module.path)}
                  className="flex-shrink-0 w-24 cursor-pointer group"
                  data-testid={module.testId}
                >
                  <div className={`w-20 h-20 ${module.color} rounded-2xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-md`}>
                    <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 text-center leading-tight">{module.title}</p>
                  <p className="text-[10px] text-slate-600 text-center leading-tight mt-0.5">{module.subtitle}</p>
                </div>
              );
            })}
          </div>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center gap-1.5 mt-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentSlide ? 'w-6 bg-slate-700' : 'w-1.5 bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="px-4 mb-6">
        <div className="max-w-7xl mx-auto bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl px-6 py-4 text-white">
          <h2 className="text-xl font-bold mb-1 italic font-['Georgia']">PropTech Potansiyelini Açığa Çıkar</h2>
          <p className="text-sm text-slate-300">Akıllı gayrimenkul yatırımı için araçlarımızı keşfedin.</p>
        </div>
      </div>

      {/* Large Feature Cards */}
      <div className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* 2x2 Grid - First 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* e-TOKI Card */}
            <div
              onClick={() => handleModuleClick('/toki')}
              className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-all"
              data-testid="feature-toki"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700" />
              <div className="relative p-4 min-h-[200px] flex flex-col">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-2xl font-bold text-white drop-shadow-md">e-TOKİ</h3>
                  <div className="bg-white rounded-2xl px-2.5 py-1.5 shadow-sm">
                    <p className="text-[10px] font-medium text-slate-800 leading-tight">Öğren: Fiyat<br/>Trendleri<br/>Nasıl Oluşur?</p>
                  </div>
                </div>
                <p className="text-xs text-white/90 mb-2">Gerçek Zamanlı Konut Piyasası Analizleri</p>
                <div className="mt-auto">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/734282e01767374da9bc679f601f445092a7881c4b10dacf1c3d8a95df28ace5.png"
                    alt="e-TOKI"
                    className="w-full h-28 object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>

            {/* e-IPAT Card */}
            <div
              onClick={() => handleModuleClick('/land')}
              className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-all"
              data-testid="feature-land"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-700 to-teal-800" />
              <div className="relative p-4 min-h-[200px] flex flex-col">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-2xl font-bold text-white drop-shadow-md">e-İPAT</h3>
                  <div className="bg-white rounded-full p-2 shadow-sm">
                    <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-white/90 mb-2">e-İPAT | İmarPlan...</p>
                <div className="mt-auto">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/7edec0cb91fb852c91fb6400497a6ee104913e28c06a9628ce096af48303cb6a.png"
                    alt="e-IPAT"
                    className="w-full h-28 object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>

            {/* Investment Simulator Card */}
            <div
              onClick={() => handleModuleClick('/investment')}
              className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-all"
              data-testid="feature-investment"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400" />
              <div className="relative p-4 min-h-[200px] flex flex-col">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-2xl font-bold text-slate-900 drop-shadow-sm">Investment<br/>Simulator</h3>
                  <div className="bg-white rounded-2xl px-2.5 py-1.5 shadow-sm">
                    <p className="text-[10px] font-medium text-slate-800 leading-tight">Keşfet:<br/>ROI Nasıl<br/>Hesaplanır?</p>
                  </div>
                </div>
                <p className="text-xs text-slate-800 mb-2">Proje ROI Tahmini</p>
                <div className="mt-auto">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/b2c4ff22b8c574ea1d3f66cf1b9ebc0468da47b29dbe1249cc02040edbf75b1c.png"
                    alt="Investment Simulator"
                    className="w-full h-28 object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>

            {/* Mega Project Map Card */}
            <div
              onClick={() => handleModuleClick('/mega-projects')}
              className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-all"
              data-testid="feature-mega"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-500" />
              <div className="relative p-4 min-h-[200px] flex flex-col">
                <h3 className="text-2xl font-bold text-white drop-shadow-md mb-1">Mega Project Map</h3>
                <p className="text-xs text-white/90 mb-2">Altyapı Öngörüleri</p>
                <div className="mt-auto">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/eab64624fef67dada87f9740213e291d5137a4ed123bfd3116d641cc04a2639c.png"
                    alt="Mega Project Map"
                    className="w-full h-28 object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Education Card */}
          <div
            onClick={() => handleModuleClick('/education')}
            className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-all"
            data-testid="feature-education"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-600 to-teal-600" />
            <div className="relative p-4 min-h-[140px] flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 drop-shadow-sm mb-1">Gayrimenkul<br/>Eğitim Merkezi</h3>
                <p className="text-xs text-slate-800 mb-3">Sertifikalı PropTech Kursları</p>
                <Button 
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6 py-2 text-sm shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModuleClick('/education');
                  }}
                >
                  Başla
                </Button>
              </div>
              <div className="flex-shrink-0 ml-3">
                <img 
                  src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/86dedebcca4ac76d1db0aed111fca43e1825812d80d254ca59d8f6e6cc54edfd.png"
                  alt="Education"
                  className="w-36 h-28 object-contain drop-shadow-xl"
                />
              </div>
              <div className="absolute top-3 right-3 bg-teal-700 text-white text-[10px] px-2.5 py-1.5 rounded-full">
                Ders İçeriklerimizi<br/>Hemen İzle
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
