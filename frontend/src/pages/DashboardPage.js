import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Building2, Map, Calculator, MapPin, GraduationCap, LogIn, LogOut,
  Settings, BookOpen, UserCircle, ChevronRight, ArrowRight,
  TrendingUp, BarChart3, Globe, Shield, Grid3X3
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

// ─── Module data ──────────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'toki', title: 'e-Konut', subtitle: 'Toplu Konut & Proje Analiz',
    description: 'TOKİ projelerini, konut gelişimlerini ve fiyat trendlerini gerçek zamanlı verilerle analiz edin.',
    icon: Building2, path: '/toki',
    badge: 'Fiyat Trendleri',
    badgeColor: 'bg-blue-600',
    gradient: 'from-blue-600 to-blue-800',
    accent: '#3b82f6',
    testId: 'feature-toki',
    img: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/734282e01767374da9bc679f601f445092a7881c4b10dacf1c3d8a95df28ace5.png',
  },
  {
    id: 'land', title: 'e-İPAT', subtitle: 'Arazi Parsel Veri Erişimi',
    description: 'İmar planları, kadastro verileri ve parsel analizleri için kapsamlı gayrimenkul platformu.',
    icon: Map, path: 'https://e-ipat.com', external: true,
    badge: 'İmar Planı',
    badgeColor: 'bg-teal-600',
    gradient: 'from-teal-600 to-teal-900',
    accent: '#0d9488',
    testId: 'feature-land',
    img: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/7edec0cb91fb852c91fb6400497a6ee104913e28c06a9628ce096af48303cb6a.png',
  },
  {
    id: 'investment', title: 'Yatırım Simülatörü', subtitle: 'Proje ROI Tahmini',
    description: 'Yatırım geri dönüşünüzü hesaplayın, risk analizi yapın ve portföy optimizasyonunu keşfedin.',
    icon: Calculator, path: '/investment',
    badge: 'ROI Hesapla',
    badgeColor: 'bg-amber-600',
    gradient: 'from-slate-600 to-slate-800',
    accent: '#64748b',
    testId: 'feature-investment',
    img: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/b2c4ff22b8c574ea1d3f66cf1b9ebc0468da47b29dbe1249cc02040edbf75b1c.png',
  },
  {
    id: 'mega', title: 'Mega Projeler Haritası', subtitle: 'Altyapı Öngörüleri',
    description: 'Kanal İstanbul, yeni havalimanları, köprüler ve büyük altyapı projelerinin güzergahlarını keşfedin.',
    icon: MapPin, path: '/mega-projects',
    badge: 'Canlı Harita',
    badgeColor: 'bg-cyan-600',
    gradient: 'from-slate-500 to-slate-700',
    accent: '#0891b2',
    testId: 'feature-mega',
    img: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/eab64624fef67dada87f9740213e291d5137a4ed123bfd3116d641cc04a2639c.png',
  },
];

const STATS = [
  { value: '12.400+', label: 'Analiz Edilen Proje', icon: Building2 },
  { value: '2.300+', label: 'Aktif Kullanıcı', icon: UserCircle },
  { value: '48 il', label: 'Kapsama Alanı', icon: Globe },
  { value: '%98', label: 'Müşteri Memnuniyeti', icon: Shield },
];

