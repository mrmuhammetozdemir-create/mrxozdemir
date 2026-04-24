import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Building2, Map, Calculator, MapPin, GraduationCap,
  Users, Target, BarChart3, BookOpen, LogIn, LogOut,
  Settings, ChevronRight, ArrowRight, ExternalLink, Zap,
  Grid3X3, Star, TrendingUp, Home, Calendar
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

// ─── All apps ─────────────────────────────────────────────────────────────────
const FEATURED = [
  {
    id: 'toki', title: 'e-Konut', subtitle: 'Toplu Konut & Proje Analiz',
    description: 'TOKİ projelerini, konut gelişimlerini ve fiyat trendlerini gerçek zamanlı verilerle analiz edin. Bölgesel kıyaslama ve detaylı rapor imkânı.',
    icon: Building2, path: '/toki',
    badge: 'Fiyat Trendleri', badgeColor: 'bg-blue-600',
    gradient: 'from-blue-600 to-blue-900', accent: '#3b82f6',
    testId: 'app-toki',
    img: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/734282e01767374da9bc679f601f445092a7881c4b10dacf1c3d8a95df28ace5.png',
    features: ['Proje bazlı analiz', 'Fiyat takibi', 'Bölgesel kıyaslama'],
  },
  {
    id: 'land', title: 'e-İPAT', subtitle: 'Arazi Parsel Veri Erişimi',
    description: 'İmar planları, kadastro verileri ve parsel analizleri ile Türkiye\'nin en kapsamlı gayrimenkul veri platformuna erişin.',
    icon: Map, path: 'https://e-ipat.com', external: true,
    badge: 'İmar Planı', badgeColor: 'bg-teal-600',
    gradient: 'from-teal-600 to-teal-900', accent: '#0d9488',
    testId: 'app-land',
    img: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/7edec0cb91fb852c91fb6400497a6ee104913e28c06a9628ce096af48303cb6a.png',
    features: ['Kadastro verisi', 'Parsel analizi', 'İmar durumu'],
  },
  {
    id: 'deger-artis', title: 'Değer Artış Hesaplama', subtitle: 'Ev Satış Vergisi Hesaplayıcı',
    description: 'Gayrimenkul satışında ödeyeceğiniz değer artış kazancı vergisini Yİ-ÜFE endeksli olarak anında hesaplayın. 2026 güncel vergi dilimleri.',
    icon: Calculator, path: '/deger-artis-hesaplama',
    badge: 'Hesapla', badgeColor: 'bg-orange-600',
    gradient: 'from-orange-600 to-amber-700', accent: '#ea580c',
    testId: 'app-deger-artis',
    img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
    features: ['2026 Güncel Vergi', 'Yİ-ÜFE Endeksli', 'PDF Rapor'],
  },
  {
    id: 'investment', title: 'Yatırım Simülatörü', subtitle: 'Proje ROI Tahmini',
    description: 'Yatırım geri dönüşünüzü hesaplayın, risk analizi yapın ve portföy optimizasyonunu gerçek verilerle keşfedin.',
    icon: Calculator, path: '/investment',
    badge: 'ROI Hesapla', badgeColor: 'bg-amber-600',
    gradient: 'from-slate-600 to-slate-900', accent: '#64748b',
    testId: 'app-investment',
    img: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/b2c4ff22b8c574ea1d3f66cf1b9ebc0468da47b29dbe1249cc02040edbf75b1c.png',
    features: ['ROI simülasyonu', 'Risk puanlama', 'Portföy analizi'],
  },
  {
    id: 'mega', title: 'Mega Projeler Haritası', subtitle: 'Altyapı Öngörüleri',
    description: 'Kanal İstanbul, yeni havalimanları, köprüler ve büyük altyapı projelerinin güzergahlarını interaktif haritada keşfedin.',
    icon: MapPin, path: '/mega-projects',
    badge: 'Canlı Harita', badgeColor: 'bg-cyan-600',
    gradient: 'from-slate-500 to-slate-800', accent: '#0891b2',
    testId: 'app-mega',
    img: 'https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/eab64624fef67dada87f9740213e291d5137a4ed123bfd3116d641cc04a2639c.png',
    features: ['Güzergah haritası', 'Proje detayları', 'Etki analizi'],
  },
  {
    id: 'arsa-zirvesi', title: 'Arsa Yatırım Zirvesi 2026', subtitle: 'Etkinlik & Konferans',
    description: 'Türkiye\'nin en büyük arsa yatırım zirvesinde buluşun. Uzman konuşmacılar, yatırım fırsatları ve sektörün liderleriyle networking imkânı.',
    icon: Calendar, path: 'https://arsayatirimzirvesi.com', external: true,
    badge: '21 Mayıs 2026', badgeColor: 'bg-green-600',
    gradient: 'from-blue-900 to-indigo-950', accent: '#1e3a8a',
    testId: 'app-arsa-zirvesi',
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop',
    features: ['21 Mayıs 2026', 'Uzman Konuşmacılar', 'Networking'],
  },
];

