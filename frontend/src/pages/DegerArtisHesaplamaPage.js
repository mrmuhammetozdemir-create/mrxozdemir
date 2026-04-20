import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, Home, TrendingUp, AlertCircle, CheckCircle2, 
  Download, Share2, MessageCircle, Phone, ChevronDown, ChevronUp,
  Calendar, DollarSign, FileText, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import jsPDF from 'jspdf';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & DATA
// ═══════════════════════════════════════════════════════════════════════════════

const WHATSAPP_NUMBER = "905015508834";

// Yİ-ÜFE Endeks Tablosu (TÜİK - Yurt İçi Üretici Fiyat Endeksi, 2003=100)
const YI_UFE = {
  1994: [0.79, 0.87, 0.94, 1.25, 1.36, 1.39, 1.40, 1.44, 1.51, 1.62, 1.72, 1.87],
  1995: [2.02, 2.16, 2.30, 2.39, 2.43, 2.46, 2.52, 2.59, 2.71, 2.83, 2.96, 3.08],
  1996: [3.38, 3.57, 3.82, 4.13, 4.30, 4.42, 4.53, 4.70, 4.94, 5.21, 5.47, 5.69],
  1997: [6.01, 6.38, 6.77, 7.14, 7.51, 7.77, 8.18, 8.61, 9.15, 9.76, 10.31, 10.86],
  1998: [11.57, 12.10, 12.58, 13.09, 13.51, 13.73, 14.07, 14.41, 15.18, 15.81, 16.35, 16.75],
  1999: [17.35, 17.94, 18.65, 19.64, 20.27, 20.63, 21.45, 22.15, 23.45, 24.54, 25.54, 27.29],
  2000: [28.87, 30.05, 30.98, 31.72, 32.26, 32.35, 32.68, 32.99, 33.76, 34.70, 35.53, 36.21],
  2001: [37.05, 38.02, 41.85, 47.85, 50.87, 52.33, 54.06, 55.97, 58.97, 62.93, 65.57, 68.27],
  2002: [71.11, 72.93, 74.29, 75.63, 75.95, 76.83, 78.88, 80.56, 83.07, 85.67, 87.06, 89.33],
  2003: [94.32, 97.28, 100.40, 102.17, 101.53, 99.58, 99.04, 98.85, 98.90, 99.46, 101.15, 101.78],
  2004: [104.46, 106.17, 108.40, 111.27, 111.24, 110.06, 108.39, 109.25, 111.26, 114.85, 115.72, 115.87],
  2005: [114.83, 114.81, 117.25, 119.62, 119.23, 119.64, 119.33, 121.40, 123.40, 124.22, 121.40, 121.14],
  2006: [123.51, 123.83, 124.14, 126.54, 130.05, 135.28, 136.45, 135.43, 135.11, 135.73, 135.33, 135.16],
  2007: [135.09, 136.37, 137.70, 138.80, 139.34, 139.19, 139.28, 140.47, 141.90, 141.71, 142.98, 143.19],
  2008: [143.80, 147.48, 152.16, 159.00, 162.37, 162.90, 164.93, 161.07, 159.63, 160.54, 160.49, 154.80],
  2009: [155.16, 156.97, 157.43, 158.45, 158.37, 159.86, 158.74, 159.40, 160.38, 160.84, 162.92, 163.98],
  2010: [164.94, 167.68, 170.94, 174.96, 172.95, 172.08, 171.81, 173.79, 174.67, 176.78, 176.23, 178.54],
  2011: [182.75, 185.90, 188.17, 189.32, 189.61, 189.62, 189.57, 192.91, 195.89, 199.03, 200.32, 202.33],
  2012: [203.10, 202.91, 203.64, 203.81, 204.89, 201.83, 201.20, 201.71, 203.79, 204.15, 207.54, 207.29],
  2013: [206.91, 206.65, 208.33, 207.27, 209.34, 212.39, 214.50, 214.59, 216.48, 217.97, 219.31, 221.74],
  2014: [229.10, 232.27, 233.98, 234.18, 232.96, 233.09, 234.79, 235.78, 237.79, 239.97, 237.65, 235.84],
  2015: [236.61, 239.46, 241.97, 245.42, 248.15, 248.78, 247.99, 250.43, 254.25, 253.74, 250.13, 249.31],
  2016: [250.67, 250.16, 251.17, 252.47, 256.21, 257.27, 257.81, 258.01, 258.77, 260.94, 266.16, 274.09],
  2017: [284.99, 288.59, 291.58, 293.79, 295.31, 295.52, 297.65, 300.18, 300.90, 306.04, 312.21, 316.48],
  2018: [319.60, 328.17, 333.21, 341.88, 354.85, 365.60, 372.06, 396.62, 439.78, 443.78, 432.55, 422.94],
  2019: [424.86, 425.26, 431.98, 444.85, 456.74, 457.16, 452.63, 449.96, 450.55, 451.31, 450.97, 454.08],
  2020: [462.42, 464.64, 468.69, 474.69, 482.02, 485.37, 490.33, 501.85, 515.13, 533.44, 555.18, 568.27],
  2021: [583.38, 590.52, 614.93, 641.63, 666.79, 693.54, 710.61, 730.28, 741.58, 780.45, 858.43, 1022.25],
  2022: [1129.03, 1210.60, 1321.90, 1423.27, 1548.01, 1652.75, 1738.21, 1780.05, 1865.09, 2011.13, 2026.08, 2021.19],
  2023: [2105.17, 2138.04, 2147.44, 2164.94, 2179.02, 2320.72, 2511.75, 2659.60, 2749.98, 2803.29, 2882.04, 2915.02],
  2024: [3035.59, 3149.03, 3252.79, 3369.98, 3435.96, 3483.25, 3550.88, 3610.51, 3659.84, 3707.10, 3731.43, 3746.52],
  2025: [3861.33, 3943.01, 4017.30, 4128.19, 4230.69, 4334.94, 4409.73, 4518.89, 4632.89, 4708.20, 4747.63, 4783.04],
  2026: [4910.53, 5029.76, 5145.36, null, null, null, null, null, null, null, null, null],
};