// ─── Logo ────────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0" style={{ background: 'linear-gradient(145deg, #0f172a, #162032)' }}>
      <div className="absolute top-0 left-0 right-0 h-5" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.18), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] pb-[3px] px-[5px]">
        <div style={{ width: '5px', height: '10px', background: '#334155', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: '6px', height: '18px', background: '#f8fafc', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: '7px', height: '23px', background: '#10b981', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: '6px', height: '15px', background: '#f8fafc', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: '4px', height: '8px', background: '#334155', borderRadius: '2px 2px 0 0' }} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [appUser, setAppUser] = useState(null);

  useSEO('home', { title: 'mrxakademi | Türkiye PropTech Platformu' });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => { if (data.role === 'admin') setAdminUser(data); })
        .catch(() => localStorage.removeItem('admin_token'));
    }
    const stored = localStorage.getItem('app_user');
    if (stored) { try { setAppUser(JSON.parse(stored)); } catch {} }
  }, []);

  const handleAdminLogout = () => { localStorage.removeItem('admin_token'); setAdminUser(null); toast.success('Çıkış yapıldı'); };
  const handleUserLogout = () => {
    api.post('/auth/logout', {}, { withCredentials: true }).catch(() => {});
    localStorage.removeItem('app_user'); localStorage.removeItem('app_session_token');
    setAppUser(null); toast.success('Çıkış yapıldı');
  };

  const go = async (path, external) => {
    if (!external) return navigate(path);
    const sessionToken = localStorage.getItem('app_session_token');
    if (appUser && sessionToken) {
      try {
        const { data } = await api.post('/auth/cross-site-token', {}, { headers: { Authorization: `Bearer ${sessionToken}` } });
        if (data.token) { window.open(`${path}?cst=${data.token}`, '_blank'); return; }
      } catch {}
    }
    window.open(path, '_blank');
  };

  return (
    <div className="min-h-screen lg:min-h-0" style={{ background: '#F5F0E8', fontFamily: "'Manrope', system-ui, sans-serif" }}>

      {/* ── STICKY HEADER ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-10 h-12 lg:h-16 flex items-center justify-between gap-4 lg:gap-6">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 shrink-0">
            <LogoMark />
            <div className="leading-none">
              <div style={{ fontFamily: "'Outfit', sans-serif" }}>
                <span className="text-[17px] font-black tracking-tight text-slate-900">mrx</span>
                <span className="text-[17px] font-extralight tracking-wide text-slate-500">ozdemir</span>
              </div>
            </div>
          </button>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            <button
              onClick={() => navigate('/uygulamalar')}
              data-testid="nav-uygulamalar"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-all border border-emerald-200"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Uygulamalar
            </button>
            {MODULES.map(m => (
              <button
                key={m.id}
                onClick={() => go(m.path, m.external)}
                data-testid={`nav-${m.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                <m.icon className="w-3.5 h-3.5" />
                {m.title}
              </button>
            ))}
            <button
              onClick={() => go('/education')}
              data-testid="nav-education"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Eğitim Merkezi
            </button>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-2 shrink-0">
            {adminUser ? (
              <>
                <button onClick={() => navigate('/admin')} data-testid="admin-panel-btn"
                  className="flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all">
                  <Settings className="w-3.5 h-3.5" /><span className="hidden sm:inline">Yönetim Paneli</span><span className="sm:hidden">Panel</span>
                </button>
                <button onClick={handleAdminLogout} data-testid="dashboard-logout-btn"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : appUser ? (
              <>
                <span className="text-sm font-semibold text-slate-700 hidden sm:block truncate max-w-[120px]" data-testid="user-name-display">
                  {appUser.full_name || appUser.email}
                </span>
                <button onClick={() => navigate('/panel')} data-testid="user-panel-btn"
                  className="flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
                  Panelim
                </button>
                <button onClick={handleUserLogout} data-testid="user-logout-btn"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/auth')} data-testid="dashboard-login-btn"
                className="flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold border-2 border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all">
                <LogIn className="w-3.5 h-3.5" />Giriş Yap
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO — only desktop ───────────────────────────────────── */}
      <section
        className="hidden lg:block relative overflow-hidden py-28"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e2d3d 40%, #0f3a28 100%)' }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A96A 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#10b981' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: '#C8A96A', transform: 'translate(30%, 30%)' }} />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 border text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
                style={{ background: 'rgba(200,169,106,0.12)', borderColor: 'rgba(200,169,106,0.3)', color: '#C8A96A' }}>
                <TrendingUp className="w-3.5 h-3.5" /> Türkiye'nin PropTech Platformu
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] mb-6"
                style={{ letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif" }}>
                PropTech Potansiyelini{' '}
                <span style={{ color: '#C8A96A' }}>Açığa Çıkar</span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
                Akıllı gayrimenkul yatırımı için analiz araçları, piyasa verileri ve eğitim platformu tek çatı altında.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate(appUser ? '/panel' : '/auth')}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base text-white hover:scale-105 transition-all shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
                >
                  {appUser ? 'Panelime Git' : 'Hemen Başla'} <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => go('/education')}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base border border-white/20 text-white hover:bg-white/10 transition-all"
                >
                  <GraduationCap className="w-5 h-5" /> Eğitimlere Bak
                </button>
              </div>
            </div>

            {/* Right: Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map(s => (
                <div key={s.label}
                  className="rounded-2xl p-5 border"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <s.icon className="w-5 h-5 mb-3" style={{ color: '#C8A96A' }} />
                  <p className="text-3xl font-extrabold text-white leading-none mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{s.value}</p>
                  <p className="text-sm text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MOBILE: Tek ekran layout ──────────────────────────────── */}
      <section className="lg:hidden flex flex-col px-3 pt-3 pb-2" style={{ height: 'calc(100dvh - 48px)' }}>
        {/* Mini hero band */}
        <div className="rounded-2xl px-4 py-3 mb-3 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0f172a, #0f3a28)' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#C8A96A' }}>Türkiye PropTech</p>
            <h1 className="text-base font-extrabold text-white leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Gayrimenkul Analiz Platformu
            </h1>
          </div>
          <button
            onClick={() => navigate(appUser ? '/panel' : '/auth')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
          >
            {appUser ? 'Panelim' : 'Başla'} <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 2x2 module grid (4 modül) + Değer Artış + edu card */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* 2x2 grid - 4 ana modül */}
          <div className="flex-[3] grid grid-cols-2 gap-2 min-h-0">
            {MODULES.map(m => (
              <div
                key={m.id}
                onClick={() => go(m.path, m.external)}
                data-testid={m.testId}
                className="relative rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient}`} />
                <div className="relative p-3 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <m.icon className="w-4 h-4 text-white/80" strokeWidth={1.5} />
                        <h3 className="text-sm font-bold text-white leading-tight">{m.title}</h3>
                      </div>
                      <span className={`${m.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/60 leading-snug">{m.subtitle}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-[10px] font-semibold text-white/70 flex items-center gap-0.5">
                      Keşfet <ChevronRight className="w-3 h-3" />
                    </span>
                    <img src={m.img} alt={m.title} className="w-14 h-10 object-contain opacity-80" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alt satır: Değer Artış + Education yan yana */}
          <div className="flex-[2] grid grid-cols-2 gap-2 min-h-0">
            {/* Değer Artış */}
            <div
              onClick={() => go('/deger-artis-hesaplama')}
              data-testid="feature-deger-artis"
              className="relative rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-amber-700" />
              <div className="relative p-3 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-white/80" strokeWidth={1.5} />
                      <h3 className="text-sm font-bold text-white leading-tight">Değer Artış</h3>
                    </div>
                    <span className="bg-orange-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      Hesapla
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 leading-snug">Ev Satış Vergisi</p>
                </div>
                <button className="text-[10px] font-semibold text-white/70 flex items-center gap-0.5">
                  Keşfet <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Education card */}
            <div
              onClick={() => go('/education')}
              data-testid="feature-education"
              className="relative rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
            >
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706 40%, #0d9488)' }} />
              <div className="relative px-3 py-2.5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-md bg-white/25 flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white leading-tight">mrxakademi</h3>
                  </div>
                  <p className="text-[10px] text-white/70 leading-snug">Sertifikalı Eğitimler</p>
                </div>
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-900"
                  style={{ background: 'white' }}
                >
                  Başla <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESKTOP: Module Grid ───────────────────────────────────── */}
      <section className="hidden lg:block py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Section header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Analiz Araçları</p>
              <h2 className="text-4xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>
                Tüm Modüller
              </h2>
              <p className="text-slate-500 mt-2 text-base">Gayrimenkul yatırımı için ihtiyacınız olan her araç, tek platformda.</p>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <BarChart3 className="w-4 h-4 text-emerald-500" /> Gerçek zamanlı veri
            </div>
          </div>

          {/* Asimetrik Grid - Featured + Küçük Modüller */}
          <div className="space-y-6">
            {/* Üst: Featured (Büyük) + 2 Küçük */}
            <div className="grid grid-cols-3 gap-6" style={{ gridTemplateRows: 'auto auto' }}>
              {/* Sol: Değer Artış Hesaplama - Featured (Büyük, 2 satır) */}
              <div
                onClick={() => go('/deger-artis-hesaplama')}
                data-testid="feature-deger-artis"
                className="group relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-md row-span-2"
                style={{ minHeight: '420px' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700" />
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="relative p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center">
                        <Calculator className="w-7 h-7 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="bg-orange-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        2026 Güncel
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-3 leading-tight">
                      Değer Artış Kazancı<br />Vergisi Hesaplama
                    </h3>
                    <p className="text-white/80 text-base leading-relaxed mb-6">
                      Gayrimenkul satışında ödeyeceğiniz vergiyi Yİ-ÜFE endeksli olarak anında hesaplayın. 
                      Gelir vergisi dilimleri, istisna tutarları ve detaylı rapor.
                    </p>
                    <div className="space-y-2 text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                        <span>Yİ-ÜFE Endeksli Hesaplama</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                        <span>2026 Vergi Dilimleri</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                        <span>PDF Rapor İndir</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-orange-900 bg-white hover:bg-white/90 transition-all self-start">
                    Hesapla <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-amber-300 to-orange-300" />
              </div>

              {/* Sağ üst 2 modül (küçük) */}
              <div
                onClick={() => go(MODULES[0].path, MODULES[0].external)}
                data-testid={MODULES[0].testId}
                className="group relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-md"
                style={{ minHeight: '200px' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="relative p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight">e-Konut</h3>
                    </div>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shrink-0">
                      Fiyat Trendleri
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mb-2">Toplu Konut & Proje Analiz</p>
                  <div className="flex-1"></div>
                  <button className="flex items-center gap-1 text-sm font-bold text-white/90">
                    Keşfet <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-blue-400 to-transparent" />
              </div>

              <div
                onClick={() => go(MODULES[1].path, MODULES[1].external)}
                data-testid={MODULES[1].testId}
                className="group relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-md"
                style={{ minHeight: '200px' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-900" />
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="relative p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                        <Map className="w-4 h-4 text-white" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight">e-İPAT</h3>
                    </div>
                    <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shrink-0">
                      İmar Planı
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mb-2">Arazi Parsel Veri Erişimi</p>
                  <div className="flex-1"></div>
                  <button className="flex items-center gap-1 text-sm font-bold text-white/90">
                    Keşfet <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-teal-400 to-transparent" />
              </div>
            </div>

            {/* Alt: 2 Normal Kart */}
            <div className="grid grid-cols-2 gap-6">
              {MODULES.slice(2, 4).map(m => (
                <div
                  key={m.id}
                  onClick={() => go(m.path, m.external)}
                  data-testid={m.testId}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-md"
                  style={{ minHeight: '240px' }}
                >
                  <div className={'absolute inset-0 bg-gradient-to-br ' + m.gradient} />
                  <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                  <div className="relative p-7 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                            <m.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                          </div>
                          <h3 className="text-xl font-bold text-white leading-tight">{m.title}</h3>
                        </div>
                        <p className="text-sm text-white/60 ml-11">{m.subtitle}</p>
                      </div>
                      <span className={'text-white text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ' + m.badgeColor}>
                        {m.badge}
                      </span>
                    </div>

                    <p className="text-sm text-white/70 leading-relaxed mb-4">{m.description}</p>

                    <div className="flex-1 flex items-end justify-between">
                      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-white/25 hover:bg-white/15 transition-all group-hover:border-white/50">
                        Keşfet <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <img src={m.img} alt={m.title}
                        className="w-32 h-24 object-contain opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, ' + m.accent + ', transparent)' }} />
                </div>
              ))}
            </div>

            {/* En Alt: Education Card - Yatay, Geniş, Tek Başına */}
            <div
              onClick={() => go('/education')}
              data-testid="feature-education"
              className="relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-md"
              style={{ minHeight: '160px' }}
            >
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706 40%, #0d9488)' }} />
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              
              <div className="relative px-10 py-8 flex items-center justify-between h-full">
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        mrx<span className="text-teal-900">akademi</span>
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight mb-1">Gayrimenkul Yatırım Eğitim Merkezi</h3>
                    <p className="text-white/80">Sertifikalı Kurslar • Canlı Seminerler • Uzman Danışmanlık</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <img
                    src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/86dedebcca4ac76d1db0aed111fca43e1825812d80d254ca59d8f6e6cc54edfd.png"
                    alt="Eğitim" 
                    className="w-36 h-28 object-contain"
                  />
                  <button
                    onClick={e => { e.stopPropagation(); go('/education'); }}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-amber-900 bg-white hover:bg-white/90 transition-all shadow-lg"
                  >
                    Eğitimlere Başla <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── FOOTER — desktop only ─────────────────────────────────── */}
      <footer className="hidden lg:block border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif" }}>
                <span className="text-[15px] font-black text-slate-900">mrx</span>
                <span className="text-[15px] font-extralight text-slate-500">ozdemir</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-400">© 2025 mrxozdemir. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            {MODULES.map(m => (
              <button key={m.id} onClick={() => go(m.path, m.external)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors">
                {m.title}
              </button>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
