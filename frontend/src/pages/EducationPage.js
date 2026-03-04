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
  const [seminars, setSeminars] = useState(STATIC_SEMINARS);
  const [courses, setCourses] = useState(STATIC_COURSES);
  const [liveData, setLiveData] = useState(null);
  const [pageSettings, setPageSettings] = useState(null);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isLoggedIn = () => !!(localStorage.getItem('app_user') || localStorage.getItem('admin_token'));

  const handleGate = (action) => {
    if (!isLoggedIn()) { setShowLoginModal(true); return; }
    action?.();
    toast.success('Eğitime kaydınız alındı! Yakında sizinle iletişime geçeceğiz.');
  };

  useEffect(() => {
    api.get('/education/courses').then(r => { if (r.data?.length > 0) setCourses(r.data); }).catch(() => {});
    api.get('/education/seminars').then(r => { if (r.data?.length > 0) setSeminars(r.data); }).catch(() => {});
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

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #040e08 0%, #0F3D2E 60%, #0d2a1a 100%)' }} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A96A 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-10 text-sm"><ArrowLeft className="w-4 h-4" />Ana Sayfaya Dön</button>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5" style={{ background: 'rgba(200,169,106,0.15)', borderColor: 'rgba(200,169,106,0.3)', color: '#C8A96A' }}>
              <Award className="w-3.5 h-3.5" /> Arsa Eğitim Akademisi
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
              {getSectionText('hero', 'title', 'Arsa Yatırımında')}<br />
              <span style={{ color: '#C8A96A' }}>Profesyonel</span> Ol
            </h1>
            <p className="text-[15px] text-slate-400 leading-relaxed mb-8 max-w-xl">
              {getSectionText('hero', 'description', 'Ücretsiz seminerlerden ileri seviye eğitimlere kadar arsa yatırımını öğrenmek için her şey burada.')}
            </p>
            <div className="flex flex-wrap gap-6">
              {[{ value: '2.300+', label: 'Aktif Öğrenci' }, { value: `${courses.length + seminars.length}`, label: 'Eğitim & Seminer' }, { value: '48 sa+', label: 'İçerik' }, { value: '4.9★', label: 'Ortalama Puan' }].map(s => (
                <div key={s.label}><div className="text-xl font-extrabold" style={{ color: '#C8A96A' }}>{s.value}</div><div className="text-xs text-slate-500">{s.label}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: ÜCRETSİZ SEMİNERLER ──────────────────────── */}
      <div className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #C8A96A, #0F3D2E)' }} />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#0F3D2E' }}>Ücretsiz · Herkese Açık</div>
              <h2 className="text-3xl font-extrabold" style={{ color: '#0F3D2E', letterSpacing: '-0.02em' }}>
                {getSectionText('seminars', 'title', 'Ücretsiz Seminerler')}
              </h2>
            </div>
          </div>
          <p className="text-[14px] text-slate-500 mb-2 pl-5">{getSectionText('seminars', 'description', 'Arsa yatırımına yeni başlayanlar için genel anlatım yapılan ücretsiz seminerler.')}</p>
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-10 max-w-2xl ml-5 border" style={{ background: 'rgba(15,61,46,0.05)', borderColor: 'rgba(15,61,46,0.15)' }}>
            <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#0F3D2E' }} />
            <p className="text-[13px]" style={{ color: '#0F3D2E' }}>Bu seminerlerde arsa yatırımı genel olarak anlatılır. Temel bilgi edinmek isteyenler için idealdir.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {seminars.map(s => (
              <div key={s.id} className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl hover:border-[#C8A96A]/40 transition-all duration-300 flex flex-col" data-testid={`seminar-card-${s.id}`}>
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #0F3D2E, #1a6645)' }} />
                {fileUrl(s.cover_image) ? (
                  <img src={fileUrl(s.cover_image)} alt={s.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0F3D2E, #1a6645)' }}>
                    <Mic className="w-10 h-10 text-white/30" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
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
                    onClick={() => setSelectedSeminar(s)}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02]"
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
      <div className="py-16 sm:py-20" style={{ background: '#0F3D2E' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #C8A96A, #e8c84a)' }} />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#C8A96A' }}>Premium · Sertifikalı</div>
              <h2 className="text-3xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>{getSectionText('courses', 'title', 'Ücretli Eğitimler')}</h2>
            </div>
          </div>
          <p className="text-[14px] text-slate-400 mb-2 pl-5">{getSectionText('courses', 'description', 'Arsa yatırımını profesyonel seviyede öğrenmek isteyenler için ayrıntılı eğitim programları.')}</p>
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-10 max-w-2xl ml-5 border" style={{ background: 'rgba(200,169,106,0.1)', borderColor: 'rgba(200,169,106,0.25)' }}>
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C8A96A' }} />
            <p className="text-[13px] text-amber-100/80">Bu eğitimlerde bölge analizleri, imar planı okuma ve gerçek yatırım örnekleri detaylı şekilde anlatılır.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/course/${c.id}`)}
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
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-400"><Users className="w-3.5 h-3.5" style={{ color: '#C8A96A' }} />{(c.student_count || 0).toLocaleString('tr-TR')} öğrenci</div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-[22px] font-extrabold" style={{ color: '#C8A96A' }}>
                      {c.price > 0 ? `₺${c.price.toLocaleString('tr-TR')}` : 'Ücretsiz'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/course/${c.id}`); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }}
                      data-testid={`course-enroll-${c.id}`}
                    >
                      {getSectionText('courses', 'button_text', 'Eğitime Katıl')} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: HAFTALIK ONLİNE ────────────────────────────── */}
      <div className="py-16 sm:py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F8F8F8, #f0e8d8)' }}>
        <div className="absolute right-0 top-0 w-72 h-72 rounded-full opacity-10" style={{ background: '#C8A96A', transform: 'translate(30%, -30%)' }} />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Canlı · {live.day_of_week || 'Her Hafta'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#0F3D2E', letterSpacing: '-0.02em' }}>
                {live.title || getSectionText('live', 'title', 'Her Hafta Canlı Online Eğitim')}
              </h2>
              <p className="text-[14px] text-slate-500 mb-7 leading-relaxed">{live.description || 'Her hafta yatırımcılarla birlikte canlı analiz yapılır.'}</p>
              {live.day_of_week && live.time && (
                <div className="flex items-center gap-2 text-sm font-semibold mb-5" style={{ color: '#0F3D2E' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#C8A96A' }} />Her {live.day_of_week} - Saat {live.time}
                </div>
              )}
              <div className="space-y-3 mb-8">
                {['Zoom / Online canlı bağlantı', 'Yatırım ve bölge analizleri', 'İmar planı incelemeleri', 'Soru & Cevap'].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0F3D2E' }}>
                      <Wifi className="w-3.5 h-3.5" style={{ color: '#C8A96A' }} />
                    </div>
                    <span className="text-[14px] text-slate-700 font-medium">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { if (live.zoom_link) window.open(live.zoom_link, '_blank'); else handleGate(); }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-[15px] hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }}
                data-testid="live-training-btn"
              >
                <Video className="w-4 h-4" />{getSectionText('live', 'button_text', 'Canlı Eğitime Katıl')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{ icon: Wifi, title: 'Zoom / Online', desc: 'Dilediğin yerden katıl' }, { icon: MessageCircle, title: 'Soru & Cevap', desc: 'Canlı soru yanıtlama' }, { icon: MapPin, title: 'İnteraktif Harita', desc: 'Gerçek zamanlı analiz' }, { icon: Calendar, title: 'Haftalık Program', desc: 'Düzenli canlı dersler' }].map(f => (
                <div key={f.title} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#0F3D2E' }}>
                    <f.icon className="w-4 h-4" style={{ color: '#C8A96A' }} />
                  </div>
                  <p className="font-bold text-sm" style={{ color: '#0F3D2E' }}>{f.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: COMMUNITY ──────────────────────────────────── */}
      <div className="py-16 sm:py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #040e08 0%, #0F3D2E 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A96A 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 border text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5" style={{ background: 'rgba(200,169,106,0.15)', borderColor: 'rgba(200,169,106,0.3)', color: '#C8A96A' }}>
                <Users className="w-3.5 h-3.5" />Özel Topluluk
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
                {getSectionText('community', 'title', 'Arsa Yatırımcı')}<br /><span style={{ color: '#C8A96A' }}>Topluluğu</span>
              </h2>
              <p className="text-[14px] text-slate-400 mb-8 leading-relaxed">{getSectionText('community', 'description', 'Yatırımcıların bir araya geldiği özel topluluk.')}</p>
              <button onClick={() => handleGate()} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-[15px] hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }} data-testid="community-btn">
                <Users className="w-4 h-4" />{getSectionText('community', 'button_text', 'Topluluğa Katıl')}
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Topluluk Kanalları</p>
              {COMMUNITY_CHANNELS.map((ch, i) => (
                <div key={ch.name} className="flex items-center gap-4 rounded-xl px-4 py-3.5 border transition-all hover:border-[#C8A96A]/40 cursor-pointer group" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }} data-testid={`community-channel-${i}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,169,106,0.15)' }}>
                    <ch.icon className="w-4 h-4" style={{ color: '#C8A96A' }} />
                  </div>
                  <div className="flex-1"><p className="text-sm font-semibold text-white group-hover:text-[#e8c84a] transition-colors"># {ch.name}</p><p className="text-xs text-slate-500">{ch.desc}</p></div>
                  <Lock className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#C8A96A] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-white py-12">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2" style={{ color: '#0F3D2E' }}>Hâlâ kararsız mısınız?</h3>
          <p className="text-[13px] text-slate-500 mb-5">Ücretsiz seminere katılın, eğitim kalitesini bizzat görün.</p>
          <button onClick={() => seminars.length > 0 ? setSelectedSeminar(seminars[0]) : handleGate()} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }} data-testid="footer-cta-btn">
            <Play className="w-4 h-4" />Ücretsiz Seminere Katıl
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Static fallback data ────────────────────────────────────────────────────

const STATIC_SEMINARS = [
  {
    id: 's1',
    title: 'Arsa Yatırımına Giriş',
    description: 'Arsa yatırımının temellerini, başlangıç stratejilerini ve piyasa dinamiklerini öğrenin. Hangi arsayı, ne zaman almalısınız?',
    duration: '45 dk',
    speaker: 'Muhammet Özdemir',
  },
  {
    id: 's2',
    title: 'İmar Planı Nedir?',
    description: 'İmar planlarını nasıl okuyacağınızı ve değerlendireceğinizi adım adım öğrenin. Yapı koşulları ve parsel analizi.',
    duration: '60 dk',
    speaker: 'Muhammet Özdemir',
  },
  {
    id: 's3',
    title: 'Arsa Alırken Nelere Dikkat Edilmeli?',
    description: 'Arsa satın alımında kritik kontrol noktaları, hukuki riskler ve uzman tavsiyeleri. Hata yapma, doğru öğren.',
    duration: '50 dk',
    speaker: 'Muhammet Özdemir',
  },
  {
    id: 's4',
    title: 'Yenişehir Bölgesi Genel Analizi',
    description: 'Yenişehir bölgesinin gelişim potansiyeli, yakın çevre projeleri ve yatırım fırsatlarına genel bakış.',
    duration: '75 dk',
    speaker: 'Muhammet Özdemir',
  },
];

const STATIC_COURSES = [
  {
    id: 'c1',
    title: 'Profesyonel Arsa Yatırım Eğitimi',
    description: 'Arsa yatırımını A\'dan Z\'ye öğrenin. Bölge analizi, imar planı okuma, portföy yönetimi ve gerçek vaka çalışmaları dahil kapsamlı eğitim.',
    duration: '12 saat',
    price: '₺2.490',
    students: 847,
    level: 'İleri Seviye',
  },
  {
    id: 'c2',
    title: 'İmar Planı Okuma Masterclass',
    description: 'Türkiye\'deki tüm imar plan türlerini, parsel analizini ve imar değişikliklerini profesyonel düzeyde öğrenin.',
    duration: '8 saat',
    price: '₺1.890',
    students: 523,
    level: 'Orta Seviye',
  },
  {
    id: 'c3',
    title: 'Yenişehir Yatırım Analizi',
    description: 'Yenişehir bölgesinin detaylı yatırım analizi; değer haritaları, gelişim projeleri ve fırsat noktaları sahadan gözlemlerle.',
    duration: '6 saat',
    price: '₺1.490',
    students: 312,
    level: 'Orta Seviye',
  },
  {
    id: 'c4',
    title: 'Tapu ve Hukuki Süreçler Eğitimi',
    description: 'Arsa alım-satımında tapu süreçleri, yasal yükümlülükler, şerh ve kısıtlar ile risk yönetimi rehberi.',
    duration: '5 saat',
    price: '₺1.290',
    students: 418,
    level: 'Başlangıç',
  },
  {
    id: 'c5',
    title: 'Doğru Arazi Analizi Eğitimi',
    description: 'Saha analizi teknikleri, topografya değerlendirmesi, zemin etüdü ve arazi seçim kriterleri uygulamalı eğitim.',
    duration: '7 saat',
    price: '₺1.690',
    students: 261,
    level: 'İleri Seviye',
  },
];

const COMMUNITY_CHANNELS = [
  { name: 'Yenişehir', icon: MapPin, desc: 'Bölge gelişmeleri ve fırsatları' },
  { name: 'Arnavutköy', icon: MapPin, desc: 'Arnavutköy yatırım analizleri' },
  { name: 'Kanal İstanbul', icon: TrendingUp, desc: 'Kanal güzergahı parsel takibi' },
  { name: 'Yatırım Fırsatları', icon: Zap, desc: 'Güncel fırsat paylaşımları' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function LevelBadge({ level }) {
  const map = {
    'Başlangıç': 'bg-emerald-900/60 text-emerald-300',
    'Orta Seviye': 'bg-amber-900/60 text-amber-300',
    'İleri Seviye': 'bg-red-900/60 text-red-300',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${map[level] || 'bg-slate-700 text-slate-300'}`}>
      {level}
    </span>
  );
}

// ─── Seminar Card ─────────────────────────────────────────────────────────────
function SeminarCard({ seminar, onJoin }) {
  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-[#c9a227]/40 hover:shadow-xl transition-all duration-300 flex flex-col"
      data-testid={`seminar-card-${seminar.id}`}
    >
      {/* Top stripe */}
      <div className="h-1 bg-gradient-to-r from-[#0a1f14] to-[#1a5c35]" />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#0a1f14] flex items-center justify-center flex-shrink-0">
            <Mic className="w-5 h-5 text-[#c9a227]" />
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            Ücretsiz
          </span>
        </div>

        <h3 className="text-[15px] font-bold text-[#0a1f14] mb-2 leading-snug group-hover:text-[#1a5c35] transition-colors">
          {seminar.title}
        </h3>
        <p className="text-[13px] text-slate-500 leading-relaxed flex-1 mb-4">
          {seminar.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-[#c9a227]" />
            {seminar.duration || `${seminar.duration_minutes} dk`}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <Users className="w-3.5 h-3.5 text-[#c9a227]" />
            {seminar.speaker || 'Muhammet Özdemir'}
          </div>
        </div>

        <button
          onClick={onJoin}
          className="w-full py-2.5 rounded-xl font-semibold text-sm text-[#0a1f14] transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #c9a227, #e8c84a)' }}
          data-testid={`seminar-join-${seminar.id}`}
        >
          Seminere Katıl
        </button>
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, onEnroll }) {
  return (
    <div
      className="group rounded-2xl overflow-hidden flex flex-col border border-white/10 hover:border-[#c9a227]/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      style={{ background: 'linear-gradient(160deg, #0f2d1c, #0a1f14)' }}
      data-testid={`course-card-${course.id}`}
    >
      <div className="p-6 flex flex-col flex-1">
        {/* Level + Stars */}
        <div className="flex items-center justify-between mb-4">
          <LevelBadge level={course.level} />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-3 h-3 fill-[#c9a227] text-[#c9a227]" />
            ))}
          </div>
        </div>

        <h3 className="text-[16px] font-bold text-white mb-2.5 leading-snug group-hover:text-[#e8c84a] transition-colors">
          {course.title}
        </h3>
        <p className="text-[13px] text-slate-400 leading-relaxed flex-1 mb-4">
          {course.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-[#c9a227]" />
            {course.duration || `${course.duration_minutes} dk`}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
            <Users className="w-3.5 h-3.5 text-[#c9a227]" />
            {course.students?.toLocaleString('tr-TR') || 0} öğrenci
          </div>
        </div>

        {/* Price + Button */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <span className="text-[22px] font-extrabold text-[#c9a227]">
            {course.price || '₺' + (course.price_tl || '—')}
          </span>
          <button
            onClick={onEnroll}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0a1f14] transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #c9a227, #e8c84a)' }}
            data-testid={`course-enroll-${course.id}`}
          >
            Eğitime Katıl <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EducationPage() {
  const navigate = useNavigate();
  const [seminars, setSeminars] = useState(STATIC_SEMINARS);
  const [courses, setCourses] = useState(STATIC_COURSES);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isLoggedIn = () => !!(localStorage.getItem('app_user') || localStorage.getItem('admin_token'));

  const handleGate = (action) => {
    if (!isLoggedIn()) { setShowLoginModal(true); return; }
    action?.();
    toast.success('Kaydınız alındı! Yakında sizinle iletişime geçeceğiz.');
  };

  useEffect(() => {
    api.get('/education/courses').then(r => { if (r.data?.length > 0) setCourses(r.data); }).catch(() => {});
    api.get('/education/seminars').then(r => { if (r.data?.length > 0) setSeminars(r.data); }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #040e08 0%, #0a1f14 50%, #0d2a1a 100%)' }}
      >
        {/* Decorative grain */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #c9a227 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20">
          {/* Back */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-10 text-sm"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
          </button>

          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 bg-[#c9a227]/15 border border-[#c9a227]/30 text-[#c9a227] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
              <Award className="w-3.5 h-3.5" /> mrxakademi Eğitim Platformu
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
              Arsa Yatırımında<br />
              <span style={{ color: '#c9a227' }}>Profesyonel</span> Ol
            </h1>
            <p className="text-[15px] text-slate-400 leading-relaxed mb-8 max-w-xl">
              Ücretsiz seminerlerden ileri seviye eğitimlere kadar arsa yatırımını öğrenmek için her şey burada. Muhammet Özdemir ile gerçek sahadan bilgiler.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { value: '2.300+', label: 'Aktif Öğrenci' },
                { value: '9', label: 'Eğitim & Seminer' },
                { value: '48 sa+', label: 'İçerik' },
                { value: '4.9★', label: 'Ortalama Puan' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-extrabold" style={{ color: '#c9a227' }}>{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: ÜCRETSİZ SEMİNERLER ───────────────────────── */}
      <div className="bg-[#f8f5ef] py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Section header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #c9a227, #0a1f14)' }} />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#1a5c35] mb-1">Ücretsiz · Herkese Açık</div>
              <h2 className="text-3xl font-extrabold text-[#0a1f14]" style={{ letterSpacing: '-0.02em' }}>Ücretsiz Seminerler</h2>
            </div>
          </div>
          <p className="text-[14px] text-slate-500 mb-2 pl-5">Arsa yatırımına yeni başlayanlar için genel bilgilendirme seminerleri.</p>

          {/* Info note */}
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-10 max-w-2xl ml-5">
            <BookOpen className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-emerald-800">
              Bu seminerlerde arsa yatırımı genel olarak anlatılır. Temel bilgi edinmek isteyenler için idealdir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {seminars.map(s => (
              <SeminarCard key={s.id} seminar={s} onJoin={() => handleGate()} />
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: ÜCRETLİ EĞİTİMLER ────────────────────────── */}
      <div className="py-16 sm:py-20" style={{ background: '#0a1f14' }}>
        <div className="max-w-6xl mx-auto px-4">
          {/* Section header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #c9a227, #e8c84a)' }} />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#c9a227' }}>Premium · Sertifikalı</div>
              <h2 className="text-3xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>Ücretli Eğitimler</h2>
            </div>
          </div>
          <p className="text-[14px] text-slate-400 mb-2 pl-5">Arsa yatırımını profesyonel seviyede öğrenmek isteyenler için detaylı eğitim programı.</p>

          {/* Info note */}
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-10 max-w-2xl ml-5 border" style={{ background: 'rgba(201,162,39,0.1)', borderColor: 'rgba(201,162,39,0.25)' }}>
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#c9a227' }} />
            <p className="text-[13px] text-amber-100/80">
              Bu eğitimlerde bölge analizleri, imar planı okuma ve gerçek yatırım örnekleri detaylı şekilde anlatılır.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(c => (
              <CourseCard key={c.id} course={c} onEnroll={() => handleGate()} />
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: HAFTALIK ONLİNE EĞİTİM ───────────────────── */}
      <div
        className="py-16 sm:py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f8f5ef, #f0e8d0)' }}
      >
        <div className="absolute right-0 top-0 w-72 h-72 rounded-full opacity-10" style={{ background: '#c9a227', transform: 'translate(30%, -30%)' }} />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Canlı · Her Hafta
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a1f14] mb-4" style={{ letterSpacing: '-0.02em' }}>
                Her Hafta<br />
                <span style={{ color: '#c9a227' }}>Canlı Online</span> Eğitim
              </h2>
              <p className="text-[14px] text-slate-500 mb-7 leading-relaxed">
                Her hafta yatırımcılarla birlikte canlı analiz yapılır. Gerçek zamanlı soru-cevap ve interaktif harita analizi.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  { icon: MapPin, text: 'Bölge analizleri' },
                  { icon: BookOpen, text: 'İmar planı incelemeleri' },
                  { icon: TrendingUp, text: 'Yatırım fırsatları' },
                  { icon: MessageCircle, text: 'Soru & Cevap' },
                ].map(f => (
                  <div key={f.text} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0a1f14' }}>
                      <f.icon className="w-3.5 h-3.5" style={{ color: '#c9a227' }} />
                    </div>
                    <span className="text-[14px] text-slate-700 font-medium">{f.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleGate()}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-[15px] text-[#0a1f14] hover:scale-105 transition-transform duration-200"
                style={{ background: 'linear-gradient(135deg, #c9a227, #e8c84a)' }}
                data-testid="live-training-btn"
              >
                <Video className="w-4 h-4" /> Canlı Eğitime Katıl
              </button>
            </div>

            {/* Right — Feature boxes */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Wifi, title: 'Zoom / Online', desc: 'Dilediğin yerden katıl' },
                { icon: MessageCircle, title: 'Soru & Cevap', desc: 'Canlı soru yanıtlama' },
                { icon: MapPin, title: 'İnteraktif Harita', desc: 'Gerçek zamanlı analiz' },
                { icon: Calendar, title: 'Haftalık Program', desc: 'Düzenli canlı dersler' },
              ].map(f => (
                <div key={f.title} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#0a1f14' }}>
                    <f.icon className="w-4 h-4" style={{ color: '#c9a227' }} />
                  </div>
                  <p className="font-bold text-[#0a1f14] text-sm">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: COMMUNITY ──────────────────────────────────── */}
      <div
        className="py-16 sm:py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #040e08 0%, #0a1f14 100%)' }}
      >
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #c9a227 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#c9a227]/15 border border-[#c9a227]/30 text-[#c9a227] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
                <Users className="w-3.5 h-3.5" /> Özel Topluluk
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
                Arsa Yatırımcı<br />
                <span style={{ color: '#c9a227' }}>Topluluğu</span>
              </h2>
              <p className="text-[14px] text-slate-400 mb-8 leading-relaxed">
                Yatırımcıların bir araya geldiği özel topluluk. Bölge bazlı kanallar, fırsat paylaşımları ve uzman görüşleri.
              </p>

              <button
                onClick={() => handleGate()}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-[15px] text-[#0a1f14] hover:scale-105 transition-transform duration-200"
                style={{ background: 'linear-gradient(135deg, #c9a227, #e8c84a)' }}
                data-testid="community-btn"
              >
                <Users className="w-4 h-4" /> Topluluğa Katıl
              </button>
            </div>

            {/* Right — Channels */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Topluluk Kanalları</p>
              {COMMUNITY_CHANNELS.map((ch, i) => (
                <div
                  key={ch.name}
                  className="flex items-center gap-4 rounded-xl px-4 py-3.5 border transition-all duration-200 hover:border-[#c9a227]/40 cursor-pointer group"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
                  data-testid={`community-channel-${i}`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,162,39,0.15)' }}>
                    <ch.icon className="w-4 h-4" style={{ color: '#c9a227' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white group-hover:text-[#e8c84a] transition-colors">
                      # {ch.name}
                    </p>
                    <p className="text-xs text-slate-500">{ch.desc}</p>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#c9a227] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER CTA ────────────────────────────────────────────── */}
      <div className="bg-[#f8f5ef] py-12">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-[#0a1f14] mb-2">Hâlâ kararsız mısınız?</h3>
          <p className="text-[13px] text-slate-500 mb-5">Ücretsiz seminere katılın, eğitim kalitesini bizzat görün.</p>
          <button
            onClick={() => handleGate()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-[#0a1f14] hover:scale-105 transition-transform"
            style={{ background: 'linear-gradient(135deg, #c9a227, #e8c84a)' }}
            data-testid="footer-cta-btn"
          >
            <Play className="w-4 h-4" /> Ücretsiz Seminere Katıl
          </button>
        </div>
      </div>
    </div>
  );
}