// İstisna Tutarları (satış yılına göre)
const ISTISNA = {
  2008: 6400, 2009: 6800, 2010: 7700, 2011: 8000, 2012: 8800, 2013: 9400,
  2014: 9700, 2015: 10600, 2016: 11000, 2017: 11000, 2018: 12000, 2019: 14800,
  2020: 18000, 2021: 19000, 2022: 25000, 2023: 55000, 2024: 87000, 2025: 120000, 2026: 150000,
};

// Gelir Vergisi Dilimleri (satış yılına göre)
const VERGI_DILIMLERI = {
  2026: [
    { limit: 190000, oran: 0.15 },
    { limit: 400000, oran: 0.20 },
    { limit: 1500000, oran: 0.27 },
    { limit: 5300000, oran: 0.35 },
    { limit: Infinity, oran: 0.40 },
  ],
  2025: [
    { limit: 158000, oran: 0.15 },
    { limit: 330000, oran: 0.20 },
    { limit: 800000, oran: 0.27 },
    { limit: 4300000, oran: 0.35 },
    { limit: Infinity, oran: 0.40 },
  ],
  2024: [
    { limit: 110000, oran: 0.15 },
    { limit: 230000, oran: 0.20 },
    { limit: 580000, oran: 0.27 },
    { limit: 3000000, oran: 0.35 },
    { limit: Infinity, oran: 0.40 },
  ],
  2023: [
    { limit: 70000, oran: 0.15 },
    { limit: 150000, oran: 0.20 },
    { limit: 370000, oran: 0.27 },
    { limit: 1900000, oran: 0.35 },
    { limit: Infinity, oran: 0.40 },
  ],
  2022: [
    { limit: 32000, oran: 0.15 },
    { limit: 70000, oran: 0.20 },
    { limit: 250000, oran: 0.27 },
    { limit: 880000, oran: 0.35 },
    { limit: Infinity, oran: 0.40 },
  ],
};

