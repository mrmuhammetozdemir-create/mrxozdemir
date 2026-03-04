import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Shield, Plus, Trash2, Edit, Upload, Download, FileText,
  Image as ImageIcon, Video, Map, Layers, Building2, X, Check, AlertCircle
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const PROJECT_TYPES = ["TOKİ", "Emlak Konut", "Özel Proje", "Kamu Projesi"];
const MEDIA_CATEGORIES = ["Altyapı", "Blok Resimleri", "Peyzaj", "Zemin", "Drone", "Master Plan"];
const DOC_TYPES = ["Zemin Etüt", "Jeoloji / Jeoteknik", "ÇED", "İhale Belgeleri", "Plan Notları", "Vaziyet Planı", "Diğer"];

function authHeaders() {
  const token = localStorage.getItem('admin_token');
  return { Authorization: `Bearer ${token}` };
}

// ========== LOGIN SCREEN ==========
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'admin') {
        toast.error('Bu hesap admin yetkisine sahip değil');
        return;
      }
      localStorage.setItem('admin_token', data.access_token);
      onLogin(data.user);
    } catch {
      toast.error('Giriş başarısız. E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white border-0 shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-1" data-testid="admin-login-title">Admin Panel</h1>
        <p className="text-sm text-center text-slate-500 mb-6">Yönetim paneline giriş yapın</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label>E-posta</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="mt-1" data-testid="admin-email-input" />
          </div>
          <div>
            <Label>Şifre</Label>
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="mt-1" data-testid="admin-password-input" />
          </div>
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading} data-testid="admin-login-btn">
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ========== PROJECT FORM ==========
function ProjectForm({ project, onSave, onCancel }) {
  const [form, setForm] = useState({
    project_name: '', city: '', district: '', neighborhood: '', description: '',
    project_type: 'TOKİ', total_housing: 0, commercial_count: 0, school_count: 0,
    mosque_count: 0, social_facility_count: 0, project_area_sqm: 0,
    start_date: '', planned_end_date: '', progress_percentage: 0,
    location_lat: 41.0082, location_lng: 28.9784,
    ...(project || {}),
    location_lat: project?.location?.lat || 41.0082,
    location_lng: project?.location?.lng || 28.9784,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const url = project ? `/admin/projects/${project.id}` : '/admin/projects';
      const method = project ? 'put' : 'post';
      await api({ method, url, data: fd, headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
      toast.success(project ? 'Proje güncellendi' : 'Proje oluşturuldu');
      onSave();
    } catch (err) {
      toast.error('Hata: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Proje Adı *</Label>
          <Input value={form.project_name} onChange={e => set('project_name', e.target.value)} required className="mt-1" data-testid="project-name-input" />
        </div>
        <div>
          <Label>Proje Tipi *</Label>
          <Select value={form.project_type} onValueChange={v => set('project_type', v)}>
            <SelectTrigger className="mt-1" data-testid="project-type-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>İl *</Label>
          <Input value={form.city} onChange={e => set('city', e.target.value)} required className="mt-1" data-testid="project-city-input" />
        </div>
        <div>
          <Label>İlçe *</Label>
          <Input value={form.district} onChange={e => set('district', e.target.value)} required className="mt-1" data-testid="project-district-input" />
        </div>
        <div>
          <Label>Mahalle</Label>
          <Input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} className="mt-1" data-testid="project-neighborhood-input" />
        </div>
        <div>
          <Label>Proje Alanı (m2)</Label>
          <Input type="number" value={form.project_area_sqm} onChange={e => set('project_area_sqm', e.target.value)} className="mt-1" />
        </div>
      </div>

      <div>
        <Label>Proje Açıklaması</Label>
        <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="mt-1" data-testid="project-description-input" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <Label>Konut Sayısı</Label>
          <Input type="number" value={form.total_housing} onChange={e => set('total_housing', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Ticari Alan</Label>
          <Input type="number" value={form.commercial_count} onChange={e => set('commercial_count', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Okul</Label>
          <Input type="number" value={form.school_count} onChange={e => set('school_count', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Cami</Label>
          <Input type="number" value={form.mosque_count} onChange={e => set('mosque_count', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Sosyal Tesis</Label>
          <Input type="number" value={form.social_facility_count} onChange={e => set('social_facility_count', e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Başlangıç Tarihi</Label>
          <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Planlanan Bitiş Tarihi</Label>
          <Input type="date" value={form.planned_end_date} onChange={e => set('planned_end_date', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>İnşaat İlerleme (%{form.progress_percentage})</Label>
          <Input type="range" min="0" max="100" value={form.progress_percentage} onChange={e => set('progress_percentage', e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Enlem (Lat)</Label>
          <Input type="number" step="any" value={form.location_lat} onChange={e => set('location_lat', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Boylam (Lng)</Label>
          <Input type="number" step="any" value={form.location_lng} onChange={e => set('location_lng', e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700" data-testid="project-save-btn">
          <Check className="w-4 h-4 mr-2" />{saving ? 'Kaydediliyor...' : (project ? 'Güncelle' : 'Oluştur')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" />İptal</Button>
      </div>
    </form>
  );
}

// ========== ADA / PARSEL MANAGER ==========
function AdaParselManager({ projectId }) {
  const [adas, setAdas] = useState([]);
  const [parsels, setParsels] = useState([]);
  const [newAda, setNewAda] = useState('');
  const [newAdaDesc, setNewAdaDesc] = useState('');
  const [expandedAda, setExpandedAda] = useState(null);
  const [newParsel, setNewParsel] = useState({ parsel_no: '', area_sqm: '', note: '' });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const loadData = useCallback(async () => {
    const [adasRes, parselsRes] = await Promise.all([
      api.get(`/projects/${projectId}/adas`),
      api.get(`/projects/${projectId}/parsels`),
    ]);
    setAdas(adasRes.data);
    setParsels(parselsRes.data);
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const addAda = async () => {
    if (!newAda.trim()) return;
    try {
      const fd = new FormData();
      fd.append('ada_no', newAda);
      fd.append('description', newAdaDesc);
      await api.post(`/admin/projects/${projectId}/adas`, fd, { headers: authHeaders() });
      toast.success(`Ada ${newAda} eklendi`);
      setNewAda(''); setNewAdaDesc('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ada eklenemedi');
    }
  };

  const deleteAda = async (adaId, adaNo) => {
    if (!window.confirm(`Ada ${adaNo} ve tüm parselleri silinecek. Emin misiniz?`)) return;
    await api.delete(`/admin/adas/${adaId}`, { headers: authHeaders() });
    toast.success('Ada silindi');
    loadData();
  };

  const addParsel = async (adaId) => {
    if (!newParsel.parsel_no.trim()) return;
    const fd = new FormData();
    fd.append('parsel_no', newParsel.parsel_no);
    fd.append('area_sqm', newParsel.area_sqm || '0');
    fd.append('note', newParsel.note);
    await api.post(`/admin/adas/${adaId}/parsels`, fd, { headers: authHeaders() });
    toast.success('Parsel eklendi');
    setNewParsel({ parsel_no: '', area_sqm: '', note: '' });
    loadData();
  };

  const deleteParsel = async (parselId) => {
    await api.delete(`/admin/parsels/${parselId}`, { headers: authHeaders() });
    toast.success('Parsel silindi');
    loadData();
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post(`/admin/projects/${projectId}/import-excel`, fd, { headers: authHeaders() });
      setImportResult(data);
      if (data.success_count > 0) toast.success(`${data.success_count} parsel başarıyla eklendi`);
      if (data.error_count > 0) toast.error(`${data.error_count} satırda hata`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Excel import başarısız');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const downloadTemplate = () => {
    window.open(`${API_BASE}/api/admin/excel-template`, '_blank');
  };

  const getParselsByAda = (adaId) => parsels.filter(p => p.ada_id === adaId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end mb-4 p-4 bg-slate-50 rounded-lg">
        <div>
          <Label className="text-xs">Ada No</Label>
          <Input value={newAda} onChange={e => setNewAda(e.target.value)} placeholder="örn: 33" className="w-24 mt-1" data-testid="new-ada-input" />
        </div>
        <div>
          <Label className="text-xs">Açıklama</Label>
          <Input value={newAdaDesc} onChange={e => setNewAdaDesc(e.target.value)} placeholder="opsiyonel" className="w-48 mt-1" />
        </div>
        <Button onClick={addAda} size="sm" className="bg-blue-600 hover:bg-blue-700" data-testid="add-ada-btn">
          <Plus className="w-4 h-4 mr-1" />Ada Ekle
        </Button>
        <div className="ml-auto flex gap-2">
          <Button onClick={downloadTemplate} variant="outline" size="sm" data-testid="download-template-btn">
            <Download className="w-4 h-4 mr-1" />Şablon İndir
          </Button>
          <label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} className="hidden" data-testid="excel-import-input" />
            <Button as="span" variant="outline" size="sm" className="cursor-pointer" disabled={importing} onClick={e => e.target.closest('label').querySelector('input').click()} data-testid="excel-import-btn">
              <Upload className="w-4 h-4 mr-1" />{importing ? 'Yükleniyor...' : 'Excel Import'}
            </Button>
          </label>
        </div>
      </div>

      {importResult && (
        <div className={`p-3 rounded-lg text-sm ${importResult.error_count > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
          <p className="font-medium">{importResult.success_count} parsel eklendi, {importResult.error_count} hata</p>
          {importResult.errors?.map((err, i) => (
            <p key={i} className="text-red-600 text-xs mt-1">Satır {err.row}: {err.error}</p>
          ))}
        </div>
      )}

      {adas.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Henüz ada eklenmemiş. Yukarıdan ada ekleyin veya Excel import yapın.</div>
      ) : (
        <div className="space-y-3">
          {adas.map(ada => (
            <Card key={ada.id} className="border border-slate-200">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedAda(expandedAda === ada.id ? null : ada.id)}
                data-testid={`ada-row-${ada.ada_no}`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-base px-3 py-1">Ada {ada.ada_no}</Badge>
                  {ada.description && <span className="text-sm text-slate-500">{ada.description}</span>}
                  <Badge className="bg-blue-100 text-blue-700">{getParselsByAda(ada.id).length} parsel</Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={e => { e.stopPropagation(); deleteAda(ada.id, ada.ada_no); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {expandedAda === ada.id && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <div className="flex gap-2 items-end my-3 p-3 bg-blue-50 rounded-lg">
                    <div>
                      <Label className="text-xs">Parsel No</Label>
                      <Input value={newParsel.parsel_no} onChange={e => setNewParsel({ ...newParsel, parsel_no: e.target.value })} className="w-20 mt-1" placeholder="1" data-testid="new-parsel-input" />
                    </div>
                    <div>
                      <Label className="text-xs">Alan (m2)</Label>
                      <Input type="number" value={newParsel.area_sqm} onChange={e => setNewParsel({ ...newParsel, area_sqm: e.target.value })} className="w-28 mt-1" placeholder="opsiyonel" />
                    </div>
                    <div>
                      <Label className="text-xs">Not</Label>
                      <Input value={newParsel.note} onChange={e => setNewParsel({ ...newParsel, note: e.target.value })} className="w-40 mt-1" placeholder="opsiyonel" />
                    </div>
                    <Button size="sm" onClick={() => addParsel(ada.id)} className="bg-blue-600 hover:bg-blue-700" data-testid="add-parsel-btn">
                      <Plus className="w-4 h-4 mr-1" />Parsel Ekle
                    </Button>
                  </div>
                  {getParselsByAda(ada.id).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-2">Bu adada henüz parsel yok</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {getParselsByAda(ada.id).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-white border rounded-lg">
                          <div>
                            <span className="font-mono font-medium text-sm">Parsel {p.parsel_no}</span>
                            {p.area_sqm && <span className="text-xs text-slate-500 ml-2">{p.area_sqm} m2</span>}
                            {p.note && <p className="text-xs text-slate-400">{p.note}</p>}
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 h-7 w-7 p-0" onClick={() => deleteParsel(p.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== MEDIA MANAGER ==========
function MediaManager({ projectId }) {
  const [media, setMedia] = useState([]);
  const [category, setCategory] = useState(MEDIA_CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);

  const loadMedia = useCallback(async () => {
    const { data } = await api.get(`/projects/${projectId}/media`);
    setMedia(data);
  }, [projectId]);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      try {
        await api.post(`/admin/projects/${projectId}/media`, fd, { headers: authHeaders() });
      } catch {
        toast.error(`${file.name} yüklenemedi`);
      }
    }
    toast.success('Medya yüklendi');
    loadMedia();
    setUploading(false);
    e.target.value = '';
  };

  const deleteMedia = async (id) => {
    await api.delete(`/admin/media/${id}`, { headers: authHeaders() });
    toast.success('Medya silindi');
    loadMedia();
  };

  const grouped = MEDIA_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = media.filter(m => m.category === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end p-4 bg-slate-50 rounded-lg">
        <div>
          <Label className="text-xs">Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEDIA_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <label>
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" data-testid="media-upload-input" />
          <Button as="span" className="cursor-pointer bg-purple-600 hover:bg-purple-700" disabled={uploading} onClick={e => e.target.closest('label').querySelector('input').click()} data-testid="media-upload-btn">
            <Upload className="w-4 h-4 mr-1" />{uploading ? 'Yükleniyor...' : 'Resim Yükle'}
          </Button>
        </label>
      </div>

      {MEDIA_CATEGORIES.map(cat => {
        const items = grouped[cat];
        if (!items?.length) return null;
        return (
          <div key={cat}>
            <h4 className="font-semibold text-sm text-slate-700 mb-2">{cat} ({items.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {items.map(m => (
                <div key={m.id} className="relative group rounded-lg overflow-hidden border">
                  <img src={`${API_BASE}/api/files/${m.storage_path}`} alt={m.original_filename} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="destructive" onClick={() => deleteMedia(m.id)} className="h-8">
                      <Trash2 className="w-3 h-3 mr-1" />Sil
                    </Button>
                  </div>
                  <p className="text-xs truncate p-1 text-slate-600">{m.original_filename}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {media.length === 0 && <p className="text-center text-slate-400 py-6">Henüz medya yüklenmemiş</p>}
    </div>
  );
}

// ========== DOCUMENT MANAGER ==========
function DocumentManager({ projectId }) {
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [uploading, setUploading] = useState(false);

  const loadDocs = useCallback(async () => {
    const { data } = await api.get(`/projects/${projectId}/documents`);
    setDocs(data);
  }, [projectId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !title.trim()) { toast.error('Belge başlığı zorunludur'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('doc_type', docType);
    try {
      await api.post(`/admin/projects/${projectId}/documents`, fd, { headers: authHeaders() });
      toast.success('Belge yüklendi');
      setTitle('');
      loadDocs();
    } catch {
      toast.error('Belge yüklenemedi');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteDoc = async (id) => {
    await api.delete(`/admin/documents/${id}`, { headers: authHeaders() });
    toast.success('Belge silindi');
    loadDocs();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end p-4 bg-slate-50 rounded-lg">
        <div>
          <Label className="text-xs">Belge Başlığı</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Belge adı" className="w-48 mt-1" data-testid="doc-title-input" />
        </div>
        <div>
          <Label className="text-xs">Belge Türü</Label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="w-48 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <label>
          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleUpload} className="hidden" data-testid="doc-upload-input" />
          <Button as="span" className="cursor-pointer bg-orange-600 hover:bg-orange-700" disabled={uploading} onClick={e => e.target.closest('label').querySelector('input').click()} data-testid="doc-upload-btn">
            <Upload className="w-4 h-4 mr-1" />{uploading ? 'Yükleniyor...' : 'Belge Yükle'}
          </Button>
        </label>
      </div>

      {docs.length === 0 ? (
        <p className="text-center text-slate-400 py-6">Henüz belge yüklenmemiş</p>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium text-sm">{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.doc_type} - {doc.original_filename}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(`${API_BASE}/api/files/${doc.storage_path}`, '_blank')}>Görüntüle</Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteDoc(doc.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== VIDEO MANAGER ==========
function VideoManager({ projectId, videos, onRefresh }) {
  const [url, setUrl] = useState('');

  const addVideo = async () => {
    if (!url.trim()) return;
    const fd = new FormData();
    fd.append('youtube_url', url);
    await api.post(`/admin/projects/${projectId}/videos`, fd, { headers: authHeaders() });
    toast.success('Video eklendi');
    setUrl('');
    onRefresh();
  };

  const removeVideo = async (videoUrl) => {
    const fd = new FormData();
    fd.append('youtube_url', videoUrl);
    await api.delete(`/admin/projects/${projectId}/videos`, { data: fd, headers: authHeaders() });
    toast.success('Video silindi');
    onRefresh();
  };

  const getYoutubeId = (u) => {
    const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
    return m ? m[1] : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end p-4 bg-slate-50 rounded-lg">
        <div className="flex-1">
          <Label className="text-xs">YouTube Video Linki</Label>
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1" data-testid="video-url-input" />
        </div>
        <Button onClick={addVideo} className="bg-red-600 hover:bg-red-700" data-testid="add-video-btn">
          <Plus className="w-4 h-4 mr-1" />Video Ekle
        </Button>
      </div>

      {(!videos || videos.length === 0) ? (
        <p className="text-center text-slate-400 py-6">Henüz video eklenmemiş</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((v, i) => {
            const vid = getYoutubeId(v);
            return (
              <div key={i} className="relative group rounded-lg overflow-hidden border">
                {vid ? (
                  <iframe src={`https://www.youtube.com/embed/${vid}`} className="w-full h-48" allowFullScreen title={`Video ${i + 1}`} />
                ) : (
                  <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">Geçersiz link</div>
                )}
                <div className="flex items-center justify-between p-2 bg-white">
                  <p className="text-xs truncate text-slate-500 flex-1">{v}</p>
                  <Button variant="ghost" size="sm" className="text-red-500 h-7 w-7 p-0" onClick={() => removeVideo(v)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== MAP LAYER MANAGER ==========
function MapLayerManager({ projectId }) {
  const [layers, setLayers] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadLayers = useCallback(async () => {
    const { data } = await api.get(`/projects/${projectId}/map-layers`);
    setLayers(data);
  }, [projectId]);

  useEffect(() => { loadLayers(); }, [loadLayers]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/admin/projects/${projectId}/map-layers`, fd, { headers: authHeaders() });
      toast.success('Harita katmanı yüklendi');
      loadLayers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Yükleme başarısız');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteLayer = async (id) => {
    await api.delete(`/admin/map-layers/${id}`, { headers: authHeaders() });
    toast.success('Katman silindi');
    loadLayers();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end p-4 bg-slate-50 rounded-lg">
        <label>
          <input type="file" accept=".kml,.kmz,.geojson,.json" onChange={handleUpload} className="hidden" data-testid="map-layer-upload-input" />
          <Button as="span" className="cursor-pointer bg-teal-600 hover:bg-teal-700" disabled={uploading} onClick={e => e.target.closest('label').querySelector('input').click()} data-testid="map-layer-upload-btn">
            <Upload className="w-4 h-4 mr-1" />{uploading ? 'Yükleniyor...' : 'KML / KMZ / GeoJSON Yükle'}
          </Button>
        </label>
      </div>

      {layers.length === 0 ? (
        <p className="text-center text-slate-400 py-6">Henüz harita katmanı yüklenmemiş</p>
      ) : (
        <div className="space-y-2">
          {layers.map(layer => (
            <div key={layer.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-teal-500" />
                <div>
                  <p className="font-medium text-sm">{layer.original_filename}</p>
                  <p className="text-xs text-slate-500">{layer.file_type} - {(layer.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteLayer(layer.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== MAIN ADMIN PAGE ==========
export default function AdminPanelPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [manageTab, setManageTab] = useState('ada');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => { if (data.role === 'admin') setUser(data); else localStorage.removeItem('admin_token'); })
        .catch(() => localStorage.removeItem('admin_token'));
    }
  }, []);

  const loadProjects = useCallback(async () => {
    const { data } = await api.get('/projects');
    setProjects(data);
  }, []);

  useEffect(() => { if (user) loadProjects(); }, [user, loadProjects]);

  const refreshProject = async () => {
    if (!selectedProject) return;
    const { data } = await api.get(`/projects/${selectedProject.id}`);
    setSelectedProject(data);
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Bu proje ve tüm verileri silinecek. Emin misiniz?')) return;
    await api.delete(`/admin/projects/${id}`, { headers: authHeaders() });
    toast.success('Proje silindi');
    setSelectedProject(null);
    loadProjects();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  if (!user) return <AdminLogin onLogin={setUser} />;

  // Project detail/management view
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setSelectedProject(null)} data-testid="back-to-list-btn">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{selectedProject.project_name}</h1>
                <p className="text-xs text-slate-500">{selectedProject.city} / {selectedProject.district}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditingProject(selectedProject); setShowForm(true); }} data-testid="edit-project-btn">
                <Edit className="w-4 h-4 mr-1" />Düzenle
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteProject(selectedProject.id)} data-testid="delete-project-btn">
                <Trash2 className="w-4 h-4 mr-1" />Sil
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {showForm ? (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Proje Düzenle</h2>
              <ProjectForm project={selectedProject} onSave={() => { setShowForm(false); refreshProject(); loadProjects(); }} onCancel={() => setShowForm(false)} />
            </Card>
          ) : (
            <Tabs value={manageTab} onValueChange={setManageTab}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="ada" data-testid="tab-ada"><Building2 className="w-4 h-4 mr-1" />Ada/Parsel</TabsTrigger>
                <TabsTrigger value="media" data-testid="tab-media"><ImageIcon className="w-4 h-4 mr-1" />Medya</TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-docs"><FileText className="w-4 h-4 mr-1" />Belgeler</TabsTrigger>
                <TabsTrigger value="videos" data-testid="tab-videos"><Video className="w-4 h-4 mr-1" />Videolar</TabsTrigger>
                <TabsTrigger value="map" data-testid="tab-map"><Layers className="w-4 h-4 mr-1" />Harita</TabsTrigger>
              </TabsList>
              <TabsContent value="ada" className="mt-4">
                <AdaParselManager projectId={selectedProject.id} />
              </TabsContent>
              <TabsContent value="media" className="mt-4">
                <MediaManager projectId={selectedProject.id} />
              </TabsContent>
              <TabsContent value="documents" className="mt-4">
                <DocumentManager projectId={selectedProject.id} />
              </TabsContent>
              <TabsContent value="videos" className="mt-4">
                <VideoManager projectId={selectedProject.id} videos={selectedProject.youtube_videos} onRefresh={refreshProject} />
              </TabsContent>
              <TabsContent value="map" className="mt-4">
                <MapLayerManager projectId={selectedProject.id} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    );
  }

  // Project list view
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="logout-btn">Çıkış</Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {showForm ? (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">{editingProject ? 'Proje Düzenle' : 'Yeni Proje Oluştur'}</h2>
            <ProjectForm project={editingProject} onSave={() => { setShowForm(false); setEditingProject(null); loadProjects(); }} onCancel={() => { setShowForm(false); setEditingProject(null); }} />
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Projeler ({projects.length})</h2>
              <Button onClick={() => { setEditingProject(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700" data-testid="new-project-btn">
                <Plus className="w-4 h-4 mr-2" />Yeni Proje
              </Button>
            </div>

            {projects.length === 0 ? (
              <Card className="p-12 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Henüz proje eklenmemiş</p>
                <Button onClick={() => setShowForm(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />İlk Projeyi Oluştur
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(p => (
                  <Card key={p.id} className="p-5 cursor-pointer hover:shadow-lg transition-shadow border hover:border-emerald-300" onClick={() => setSelectedProject(p)} data-testid={`project-card-${p.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{p.project_name}</h3>
                        <p className="text-sm text-slate-500">{p.city} / {p.district}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">{p.project_type || 'TOKİ'}</Badge>
                    </div>
                    {p.progress_percentage > 0 && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>İlerleme</span>
                          <span>%{p.progress_percentage}</span>
                        </div>
                        <Progress value={p.progress_percentage} className="h-2" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {p.total_housing > 0 && <Badge variant="outline" className="text-xs">{p.total_housing} Konut</Badge>}
                      {p.commercial_count > 0 && <Badge variant="outline" className="text-xs">{p.commercial_count} Ticari</Badge>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
