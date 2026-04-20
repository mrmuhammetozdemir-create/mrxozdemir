import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, Users, Play, Video, MessageCircle,
  Zap, Calendar, ChevronRight, Mic, MapPin, BookOpen, Award, Lock,
  Wifi, Star, TrendingUp
} from 'lucide-react';
import api from '@/utils/api';
import SeminarRegistrationModal from '@/components/SeminarRegistrationModal';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const fileUrl = (p) => p ? `${BACKEND}/api/files/${p}` : null;

// ─── Static fallback data ────────────────────────────────────────────────────

const STATIC_SEMINARS = [
  { id: 's1', title: 'Arsa Yatırımına Giriş', description: 'Arsa yatırımının temellerini, başlangıç stratejilerini ve piyasa dinamiklerini öğrenin.', duration: '45 dk', speaker: 'Muhammet Özdemir', seminar_type: 'free', status: 'active' },
  { id: 's2', title: 'İmar Planı Nedir?', description: 'İmar planlarını nasıl okuyacağınızı ve değerlendireceğinizi adım adım öğrenin.', duration: '60 dk', speaker: 'Muhammet Özdemir', seminar_type: 'free', status: 'active' },
  { id: 's3', title: 'Arsa Alırken Nelere Dikkat Edilmeli?', description: 'Arsa satın alımında kritik kontrol noktaları, hukuki riskler ve uzman tavsiyeleri.', duration: '50 dk', speaker: 'Muhammet Özdemir', seminar_type: 'free', status: 'active' },
  { id: 's4', title: 'Yenişehir Bölgesi Genel Analizi', description: 'Yenişehir bölgesinin gelişim potansiyeli, yakın çevre projeleri ve yatırım fırsatlarına genel bakış.', duration: '75 dk', speaker: 'Muhammet Özdemir', seminar_type: 'free', status: 'active' },
];

const STATIC_COURSES = [
  { id: 'c1', title: 'Profesyonel Arsa Yatırım Eğitimi', short_description: 'Arsa yatırımını A\'dan Z\'ye öğrenin. Bölge analizi, imar planı okuma, portföy yönetimi dahil kapsamlı eğitim.', duration: '12 saat', price: 2490, student_count: 847, rating: 4.9, level: 'ileri', status: 'active' },
  { id: 'c2', title: 'İmar Planı Okuma Masterclass', short_description: 'Türkiye\'deki tüm imar plan türlerini ve parsel analizini profesyonel düzeyde öğrenin.', duration: '8 saat', price: 1890, student_count: 523, rating: 4.8, level: 'orta', status: 'active' },
  { id: 'c3', title: 'Yenişehir Yatırım Analizi', short_description: 'Yenişehir bölgesinin detaylı yatırım analizi; değer haritaları, gelişim projeleri ve fırsat noktaları.', duration: '6 saat', price: 1490, student_count: 312, rating: 4.9, level: 'orta', status: 'active' },
  { id: 'c4', title: 'Tapu ve Hukuki Süreçler Eğitimi', short_description: 'Arsa alım-satımında tapu süreçleri, yasal yükümlülükler ve risk yönetimi.', duration: '5 saat', price: 1290, student_count: 418, rating: 4.7, level: 'başlangıç', status: 'active' },
  { id: 'c5', title: 'Doğru Arazi Analizi Eğitimi', short_description: 'Saha analizi teknikleri, topografya değerlendirmesi ve arazi seçim kriterleri uygulamalı eğitim.', duration: '7 saat', price: 1690, student_count: 261, rating: 4.8, level: 'ileri', status: 'active' },
];

const COMMUNITY_CHANNELS = [
  { name: 'Yenişehir', icon: MapPin, desc: 'Bölge gelişmeleri ve fırsatları' },
  { name: 'Arnavutköy', icon: MapPin, desc: 'Arnavutköy yatırım analizleri' },
  { name: 'Kanal İstanbul', icon: TrendingUp, desc: 'Kanal güzergahı parsel takibi' },
  { name: 'Yatırım Fırsatları', icon: Zap, desc: 'Güncel fırsat paylaşımları' },
];

