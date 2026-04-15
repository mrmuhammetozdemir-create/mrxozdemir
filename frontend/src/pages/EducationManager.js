import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit, Save, X, Upload, Search, Copy, BookOpen, Mic,
  Video, FileText, Image as ImgIcon, Folder, RefreshCw, Play, Eye,
  Users, CheckCircle, Calendar, Clock, Link, ChevronDown, ChevronRight
} from 'lucide-react';
import api from '@/utils/api';

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const fileUrl = (p) => p ? `${BACKEND}/api/files/${p}` : null;

const BLANK_COURSE = { title: '', short_description: '', full_description: '', cover_image: '', promo_video: '', price: 0, discount_price: '', level: 'başlangıç', tags: [], status: 'active', order: 0, student_count: 0, rating: 5.0 };
const BLANK_SEMINAR = { title: '', description: '', date: '', time: '', duration: '', speaker: 'Muhammet Özdemir', seminar_type: 'free', location: '', zoom_link: '', cover_image: '', status: 'active' };

// ─── Courses Tab ──────────────────────────────────────────────────────────────
function CoursesTab() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(null); // null | BLANK_COURSE | existing
  const [editId, setEditId] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageUpload, setImageUpload] = useState(null);
  const imgRef = useRef();

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/admin/education/courses', );
    setCourses(data); setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!form.title) { toast.error('Başlık zorunlu'); return; }
    setSaving(true);
    try {
      let coverImage = form.cover_image;
      if (imageUpload) {
        const fd = new FormData(); fd.append('file', imageUpload); fd.append('folder', 'kurslar');
        const { data: med } = await api.post('/admin/education/media/upload', fd, );
        coverImage = med.storage_path;
      }
      const payload = { ...form, cover_image: coverImage, price: parseFloat(form.price) || 0, discount_price: form.discount_price ? parseFloat(form.discount_price) : null, order: parseInt(form.order) || 0 };
      if (editId) await api.put(`/admin/education/courses/${editId}`, payload, );
      else await api.post('/admin/education/courses', payload, );
      toast.success('Kaydedildi'); setForm(null); setEditId(null); setImageUpload(null); fetch();
    } catch { toast.error('Kayıt başarısız'); }
    finally { setSaving(false); }
  };

  const del = async (id) => { if (!window.confirm('Silinsin mi?')) return; await api.delete(`/admin/education/courses/${id}`, ); toast.success('Silindi'); fetch(); };

  const addModule = async (courseId) => {
    const title = prompt('Modül başlığı:');
    if (!title) return;
    await api.post(`/admin/education/courses/${courseId}/modules`, { title, order: 0 }, );
    fetch();
  };
  const delModule = async (courseId, moduleId) => { if (!window.confirm('Modül silinsin mi?')) return; await api.delete(`/admin/education/courses/${courseId}/modules/${moduleId}`, ); fetch(); };

  const addLesson = async (courseId, moduleId) => {
    const title = prompt('Ders başlığı:');
    if (!title) return;
    const video = prompt('Video URL (boş bırakılabilir):') || '';
    const duration = prompt('Süre (örn: 15 dk):') || '';
    await api.post(`/admin/education/courses/${courseId}/modules/${moduleId}/lessons`, { title, video_url: video, duration, is_preview: false, order: 0, pdf_files: [] }, );
    fetch();
  };
  const delLesson = async (courseId, moduleId, lessonId) => { if (!window.confirm('Ders silinsin mi?')) return; await api.delete(`/admin/education/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, ); fetch(); };

  if (form !== null) return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setForm(null); setEditId(null); setImageUpload(null); }} className="text-slate-500 hover:text-slate-800 transition-colors"><X className="w-5 h-5" /></button>
        <h3 className="text-lg font-bold text-slate-900">{editId ? 'Kursu Düzenle' : 'Yeni Kurs'}</h3>
      </div>
      <div className="space-y-4">
        {/* Cover Image */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5 block">Kapak Görseli</Label>
          <div className="flex items-center gap-3">
            {(imageUpload ? URL.createObjectURL(imageUpload) : fileUrl(form.cover_image)) ? (
              <img src={imageUpload ? URL.createObjectURL(imageUpload) : fileUrl(form.cover_image)} alt="" className="w-24 h-16 rounded-lg object-cover border" />
            ) : <div className="w-24 h-16 rounded-lg bg-slate-100 flex items-center justify-center border"><ImgIcon className="w-6 h-6 text-slate-300" /></div>}
            <Button type="button" variant="outline" size="sm" onClick={() => imgRef.current.click()}>
              <Upload className="w-3.5 h-3.5 mr-1" />Görsel Yükle
            </Button>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => setImageUpload(e.target.files[0])} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Label className="text-xs text-slate-500">Başlık *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="mt-1 h-9" /></div>
          <div className="sm:col-span-2"><Label className="text-xs text-slate-500">Kısa Açıklama</Label><Input value={form.short_description} onChange={e => setForm(f => ({...f, short_description: e.target.value}))} className="mt-1 h-9" /></div>
          <div className="sm:col-span-2"><Label className="text-xs text-slate-500">Tam Açıklama</Label><Textarea value={form.full_description} onChange={e => setForm(f => ({...f, full_description: e.target.value}))} className="mt-1 text-sm min-h-[100px] resize-none" /></div>
          <div><Label className="text-xs text-slate-500">Fiyat (₺)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className="mt-1 h-9" /></div>
          <div><Label className="text-xs text-slate-500">İndirimli Fiyat (₺)</Label><Input type="number" value={form.discount_price} onChange={e => setForm(f => ({...f, discount_price: e.target.value}))} className="mt-1 h-9" placeholder="Boş = indirim yok" /></div>
          <div>
            <Label className="text-xs text-slate-500">Seviye</Label>
            <Select value={form.level} onValueChange={v => setForm(f => ({...f, level: v}))}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="başlangıç">Başlangıç</SelectItem><SelectItem value="orta">Orta</SelectItem><SelectItem value="ileri">İleri</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Durum</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="draft">Taslak</SelectItem><SelectItem value="inactive">Pasif</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs text-slate-500">Öğrenci Sayısı</Label><Input type="number" value={form.student_count} onChange={e => setForm(f => ({...f, student_count: e.target.value}))} className="mt-1 h-9" /></div>
          <div><Label className="text-xs text-slate-500">Sıra</Label><Input type="number" value={form.order} onChange={e => setForm(f => ({...f, order: e.target.value}))} className="mt-1 h-9" /></div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-500">Etiketler (Enter ile ekle)</Label>
            <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
              {(form.tags || []).map(t => <span key={t} className="text-xs bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full flex items-center gap-1">{t}<button onClick={() => setForm(f => ({...f, tags: f.tags.filter(x => x !== t)}))} className="text-[#0F3D2E]/60 hover:text-[#0F3D2E]">×</button></span>)}
            </div>
            <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); setForm(f => ({...f, tags: [...(f.tags || []), tagInput.trim()]})); setTagInput(''); }}} placeholder="Etiket ekle (Enter)" className="h-9 text-sm" />
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full h-10 font-semibold" style={{ background: '#0F3D2E' }}>
          <Save className="w-4 h-4 mr-2" />{saving ? 'Kaydediliyor...' : 'Kursu Kaydet'}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-slate-900">Kurslar <span className="text-sm font-normal text-slate-400">({courses.length})</span></h3>
        <Button onClick={() => setForm({...BLANK_COURSE})} className="h-9 text-sm" style={{ background: '#0F3D2E' }}><Plus className="w-4 h-4 mr-1" />Yeni Kurs</Button>
      </div>
      {loading ? <div className="text-center py-12"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#0F3D2E', borderTopColor: 'transparent' }} /></div> :
      courses.length === 0 ? <div className="text-center py-16 text-slate-400"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">Henüz kurs eklenmemiş</p></div> : (
        <div className="space-y-4">
          {courses.map(c => (
            <div key={c.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 p-4 bg-white">
                {fileUrl(c.cover_image) ? <img src={fileUrl(c.cover_image)} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-14 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5 text-slate-400" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.level} · {c.price > 0 ? `₺${c.price}` : 'Ücretsiz'} · {(c.modules || []).length} modül · {(c.student_count || 0)} öğrenci</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.status === 'active' ? 'Aktif' : c.status === 'draft' ? 'Taslak' : 'Pasif'}</span>
                <div className="flex gap-1">
                  <button onClick={() => setOpenModules(o => ({...o, [c.id]: !o[c.id]}))} className="p-2 text-slate-400 hover:text-[#0F3D2E]">{openModules[c.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
                  <button onClick={() => { setForm({...BLANK_COURSE, ...c, discount_price: c.discount_price || '', tags: c.tags || []}); setEditId(c.id); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => del(c.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {openModules[c.id] && (
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-600">MODÜLLER</p>
                    <button onClick={() => addModule(c.id)} className="flex items-center gap-1 text-xs font-semibold text-[#0F3D2E] hover:underline"><Plus className="w-3.5 h-3.5" />Modül Ekle</button>
                  </div>
                  {(c.modules || []).length === 0 ? <p className="text-xs text-slate-400">Henüz modül yok</p> : (
                    <div className="space-y-2">
                      {(c.modules || []).sort((a,b) => a.order - b.order).map(mod => (
                        <div key={mod.module_id} className="bg-white rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between p-3">
                            <span className="text-sm font-medium text-slate-800">{mod.title} <span className="text-slate-400 text-xs">({(mod.lessons||[]).length} ders)</span></span>
                            <div className="flex gap-1">
                              <button onClick={() => addLesson(c.id, mod.module_id)} className="text-xs text-[#0F3D2E] hover:underline px-2">+ Ders</button>
                              <button onClick={() => delModule(c.id, mod.module_id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          {(mod.lessons || []).length > 0 && (
                            <div className="border-t border-slate-50 divide-y divide-slate-50">
                              {(mod.lessons || []).map(l => (
                                <div key={l.lesson_id} className="flex items-center gap-2 px-3 py-2">
                                  {l.video_url ? <Play className="w-3.5 h-3.5 text-[#C8A96A]" /> : <FileText className="w-3.5 h-3.5 text-slate-300" />}
                                  <span className="text-xs text-slate-600 flex-1">{l.title}</span>
                                  {l.duration && <span className="text-xs text-slate-400">{l.duration}</span>}
                                  {l.is_preview && <span className="text-[10px] text-emerald-600 font-medium">Önizleme</span>}
                                  <button onClick={() => delLesson(c.id, mod.module_id, l.lesson_id)} className="text-slate-300 hover:text-red-500 p-0.5"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Seminars Tab ─────────────────────────────────────────────────────────────
function SeminarsTab() {
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewRegsId, setViewRegsId] = useState(null);
  const [regs, setRegs] = useState([]);
  const [imageUpload, setImageUpload] = useState(null);
  const imgRef = useRef();

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/admin/education/seminars', );
    setSeminars(data); setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!form.title) { toast.error('Başlık zorunlu'); return; }
    setSaving(true);
    try {
      let coverImage = form.cover_image;
      if (imageUpload) {
        const fd = new FormData(); fd.append('file', imageUpload); fd.append('folder', 'seminerler');
        const { data: med } = await api.post('/admin/education/media/upload', fd, );
        coverImage = med.storage_path;
      }
      const payload = { ...form, cover_image: coverImage };
      if (editId) await api.put(`/admin/education/seminars/${editId}`, payload, );
      else await api.post('/admin/education/seminars', payload, );
      toast.success('Kaydedildi'); setForm(null); setEditId(null); setImageUpload(null); fetch();
    } catch { toast.error('Kayıt başarısız'); }
    finally { setSaving(false); }
  };

  const del = async (id) => { if (!window.confirm('Silinsin mi?')) return; await api.delete(`/admin/education/seminars/${id}`, ); toast.success('Silindi'); fetch(); };

  const loadRegs = async (seminarId) => {
    const { data } = await api.get(`/admin/education/seminars/${seminarId}/registrations`, );
    setRegs(data); setViewRegsId(seminarId);
  };

  if (viewRegsId) {
    const sem = seminars.find(s => s.id === viewRegsId);
    return (
      <div>
        <button onClick={() => setViewRegsId(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-5"><X className="w-4 h-4" />Geri</button>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{sem?.title}</h3>
        <p className="text-sm text-slate-500 mb-5">{regs.length} katılımcı</p>
        {regs.length === 0 ? <p className="text-sm text-slate-400">Kayıt yok</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm border rounded-xl overflow-hidden">
            <thead className="bg-slate-50"><tr>{['Ad Soyad','Telefon','E-posta','Kayıt Tarihi'].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{regs.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-slate-600">{r.phone}</td>
                <td className="px-4 py-3 text-slate-600">{r.email}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString('tr-TR')}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    );
  }

  if (form !== null) return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setForm(null); setEditId(null); }} className="text-slate-500 hover:text-slate-800"><X className="w-5 h-5" /></button>
        <h3 className="text-lg font-bold text-slate-900">{editId ? 'Semineri Düzenle' : 'Yeni Seminer'}</h3>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-xs text-slate-500 mb-1.5 block">Kapak Görseli</Label>
          <div className="flex items-center gap-3">
            {(imageUpload ? URL.createObjectURL(imageUpload) : fileUrl(form.cover_image)) ? (
              <img src={imageUpload ? URL.createObjectURL(imageUpload) : fileUrl(form.cover_image)} alt="" className="w-24 h-16 rounded-lg object-cover border" />
            ) : <div className="w-24 h-16 rounded-lg bg-slate-100 flex items-center justify-center border"><ImgIcon className="w-6 h-6 text-slate-300" /></div>}
            <Button type="button" variant="outline" size="sm" onClick={() => imgRef.current.click()}><Upload className="w-3.5 h-3.5 mr-1" />Görsel Yükle</Button>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => setImageUpload(e.target.files[0])} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Label className="text-xs text-slate-500">Başlık *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="mt-1 h-9" /></div>
          <div className="sm:col-span-2"><Label className="text-xs text-slate-500">Açıklama</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="mt-1 text-sm min-h-[80px] resize-none" /></div>
          <div><Label className="text-xs text-slate-500">Tarih</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="mt-1 h-9" /></div>
          <div><Label className="text-xs text-slate-500">Saat</Label><Input type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))} className="mt-1 h-9" /></div>
          <div><Label className="text-xs text-slate-500">Süre</Label><Input value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))} placeholder="örn: 60 dk" className="mt-1 h-9" /></div>
          <div><Label className="text-xs text-slate-500">Konuşmacı</Label><Input value={form.speaker} onChange={e => setForm(f => ({...f, speaker: e.target.value}))} className="mt-1 h-9" /></div>
          <div><Label className="text-xs text-slate-500">Tür</Label><Select value={form.seminar_type} onValueChange={v => setForm(f => ({...f, seminar_type: v}))}><SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Ücretsiz</SelectItem><SelectItem value="paid">Ücretli</SelectItem></SelectContent></Select></div>
          <div><Label className="text-xs text-slate-500">Durum</Label><Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}><SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="draft">Taslak</SelectItem><SelectItem value="inactive">Pasif</SelectItem></SelectContent></Select></div>
          <div className="sm:col-span-2"><Label className="text-xs text-slate-500">Zoom / Konum</Label><Input value={form.zoom_link} onChange={e => setForm(f => ({...f, zoom_link: e.target.value}))} placeholder="Zoom linki veya konum" className="mt-1 h-9" /></div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full h-10 font-semibold" style={{ background: '#0F3D2E' }}><Save className="w-4 h-4 mr-2" />{saving ? 'Kaydediliyor...' : 'Semineri Kaydet'}</Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-slate-900">Seminerler <span className="text-sm font-normal text-slate-400">({seminars.length})</span></h3>
        <Button onClick={() => setForm({...BLANK_SEMINAR})} className="h-9 text-sm" style={{ background: '#0F3D2E' }}><Plus className="w-4 h-4 mr-1" />Yeni Seminer</Button>
      </div>
      {loading ? <div className="text-center py-12"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#0F3D2E', borderTopColor: 'transparent' }} /></div> :
      seminars.length === 0 ? <div className="text-center py-16 text-slate-400"><Mic className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">Henüz seminer eklenmemiş</p></div> : (
        <div className="space-y-3">
          {seminars.map(s => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              {fileUrl(s.cover_image) ? <img src={fileUrl(s.cover_image)} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-14 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><Mic className="w-5 h-5 text-slate-400" /></div>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{s.title}</p>
                <p className="text-xs text-slate-400">{s.date} {s.time} · {s.speaker} · {s.seminar_type === 'free' ? 'Ücretsiz' : 'Ücretli'} · {s.registration_count || 0} kayıt</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.status === 'active' ? 'Aktif' : 'Pasif'}</span>
              <div className="flex gap-1">
                <button onClick={() => loadRegs(s.id)} className="p-2 text-slate-400 hover:text-blue-600" title="Kayıtlar"><Users className="w-4 h-4" /></button>
                <button onClick={() => { setForm({...BLANK_SEMINAR, ...s}); setEditId(s.id); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => del(s.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live Training Tab ────────────────────────────────────────────────────────
function LiveTab() {
  const [live, setLive] = useState({ title: '', description: '', day_of_week: '', time: '', zoom_link: '', status: 'active', archives: [] });
  const [saving, setSaving] = useState(false);
  const [archiveForm, setArchiveForm] = useState(false);
  const [arc, setArc] = useState({ title: '', video_url: '', date: '' });

  useEffect(() => {
    api.get('/admin/education/live', ).then(r => { if (r.data && r.data.title) setLive(r.data); }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    const { data } = await api.put('/admin/education/live', live, );
    setLive(data); setSaving(false); toast.success('Kaydedildi');
  };

  const addArchive = async () => {
    if (!arc.title) { toast.error('Başlık zorunlu'); return; }
    const { data } = await api.post('/admin/education/live/archives', arc, );
    setLive(l => ({ ...l, archives: [...(l.archives || []), data] }));
    setArc({ title: '', video_url: '', date: '' }); setArchiveForm(false);
    toast.success('Arşiv eklendi');
  };

  const delArchive = async (id) => {
    await api.delete(`/admin/education/live/archives/${id}`, );
    setLive(l => ({ ...l, archives: (l.archives || []).filter(a => a.archive_id !== id) }));
    toast.success('Silindi');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-5">Haftalık Canlı Eğitim</h3>
        <div className="space-y-3">
          <div><Label className="text-xs text-slate-500">Başlık</Label><Input value={live.title} onChange={e => setLive(l => ({...l, title: e.target.value}))} className="mt-1 h-9" /></div>
          <div><Label className="text-xs text-slate-500">Açıklama</Label><Textarea value={live.description} onChange={e => setLive(l => ({...l, description: e.target.value}))} className="mt-1 text-sm min-h-[80px] resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-slate-500">Gün</Label><Input value={live.day_of_week} onChange={e => setLive(l => ({...l, day_of_week: e.target.value}))} placeholder="örn: Çarşamba" className="mt-1 h-9" /></div>
            <div><Label className="text-xs text-slate-500">Saat</Label><Input value={live.time} onChange={e => setLive(l => ({...l, time: e.target.value}))} placeholder="örn: 20:00" className="mt-1 h-9" /></div>
          </div>
          <div><Label className="text-xs text-slate-500">Zoom Linki</Label><Input value={live.zoom_link} onChange={e => setLive(l => ({...l, zoom_link: e.target.value}))} placeholder="https://zoom.us/j/..." className="mt-1 h-9" /></div>
          <div><Label className="text-xs text-slate-500">Durum</Label><Select value={live.status} onValueChange={v => setLive(l => ({...l, status: v}))}><SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Pasif</SelectItem></SelectContent></Select></div>
        </div>
        <Button onClick={save} disabled={saving} className="mt-4 h-10 font-semibold" style={{ background: '#0F3D2E' }}><Save className="w-4 h-4 mr-2" />{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-800">Arşiv Kayıtları ({(live.archives || []).length})</h4>
          <Button onClick={() => setArchiveForm(true)} size="sm" variant="outline" className="h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Arşiv Ekle</Button>
        </div>
        {archiveForm && (
          <div className="bg-slate-50 rounded-xl p-4 mb-3 space-y-2">
            <Input value={arc.title} onChange={e => setArc(a => ({...a, title: e.target.value}))} placeholder="Başlık" className="h-9 text-sm" />
            <Input value={arc.video_url} onChange={e => setArc(a => ({...a, video_url: e.target.value}))} placeholder="Video URL" className="h-9 text-sm" />
            <Input type="date" value={arc.date} onChange={e => setArc(a => ({...a, date: e.target.value}))} className="h-9 text-sm" />
            <div className="flex gap-2"><Button onClick={addArchive} size="sm" className="text-xs" style={{ background: '#0F3D2E' }}>Ekle</Button><Button onClick={() => setArchiveForm(false)} size="sm" variant="outline" className="text-xs">İptal</Button></div>
          </div>
        )}
        <div className="space-y-2">
          {(live.archives || []).map(a => (
            <div key={a.archive_id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3">
              <Play className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
              <div className="flex-1"><p className="text-sm font-medium text-slate-800">{a.title}</p>{a.date && <p className="text-xs text-slate-400">{a.date}</p>}</div>
              {a.video_url && <a href={a.video_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">İzle</a>}
              <button onClick={() => delArchive(a.archive_id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Media Library Tab ────────────────────────────────────────────────────────
function MediaTab() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const inputRef = useRef();

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(); if (search) params.set('search', search); if (folder) params.set('folder', folder);
    const { data } = await api.get(`/admin/education/media?${params}`, );
    setMedia(data); setLoading(false);
  }, [search, folder]);

  useEffect(() => { fetch(); }, [fetch]);

  const upload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData(); fd.append('file', file); fd.append('folder', folder || 'genel');
      try { await api.post('/admin/education/media/upload', fd, ); } catch { toast.error(`${file.name} yüklenemedi`); }
    }
    setUploading(false); toast.success('Yükleme tamamlandı'); fetch();
  };

  const del = async (id) => {
    if (!window.confirm('Silinsin mi?')) return;
    await api.delete(`/admin/education/media/${id}`, );
    toast.success('Silindi'); fetch();
  };

  const copy = (m) => { navigator.clipboard.writeText(fileUrl(m.storage_path) || ''); toast.success('Link kopyalandı'); };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-slate-900">Medya Kütüphanesi</h3>
        <Button onClick={() => inputRef.current.click()} disabled={uploading} className="h-9 text-sm" style={{ background: '#0F3D2E' }}>
          <Upload className="w-4 h-4 mr-1" />{uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
        </Button>
        <input ref={inputRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={e => upload(Array.from(e.target.files))} />
      </div>

      {/* Drag-drop area */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-5 hover:border-[#C8A96A]/50 transition-colors cursor-pointer"
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); }}
        onDrop={e => { e.preventDefault(); upload(Array.from(e.dataTransfer.files)); }}
      >
        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Dosyaları buraya sürükle veya <span style={{ color: '#0F3D2E' }} className="font-semibold">tıklayarak seç</span></p>
        <p className="text-xs text-slate-400 mt-1">Görsel, Video, PDF destekleniyor</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Dosya ara..." className="pl-9 h-9 text-sm" />
        </div>
        <Input value={folder} onChange={e => setFolder(e.target.value)} placeholder="Klasör filtrele" className="h-9 text-sm w-36" />
      </div>

      {loading ? <div className="text-center py-12"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#0F3D2E', borderTopColor: 'transparent' }} /></div> :
      media.length === 0 ? <div className="text-center py-16 text-slate-400"><Folder className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">Medya bulunamadı</p></div> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {media.map(m => (
            <div key={m.id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-all">
              <div className="h-24 bg-slate-100 flex items-center justify-center overflow-hidden">
                {m.type === 'image' ? <img src={fileUrl(m.storage_path)} alt={m.name} className="w-full h-full object-cover" /> :
                 m.type === 'video' ? <Video className="w-8 h-8 text-slate-400" /> :
                 <FileText className="w-8 h-8 text-slate-400" />}
              </div>
              <div className="p-2">
                <p className="text-[11px] text-slate-700 font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-slate-400">{m.folder} · {m.ext?.toUpperCase()}</p>
              </div>
              <div className="flex border-t border-slate-100 divide-x divide-slate-100">
                <button onClick={() => copy(m)} className="flex-1 py-1.5 text-[10px] text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1"><Copy className="w-3 h-3" />Kopyala</button>
                <button onClick={() => del(m.id)} className="flex-1 py-1.5 text-[10px] text-red-400 hover:bg-red-50 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" />Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page Settings Tab ────────────────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { key: 'hero', title: 'Arsa Eğitim Akademisi', description: 'Arsa yatırımında profesyonel ol.', button_text: '', order: 1, is_active: true },
  { key: 'seminars', title: 'Ücretsiz Seminerler', description: 'Arsa yatırımına yeni başlayanlar için genel anlatım yapılan ücretsiz seminerler.', button_text: 'Seminere Katıl', order: 2, is_active: true },
  { key: 'courses', title: 'Ücretli Eğitimler', description: 'Arsa yatırımını profesyonel seviyede öğrenmek isteyenler için ayrıntılı eğitim programları.', button_text: 'Eğitime Katıl', order: 3, is_active: true },
  { key: 'live', title: 'Her Hafta Canlı Online Eğitim', description: 'Her hafta yatırımcılarla birlikte canlı analiz yapılır.', button_text: 'Canlı Eğitime Katıl', order: 4, is_active: true },
  { key: 'community', title: 'Arsa Yatırımcı Topluluğu', description: 'Yatırımcıların bir araya geldiği özel topluluk.', button_text: 'Topluluğa Katıl', order: 5, is_active: true },
];

function PageSettingsTab() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/education/page-settings').then(r => { if (r.data?.sections?.length) setSections(r.data.sections); }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try { await api.put('/admin/education/page-settings', sections, ); toast.success('Sayfa ayarları kaydedildi'); }
    catch { toast.error('Kayıt başarısız'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-slate-900">Sayfa Yönetimi</h3>
        <Button onClick={save} disabled={saving} className="h-9 text-sm" style={{ background: '#0F3D2E' }}><Save className="w-4 h-4 mr-1" />{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
      <div className="space-y-4">
        {sections.map((sec, i) => (
          <div key={sec.key} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{sec.key}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sec.is_active} onChange={e => setSections(secs => secs.map((s, j) => j === i ? {...s, is_active: e.target.checked} : s))} className="w-4 h-4 rounded" />
                <span className="text-xs text-slate-600">Aktif</span>
              </label>
            </div>
            <div className="space-y-2">
              <div><Label className="text-xs text-slate-500">Başlık</Label><Input value={sec.title} onChange={e => setSections(secs => secs.map((s, j) => j === i ? {...s, title: e.target.value} : s))} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs text-slate-500">Açıklama</Label><Textarea value={sec.description} onChange={e => setSections(secs => secs.map((s, j) => j === i ? {...s, description: e.target.value} : s))} className="mt-1 text-sm min-h-[60px] resize-none" /></div>
              {sec.button_text !== undefined && <div><Label className="text-xs text-slate-500">Buton Metni</Label><Input value={sec.button_text} onChange={e => setSections(secs => secs.map((s, j) => j === i ? {...s, button_text: e.target.value} : s))} className="mt-1 h-9 text-sm" /></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function EducationManager() {
  return (
    <div data-testid="education-manager">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Eğitim Merkezi</h2>
        <p className="text-sm text-slate-500 mt-0.5">Arsa Eğitim Akademisi yönetim paneli</p>
      </div>
      <Tabs defaultValue="courses">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="courses" className="text-xs data-[state=active]:bg-[#0F3D2E] data-[state=active]:text-white">Kurslar</TabsTrigger>
          <TabsTrigger value="seminars" className="text-xs data-[state=active]:bg-[#0F3D2E] data-[state=active]:text-white">Seminerler</TabsTrigger>
          <TabsTrigger value="live" className="text-xs data-[state=active]:bg-[#0F3D2E] data-[state=active]:text-white">Haftalık Canlı</TabsTrigger>
          <TabsTrigger value="media" className="text-xs data-[state=active]:bg-[#0F3D2E] data-[state=active]:text-white">Medya Kütüphanesi</TabsTrigger>
          <TabsTrigger value="page" className="text-xs data-[state=active]:bg-[#0F3D2E] data-[state=active]:text-white">Sayfa Yönetimi</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-0"><CoursesTab /></TabsContent>
        <TabsContent value="seminars" className="mt-0"><SeminarsTab /></TabsContent>
        <TabsContent value="live" className="mt-0"><LiveTab /></TabsContent>
        <TabsContent value="media" className="mt-0"><MediaTab /></TabsContent>
        <TabsContent value="page" className="mt-0"><PageSettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