const TAPU_HARCI_ORANI = 0.02; // %2
const DAMGA_VERGISI_ORANI = 0.00759; // binde 7,59
const BES_YIL_AY = 60; // 5 yıl = 60 ay

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Para formatı: 1.430.533,91 ₺
const formatMoney = (num) => {
  if (num === null || num === undefined) return '0,00 ₺';
  return new Intl.NumberFormat('tr-TR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(num) + ' ₺';
};

// Tarihten bir önceki ayın Yİ-ÜFE değerini al
const getYiUfe = (dateStr) => {
  const [day, month, year] = dateStr.split('.').map(Number);
  let targetMonth = month - 1; // Bir önceki ay
  let targetYear = year;
  
  if (targetMonth === 0) { // Ocak ayı ise bir önceki yılın Aralık'ı
    targetMonth = 12;
    targetYear = year - 1;
  }
  
  if (!YI_UFE[targetYear]) return null;
  const value = YI_UFE[targetYear][targetMonth - 1]; // Array 0-indexed
  return value;
};

// Tarih farkını ay cinsinden hesapla
const getMonthDifference = (startDate, endDate) => {
  const [d1, m1, y1] = startDate.split('.').map(Number);
  const [d2, m2, y2] = endDate.split('.').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
};

// Artan oranlı gelir vergisi hesapla
const calculateGelirVergisi = (matrah, year) => {
  const dilimler = VERGI_DILIMLERI[year] || VERGI_DILIMLERI[2026];
  let vergi = 0;
  let kalanMatrah = matrah;
  let oncekiLimit = 0;

  for (const dilim of dilimler) {
    const dilimTutari = Math.min(kalanMatrah, dilim.limit - oncekiLimit);
    if (dilimTutari <= 0) break;
    
    vergi += dilimTutari * dilim.oran;
    kalanMatrah -= dilimTutari;
    oncekiLimit = dilim.limit;
    
    if (kalanMatrah <= 0) break;
  }
  
  return vergi;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DegerArtisHesaplamaPage() {
  const navigate = useNavigate();
  
  useSEO('custom', {
    title: 'Ev Satış Vergisi Hesaplama 2026 | Gayrimenkul Değer Artış Kazancı — mrxakademi',
    description: 'Gayrimenkul satışında ne kadar vergi ödeyeceğinizi saniyeler içinde öğrenin. Güncel Yİ-ÜFE endeksli, 2026 vergi dilimli ücretsiz hesaplama aracı.'
  });

  // Form state
  const [edinimSekli, setEdinimSekli] = useState('bedel');
  const [alisTarihi, setAlisTarihi] = useState('');
  const [satisTarihi, setSatisTarihi] = useState('');
  const [alisFiyati, setAlisFiyati] = useState('');
  const [satisFiyati, setSatisFiyati] = useState('');
  const [krediFaizi, setKrediFaizi] = useState('');
  
  // Result state
  const [result, setResult] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '', phone: '', email: '', subject: 'Gayrimenkul Satış Vergisi Danışmanlığı', message: ''
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HESAPLAMA FONKSIYONU
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleHesapla = () => {
    // Validasyon
    if (!alisTarihi || !satisTarihi || !alisFiyati || !satisFiyati) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    const alis = parseFloat(alisFiyati.replace(/[.,\s]/g, '')) || 0;
    const satis = parseFloat(satisFiyati.replace(/[.,\s]/g, '')) || 0;
    const kredi = krediFaizi ? parseFloat(krediFaizi.replace(/[.,\s]/g, '')) : 0;

    // Ön kontrol 1: Miras veya Bağış
    if (edinimSekli !== 'bedel') {
      setResult({
        vergiYok: true,
        mesaj: `${edinimSekli === 'miras' ? 'Miras' : 'Bağış'} yoluyla edinilen gayrimenkuller Gelir Vergisi Kanunu'nun 81. maddesi gereğince değer artış kazancı vergisinden muaftır.`
      });
      return;
    }

    // Ön kontrol 2: Tarih geçerliliği
    const [ad, am, ay] = alisTarihi.split('.').map(Number);
    const [sd, sm, sy] = satisTarihi.split('.').map(Number);
    const alisDate = new Date(ay, am - 1, ad);
    const satisDate = new Date(sy, sm - 1, sd);
    
    if (satisDate <= alisDate) {
      toast.error('Satış tarihi, alış tarihinden sonra olmalıdır');
      return;
    }

    // Ön kontrol 3: 5 yıl kuralı
    const ayFarki = getMonthDifference(alisTarihi, satisTarihi);
    if (ayFarki > BES_YIL_AY) {
      setResult({
        vergiYok: true,
        mesaj: `Gayrimenkulün edinim tarihinden itibaren ${ayFarki} ay (${Math.floor(ayFarki / 12)} yıl ${ayFarki % 12} ay) geçmiştir. 5 yıl (60 ay) üzerinde olan satışlar değer artış kazancı vergisinden muaftır.`
      });
      return;
    }

    // Yİ-ÜFE değerlerini al
    const alisYiUfe = getYiUfe(alisTarihi);
    const satisYiUfe = getYiUfe(satisTarihi);

    if (alisYiUfe === null || alisYiUfe === undefined) {
      toast.error('Alış tarihi için Yİ-ÜFE verisi bulunamadı');
      return;
    }
    if (satisYiUfe === null || satisYiUfe === undefined) {
      toast.error('Satış tarihi için Yİ-ÜFE verisi henüz açıklanmamış. Lütfen daha önceki bir tarih seçin.');
      return;
    }

    // Hesaplama adımları
    const endeksOrani = satisYiUfe / alisYiUfe;
    const degerlenmisAlis = alis * endeksOrani;
    
    if (degerlenmisAlis >= satis) {
      setResult({
        vergiYok: true,
        mesaj: 'Endeks değerlemesi sonrası alış bedeli, satış bedelinden yüksek veya eşit olduğu için değer artış kazancı oluşmamıştır. Vergi ödenmez.'
      });
      return;
    }

    const gayrisafiHasilat = satis - degerlenmisAlis;
    const istisnaTutari = ISTISNA[sy] || 0;
    const istisnaSonrasi = gayrisafiHasilat - istisnaTutari;
    
    if (istisnaSonrasi <= 0) {
      setResult({
        vergiYok: true,
        mesaj: `Değer artış kazancı (${formatMoney(gayrisafiHasilat)}) istisna tutarının (${formatMoney(istisnaTutari)}) altında kaldığı için vergi ödenmez.`
      });
      return;
    }

    const tapuHarci = satis * TAPU_HARCI_ORANI;
    const matrah = istisnaSonrasi - tapuHarci - kredi;
    
    if (matrah <= 0) {
      setResult({
        vergiYok: true,
        mesaj: 'Tapu harcı ve diğer giderler düşüldükten sonra vergiye tabi matrah oluşmamıştır.'
      });
      return;
    }

    const gelirVergisi = calculateGelirVergisi(matrah, sy);
    const damgaVergisi = matrah * DAMGA_VERGISI_ORANI;
    const toplamVergi = gelirVergisi + damgaVergisi;
    const vergiYukuOrani = (toplamVergi / gayrisafiHasilat) * 100;

    setResult({
      vergiYok: false,
      alis,
      satis,
      kredi,
      alisYiUfe,
      satisYiUfe,
      endeksOrani,
      degerlenmisAlis,
      gayrisafiHasilat,
      istisnaTutari,
      istisnaSonrasi,
      tapuHarci,
      matrah,
      gelirVergisi,
      damgaVergisi,
      toplamVergi,
      vergiYukuOrani,
      satisYili: sy
    });
  };

  const handleTemizle = () => {
    setEdinimSekli('bedel');
    setAlisTarihi('');
    setSatisTarihi('');
    setAlisFiyati('');
    setSatisFiyati('');
    setKrediFaizi('');
    setResult(null);
    setShowContactForm(false);
  };

  // PDF İndir
  const handlePdfIndir = () => {
    if (!result || result.vergiYok) return;
    
    const doc = new jsPDF();
    
    // Başlık
    doc.setFontSize(16);
    doc.text('Gayrimenkul Değer Artış Kazancı Vergisi Hesaplama', 20, 20);
    doc.setFontSize(10);
    doc.text('mrxakademi.com', 20, 28);
    doc.text(new Date().toLocaleDateString('tr-TR'), 160, 28);
    
    // Çizgi
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);
    
    let y = 42;
    doc.setFontSize(12);
    
    // Sonuç
    doc.setFont(undefined, 'bold');
    doc.text(`TOPLAM ÖDENECEK VERGİ: ${formatMoney(result.toplamVergi)}`, 20, y);
    y += 10;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Vergi Yükü: %${result.vergiYukuOrani.toFixed(2)}`, 20, y);
    y += 15;
    
    // Detaylar
    const lines = [
      `Alış Bedeli: ${formatMoney(result.alis)}`,
      `Satış Bedeli: ${formatMoney(result.satis)}`,
      ``,
      `Alış Yİ-ÜFE: ${result.alisYiUfe.toFixed(2)}`,
      `Satış Yİ-ÜFE: ${result.satisYiUfe.toFixed(2)}`,
      `Endeks Oranı: ${result.endeksOrani.toFixed(4)}`,
      `Değerlenmiş Alış: ${formatMoney(result.degerlenmisAlis)}`,
      ``,
      `Gayrisafi Hasılat: ${formatMoney(result.gayrisafiHasilat)}`,
      `İstisna (${result.satisYili}): - ${formatMoney(result.istisnaTutari)}`,
      `Tapu Harcı (%2): - ${formatMoney(result.tapuHarci)}`,
      `Kredi Faizi: - ${formatMoney(result.kredi)}`,
      ``,
      `Vergiye Tabi Matrah: ${formatMoney(result.matrah)}`,
      `Gelir Vergisi: ${formatMoney(result.gelirVergisi)}`,
      `Damga Vergisi: ${formatMoney(result.damgaVergisi)}`,
    ];
    
    lines.forEach(line => {
      doc.text(line, 20, y);
      y += 6;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.text('Bu hesaplama bilgilendirme amaçlıdır ve hukuki bağlayıcılığı yoktur.', 20, 280);
    
    doc.save('deger-artis-vergisi-hesaplama.pdf');
    toast.success('PDF indirildi');
  };

  // Paylaş
  const handlePaylas = () => {
    if (!result || result.vergiYok) return;
    
    const text = `Gayrimenkul Değer Artış Vergisi Hesaplama\n\nToplam Vergi: ${formatMoney(result.toplamVergi)}\nVergi Yükü: %${result.vergiYukuOrani.toFixed(2)}\n\nmrxakademi.com`;
    
    if (navigator.share) {
      navigator.share({ title: 'Vergi Hesaplama', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Sonuç panoya kopyalandı');
    }
  };

  // WhatsApp CTA
  const handleWhatsApp = () => {
    const message = encodeURIComponent('Merhaba, mrxakademi üzerinden gayrimenkul değer artış vergisi hakkında bilgi almak istiyorum.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  // İletişim Formu Gönder
  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) {
      toast.error('Ad soyad ve telefon zorunludur');
      return;
    }
    
    const message = encodeURIComponent(
      `Yeni Talep\nAd: ${contactForm.name}\nTel: ${contactForm.phone}\nEmail: ${contactForm.email || '-'}\nKonu: ${contactForm.subject}\nMesaj: ${contactForm.message || '-'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    
    toast.success('Talebiniz iletildi');
    setShowContactForm(false);
    setContactForm({ name: '', phone: '', email: '', subject: 'Gayrimenkul Satış Vergisi Danışmanlığı', message: '' });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition">
            <Calculator className="w-6 h-6 text-orange-500" />
            <div>
              <div className="text-white font-semibold text-lg">Değer Artış Hesaplama</div>
              <div className="text-slate-400 text-xs">mrxakademi</div>
            </div>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Ana Sayfa</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm mb-6">
            <Calculator className="w-4 h-4" />
            <span>2026 Güncel Vergi Hesaplayıcı</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Gayrimenkul Değer Artış Kazancı<br />Vergisi Hesaplama
          </h1>
          <p className="text-lg text-slate-300 mb-2">
            Ev, Arsa, İş Yeri Satışında Ödeyeceğiniz Vergiyi Anında Hesaplayın
          </p>
          <p className="text-sm text-slate-500">
            193 sayılı GVK Mükerrer 80. Madde • Yİ-ÜFE Endeksli • Ücretsiz
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Hesaplama Formu
          </h2>

          {/* Edinim Şekli */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">1. Edinim Şekli</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'bedel', label: 'Bedel Karşılığı' },
                { value: 'miras', label: 'Miras' },
                { value: 'bagis', label: 'Bağış' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEdinimSekli(opt.value)}
                  className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                    edinimSekli === opt.value
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            {/* Alış Tarihi */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                2. Alış Tarihi <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="GG.AA.YYYY"
                  value={alisTarihi}
                  onChange={(e) => setAlisTarihi(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Örnek: 01.01.2022</p>
            </div>

            {/* Satış Tarihi */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                3. Satış Tarihi <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="GG.AA.YYYY"
                  value={satisTarihi}
                  onChange={(e) => setSatisTarihi(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Örnek: 01.01.2026</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            {/* Alış Fiyatı */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                4. Alış Fiyatı <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="500.000"
                  value={alisFiyati}
                  onChange={(e) => setAlisFiyati(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">₺</span>
              </div>
            </div>

            {/* Satış Fiyatı */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                5. Satış Fiyatı <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="4.000.000"
                  value={satisFiyati}
                  onChange={(e) => setSatisFiyati(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">₺</span>
              </div>
            </div>
          </div>

          {/* Kredi Faizi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              6. Konut Kredisi Faizi (Opsiyonel)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="0"
                value={krediFaizi}
                onChange={(e) => setKrediFaizi(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">₺</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Gayrimenkulün iktisabı için ödenen kredi faizi vergiden düşülebilir</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleHesapla}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold rounded-lg transition shadow-lg shadow-orange-500/20"
            >
              <Calculator className="w-5 h-5" />
              HESAPLA
            </button>
            <button
              onClick={handleTemizle}
              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition"
            >
              TEMİZLE
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mb-8">
            {result.vergiYok ? (
              // Vergi Yok
              <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-2 border-emerald-500/30 rounded-2xl p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-emerald-400 mb-3">✅ VERGİ YOK</h3>
                <p className="text-slate-300 max-w-2xl mx-auto">{result.mesaj}</p>
              </div>
            ) : (
              // Vergi Var
              <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800">
                <div className="text-center mb-8 pb-8 border-b border-slate-800">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm mb-4">
                    <TrendingUp className="w-4 h-4" />
                    HESAPLAMA SONUCU
                  </div>
                  <h3 className="text-sm text-slate-400 mb-2">Toplam Ödenecek Vergi</h3>
                  <div className="text-4xl sm:text-5xl font-bold text-white mb-4">
                    {formatMoney(result.toplamVergi)}
                  </div>
                  <p className="text-slate-400">
                    💡 Kârınızın <span className="text-orange-400 font-semibold">%{result.vergiYukuOrani.toFixed(1)}</span> vergi olarak ödenir
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center mt-6">
                    <button
                      onClick={handlePdfIndir}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    >
                      <Download className="w-4 h-4" />
                      PDF İndir
                    </button>
                    <button
                      onClick={handlePaylas}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    >
                      <Share2 className="w-4 h-4" />
                      Paylaş
                    </button>
                  </div>
                </div>

                {/* Detaylar */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Alış Bedeli</span>
                    <span className="text-white font-medium">{formatMoney(result.alis)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Satış Bedeli</span>
                    <span className="text-white font-medium">{formatMoney(result.satis)}</span>
                  </div>
                  <div className="border-t border-slate-800 my-2"></div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Alış Yİ-ÜFE</span>
                    <span className="text-slate-300">{result.alisYiUfe.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Satış Yİ-ÜFE</span>
                    <span className="text-slate-300">{result.satisYiUfe.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Endeks Oranı</span>
                    <span className="text-slate-300">{result.endeksOrani.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Değerlenmiş Alış</span>
                    <span className="text-white font-medium">{formatMoney(result.degerlenmisAlis)}</span>
                  </div>
                  <div className="border-t border-slate-800 my-2"></div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Gayrisafi Hasılat</span>
                    <span className="text-white font-medium">{formatMoney(result.gayrisafiHasilat)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">İstisna ({result.satisYili})</span>
                    <span className="text-red-400">- {formatMoney(result.istisnaTutari)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Tapu Harcı (%2)</span>
                    <span className="text-red-400">- {formatMoney(result.tapuHarci)}</span>
                  </div>
                  {result.kredi > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Kredi Faizi</span>
                      <span className="text-red-400">- {formatMoney(result.kredi)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 my-2"></div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Vergiye Tabi Matrah</span>
                    <span className="text-white font-semibold">{formatMoney(result.matrah)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Gelir Vergisi</span>
                    <span className="text-orange-400 font-medium">{formatMoney(result.gelirVergisi)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Damga Vergisi</span>
                    <span className="text-orange-400 font-medium">{formatMoney(result.damgaVergisi)}</span>
                  </div>
                  <div className="border-t-2 border-orange-500/30 my-3"></div>
                  
                  <div className="flex justify-between py-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 -mx-3 px-3 rounded-lg">
                    <span className="text-white font-bold">TOPLAM VERGİ</span>
                    <span className="text-orange-400 font-bold text-lg">{formatMoney(result.toplamVergi)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Section - Uzman Desteği */}
            <div className="mt-8 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">📞 Uzman Desteği Alın</h3>
                  <p className="text-slate-300">
                    Vergi planlaması ve gayrimenkul yatırımı hakkında ücretsiz danışmanlık
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition"
                  style={{ backgroundColor: '#25D366', color: 'white' }}
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp ile İletişime Geç
                </button>
                <button
                  onClick={() => setShowContactForm(!showContactForm)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
                >
                  <Phone className="w-5 h-5" />
                  Beni Arayın
                </button>
              </div>

              {/* Contact Form */}
              {showContactForm && (
                <form onSubmit={handleContactSubmit} className="mt-6 pt-6 border-t border-slate-700 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Ad Soyad *"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Telefon (05XX XXX XX XX) *"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                      required
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="E-posta (opsiyonel)"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  />
                  <select
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  >
                    <option>Gayrimenkul Satış Vergisi Danışmanlığı</option>
                    <option>Gayrimenkul Yatırım Danışmanlığı</option>
                    <option>Konut Kredisi Danışmanlığı</option>
                    <option>Diğer</option>
                  </select>
                  <textarea
                    placeholder="Mesajınız (opsiyonel, max 500 karakter)"
                    maxLength={500}
                    rows={3}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition"
                  >
                    Gönder
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Bilgilendirme - Accordion */}
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-orange-500" />
            Sıkça Sorulan Sorular
          </h2>

          <div className="space-y-3">
            {[
              {
                q: 'Gayrimenkul Değer Artış Kazancı Vergisi Nedir?',
                a: 'Bedel karşılığı edinilen gayrimenkullerin 5 yıl içinde satılması halinde, reel kazanç üzerinden alınan gelir vergisidir. Miras/bağış yoluyla edinilen gayrimenkuller muaftır.'
              },
              {
                q: '5 Yıl Kuralı Nasıl Çalışır?',
                a: 'Tapu tescil tarihinden itibaren 60 ay (5 tam yıl) geçtikten sonra yapılan satışlarda değer artış kazancı vergisi ödenmez. Örneğin 01.01.2020 tarihinde alınan bir gayrimenkul 01.01.2025 tarihinde veya sonrasında satılırsa vergi muafiyeti uygulanır.'
              },
              {
                q: 'Beyanname Ne Zaman Verilir?',
                a: 'Gayrimenkul satışının yapıldığı yılı takip eden yılın 1-31 Mart tarihleri arasında beyanname verilir. Verginin ödemesi ise Mart ve Temmuz aylarında iki eşit taksitte yapılır.'
              },
              {
                q: '2026 Vergi Dilimleri Neler?',
                a: '2026 yılı gelir vergisi dilimleri: 0-190.000 ₺: %15, 190.001-400.000 ₺: %20, 400.001-1.500.000 ₺: %27, 1.500.001-5.300.000 ₺: %35, 5.300.001 ₺ ve üzeri: %40 şeklindedir. Vergi hesaplaması artan oranlı (progressive) olarak yapılır.'
              },
              {
                q: '2026 İstisna Tutarı Nedir?',
                a: '2026 yılında gayrimenkul satışından elde edilen değer artış kazancının ilk 150.000 ₺\'si gelir vergisinden istisnadır. Bu tutar her yıl güncellenmektedir.'
              },
              {
                q: 'Hangi Giderler Vergiden Düşülebilir?',
                a: 'Satış bedeli üzerinden hesaplanan %2 tapu harcı ve gayrimenkulün iktisabı için ödenen konut kredisi faizi vergiye tabi matraha dahil edilmeden önce düşülebilir. Ayrıca alış bedeli Yİ-ÜFE endeksi ile değerlemeye tabi tutularak enflasyon etkisi elimine edilir.'
              }
            ].map((item, idx) => (
              <div key={item.q.slice(0, 30)} className="border border-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenAccordion(openAccordion === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-slate-800 hover:bg-slate-750 text-left transition"
                >
                  <span className="font-medium text-white">{item.q}</span>
                  {openAccordion === idx ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openAccordion === idx && (
                  <div className="px-5 py-4 bg-slate-900 text-slate-300 border-t border-slate-800">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400">
            <strong className="text-amber-400">Uyarı:</strong> Bu hesaplama bilgilendirme amaçlıdır ve hukuki bağlayıcılığı yoktur. Kesin vergi hesaplaması için mali müşavirinize danışınız.
          </p>
        </div>
      </main>
    </div>
  );
}
