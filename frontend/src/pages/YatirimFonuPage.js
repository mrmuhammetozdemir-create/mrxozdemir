import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import {
  MapPin, TrendingUp, ShieldCheck, Users, ChevronDown, ChevronRight,
  Download, Eye, ArrowRight, CheckCircle, Clock, FileText,
  Building2, BarChart3, Target, Star, Phone, Mail, Bell,
  ChevronUp, Globe, Lock, Layers
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '../components/ui/accordion';

const API = process.env.REACT_APP_BACKEND_URL;
const api = axios.create({ baseURL: `${API}/api` });

const HERO_IMG = 'https://images.unsplash.com/photo-1567563051934-e79f7360620f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600';

const BUDGET_OPTIONS = [
  '500.000 TL – 2.000.000 TL',
  '2.000.000 TL – 10.000.000 TL',
  '10.000.000 TL ve üzeri',
];
const REGION_OPTIONS = ['Yenişehir', 'Arnavutköy', 'Çilingir', 'Dursunköy', 'Hacımaşlı', 'Sazlıbosna', 'Genel bilgilendirme'];
const DURATION_OPTIONS = ['1-3 yıl', '3-5 yıl', '5 yıl ve üzeri'];

const ADVANTAGES = [
  { icon: MapPin, title: 'Gelişim Bölgelerine Odaklı', desc: 'İmar planı süreçleri yakından takip edilen gelecek değerli bölgelerde stratejik konumlanma' },
  { icon: BarChart3, title: 'Analiz Destekli Fırsat Seçimi', desc: 'Her yatırım fırsatı kapsamlı arazi analizi ve değerleme sürecinden geçirilir' },
  { icon: Users, title: 'Segment Bazlı Yatırımcı Yapısı', desc: 'Bütçe ve hedefe göre farklılaştırılmış özel yatırımcı segmentleri' },
  { icon: ShieldCheck, title: 'Şeffaf Bilgilendirme Süreci', desc: 'Her adımda net raporlama ve güvenilir iletişim politikası' },
];

const PROCESS_STEPS = [
  { num: '01', title: 'Bölge Analizi', desc: 'İmar gelişim potansiyeli yüksek bölgeler teknik ekip tarafından incelenir ve raporlanır.' },
  { num: '02', title: 'Ön Değerlendirme', desc: 'Seçilen parseller çoklu kriter analizi ile değerlendirilir; hukuki, teknik ve finansal durum teyit edilir.' },
  { num: '03', title: 'Yatırım Sunumu', desc: 'Nitelendirilen fırsatlar yatırımcı segmentlerine uygun formatta hazırlanarak sunuma alınır.' },
  { num: '04', title: 'Katılım Süreci', desc: 'Başvuru ve segment eşleştirmesi tamamlanan yatırımcılar onay sürecine dahil edilir.' },
  { num: '05', title: 'Satın Alma ve Takip', desc: 'Satın alma gerçekleştikten sonra yatırımcılar düzenli güncellemeler ile bilgilendirilmeye devam eder.' },
];

const SEGMENTS = [
  {
    id: 'baslangic',
    title: 'Başlangıç Yatırımcı',
    range: '500.000 TL – 2.000.000 TL',
    color: '#4a7c59',
    bg: '#f0f7f2',
    border: '#4a7c59',
    badge: 'Giriş Seviyesi',
    perks: ['Yatırım sunumlarına erişim', 'Seminer davetleri', 'Saha gezileri', 'Genel yatırım raporları'],
  },
  {
    id: 'stratejik',
    title: 'Stratejik Yatırımcı',
    range: '2.000.000 TL – 10.000.000 TL',
    color: '#0F3D2E',
    bg: '#0F3D2E',
    border: '#C8A96A',
    badge: 'En Popüler',
    textDark: false,
    perks: ['Öncelikli bilgilendirme', 'Özel analiz özetleri', 'Danışman eşleşmesi', 'Ön talepte öncelik'],
  },
  {
    id: 'kurucu',
    title: 'Kurucu Yatırımcı',
    range: '10.000.000 TL ve üzeri',
    color: '#8B5E1A',
    bg: '#fdf6ec',
    border: '#C8A96A',
    badge: 'Premium',
    perks: ['Özel toplantılar', 'Proje bazlı değerlendirme', 'Kapalı fırsat erişimi', 'Üst düzey bilgilendirme süreci'],
  },
];

const VALUE_PROPS = [
  { icon: Target, title: 'Doğru Bölge Analizi', desc: 'İmar ve gelişim potansiyeli analiz edilen bölgelere odaklanarak riskleri minimize eden yaklaşım.' },
  { icon: Building2, title: 'Kurumsal Sunum ve Süreç', desc: 'Profesyonel dokümantasyon, şeffaf süreç yönetimi ve titiz değerlendirme standartları.' },
  { icon: Layers, title: 'Segment Bazlı Yapı', desc: 'Farklı bütçe ve beklentilere uygun özelleştirilmiş yatırımcı deneyimi.' },
  { icon: Globe, title: 'Şeffaf Bilgilendirme', desc: 'Tüm süreçlerde açık iletişim, düzenli raporlama ve yatırımcı öncelikli yaklaşım.' },
];

const FAQ_ITEMS = [
  { q: 'Bu yapı nasıl çalışır?', a: 'İPAT Arazi Fonu, gelişim bölgelerindeki imar planlamaları yakından takip edilen parselleri analiz ederek segment bazlı yatırımcılara sunan bir yapıdır. Her fırsat kendi özel koşulları çerçevesinde ayrıca değerlendirilir.' },
  { q: 'Ön başvuru ne anlama gelir?', a: 'Ön başvuru, fon açıldığında öncelikli bilgilendirme ve değerlendirme sürecine dahil olmak için yapılan ilk adımdır. Ön başvuru kesin bir taahhüt oluşturmaz; yalnızca ilgi beyanıdır.' },
  { q: 'Hangi yatırımcı segmentine uygunum?', a: 'Segment belirleme sürecinde yatırım bütçeniz, hedeflenen süreniz ve bölge tercihleriniz esas alınır. Başvuru formunu doldurduktan sonra ekibimiz uygun segment değerlendirmesini yaparak sizinle iletişime geçer.' },
  { q: 'Katılım süreci nasıl ilerler?', a: 'Başvurunuzu tamamladıktan sonra ön değerlendirme yapılır, gerekirse telefon veya yüz yüze görüşme ayarlanır. Uygun segment teyit edildikten sonra yatırım sunumu paylaşılır.' },
  { q: 'Sunum dosyasına nasıl ulaşabilirim?', a: 'Sunum dosyasını bu sayfa üzerinden çevrimiçi görüntüleyebilir veya PDF olarak indirebilirsiniz. Ek dokümanlara erişim için yatırımcı başvurusu yapmanız gerekebilir.' },
  { q: 'Yatırım fırsatları neye göre belirlenir?', a: 'Fırsatlar; bölgenin imar gelişim potansiyeli, tapu ve hukuki durum, ulaşım ve altyapı, çevre proje geliştirmeleri gibi çok sayıda kriter değerlendirilerek seçilir.' },
];

const EMPTY_FORM = {
  ad_soyad: '', telefon: '', email: '', sehir: '', meslek: '',
  yatirim_butcesi: '', ilgi_duyulan_bolge: '', yatirim_suresi: '',
  aciklama: '', genel_bilgilendirme_onay: false, iletisim_onay: false,
};

export default function YatirimFonuPage() {
  const navigate = useNavigate();
  useSEO('yatirim-fonu', { title: 'Yatırım Fonu | mrxakademi' });
  const formRef = useRef(null);
  const beklemeRef = useRef(null);
  const sunumRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const [bekleme, setBekleme] = useState({ ad_soyad: '', telefon_veya_email: '' });
  const [beklemeLoading, setBeklemeLoading] = useState(false);
  const [beklemeSuccess, setBeklemeSuccess] = useState(false);

  // useSEO hook handles document.title - removed manual override

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const setF = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.genel_bilgilendirme_onay || !form.iletisim_onay) {
      toast.error('Lütfen onay kutucuklarını işaretleyin.'); return;
    }
    setFormLoading(true);
    try {
      await api.post('/yatirim-fonu/basvuru', form);
      setFormSuccess(true);
      setForm(EMPTY_FORM);
    } catch {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleBekleme = async (e) => {
    e.preventDefault();
    setBeklemeLoading(true);
    try {
      await api.post('/yatirim-fonu/bekleme-listesi', bekleme);
      setBeklemeSuccess(true);
      setBekleme({ ad_soyad: '', telefon_veya_email: '' });
    } catch {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setBeklemeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="İPAT Arazi Fonu" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,61,46,0.92) 0%, rgba(10,28,18,0.80) 60%, rgba(15,61,46,0.60) 100%)' }} />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6 border" style={{ background: 'rgba(200,169,106,0.15)', borderColor: 'rgba(200,169,106,0.5)', color: '#C8A96A' }}>
              <Star className="w-3 h-3" />e-İPAT Yatırım Platformu
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white mb-5 leading-tight tracking-tight">
              İPAT Arazi<br /><span style={{ color: '#C8A96A' }}>Fonu</span>
            </h1>
            <p className="text-xl font-semibold text-white/90 mb-3 leading-snug">
              İmar Planına Alınmış Tarla yatırımlarına analiz temelli, planlı ve kurumsal katılım modeli
            </p>
            <p className="text-base text-white/70 mb-10 leading-relaxed max-w-xl">
              Gelişim bölgelerini yakından takip eden analistlerimiz ve segment bazlı yatırımcı yapısıyla, arazi yatırımını kurumsal bir süreçle deneyimleyin.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => scrollTo(sunumRef)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }} data-testid="hero-view-sunum-btn">
                <Eye className="w-4 h-4" />Sunumu Görüntüle
              </button>
              <button onClick={() => scrollTo(sunumRef)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border-2 border-white/40 text-white hover:bg-white/10 transition-all" data-testid="hero-download-btn">
                <Download className="w-4 h-4" />Sunumu İndir
              </button>
              <button onClick={() => scrollTo(formRef)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105" style={{ background: '#0F3D2E', color: 'white', border: '2px solid rgba(200,169,106,0.4)' }} data-testid="hero-apply-btn">
                <ArrowRight className="w-4 h-4" />Başvuru Yap
              </button>
              <button onClick={() => scrollTo(beklemeRef)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border border-white/30 text-white/80 hover:bg-white/10 transition-all" data-testid="hero-notify-btn">
                <Bell className="w-4 h-4" />Fon Açıldığında Haber Ver
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FON NEDİR ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8A96A' }}>Fon Modeli</span>
            <h2 className="text-4xl font-black mt-2 mb-4" style={{ color: '#0F3D2E' }}>İPAT Arazi Fonu Nedir?</h2>
            <p className="text-base text-slate-600 leading-relaxed">
              İPAT Arazi Fonu; imar planına alınma potansiyeli taşıyan tarla ve arazi yatırımlarını analiz odaklı bir yaklaşımla değerlendirerek uygun yatırımcı profillerine sunan bir yatırım katılım modelidir. Fırsat seçimi, sunum, değerlendirme ve satın alma sürecinin tüm adımları kurumsal disiplinle yönetilir.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-slate-100 hover:border-[#C8A96A]/40 hover:shadow-lg transition-all duration-300 bg-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #0F3D2E, #1a5c43)' }}>
                  <a.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-[15px] mb-2" style={{ color: '#0F3D2E' }}>{a.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FON SÜRECİ ────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#f7f9f8' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8A96A' }}>Süreç</span>
            <h2 className="text-4xl font-black mt-2" style={{ color: '#0F3D2E' }}>Fon Süreci Nasıl İşler?</h2>
          </div>
          <div className="relative">
            {/* Desktop connector line */}
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-0.5" style={{ background: 'linear-gradient(90deg, #C8A96A22, #C8A96A, #C8A96A22)' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {PROCESS_STEPS.map((s, i) => (
                <div key={i} className="relative flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-lg mb-4 shadow-lg z-10 relative transition-transform group-hover:scale-110" style={{ background: 'linear-gradient(135deg, #0F3D2E, #1a5c43)', border: '3px solid #C8A96A' }}>
                    {s.num}
                  </div>
                  <h3 className="font-bold text-[15px] mb-2" style={{ color: '#0F3D2E' }}>{s.title}</h3>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── YATIRIMCI SEGMENTLERİ ─────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8A96A' }}>Segmentler</span>
            <h2 className="text-4xl font-black mt-2" style={{ color: '#0F3D2E' }}>Yatırımcı Segmentleri</h2>
            <p className="text-base text-slate-500 mt-3 max-w-xl mx-auto">Bütçenize ve yatırım hedeflerinize uygun segmenti seçerek katılım sürecine dahil olun.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SEGMENTS.map((seg) => {
              const isDark = seg.id === 'stratejik';
              return (
                <div key={seg.id} className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl" style={{ background: seg.bg, border: `2px solid ${seg.border}` }} data-testid={`segment-card-${seg.id}`}>
                  {isDark && (
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #C8A96A, #e8c84a, #C8A96A)' }} />
                  )}
                  <div className="p-7">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: isDark ? 'rgba(200,169,106,0.2)' : 'rgba(15,61,46,0.1)', color: isDark ? '#C8A96A' : '#0F3D2E' }}>{seg.badge}</span>
                        <h3 className={`text-xl font-black mt-2 ${isDark ? 'text-white' : ''}`} style={{ color: isDark ? 'white' : '#0F3D2E' }}>{seg.title}</h3>
                      </div>
                    </div>
                    <div className="mb-5 p-3 rounded-xl" style={{ background: isDark ? 'rgba(200,169,106,0.1)' : 'rgba(15,61,46,0.05)' }}>
                      <p className="text-[11px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: isDark ? '#C8A96A80' : '#0F3D2E60' }}>Bütçe Aralığı</p>
                      <p className="text-[15px] font-black" style={{ color: isDark ? '#C8A96A' : '#0F3D2E' }}>{seg.range}</p>
                    </div>
                    <ul className="space-y-2.5">
                      {seg.perks.map((p, pi) => (
                        <li key={pi} className="flex items-center gap-2.5 text-[13px]" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : '#374151' }}>
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? '#C8A96A' : '#0F3D2E' }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => scrollTo(formRef)} className="mt-6 w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: isDark ? 'linear-gradient(135deg, #C8A96A, #e8c84a)' : '#0F3D2E', color: isDark ? '#0F3D2E' : 'white' }} data-testid={`segment-apply-${seg.id}`}>
                      Bu Segmente Başvur
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── KATILIM ŞARTLARI ──────────────────────────────────── */}
      <section className="py-20" style={{ background: '#0F3D2E' }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8A96A' }}>Şartlar</span>
            <h2 className="text-4xl font-black mt-2 text-white">Katılım Şartları</h2>
            <p className="text-white/70 mt-3 leading-relaxed max-w-xl mx-auto">
              İPAT Arazi Fonu'na katılım için belirlenen temel koşullar şeffaflık ilkesiyle aşağıda belirtilmektedir.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              'Yatırımcı başvuru formunun eksiksiz doldurulması',
              'Yatırım bütçesinin beyan edilmesi',
              'Uygun segment eşleşmesinin yapılması',
              'Gerekli görüldüğünde ön görüşme yapılması',
              'Proje bazlı bilgilendirme ve değerlendirme sürecine katılım',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(200,169,106,0.2)' }}>
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#C8A96A' }} />
                <p className="text-white/85 text-[14px] leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-xl text-center" style={{ background: 'rgba(200,169,106,0.08)', border: '1px solid rgba(200,169,106,0.25)' }}>
            <p className="text-white/60 text-[12px] leading-relaxed">
              <Lock className="w-3.5 h-3.5 inline mr-1.5" style={{ color: '#C8A96A' }} />
              Bu sayfadaki içerikler genel bilgilendirme amaçlıdır. Her yatırım fırsatı kendi özel şartları çerçevesinde ayrıca değerlendirilir.
            </p>
          </div>
        </div>
      </section>

      {/* ── NEDEN BU MODEL ────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8A96A' }}>Değer Önerisi</span>
            <h2 className="text-4xl font-black mt-2" style={{ color: '#0F3D2E' }}>Neden İPAT Arazi Fonu?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUE_PROPS.map((v, i) => (
              <div key={i} className="p-6 rounded-2xl group hover:shadow-xl transition-all duration-300 cursor-default" style={{ background: 'linear-gradient(135deg, #f8fbf9, #f0f7f2)', border: '1px solid #d4ead9' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110" style={{ background: 'linear-gradient(135deg, #0F3D2E, #1e6647)' }}>
                  <v.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-[16px] mb-2" style={{ color: '#0F3D2E' }}>{v.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUNUM DOSYASI ─────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#f7f9f8' }} ref={sunumRef}>
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8A96A' }}>Sunum</span>
          <h2 className="text-4xl font-black mt-2 mb-10" style={{ color: '#0F3D2E' }}>Sunum Dosyası</h2>
          <div className="rounded-2xl overflow-hidden shadow-xl border" style={{ borderColor: '#d4e6d9', background: 'white' }}>
            {/* Mock PDF preview */}
            <div className="relative bg-slate-100" style={{ height: '380px', background: 'linear-gradient(160deg, #0F3D2E 0%, #1a5c43 40%, #0a2a1e 100%)' }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ background: 'rgba(200,169,106,0.15)', border: '2px solid rgba(200,169,106,0.4)' }}>
                  <FileText className="w-10 h-10" style={{ color: '#C8A96A' }} />
                </div>
                <p className="text-xl font-black mb-1" style={{ color: '#C8A96A' }}>İPAT Arazi Fonu</p>
                <p className="text-sm text-white/70 mb-2">Yatırım Sunumu</p>
                <div className="mt-4 grid grid-cols-3 gap-4 opacity-40">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-2 rounded-full bg-white/40 w-24" />
                  ))}
                </div>
                <p className="text-[11px] text-white/40 mt-6">Sunum dosyası yüklendiğinde burada görüntülenecektir</p>
              </div>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <p className="font-bold text-slate-800">ipat-arazi-fonu-sunumu.pdf</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Yatırım Sunumu · e-İPAT</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] border-2 transition-all hover:scale-105" style={{ borderColor: '#0F3D2E', color: '#0F3D2E' }} data-testid="sunum-view-btn">
                  <Eye className="w-4 h-4" />Görüntüle
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] text-white transition-all hover:scale-105 hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #0F3D2E, #1a5c43)' }} data-testid="sunum-download-btn">
                  <Download className="w-4 h-4" />PDF İndir
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SSS ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8A96A' }}>SSS</span>
            <h2 className="text-4xl font-black mt-2" style={{ color: '#0F3D2E' }}>Sık Sorulan Sorular</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border overflow-hidden" style={{ borderColor: '#e2ede5' }} data-testid={`faq-item-${i}`}>
                <AccordionTrigger className="px-5 py-4 text-[15px] font-semibold text-left hover:no-underline hover:bg-[#f0f7f2] transition-colors" style={{ color: '#0F3D2E' }}>
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 text-[14px] text-slate-600 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── BAŞVURU FORMU ─────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#f7f9f8' }} ref={formRef}>
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8A96A' }}>Başvuru</span>
            <h2 className="text-4xl font-black mt-2" style={{ color: '#0F3D2E' }}>Yatırımcı Başvuru Formu</h2>
            <p className="text-slate-500 mt-3 text-[14px] max-w-lg mx-auto">Uygun yatırımcı segmentine dahil olmak ve fırsatlardan öncelikli haberdar olmak için başvurunuzu yapın.</p>
          </div>

          {formSuccess ? (
            <div className="rounded-2xl p-10 text-center shadow-sm" style={{ background: 'linear-gradient(135deg, #0F3D2E, #1a5c43)' }} data-testid="form-success-msg">
              <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: '#C8A96A' }} />
              <h3 className="text-xl font-black text-white mb-2">Başvurunuz Alınmıştır</h3>
              <p className="text-white/80 text-[14px] leading-relaxed">Uygun segment değerlendirmesi sonrası tarafınıza dönüş sağlanacaktır.</p>
              <button onClick={() => setFormSuccess(false)} className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-[13px]" style={{ background: 'rgba(200,169,106,0.2)', color: '#C8A96A', border: '1px solid rgba(200,169,106,0.4)' }}>
                Yeni Başvuru Yap
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-5 border border-slate-100" data-testid="investor-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide text-slate-500">Ad Soyad *</label>
                  <input required value={form.ad_soyad} onChange={e => setF('ad_soyad', e.target.value)} placeholder="Adınız Soyadınız" className="w-full px-4 py-3 rounded-xl text-[14px] border border-slate-200 focus:outline-none focus:ring-2 transition" style={{ focusRingColor: '#0F3D2E' }} data-testid="form-ad-soyad" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide text-slate-500">Telefon *</label>
                  <input required value={form.telefon} onChange={e => setF('telefon', e.target.value)} placeholder="+90 5XX XXX XX XX" className="w-full px-4 py-3 rounded-xl text-[14px] border border-slate-200 focus:outline-none focus:ring-2 transition" data-testid="form-telefon" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide text-slate-500">E-posta *</label>
                  <input required type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="ornek@email.com" className="w-full px-4 py-3 rounded-xl text-[14px] border border-slate-200 focus:outline-none focus:ring-2 transition" data-testid="form-email" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide text-slate-500">Şehir</label>
                  <input value={form.sehir} onChange={e => setF('sehir', e.target.value)} placeholder="İstanbul" className="w-full px-4 py-3 rounded-xl text-[14px] border border-slate-200 focus:outline-none focus:ring-2 transition" data-testid="form-sehir" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide text-slate-500">Meslek</label>
                  <input value={form.meslek} onChange={e => setF('meslek', e.target.value)} placeholder="Mesleğiniz" className="w-full px-4 py-3 rounded-xl text-[14px] border border-slate-200 focus:outline-none focus:ring-2 transition" data-testid="form-meslek" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide text-slate-500">Yatırım Bütçesi *</label>
                  <select required value={form.yatirim_butcesi} onChange={e => setF('yatirim_butcesi', e.target.value)} className="w-full px-4 py-3 rounded-xl text-[14px] border border-slate-200 focus:outline-none focus:ring-2 transition bg-white" data-testid="form-yatirim-butcesi">
                    <option value="">Seçiniz</option>
                    {BUDGET_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide text-slate-500">İlgi Duyulan Bölge *</label>
                  <select required value={form.ilgi_duyulan_bolge} onChange={e => setF('ilgi_duyulan_bolge', e.target.value)} className="w-full px-4 py-3 rounded-xl text-[14px] border border-slate-200 focus:outline-none focus:ring-2 transition bg-white" data-testid="form-bolge">
                    <option value="">Seçiniz</option>
                    {REGION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide text-slate-500">Yatırım Süresi *</label>
                  <select required value={form.yatirim_suresi} onChange={e => setF('yatirim_suresi', e.target.value)} className="w-full px-4 py-3 rounded-xl text-[14px] border border-slate-200 focus:outline-none focus:ring-2 transition bg-white" data-testid="form-sure">
                    <option value="">Seçiniz</option>
                    {DURATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide text-slate-500">Açıklama</label>
                <textarea value={form.aciklama} onChange={e => setF('aciklama', e.target.value)} rows={3} placeholder="Ek bilgi veya taleplerinizi yazabilirsiniz..." className="w-full px-4 py-3 rounded-xl text-[14px] border border-slate-200 focus:outline-none focus:ring-2 transition resize-none" data-testid="form-aciklama" />
              </div>
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group" data-testid="form-check-bilgilendirme">
                  <input type="checkbox" checked={form.genel_bilgilendirme_onay} onChange={e => setF('genel_bilgilendirme_onay', e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#0F3D2E] rounded" />
                  <span className="text-[13px] text-slate-600 leading-relaxed">Genel bilgilendirme metnini okudum ve anladım.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group" data-testid="form-check-iletisim">
                  <input type="checkbox" checked={form.iletisim_onay} onChange={e => setF('iletisim_onay', e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#0F3D2E] rounded" />
                  <span className="text-[13px] text-slate-600 leading-relaxed">Benimle iletişime geçilmesini kabul ediyorum.</span>
                </label>
              </div>
              <button type="submit" disabled={formLoading} className="w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.01] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2" style={{ background: 'linear-gradient(135deg, #0F3D2E, #1a5c43)', color: 'white' }} data-testid="form-submit-btn">
                {formLoading ? 'Gönderiliyor...' : 'Başvurumu Gönder'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── BEKLEME LİSTESİ ───────────────────────────────────── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #0F3D2E 0%, #1a5c43 100%)' }} ref={beklemeRef}>
        <div className="max-w-xl mx-auto px-6 lg:px-12 text-center">
          <Bell className="w-10 h-10 mx-auto mb-4" style={{ color: '#C8A96A' }} />
          <h2 className="text-3xl font-black text-white mb-3">Fon Açıldığında İlk Siz Haberdar Olun</h2>
          <p className="text-white/70 text-[14px] mb-8 leading-relaxed">Fon resmi olarak açıldığında öncelikli bilgilendirme almak için bekleme listesine katılın.</p>

          {beklemeSuccess ? (
            <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(200,169,106,0.3)' }} data-testid="bekleme-success-msg">
              <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#C8A96A' }} />
              <p className="text-white font-semibold">Bekleme listesine başarıyla eklendiniz!</p>
              <p className="text-white/60 text-[13px] mt-1">Fon açıldığında sizinle iletişime geçeceğiz.</p>
            </div>
          ) : (
            <form onSubmit={handleBekleme} className="flex flex-col sm:flex-row gap-3" data-testid="bekleme-form">
              <input required value={bekleme.ad_soyad} onChange={e => setBekleme(p => ({ ...p, ad_soyad: e.target.value }))} placeholder="Ad Soyad" className="flex-1 px-4 py-3.5 rounded-xl text-[14px] bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#C8A96A] transition" data-testid="bekleme-ad-soyad" />
              <input required value={bekleme.telefon_veya_email} onChange={e => setBekleme(p => ({ ...p, telefon_veya_email: e.target.value }))} placeholder="Telefon veya E-posta" className="flex-1 px-4 py-3.5 rounded-xl text-[14px] bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#C8A96A] transition" data-testid="bekleme-contact" />
              <button type="submit" disabled={beklemeLoading} className="px-6 py-3.5 rounded-xl font-bold text-[14px] flex-shrink-0 transition-all hover:scale-105 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }} data-testid="bekleme-submit-btn">
                {beklemeLoading ? '...' : 'Bekleme Listesine Katıl'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <div className="py-6 text-center" style={{ background: '#0a2218' }}>
        <p className="text-[12px] text-white/30">© {new Date().getFullYear()} e-İPAT · İPAT Arazi Fonu · Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
}