const LEVEL_MAP = { 'başlangıç': 'Başlangıç', 'orta': 'Orta Seviye', 'ileri': 'İleri Seviye' };
const LEVEL_COLORS = { 'başlangıç': 'bg-emerald-900/60 text-emerald-300', 'orta': 'bg-amber-900/60 text-amber-300', 'ileri': 'bg-red-900/60 text-red-300' };

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EducationPage() {
  const navigate = useNavigate();
  useSEO('egitim', { title: 'Eğitim Platformu | mrxakademi' });
  const [seminars, setSeminars] = useState(STATIC_SEMINARS);
  const [courses, setCourses] = useState(STATIC_COURSES);
  const [liveData, setLiveData] = useState(null);
  const [pageSettings, setPageSettings] = useState(null);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [seminarsFromDB, setSeminarsFromDB] = useState(false);
  const [coursesFromDB, setCoursesFromDB] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('app_user');
    if (u) { try { const p = JSON.parse(u); setLoggedIn(true); setUserName(p.full_name || p.email || ''); } catch {} }
  }, []);

  const isLoggedIn = () => !!(localStorage.getItem('app_user'));

  const handleGate = (action) => {
    if (!isLoggedIn()) { setShowLoginModal(true); return; }
    action?.();
    toast.success('Eğitime kaydınız alındı! Yakında sizinle iletişime geçeceğiz.');
  };

  useEffect(() => {
    api.get('/education/courses').then(r => { if (r.data?.length > 0) { setCourses(r.data); setCoursesFromDB(true); } }).catch(() => {});
    api.get('/education/seminars').then(r => { if (r.data?.length > 0) { setSeminars(r.data); setSeminarsFromDB(true); } }).catch(() => {});
    api.get('/education/live').then(r => { if (r.data?.title) setLiveData(r.data); }).catch(() => {});
    api.get('/education/page-settings').then(r => { if (r.data?.sections) setPageSettings(r.data); }).catch(() => {});
  }, []);

  const getSectionText = (key, field, fallback) => {
    const sec = pageSettings?.sections?.find(s => s.key === key);
    return sec?.[field] || fallback;
  };

  const live = liveData || { title: 'Her Hafta Canlı Online Eğitim', description: 'Her hafta yatırımcılarla birlikte canlı analiz yapılır.', day_of_week: 'Çarşamba', time: '20:00', zoom_link: '' };

  return (
    <div className="min-h-screen" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F8F8F8' }}>
      {selectedSeminar && <SeminarRegistrationModal seminar={selectedSeminar} onClose={() => setSelectedSeminar(null)} />}
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}

      {/* ── STICKY HEADER ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'rgba(4,14,8,0.96)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-extrabold text-white">mrx<span style={{ color: '#C8A96A' }}>akademi</span></span>
          </button>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-6">
            <button onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Kurslar</button>
            <button onClick={() => document.getElementById('seminars-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Seminerler</button>
            <button onClick={() => document.getElementById('live-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Canlı Eğitim</button>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <button
                onClick={() => navigate('/panel')}
                data-testid="education-panel-btn"
                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
              >
                <Users className="w-3.5 h-3.5" />
                {userName ? userName.split(' ')[0] : 'Panelim'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth', { state: { from: '/panel' } })}
                  data-testid="education-login-btn"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => navigate('/auth?mode=register', { state: { from: '/panel' } })}
                  data-testid="education-register-btn"
                  className="text-xs font-bold px-4 py-2 rounded-lg text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
                >
                  Ücretsiz Kayıt
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #040e08 0%, #0F3D2E 60%, #0d2a1a 100%)' }} className="relative overflow-hidden" id="hero-section">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A96A 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#C8A96A', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#10b981' }} />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* LEFT: Text */}
            <div>
              <div className="inline-flex items-center gap-2 border text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(200,169,106,0.15)', borderColor: 'rgba(200,169,106,0.3)', color: '#C8A96A' }}>
                <Award className="w-3.5 h-3.5" /> Türkiye'nin Arsa Eğitim Akademisi
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6" style={{ letterSpacing: '-0.03em' }}>
                {getSectionText('hero', 'title', 'Arsa Yatırımında')}{' '}
                <span style={{ color: '#C8A96A' }}>Profesyonel</span> Ol
              </h1>
              <p className="text-[16px] text-slate-400 leading-relaxed mb-8 max-w-lg">
                {getSectionText('hero', 'description', 'Ücretsiz seminerlerden sertifikalı eğitimlere — arsa yatırımını doğru öğren, kazançlı yatırımlar yap.')}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4 mb-10">
                <button
                  onClick={() => navigate('/auth?mode=register', { state: { from: '/panel' } })}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base hover:scale-105 transition-all shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }}
                >
                  <Play className="w-5 h-5" /> Ücretsiz Başla
                </button>
                <button
                  onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border border-white/20 text-white hover:bg-white/10 transition-all"
                >
                  Eğitimleri İncele <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-8 pt-6 border-t border-white/10">
                {[
                  { value: '2.300+', label: 'Aktif Öğrenci' },
                  { value: `${courses.length + seminars.length}+`, label: 'Eğitim & Seminer' },
                  { value: '48 sa+', label: 'Video İçerik' },
                  { value: '4.9 ★', label: 'Ortalama Puan' }
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-2xl font-extrabold" style={{ color: '#C8A96A' }}>{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Featured cards */}
            <div className="hidden lg:flex flex-col gap-4">
              {/* Featured course card */}
              <div className="rounded-2xl border overflow-hidden shadow-2xl" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
                <div className="h-2" style={{ background: 'linear-gradient(90deg, #C8A96A, #10b981)' }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: 'rgba(200,169,106,0.2)', color: '#C8A96A' }}>Premium Kurs</span>
                    <div className="flex items-center gap-1">{[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-[#C8A96A] text-[#C8A96A]" />)}</div>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1 leading-snug">Profesyonel Arsa Yatırım Eğitimi</h3>
                  <p className="text-sm text-slate-400 mb-4">Arsa yatırımını A'dan Z'ye öğrenin. Bölge analizi, imar planı okuma dahil.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" style={{ color: '#C8A96A' }} />12 saat</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" style={{ color: '#C8A96A' }} />847 öğrenci</span>
                    </div>
                    <span className="text-xl font-extrabold" style={{ color: '#C8A96A' }}>₺2.490</span>
                  </div>
                </div>
              </div>

              {/* Trust badges row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Award, label: 'Sertifikalı', sub: 'Onaylı belgeler' },
                  { icon: Wifi, label: 'Canlı Eğitim', sub: 'Haftalık online' },
                  { icon: TrendingUp, label: 'Yatırım Odaklı', sub: 'Gerçek analizler' },
                ].map(b => (
                  <div key={b.label} className="rounded-xl p-3.5 text-center border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(200,169,106,0.15)' }}>
                      <b.icon className="w-4 h-4" style={{ color: '#C8A96A' }} />
                    </div>
                    <p className="text-xs font-bold text-white">{b.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{b.sub}</p>
                  </div>
                ))}
              </div>

              {/* Live session pill */}
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  CANLI
                </span>
                <span className="text-white text-sm font-semibold">Her {live.day_of_week || 'Çarşamba'} — Saat {live.time || '20:00'} Canlı Eğitim</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap justify-center lg:justify-between items-center gap-4">
          {[
            '✓  Türkiye\'de 2.300+ aktif öğrenci',
            '✓  Her hafta canlı soru & cevap',
            '✓  Sertifikalı tamamlama belgesi',
            '✓  Tüm cihazlardan erişim',
            '✓  7/24 topluluk desteği',
          ].map(t => (
            <span key={t} className="text-xs font-semibold text-slate-400">{t}</span>
          ))}
        </div>
      </div>

      {/* ── SECTION 1: ÜCRETSİZ SEMİNERLER ──────────────────────── */}
      <div className="bg-white py-20 lg:py-24" id="seminars-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-1 h-14 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #C8A96A, #0F3D2E)' }} />
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#0F3D2E' }}>Ücretsiz · Herkese Açık</div>
                <h2 className="text-4xl font-extrabold" style={{ color: '#0F3D2E', letterSpacing: '-0.02em' }}>
                  {getSectionText('seminars', 'title', 'Ücretsiz Seminerler')}
                </h2>
                <p className="text-[15px] text-slate-500 mt-2 max-w-xl">{getSectionText('seminars', 'description', 'Arsa yatırımına yeni başlayanlar için genel anlatım yapılan ücretsiz seminerler.')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 border shrink-0" style={{ background: 'rgba(15,61,46,0.05)', borderColor: 'rgba(15,61,46,0.15)' }}>
              <BookOpen className="w-4 h-4 flex-shrink-0" style={{ color: '#0F3D2E' }} />
              <p className="text-[13px] font-medium" style={{ color: '#0F3D2E' }}>Temel bilgi için idealdir</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {seminars.map(s => (
              <div key={s.id} className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl hover:border-[#C8A96A]/40 transition-all duration-300 flex flex-col" data-testid={`seminar-card-${s.id}`}>
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0F3D2E, #1a6645)' }} />
                {fileUrl(s.cover_image) ? (
                  <img src={fileUrl(s.cover_image)} alt={s.title} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0F3D2E, #1a6645)' }}>
                    <Mic className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border" style={{ background: 'rgba(15,61,46,0.08)', borderColor: 'rgba(15,61,46,0.15)', color: '#0F3D2E' }}>Ücretsiz</span>
                    {s.date && <span className="text-[11px] text-slate-400">{s.date}</span>}
                  </div>
                  <h3 className="text-[15px] font-bold mb-2 leading-snug group-hover:text-[#0F3D2E] transition-colors" style={{ color: '#1a1a1a' }}>{s.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed flex-1 mb-4">{s.description}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-500"><Clock className="w-3.5 h-3.5" style={{ color: '#C8A96A' }} />{s.duration}</div>
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-500"><Mic className="w-3.5 h-3.5" style={{ color: '#C8A96A' }} />{s.speaker || 'Muhammet Özdemir'}</div>
                  </div>
                  <button
                    onClick={() => seminarsFromDB ? setSelectedSeminar(s) : handleGate()}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }}
                    data-testid={`seminar-join-${s.id}`}
                  >
                    {getSectionText('seminars', 'button_text', 'Seminere Katıl')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: ÜCRETLİ EĞİTİMLER ────────────────────────── */}
      <div className="py-20 lg:py-24" id="courses-section" style={{ background: '#0F3D2E' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-1 h-14 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #C8A96A, #e8c84a)' }} />
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#C8A96A' }}>Premium · Sertifikalı</div>
                <h2 className="text-4xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>{getSectionText('courses', 'title', 'Ücretli Eğitimler')}</h2>
                <p className="text-[15px] text-slate-400 mt-2 max-w-xl">{getSectionText('courses', 'description', 'Arsa yatırımını profesyonel seviyede öğrenmek isteyenler için ayrıntılı eğitim programları.')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 border shrink-0" style={{ background: 'rgba(200,169,106,0.1)', borderColor: 'rgba(200,169,106,0.25)' }}>
              <Zap className="w-4 h-4 flex-shrink-0" style={{ color: '#C8A96A' }} />
              <p className="text-[13px] font-medium text-amber-100/80">Gerçek bölge analizleri dahil</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {courses.map(c => (
              <div
                key={c.id}
                onClick={() => coursesFromDB ? navigate(`/course/${c.id}`) : handleGate()}
                className="group rounded-2xl overflow-hidden flex flex-col border cursor-pointer hover:border-[#C8A96A]/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                style={{ background: 'linear-gradient(160deg, #0f2d1c, #0a1f14)', borderColor: 'rgba(255,255,255,0.08)' }}
                data-testid={`course-card-${c.id}`}
              >
                {fileUrl(c.cover_image) ? (
                  <img src={fileUrl(c.cover_image)} alt={c.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <BookOpen className="w-10 h-10 text-white/20" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${LEVEL_COLORS[c.level] || 'bg-slate-700 text-slate-300'}`}>{LEVEL_MAP[c.level] || c.level}</span>
                    <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-[#C8A96A] text-[#C8A96A]" />)}</div>
                  </div>
                  <h3 className="text-[15px] font-bold text-white mb-2 leading-snug group-hover:text-[#e8c84a] transition-colors">{c.title}</h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed flex-1 mb-4">{c.short_description}</p>
                  <div className="flex items-center gap-4 mb-4">
                    {c.duration && <div className="flex items-center gap-1.5 text-[12px] text-slate-400"><Clock className="w-3.5 h-3.5" style={{ color: '#C8A96A' }} />{c.duration}</div>}
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-400"><Users className="w-3.5 h-3.5" style={{ color: '#C8A96A' }} />{(c.student_count || 0).toLocaleString('tr-TR')}</div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-[20px] font-extrabold" style={{ color: '#C8A96A' }}>
                      {c.price > 0 ? `₺${c.price.toLocaleString('tr-TR')}` : 'Ücretsiz'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); coursesFromDB ? navigate(`/course/${c.id}`) : handleGate(); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }}
                      data-testid={`course-enroll-${c.id}`}
                    >
                      {getSectionText('courses', 'button_text', 'Katıl')} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: HAFTALIK ONLİNE ────────────────────────────── */}
      <div className="py-20 lg:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F8F8F8, #f0e8d8)' }} id="live-section">
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full opacity-10" style={{ background: '#C8A96A', transform: 'translate(30%, -30%)' }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Canlı · {live.day_of_week || 'Her Hafta'}
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-5" style={{ color: '#0F3D2E', letterSpacing: '-0.02em' }}>
                {live.title || getSectionText('live', 'title', 'Her Hafta Canlı Online Eğitim')}
              </h2>
              <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">{live.description || 'Her hafta yatırımcılarla birlikte canlı analiz yapılır.'}</p>
              {live.day_of_week && live.time && (
                <div className="flex items-center gap-2 text-base font-bold mb-7" style={{ color: '#0F3D2E' }}>
                  <Calendar className="w-5 h-5" style={{ color: '#C8A96A' }} />Her {live.day_of_week} — Saat {live.time}
                </div>
              )}
              <div className="space-y-3.5 mb-10">
                {['Zoom / Online canlı bağlantı', 'Yatırım ve bölge analizleri', 'İmar planı incelemeleri', 'Soru & Cevap'].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#0F3D2E' }}>
                      <Wifi className="w-4 h-4" style={{ color: '#C8A96A' }} />
                    </div>
                    <span className="text-[15px] text-slate-700 font-medium">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { if (live.zoom_link) window.open(live.zoom_link, '_blank'); else handleGate(); }}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base hover:scale-105 transition-transform shadow-lg"
                style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }}
                data-testid="live-training-btn"
              >
                <Video className="w-5 h-5" />{getSectionText('live', 'button_text', 'Canlı Eğitime Katıl')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {[{ icon: Wifi, title: 'Zoom / Online', desc: 'Dilediğin yerden katıl' }, { icon: MessageCircle, title: 'Soru & Cevap', desc: 'Canlı soru yanıtlama' }, { icon: MapPin, title: 'İnteraktif Harita', desc: 'Gerçek zamanlı analiz' }, { icon: Calendar, title: 'Haftalık Program', desc: 'Düzenli canlı dersler' }].map(f => (
                <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#0F3D2E' }}>
                    <f.icon className="w-5 h-5" style={{ color: '#C8A96A' }} />
                  </div>
                  <p className="font-bold text-base" style={{ color: '#0F3D2E' }}>{f.title}</p>
                  <p className="text-sm text-slate-400 mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: COMMUNITY ──────────────────────────────────── */}
      <div className="py-20 lg:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #040e08 0%, #0F3D2E 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A96A 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 border text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(200,169,106,0.15)', borderColor: 'rgba(200,169,106,0.3)', color: '#C8A96A' }}>
                <Users className="w-3.5 h-3.5" />Özel Topluluk
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-5" style={{ letterSpacing: '-0.02em' }}>
                {getSectionText('community', 'title', 'Arsa Yatırımcı')}<br /><span style={{ color: '#C8A96A' }}>Topluluğu</span>
              </h2>
              <p className="text-[15px] text-slate-400 mb-10 leading-relaxed">{getSectionText('community', 'description', 'Yatırımcıların bir araya geldiği özel topluluk.')}</p>
              <button onClick={() => handleGate()} className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base hover:scale-105 transition-transform shadow-lg" style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }} data-testid="community-btn">
                <Users className="w-5 h-5" />{getSectionText('community', 'button_text', 'Topluluğa Katıl')}
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">Topluluk Kanalları</p>
              {COMMUNITY_CHANNELS.map((ch, i) => (
                <div key={ch.name} className="flex items-center gap-4 rounded-xl px-5 py-4 border transition-all hover:border-[#C8A96A]/40 cursor-pointer group" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }} data-testid={`community-channel-${i}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,169,106,0.15)' }}>
                    <ch.icon className="w-4.5 h-4.5" style={{ color: '#C8A96A' }} />
                  </div>
                  <div className="flex-1"><p className="text-sm font-semibold text-white group-hover:text-[#e8c84a] transition-colors"># {ch.name}</p><p className="text-xs text-slate-500 mt-0.5">{ch.desc}</p></div>
                  <Lock className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#C8A96A] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(15,61,46,0.08)', color: '#0F3D2E' }}>
            <Award className="w-3.5 h-3.5" /> Türkiye'nin Arsa Akademisi
          </div>
          <h3 className="text-4xl font-extrabold mb-4" style={{ color: '#0F3D2E', letterSpacing: '-0.02em' }}>Hâlâ kararsız mısınız?</h3>
          <p className="text-[15px] text-slate-500 mb-8 max-w-lg mx-auto">Ücretsiz seminere katılın, eğitim kalitesini bizzat görün. Hiçbir ödeme gerekmez.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => seminarsFromDB && seminars.length > 0 ? setSelectedSeminar(seminars[0]) : handleGate()} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base hover:scale-105 transition-transform shadow-lg" style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }} data-testid="footer-cta-btn">
              <Play className="w-5 h-5" />Ücretsiz Seminere Katıl
            </button>
            <button onClick={() => navigate('/auth', { state: { from: '/panel' } })} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border-2 hover:bg-slate-50 transition-all" style={{ borderColor: '#0F3D2E', color: '#0F3D2E' }}>
              Giriş Yap <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
