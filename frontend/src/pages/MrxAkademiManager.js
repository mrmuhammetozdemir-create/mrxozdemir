import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  BookOpen, Radio, Users, ClipboardList, CreditCard, FileText,
  FolderOpen, Building2, GraduationCap, BarChart3, ChevronDown, ChevronUp,
  User, CheckCircle, Clock, XCircle, Loader2, Plus, Trash2, Edit,
  Save, X, Eye, TrendingUp, Award, MapPin, Target, ArrowLeft,
  Home, Layers
} from 'lucide-react';
import api from '@/utils/api';
import EducationManagerPage from '@/pages/EducationManager';
import { LiveStreamsTab, SupervisionTab, ExamsTab, AiExamAssistant } from '@/pages/PanelManager';

function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }; }

// ─── Accordion Section ────────────────────────────────────────────────────────
function Section({ id, title, icon: Icon, iconBg, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.04)]" data-testid={`section-${id}`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
        data-testid={`section-toggle-${id}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">{title}</span>
          {badge !== undefined && (
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 py-5">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function AcademyStats({ refreshKey = 0 }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/academy-stats', { headers: authHeaders() })
      .then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [refreshKey]);

  const cards = [
    { label: 'Öğrenci', value: stats.students, icon: Users, bg: 'bg-indigo-600' },
    { label: 'Kurs', value: stats.courses, icon: BookOpen, bg: 'bg-amber-500' },
    { label: 'Canlı Yayın', value: stats.streams, icon: Radio, bg: 'bg-red-500' },
    { label: 'Süpervizyon', value: stats.supervision, icon: MapPin, bg: 'bg-blue-600' },
    { label: 'Sınav', value: stats.exams, icon: ClipboardList, bg: 'bg-purple-600' },
    { label: 'Sınav Girişi', value: stats.exam_attempts, icon: Target, bg: 'bg-slate-700' },
    { label: 'Ödeme', value: stats.payments, icon: CreditCard, bg: 'bg-emerald-600' },
    { label: 'Sözleşme', value: stats.contracts, icon: FileText, bg: 'bg-teal-600' },
  ];

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <div key={c.label} className={`${c.bg} rounded-xl p-3.5 text-white`}>
            <div className="flex items-center justify-between mb-1">
              <Icon className="w-4 h-4 opacity-80" />
              <span className="text-2xl font-black leading-none">{c.value ?? 0}</span>
            </div>
            <p className="text-[11px] font-semibold opacity-80">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Öğrenci Listesi + Detay ──────────────────────────────────────────────────
function StudentsSection() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/students', { headers: authHeaders() })
      .then(r => setStudents(r.data)).catch(() => setStudents([])).finally(() => setLoading(false));
  }, []);

  const openDetail = async (uid) => {
    setSelected(uid); setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/students/${uid}`, { headers: authHeaders() });
      setDetail(data);
    } catch { toast.error('Detay yüklenemedi'); }
    finally { setDetailLoading(false); }
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div>
        <button onClick={() => { setSelected(null); setDetail(null); }}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Öğrenci Listesi
        </button>

        {detailLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : detail ? (
          <div className="space-y-5">
            {/* User Header */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">{detail.user?.full_name || detail.user?.email}</p>
                <p className="text-sm text-slate-500">{detail.user?.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">Kayıt: {detail.user?.created_at?.slice(0, 10) || '—'}</p>
              </div>
            </div>

            <Tabs defaultValue="progress">
              <TabsList className="bg-slate-100">
                <TabsTrigger value="progress" className="text-xs">Kurs İlerlemesi</TabsTrigger>
                <TabsTrigger value="exams" className="text-xs">Sınavlar</TabsTrigger>
                <TabsTrigger value="files" className="text-xs">Dosyalar</TabsTrigger>
                <TabsTrigger value="payments" className="text-xs">Ödemeler</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="mt-4 space-y-3">
                {detail.progress?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Henüz kurs başlanmadı.</p>
                ) : detail.progress?.map(c => (
                  <div key={c.course_id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.progress_pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{c.completed}/{c.total} ders</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${c.progress_pct >= 90 ? 'bg-emerald-100 text-emerald-700' : c.progress_pct > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.progress_pct}%
                    </span>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="exams" className="mt-4 space-y-3">
                {detail.exam_attempts?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Henüz sınava girilmedi.</p>
                ) : detail.exam_attempts?.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{a.exam_title}</p>
                      <p className="text-xs text-slate-400">{a.completed_at?.slice(0, 16).replace('T', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${a.score >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>{a.score}</span>
                      {a.passed
                        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="files" className="mt-4 space-y-2">
                {detail.files?.length === 0
                  ? <p className="text-sm text-slate-400 text-center py-6">Dosya yok.</p>
                  : detail.files?.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 text-sm">
                      <span className="font-medium text-slate-800">{f.file_name}</span>
                      <span className="text-xs text-slate-400">{f.created_at?.slice(0, 10)}</span>
                    </div>
                  ))}
              </TabsContent>

              <TabsContent value="payments" className="mt-4 space-y-2">
                {detail.payments?.length === 0
                  ? <p className="text-sm text-slate-400 text-center py-6">Ödeme kaydı yok.</p>
                  : detail.payments?.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 text-sm">
                      <span className="font-medium text-slate-800">{p.course_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">{p.amount}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.status === 'completed' ? 'Ödendi' : 'Bekliyor'}
                        </span>
                      </div>
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ad veya e-posta ara..."
        data-testid="student-search" className="text-sm" />
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          Öğrenci bulunamadı.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-bold text-slate-500 px-4 py-3">Öğrenci</th>
                <th className="text-center text-xs font-bold text-slate-500 px-3 py-3 hidden sm:table-cell">Kurs</th>
                <th className="text-center text-xs font-bold text-slate-500 px-3 py-3 hidden sm:table-cell">Ders</th>
                <th className="text-center text-xs font-bold text-slate-500 px-3 py-3 hidden md:table-cell">Sınav</th>
                <th className="text-center text-xs font-bold text-slate-500 px-3 py-3 hidden md:table-cell">En İyi Puan</th>
                <th className="text-right text-xs font-bold text-slate-500 px-4 py-3">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(s => (
                <tr key={s.user_id} data-testid={`student-row-${s.user_id}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-xs">{s.full_name || '—'}</p>
                        <p className="text-slate-400 text-[10px] truncate">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <span className="text-xs font-bold text-slate-700">{s.courses_enrolled}</span>
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <span className="text-xs font-bold text-slate-700">{s.completed_lessons}</span>
                  </td>
                  <td className="px-3 py-3 text-center hidden md:table-cell">
                    <span className="text-xs font-bold text-slate-700">{s.exam_attempts}</span>
                  </td>
                  <td className="px-3 py-3 text-center hidden md:table-cell">
                    <span className={`text-xs font-black ${s.best_score >= 70 ? 'text-emerald-600' : s.best_score > 0 ? 'text-yellow-600' : 'text-slate-400'}`}>
                      {s.best_score > 0 ? s.best_score : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openDetail(s.user_id)}
                      data-testid={`view-student-${s.user_id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 ml-auto transition-colors">
                      <Eye className="w-3.5 h-3.5" /> İncele
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Ödemeler Yönetimi ────────────────────────────────────────────────────────
function PaymentsAdminSection({ students, onCrudSuccess }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/payments', { headers: authHeaders() })
      .then(r => setPayments(r.data)).catch(() => setPayments([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.course_name || !form.user_id) { toast.error('Kullanıcı ve kurs adı zorunlu'); return; }
    setSaving(true);
    try {
      if (editId) { await api.put(`/admin/payments/${editId}`, form, { headers: authHeaders() }); toast.success('Güncellendi'); }
      else { await api.post('/admin/payments', form, { headers: authHeaders() }); toast.success('Eklendi'); }
      setForm(null); setEditId(null); load(); onCrudSuccess?.();
    } catch { toast.error('Kayıt başarısız'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Silinsin mi?')) return;
    await api.delete(`/admin/payments/${id}`, { headers: authHeaders() });
    toast.success('Silindi'); load(); onCrudSuccess?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setForm({ user_id: '', course_name: '', amount: '', status: 'pending', notes: '' }); setEditId(null); }}
          className="bg-slate-900 hover:bg-slate-700 text-white h-8 text-xs" data-testid="add-payment-btn">
          <Plus className="w-3.5 h-3.5 mr-1" /> Ödeme Ekle
        </Button>
      </div>

      {form && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-slate-800">{editId ? 'Ödeme Düzenle' : 'Yeni Ödeme'}</h4>
            <button onClick={() => { setForm(null); setEditId(null); }}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Kullanıcı *</Label>
              <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}>
                <SelectTrigger data-testid="payment-user-select"><SelectValue placeholder="Kullanıcı seç" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || s.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Kurs Adı *</Label>
              <Input value={form.course_name} onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))}
                placeholder="Arsa Yatırım Uzmanlığı" data-testid="payment-course-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Tutar</Label>
              <Input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="₺2.500" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Durum</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setForm(null); setEditId(null); }}>İptal</Button>
            <Button size="sm" onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white" data-testid="save-payment-btn">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />} Kaydet
            </Button>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        : payments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">Ödeme kaydı yok.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-bold text-slate-500 px-4 py-3">Kullanıcı ID</th>
                  <th className="text-left text-xs font-bold text-slate-500 px-3 py-3">Kurs</th>
                  <th className="text-left text-xs font-bold text-slate-500 px-3 py-3 hidden sm:table-cell">Tutar</th>
                  <th className="text-left text-xs font-bold text-slate-500 px-3 py-3">Durum</th>
                  <th className="text-right text-xs font-bold text-slate-500 px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-xs text-slate-500 truncate max-w-[80px]">{p.user_id?.slice(0, 8)}…</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800 truncate">{p.course_name}</td>
                    <td className="px-3 py-2.5 text-slate-600 hidden sm:table-cell">{p.amount}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status === 'completed' ? 'Ödendi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setForm({ ...p }); setEditId(p.id); }} className="p-1 text-slate-400 hover:text-blue-600 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(p.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ─── Sözleşmeler Yönetimi ─────────────────────────────────────────────────────
function ContractsAdminSection({ students, onCrudSuccess }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/contracts', { headers: authHeaders() })
      .then(r => setContracts(r.data)).catch(() => setContracts([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.contract_name || !form.user_id) { toast.error('Kullanıcı ve sözleşme adı zorunlu'); return; }
    setSaving(true);
    try {
      if (editId) { await api.put(`/admin/contracts/${editId}`, form, { headers: authHeaders() }); toast.success('Güncellendi'); }
      else { await api.post('/admin/contracts', form, { headers: authHeaders() }); toast.success('Eklendi'); }
      setForm(null); setEditId(null); load(); onCrudSuccess?.();
    } catch { toast.error('Kayıt başarısız'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Silinsin mi?')) return;
    await api.delete(`/admin/contracts/${id}`, { headers: authHeaders() });
    toast.success('Silindi'); load(); onCrudSuccess?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setForm({ user_id: '', contract_name: '', status: 'pending', notes: '' }); setEditId(null); }}
          className="bg-slate-900 hover:bg-slate-700 text-white h-8 text-xs" data-testid="add-contract-btn">
          <Plus className="w-3.5 h-3.5 mr-1" /> Sözleşme Ekle
        </Button>
      </div>

      {form && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-slate-800">{editId ? 'Düzenle' : 'Yeni Sözleşme'}</h4>
            <button onClick={() => { setForm(null); setEditId(null); }}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Kullanıcı *</Label>
              <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}>
                <SelectTrigger data-testid="contract-user-select"><SelectValue placeholder="Kullanıcı seç" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || s.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Sözleşme Adı *</Label>
              <Input value={form.contract_name} onChange={e => setForm(f => ({ ...f, contract_name: e.target.value }))}
                placeholder="Eğitim Hizmet Sözleşmesi" data-testid="contract-name-input" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Durum</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Onaylandı</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setForm(null); setEditId(null); }}>İptal</Button>
            <Button size="sm" onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white" data-testid="save-contract-btn">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />} Kaydet
            </Button>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        : contracts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">Sözleşme kaydı yok.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-bold text-slate-500 px-4 py-3">Kullanıcı ID</th>
                  <th className="text-left text-xs font-bold text-slate-500 px-3 py-3">Sözleşme</th>
                  <th className="text-left text-xs font-bold text-slate-500 px-3 py-3">Durum</th>
                  <th className="text-right text-xs font-bold text-slate-500 px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-xs text-slate-500">{c.user_id?.slice(0, 8)}…</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{c.contract_name}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.status === 'approved' ? 'Onaylandı' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setForm({ ...c }); setEditId(c.id); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(c.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ─── Dosyalar Yönetimi ────────────────────────────────────────────────────────
function FilesAdminSection({ students, onCrudSuccess }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selUser, setSelUser] = useState('');

  const load = useCallback(() => {
    api.get('/admin/all-files', { headers: authHeaders() })
      .then(r => setFiles(r.data)).catch(() => setFiles([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.file_name || !selUser) { toast.error('Kullanıcı ve dosya adı zorunlu'); return; }
    setSaving(true);
    try {
      await api.post(`/admin/files/${selUser}`, { file_name: form.file_name, file_url: form.file_url, file_type: 'document' }, { headers: authHeaders() });
      toast.success('Dosya eklendi'); setForm(null); setSelUser(''); load(); onCrudSuccess?.();
    } catch { toast.error('Eklenemedi'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Silinsin mi?')) return;
    await api.delete(`/admin/files/${id}`, { headers: authHeaders() });
    toast.success('Silindi'); load(); onCrudSuccess?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setForm({ file_name: '', file_url: '' })}
          className="bg-slate-900 hover:bg-slate-700 text-white h-8 text-xs" data-testid="add-file-admin-btn">
          <Plus className="w-3.5 h-3.5 mr-1" /> Dosya Ekle
        </Button>
      </div>

      {form && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-slate-800">Yeni Dosya</h4>
            <button onClick={() => setForm(null)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Kullanıcı *</Label>
              <Select value={selUser} onValueChange={setSelUser}>
                <SelectTrigger data-testid="file-user-select"><SelectValue placeholder="Kullanıcı seç" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || s.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Dosya Adı *</Label>
              <Input value={form.file_name} onChange={e => setForm(f => ({ ...f, file_name: e.target.value }))}
                placeholder="Sertifika.pdf" data-testid="file-name-input" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Dosya URL (opsiyonel)</Label>
              <Input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setForm(null)}>İptal</Button>
            <Button size="sm" onClick={save} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white" data-testid="save-file-admin-btn">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />} Kaydet
            </Button>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        : files.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">Dosya kaydı yok.</div>
        ) : (
          <div className="space-y-2">
            {files.map(f => {
              const student = students.find(s => s.user_id === f.user_id);
              return (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{f.file_name}</p>
                    <p className="text-xs text-slate-400">{student?.full_name || student?.email || f.user_id?.slice(0, 8)} • {f.created_at?.slice(0, 10)}</p>
                  </div>
                  <button onClick={() => del(f.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ─── Gayrimenkul Araçları (Quick Links) ───────────────────────────────────────
function GayrimenkulLinks({ onNavigate }) {
  const links = [
    { id: 'toki', label: 'e-Konut Yönetimi', icon: Building2, color: 'bg-blue-600', desc: 'Projeler, galeriler, haritalar' },
    { id: 'eipat', label: 'e-İPAT Yönetimi', icon: Layers, color: 'bg-teal-600', desc: 'Arsa parsel analizi' },
    { id: 'mega', label: 'Mega Projeler', icon: MapPin, color: 'bg-cyan-600', desc: 'Altyapı ve büyük projeler' },
    { id: 'opportunities', label: 'Arsa Fırsatları', icon: Target, color: 'bg-orange-500', desc: 'Yatırım fırsatları' },
    { id: 'market', label: 'Piyasa Analizi', icon: BarChart3, color: 'bg-violet-600', desc: 'Piyasa verileri' },
    { id: 'community', label: 'Topluluk', icon: Users, color: 'bg-purple-600', desc: 'Forum gönderileri' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {links.map(l => {
        const Icon = l.icon;
        return (
          <button key={l.id} onClick={() => onNavigate(l.id)}
            data-testid={`gayrimenkul-link-${l.id}`}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left">
            <div className={`w-8 h-8 rounded-lg ${l.color} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{l.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{l.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main MrxAkademi Manager ──────────────────────────────────────────────────
export default function MrxAkademiManager({ onNavigate }) {
  const [students, setStudents] = useState([]);
  const [statsKey, setStatsKey] = useState(0);
  const refreshStats = () => setStatsKey(k => k + 1);

  useEffect(() => {
    api.get('/admin/students', { headers: authHeaders() })
      .then(r => setStudents(r.data)).catch(() => setStudents([]));
  }, []);

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              mrx<span className="text-emerald-600">akademi</span>
            </h2>
            <p className="text-xs text-slate-500">Tüm eğitim ve gayrimenkul araçlarını tek panelden yönet</p>
          </div>
        </div>
      </div>

      {/* Academy Stats */}
      <AcademyStats refreshKey={statsKey} />

      {/* Accordion Sections */}
      <div className="space-y-3">

        <Section id="education" title="Eğitimler & Kurs İçerikleri" icon={BookOpen} iconBg="bg-amber-500" defaultOpen={false}>
          <EducationManagerPage />
        </Section>

        <Section id="live-streams" title="Canlı Yayınlar" icon={Radio} iconBg="bg-red-500" defaultOpen={false}>
          <LiveStreamsTab />
        </Section>

        <Section id="supervision" title="Süpervizyon Etkinlikleri" icon={MapPin} iconBg="bg-blue-600" defaultOpen={false}>
          <SupervisionTab />
        </Section>

        <Section id="exams" title="Eğitim Sınavları" icon={ClipboardList} iconBg="bg-purple-600" defaultOpen={false}>
          <div className="space-y-4">
            <AiExamAssistant onExtracted={() => {}} />
            <ExamsTab />
          </div>
        </Section>

        <Section id="students" title="Öğrenci Takibi" icon={Users} iconBg="bg-indigo-600" badge={students.length} defaultOpen={false}>
          <StudentsSection />
        </Section>

        <Section id="payments" title="Ödemeler" icon={CreditCard} iconBg="bg-emerald-600" defaultOpen={false}>
          <PaymentsAdminSection students={students} onCrudSuccess={refreshStats} />
        </Section>

        <Section id="contracts" title="Sözleşmeler" icon={FileText} iconBg="bg-teal-600" defaultOpen={false}>
          <ContractsAdminSection students={students} onCrudSuccess={refreshStats} />
        </Section>

        <Section id="files" title="Dosya Yönetimi" icon={FolderOpen} iconBg="bg-slate-600" defaultOpen={false}>
          <FilesAdminSection students={students} onCrudSuccess={refreshStats} />
        </Section>

        <Section id="gayrimenkul" title="Gayrimenkul Araçları" icon={Building2} iconBg="bg-cyan-600" defaultOpen={false}>
          <GayrimenkulLinks onNavigate={onNavigate} />
        </Section>

      </div>
    </div>
  );
}