const SECONDARY = [
  {
    id: 'education', title: 'Eğitim Merkezi', subtitle: 'mrxakademi',
    description: 'Sertifikalı kurslar ve haftalık canlı eğitimler.',
    icon: GraduationCap, path: '/education',
    color: 'from-amber-500 to-orange-600', iconBg: '#f59e0b', testId: 'app-education',
  },
  {
    id: 'community', title: 'Topluluk', subtitle: 'Forum & Tartışma',
    description: 'Yatırımcıların buluşma noktası.',
    icon: Users, path: '/community',
    color: 'from-purple-600 to-purple-800', iconBg: '#9333ea', testId: 'app-community',
  },
  {
    id: 'opportunities', title: 'Arsa Fırsatları', subtitle: 'Yatırım Listesi',
    description: 'Öne çıkan arsa ve gayrimenkul fırsatları.',
    icon: Target, path: '/opportunities',
    color: 'from-red-600 to-red-800', iconBg: '#dc2626', testId: 'app-opportunities',
  },
  {
    id: 'market', title: 'Piyasa Analizi', subtitle: 'Trend & İstatistik',
    description: 'Gayrimenkul piyasası verileri ve trend analizleri.',
    icon: BarChart3, path: '/market',
    color: 'from-emerald-600 to-teal-700', iconBg: '#059669', testId: 'app-market',
  },
];

