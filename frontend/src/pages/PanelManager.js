import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit, Save, X, Radio, Users, ClipboardList,
  CalendarDays, MapPin, CheckCircle, Clock, AlertCircle, Loader2,
  ChevronDown, ChevronUp, BookOpen, Sparkles, FileUp, Bot, UploadCloud
} from 'lucide-react';
import api from '@/utils/api';


const BLANK_STREAM = { title: '', date: '', status: 'upcoming', platform: 'Zoom', join_url: '', description: '' };
const BLANK_SUPERVISION = { title: '', location: '', city: '', date: '', status: 'upcoming', capacity: 20, registered: 0, description: '' };
const BLANK_EXAM = { course_id: '', title: '', pass_score: 70, duration_minutes: 30, questions: [] };
const BLANK_Q = { id: '', text: '', options: ['', '', '', ''], correct_answer: '' };

const STATUS_OPTIONS_STREAM = [
  { value: 'upcoming', label: 'Yakında' },
  { value: 'live', label: 'Canlı' },
  { value: 'ended', label: 'Sona Erdi' },
];
const STATUS_OPTIONS_SUPERVISION = [
  { value: 'upcoming', label: 'Yakında' },
  { value: 'ended', label: 'Sona Erdi' },
];

// ========== STATS BAR ==========
function StatsBar({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Canlı Yayın', value: stats.streams || 0, icon: Radio, color: 'bg-red-50 text-red-600' },
        { label: 'Süpervizyon', value: stats.supervision || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: 'Sınav', value: stats.exams || 0, icon: ClipboardList, color: 'bg-amber-50 text-amber-600' },
        { label: 'Aktif Kullanıcı', value: stats.active_users || 0, icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
      ].map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className={`${s.color} rounded-xl p-4 flex items-center gap-3 border border-black/5`}>
            <div className="shrink-0"><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-70">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ========== LIVE STREAMS TAB ==========
function LiveStreamsTab({ onUpdate }) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/live-streams', );
      setStreams(data);
    } catch { toast.error('Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.date) { toast.error('Başlık ve tarih zorunlu'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/live-streams/${editId}`, form, );
        toast.success('Güncellendi');
      } else {
        await api.post('/admin/live-streams', form, );
        toast.success('Eklendi');
      }
      setForm(null); setEditId(null); load(); if (onUpdate) onUpdate();
    } catch { toast.error('Kayıt başarısız'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Silinsin mi?')) return;
    await api.delete(`/admin/live-streams/${id}`, );
    toast.success('Silindi'); load(); if (onUpdate) onUpdate();
  };

  const statusBadge = (s) => {
    if (s === 'live') return <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />CANLI</span>;
    if (s === 'upcoming') return <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Yakında</span>;
    return <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">Sona Erdi</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Radio className="w-4 h-4 text-red-500" />Canlı Yayınlar</h3>
        <Button size="sm" onClick={() => { setForm({ ...BLANK_STREAM }); setEditId(null); }}
          data-testid="add-stream-btn" className="bg-slate-900 hover:bg-slate-700 text-white h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Yayın Ekle
        </Button>
      </div>

      {/* Form */}
      {form && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">{editId ? 'Yayın Düzenle' : 'Yeni Canlı Yayın'}</h4>
            <Button variant="ghost" size="sm" onClick={() => { setForm(null); setEditId(null); }} className="h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Başlık *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Yayın başlığı" data-testid="stream-title-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Tarih & Saat *</Label>
              <Input type="datetime-local" value={form.date?.slice(0, 16) || ''}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                data-testid="stream-date-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Durum</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="stream-status-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS_STREAM.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Platform</Label>
              <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Zoom', 'YouTube', 'Teams', 'Meet'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Katılım Linki</Label>
              <Input value={form.join_url} onChange={e => setForm(f => ({ ...f, join_url: e.target.value }))}
                placeholder="https://zoom.us/..." data-testid="stream-url-input" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Açıklama</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Yayın hakkında kısa açıklama" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setForm(null); setEditId(null); }}>İptal</Button>
            <Button size="sm" onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white" data-testid="save-stream-btn">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Kaydet
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : streams.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          Henüz canlı yayın eklenmemiş.
        </div>
      ) : (
        <div className="space-y-2">
          {streams.map(s => (
            <div key={s.id} data-testid={`stream-row-${s.id}`}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{s.title}</p>
                  <p className="text-xs text-slate-500">{s.platform} • {new Date(s.date).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusBadge(s.status)}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                  onClick={() => { setForm({ ...s }); setEditId(s.id); }}
                  data-testid={`edit-stream-${s.id}`}><Edit className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                  onClick={() => del(s.id)} data-testid={`delete-stream-${s.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== SUPERVISION TAB ==========
function SupervisionTab({ onUpdate }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/supervision', );
      setEvents(data);
    } catch { toast.error('Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.date) { toast.error('Başlık ve tarih zorunlu'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/supervision/${editId}`, form, );
        toast.success('Güncellendi');
      } else {
        await api.post('/admin/supervision', form, );
        toast.success('Eklendi');
      }
      setForm(null); setEditId(null); load(); if (onUpdate) onUpdate();
    } catch { toast.error('Kayıt başarısız'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Silinsin mi?')) return;
    await api.delete(`/admin/supervision/${id}`, );
    toast.success('Silindi'); load(); if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" />Süpervizyon Etkinlikleri</h3>
        <Button size="sm" onClick={() => { setForm({ ...BLANK_SUPERVISION }); setEditId(null); }}
          data-testid="add-supervision-btn" className="bg-slate-900 hover:bg-slate-700 text-white h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Etkinlik Ekle
        </Button>
      </div>

      {form && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">{editId ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'}</h4>
            <Button variant="ghost" size="sm" onClick={() => { setForm(null); setEditId(null); }} className="h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Başlık *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Etkinlik adı" data-testid="supervision-title-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Lokasyon</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="İstanbul - Kadıköy Ofis" data-testid="supervision-location-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Şehir</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="İstanbul" data-testid="supervision-city-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Tarih *</Label>
              <Input type="datetime-local" value={form.date?.slice(0, 16) || ''}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                data-testid="supervision-date-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Durum</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="supervision-status-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS_SUPERVISION.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Kapasite</Label>
              <Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                data-testid="supervision-capacity-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Mevcut Kayıt</Label>
              <Input type="number" value={form.registered} onChange={e => setForm(f => ({ ...f, registered: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Açıklama</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setForm(null); setEditId(null); }}>İptal</Button>
            <Button size="sm" onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white" data-testid="save-supervision-btn">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Kaydet
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          Henüz etkinlik eklenmemiş.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(e => (
            <div key={e.id} data-testid={`supervision-row-${e.id}`}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{e.title}</p>
                  <p className="text-xs text-slate-500">{e.city} • {new Date(e.date).toLocaleDateString('tr-TR')} • {e.registered}/{e.capacity} kayıtlı</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${e.status === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  {e.status === 'upcoming' ? 'Yakında' : 'Sona Erdi'}
                </span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                  onClick={() => { setForm({ ...e }); setEditId(e.id); }}
                  data-testid={`edit-supervision-${e.id}`}><Edit className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                  onClick={() => del(e.id)} data-testid={`delete-supervision-${e.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== AI SINAV ASISTANI ==========
function AiExamAssistant({ onExtracted }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Sadece PDF dosyası yükleyin');
      return;
    }
    setFile(f);
  };

  const extract = async () => {
    if (!file) { toast.error('Önce bir PDF dosyası seçin'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/admin/exams/extract-from-pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!data.questions?.length) { toast.error('PDF\'de soru bulunamadı'); return; }
      toast.success(`${data.questions.length} soru çıkarıldı!`);
      onExtracted(data);
      setFile(null);
      setOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'PDF işlenirken hata oluştu';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50/70 transition-colors"
        onClick={() => setOpen(o => !o)}
        data-testid="ai-assistant-toggle"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-purple-900">AI Sınav Asistanı</p>
            <p className="text-[10px] text-purple-500 font-medium">PDF yükle → Sorular otomatik oluşsun</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Gemini AI</span>
          {open ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            data-testid="pdf-drop-zone"
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 select-none
              ${dragging ? 'border-purple-500 bg-purple-100/60 scale-[1.01]' : file ? 'border-emerald-400 bg-emerald-50' : 'border-purple-300 hover:border-purple-400 hover:bg-purple-50/50'}`}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden"
              onChange={e => handleFile(e.target.files?.[0])} data-testid="pdf-file-input" />

            {file ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-800 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-emerald-600">{(file.size / 1024).toFixed(1)} KB — PDF hazır</p>
                </div>
                <button className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
                  onClick={e => { e.stopPropagation(); setFile(null); }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <UploadCloud className="w-8 h-8 text-purple-300 mx-auto mb-1.5" />
                <p className="text-sm font-semibold text-purple-700">PDF dosyasını buraya sürükle</p>
                <p className="text-xs text-purple-400 mt-0.5">veya tıkla ve seç</p>
              </div>
            )}
          </div>

          {/* Extract button */}
          <Button
            onClick={extract}
            disabled={!file || loading}
            data-testid="extract-pdf-btn"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-10 shadow-md"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                AI Analiz Ediyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Soruları Otomatik Çıkar
              </span>
            )}
          </Button>

          <p className="text-[10px] text-purple-400 text-center">
            Çoktan seçmeli sorular otomatik tespit edilir ve forma aktarılır
          </p>
        </div>
      )}
    </div>
  );
}

// ========== EXAMS TAB ==========
function ExamsTab({ onUpdate }) {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedQ, setExpandedQ] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [examsRes, coursesRes] = await Promise.all([
        api.get('/admin/exams', ),
        api.get('/admin/education/courses', ),
      ]);
      setExams(examsRes.data);
      setCourses(coursesRes.data);
    } catch { toast.error('Yüklenemedi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addQuestion = () => {
    const newQ = { ...BLANK_Q, id: `q${Date.now()}` };
    setForm(f => ({ ...f, questions: [...(f.questions || []), newQ] }));
    setExpandedQ(newQ.id);
  };

  const updateQuestion = (idx, field, value) => {
    setForm(f => {
      const qs = [...f.questions];
      qs[idx] = { ...qs[idx], [field]: value };
      return { ...f, questions: qs };
    });
  };

  const updateOption = (qIdx, oIdx, value) => {
    setForm(f => {
      const qs = [...f.questions];
      const opts = [...qs[qIdx].options];
      opts[oIdx] = value;
      qs[qIdx] = { ...qs[qIdx], options: opts };
      return { ...f, questions: qs };
    });
  };

  const removeQuestion = (idx) => {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    if (!form.title) { toast.error('Sınav başlığı zorunlu'); return; }
    if (!form.questions?.length) { toast.error('En az 1 soru ekleyin'); return; }
    const invalid = form.questions.find(q => !q.text || !q.correct_answer || q.options.some(o => !o));
    if (invalid) { toast.error('Tüm soru alanları doldurulmalı'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/exams/${editId}`, form, );
        toast.success('Güncellendi');
      } else {
        await api.post('/admin/exams', form, );
        toast.success('Eklendi');
      }
      setForm(null); setEditId(null); load(); if (onUpdate) onUpdate();
    } catch { toast.error('Kayıt başarısız'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Silinsin mi?')) return;
    await api.delete(`/admin/exams/${id}`, );
    toast.success('Silindi'); load(); if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-amber-500" />Eğitim Sınavları</h3>
        <Button size="sm" onClick={() => { setForm({ ...BLANK_EXAM, questions: [] }); setEditId(null); }}
          data-testid="add-exam-btn" className="bg-slate-900 hover:bg-slate-700 text-white h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Sınav Ekle
        </Button>
      </div>

      {/* AI Assistant */}
      {!form && (
        <AiExamAssistant onExtracted={(data) => {
          setForm({ ...BLANK_EXAM, ...data });
          setEditId(null);
          setExpandedQ(null);
          toast.success('Form otomatik dolduruldu! İnceleyip kaydedin.');
        }} />
      )}

      {form && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">{editId ? 'Sınav Düzenle' : 'Yeni Sınav'}</h4>
            <Button variant="ghost" size="sm" onClick={() => { setForm(null); setEditId(null); }} className="h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Sınav Başlığı *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Sınav adı" data-testid="exam-title-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Bağlı Kurs</Label>
              <Select value={form.course_id || "__none__"} onValueChange={v => setForm(f => ({ ...f, course_id: v === "__none__" ? "" : v }))}>
                <SelectTrigger data-testid="exam-course-select"><SelectValue placeholder="Kurs seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Kurs seçin —</SelectItem>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Geçme Notu</Label>
              <Input type="number" min={0} max={100} value={form.pass_score}
                onChange={e => setForm(f => ({ ...f, pass_score: parseInt(e.target.value) || 70 }))}
                data-testid="exam-pass-score-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Süre (dakika)</Label>
              <Input type="number" min={5} value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 30 }))} />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-semibold text-slate-600">Sorular ({form.questions?.length || 0})</Label>
              <Button size="sm" variant="outline" onClick={addQuestion} data-testid="add-question-btn" className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Soru Ekle
              </Button>
            </div>

            <div className="space-y-3">
              {form.questions?.map((q, qi) => (
                <div key={q.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                  >
                    <span className="text-xs font-semibold text-slate-700">
                      {qi + 1}. {q.text || 'Soru metni girin...'}
                    </span>
                    <div className="flex items-center gap-1">
                      {q.text && q.correct_answer ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                        onClick={e => { e.stopPropagation(); removeQuestion(qi); }}>
                        <X className="w-3 h-3" />
                      </Button>
                      {expandedQ === q.id ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </div>

                  {expandedQ === q.id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                      <div>
                        <Label className="text-xs font-semibold text-slate-500 mb-1 block">Soru Metni</Label>
                        <Textarea value={q.text} onChange={e => updateQuestion(qi, 'text', e.target.value)}
                          placeholder="Soru metnini girin" rows={2} data-testid={`q-text-${qi}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi}>
                            <Label className="text-xs text-slate-500 mb-1 block">Seçenek {String.fromCharCode(65 + oi)}</Label>
                            <Input value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                              placeholder={`Şık ${String.fromCharCode(65 + oi)}`}
                              data-testid={`q-opt-${qi}-${oi}`} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-500 mb-1 block">Doğru Cevap</Label>
                        <Select value={q.correct_answer} onValueChange={v => updateQuestion(qi, 'correct_answer', v)}>
                          <SelectTrigger data-testid={`q-answer-${qi}`}><SelectValue placeholder="Doğru şıkkı seçin" /></SelectTrigger>
                          <SelectContent>
                            {q.options.filter(o => o).map((opt, oi) => (
                              <SelectItem key={oi} value={opt}>{String.fromCharCode(65 + oi)}) {opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setForm(null); setEditId(null); }}>İptal</Button>
            <Button size="sm" onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white" data-testid="save-exam-btn">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Kaydet
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : exams.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          Henüz sınav eklenmemiş.
        </div>
      ) : (
        <div className="space-y-2">
          {exams.map(exam => {
            const course = courses.find(c => c.id === exam.course_id);
            return (
              <div key={exam.id} data-testid={`exam-row-${exam.id}`}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{exam.title}</p>
                    <p className="text-xs text-slate-500">
                      {course?.title || 'Kurs seçilmedi'} • {exam.questions?.length || 0} soru • Geçme: {exam.pass_score}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{exam.duration_minutes} dk</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                    onClick={() => { setForm({ ...exam }); setEditId(exam.id); setExpandedQ(null); }}
                    data-testid={`edit-exam-${exam.id}`}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                    onClick={() => del(exam.id)} data-testid={`delete-exam-${exam.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== MAIN PANEL MANAGER ==========
export { LiveStreamsTab, SupervisionTab, ExamsTab, AiExamAssistant };
export default function PanelManager() {
  const [stats, setStats] = useState({ streams: 0, supervision: 0, exams: 0, active_users: 0 });

  const refreshStats = useCallback(() => {
    api.get('/admin/panel-stats', )
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Kullanıcı Paneli Yönetimi</h2>
        <p className="text-sm text-slate-500">Canlı yayınlar, süpervizyon etkinlikleri ve sınavları buradan yönetin.</p>
      </div>

      <StatsBar stats={stats} />

      <Tabs defaultValue="streams">
        <TabsList className="mb-5 bg-slate-100">
          <TabsTrigger value="streams" data-testid="pm-tab-streams" className="gap-1.5">
            <Radio className="w-3.5 h-3.5" /> Canlı Yayınlar
          </TabsTrigger>
          <TabsTrigger value="supervision" data-testid="pm-tab-supervision" className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> Süpervizyon
          </TabsTrigger>
          <TabsTrigger value="exams" data-testid="pm-tab-exams" className="gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Sınavlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streams"><LiveStreamsTab onUpdate={refreshStats} /></TabsContent>
        <TabsContent value="supervision"><SupervisionTab onUpdate={refreshStats} /></TabsContent>
        <TabsContent value="exams"><ExamsTab onUpdate={refreshStats} /></TabsContent>
      </Tabs>
    </div>
  );
}