// ─── Logo ──────────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div className="relative w-8 h-8 rounded-xl overflow-hidden shrink-0" style={{ background: 'linear-gradient(145deg, #0f172a, #162032)' }}>
      <div className="absolute top-0 left-0 right-0 h-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.18), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] pb-[2px] px-[4px]">
        <div style={{ width: '4px', height: '8px', background: '#334155', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: '5px', height: '14px', background: '#f8fafc', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: '6px', height: '18px', background: '#10b981', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: '5px', height: '11px', background: '#f8fafc', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: '3px', height: '6px', background: '#334155', borderRadius: '2px 2px 0 0' }} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500" />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function UygulamalarPage() {
  const navigate = useNavigate();
  const [appUser, setAppUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('app_user');
    if (stored) {
      try { setAppUser(JSON.parse(stored)); }
      catch (e) { console.warn('app_user parse error:', e); localStorage.removeItem('app_user'); }
    }
    // Admin auth check via cookie (httpOnly)
    api.get('/auth/me', { withCredentials: true })
      .then(({ data }) => { if (data.user?.role === 'admin') setAdminUser(data.user); })
      .catch(() => {});
  }, []);

  const go = async (path, external) => {
    if (!external) return navigate(path);
    if (appUser) {
      try {
        const { data } = await api.post('/auth/cross-site-token', {}, { withCredentials: true });
        if (data.token) { window.open(`${path}?cst=${data.token}`, '_blank'); return; }
      } catch (e) {
        console.warn('Cross-site token failed, opening without SSO:', e?.message);
      }
    }
    window.open(path, '_blank');
  };

  const handleLogout = () => {
    api.post('/auth/logout', {}, { withCredentials: true }).catch(() => {});
    localStorage.removeItem('app_user');
    setAppUser(null); setAdminUser(null);
    toast.success('Çıkış yapıldı');
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F0E8', fontFamily: "'Manrope', system-ui, sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-10 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
            <LogoMark />
            <div className="leading-none hidden sm:block">
              <div style={{ fontFamily: "'Outfit', sans-serif" }}>
                <span className="text-base font-black tracking-tight text-slate-900">mrx</span>
                <span className="text-base font-extralight tracking-wide text-slate-500">ozdemir</span>
              </div>
            </div>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500 flex-1 justify-center">
            <button onClick={() => navigate('/')} className="hover:text-slate-800 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Ana Sayfa
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Grid3X3 className="w-3.5 h-3.5 text-emerald-600" /> Uygulamalar
            </span>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2 shrink-0">
            {(adminUser || appUser) ? (
              <>
                {adminUser && (
                  <button onClick={() => navigate('/admin')} data-testid="header-admin-btn"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all">
                    <Settings className="w-3.5 h-3.5" /> Yönetim
                  </button>
                )}
                {appUser && (
                  <button onClick={() => navigate('/panel')} data-testid="header-panel-btn"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
                    Panelim
                  </button>
                )}
                <button onClick={handleLogout} data-testid="header-logout-btn"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/auth')} data-testid="header-login-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-slate-200 text-slate-700 hover:border-slate-400 transition-all">
                <LogIn className="w-3.5 h-3.5" /> Giriş Yap
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── PAGE HERO ───────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e2d3d 50%, #0f3a28 100%)' }} className="relative overflow-hidden py-14 lg:py-16">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A96A 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#10b981', transform: 'translate(20%, -20%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Tüm Araçlar</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-3" style={{ letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif" }}>
              Uygulamalar
            </h1>
            <p className="text-[15px] text-slate-400 max-w-xl leading-relaxed">
              Gayrimenkul yatırımı için ihtiyacınız olan tüm analiz ve eğitim araçları — tek platformda.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: `${FEATURED.length + SECONDARY.length} Uygulama`, icon: Grid3X3, color: 'text-emerald-400' },
              { label: 'Gerçek Zamanlı Veri', icon: TrendingUp, color: 'text-blue-400' },
              { label: 'Türkiye Geneli', icon: MapPin, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 rounded-xl px-4 py-2 border"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <span className="text-xs font-semibold text-slate-300">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-10 py-12 lg:py-16 space-y-12">

        {/* ── ANA UYGULAMALAR ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-7">
            <div className="w-1 h-8 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Temel Araçlar</p>
              <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Ana Uygulamalar</h2>
            </div>
            <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{FEATURED.length} uygulama</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURED.map(app => (
              <div
                key={app.id}
                onClick={() => go(app.path, app.external)}
                data-testid={app.testId}
                className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                style={{ minHeight: '260px' }}
              >
                {/* BG gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient}`} />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="relative p-7 h-full flex flex-col">
                  {/* Top */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                          <app.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">{app.title}</h3>
                          <p className="text-xs text-white/55">{app.subtitle}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {app.external && <ExternalLink className="w-3.5 h-3.5 text-white/40" />}
                      <span className={`${app.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>{app.badge}</span>
                    </div>
                  </div>

                  <p className="text-sm text-white/65 leading-relaxed mb-5 max-w-xs">{app.description}</p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {app.features.map(f => (
                      <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white/70 border border-white/15">{f}</span>
                    ))}
                  </div>

                  {/* Bottom */}
                  <div className="flex items-end justify-between mt-auto">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-white/25 hover:bg-white/15 transition-all group-hover:border-white/50">
                      Uygulamaya Git <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <img src={app.img} alt={app.title}
                      className="w-36 h-28 object-contain opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Hover bottom accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${app.accent}, transparent)` }} />
              </div>
            ))}
          </div>
        </section>

        {/* ── EK UYGULAMALAR ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-7">
            <div className="w-1 h-8 rounded-full bg-amber-500" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Platformun Tamamı</p>
              <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Ek Uygulamalar</h2>
            </div>
            <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{SECONDARY.length} uygulama</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SECONDARY.map(app => (
              <div
                key={app.id}
                onClick={() => go(app.path)}
                data-testid={app.testId}
                className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 border border-slate-100 hover:border-transparent transition-all duration-300"
              >
                {/* Top color bar */}
                <div className={`h-1.5 bg-gradient-to-r ${app.color}`} />
                <div className="p-5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                    style={{ background: `${app.iconBg}15` }}>
                    <app.icon className="w-5 h-5" style={{ color: app.iconBg }} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-0.5">{app.title}</h3>
                  <p className="text-[11px] font-semibold text-slate-400 mb-3">{app.subtitle}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-5">{app.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-700 transition-colors flex items-center gap-1">
                      Açmak için tıkla <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BAND ────────────────────────────────────────────── */}
        <section>
          <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a, #0f3a28)' }}>
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A96A 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            <div className="relative px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/25 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tüm araçlara tam erişim sağlayın</h3>
                  <p className="text-sm text-slate-400">Üyelik ile sınırsız analiz yapın, sertifika alın, topluluğa katılın.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 flex-shrink-0">
                <button
                  onClick={() => navigate('/education', { state: { from: '/panel' } })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border border-white/25 hover:bg-white/10 transition-all"
                >
                  <BookOpen className="w-4 h-4" /> Eğitim Merkezi
                </button>
                <button
                  onClick={() => navigate(appUser ? '/panel' : '/auth', { state: { from: '/panel' } })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
                  data-testid="uygulamalar-cta-btn"
                >
                  {appUser ? 'Panelime Git' : 'Ücretsiz Kayıt Ol'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-4">
        <div className="max-w-7xl mx-auto px-4 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-sm font-bold text-slate-700">mrxozdemir</span>
          </div>
          <p className="text-xs text-slate-400">© 2025 mrxozdemir. Tüm hakları saklıdır.</p>
          <button onClick={() => navigate('/')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" /> Ana Sayfaya Dön
          </button>
        </div>
      </footer>

    </div>
  );
}
