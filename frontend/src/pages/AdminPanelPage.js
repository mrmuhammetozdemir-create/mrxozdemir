import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Shield, Plus, Trash2, Edit, Upload, Download, FileText,
  Image as ImageIcon, Video, Map, Layers, Building2, X, Check,
  Home, MapPin, GraduationCap, Users, Target, TrendingUp, BarChart3,
  Menu, LogOut, ChevronRight, UserCog, Bot, Send, Sparkles, CheckCircle2,
  AlertCircle, Search, ListFilter, Pencil, Globe, RefreshCw, Copy
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import UsersManager from '@/pages/UsersManager';
import EducationManagerPage from '@/pages/EducationManager';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const PROJECT_TYPES = ["TOKİ", "Emlak Konut", "Özel Proje", "Kamu Projesi"];
const MEDIA_CATEGORIES = ["Altyapı", "Blok Resimleri", "Peyzaj", "Zemin", "Drone", "Master Plan"];
const DOC_TYPES = ["Zemin Etüt", "Jeoloji / Jeoteknik", "ÇED", "İhale Belgeleri", "Plan Notları", "Vaziyet Planı", "Diğer"];

function authHeaders() {
  const token = localStorage.getItem('admin_token');
  return { Authorization: `Bearer ${token}` };
}

// ==================== LOGIN ====================
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'admin') { toast.error('Admin yetkisi yok'); return; }
      localStorage.setItem('admin_token', data.access_token);
      onLogin(data.user);
    } catch { toast.error('Giriş başarısız'); }
    finally { setLoading(false); }
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

// ==================== SIDEBAR ====================
const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Ana Sayfa', icon: Home, color: 'text-slate-600' },
  { id: 'toki', label: 'e-Konut Yönetimi', icon: Building2, color: 'text-blue-600' },
  { id: 'ipat', label: 'e-İPAT Yönetimi', icon: Map, color: 'text-green-600' },
  { id: 'mega', label: 'Mega Projeler', icon: MapPin, color: 'text-cyan-600' },
  { id: 'education', label: 'Eğitim Yönetimi', icon: GraduationCap, color: 'text-amber-600' },
  { id: 'community', label: 'Topluluk Yönetimi', icon: Users, color: 'text-purple-600' },
  { id: 'opportunities', label: 'Arsa Fırsatları', icon: Target, color: 'text-red-600' },
  { id: 'market', label: 'Piyasa Analizi', icon: BarChart3, color: 'text-teal-600' },
  { id: 'users', label: 'Kullanıcılar', icon: UserCog, color: 'text-indigo-600' },
  { id: 'seo',   label: 'SEO Yönetimi', icon: Globe,   color: 'text-emerald-600' },
];

function Sidebar({ active, onSelect, collapsed, onToggle }) {
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200 min-h-screen transition-all duration-200 flex flex-col`}>
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        {!collapsed && <span className="font-bold text-slate-800 text-sm">Admin Panel</span>}
        <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0" data-testid="sidebar-toggle">
          <Menu className="w-4 h-4" />
        </Button>
      </div>
      <nav className="flex-1 py-2">
        {SIDEBAR_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                ${isActive ? 'bg-slate-100 border-r-2 border-blue-600' : 'hover:bg-slate-50'}`}
              data-testid={`sidebar-${item.id}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : item.color}`} />
              {!collapsed && (
                <span className={`text-sm ${isActive ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// ==================== DASHBOARD PAGE ====================
function DashboardContent({ stats, onNavigate }) {
  const cards = [
    { id: 'toki', label: 'e-Konut Projeleri', count: stats.projects, icon: Building2, color: 'bg-blue-600', desc: 'Toplu konut ve proje analiz sistemi' },
    { id: 'ipat', label: 'e-İPAT Arsaları', count: stats.land_parcels, icon: Map, color: 'bg-green-600', desc: 'Arsa parsel analizi' },
    { id: 'mega', label: 'Mega Projeler', count: stats.mega_projects, icon: MapPin, color: 'bg-cyan-600', desc: 'Altyapı projeleri' },
    { id: 'education', label: 'Eğitim', count: (stats.courses || 0) + (stats.seminars || 0), icon: GraduationCap, color: 'bg-amber-500', desc: 'Kurs ve seminerler' },
    { id: 'community', label: 'Topluluk', count: stats.community_posts, icon: Users, color: 'bg-purple-600', desc: 'Forum gönderileri' },
    { id: 'opportunities', label: 'Arsa Fırsatları', count: stats.opportunities, icon: Target, color: 'bg-red-600', desc: 'Yatırım fırsatları' },
    { id: 'market', label: 'Piyasa Analizi', count: stats.market_data, icon: BarChart3, color: 'bg-teal-600', desc: 'Piyasa verileri' },
    { id: 'users', label: 'Kullanıcılar', count: stats.app_users || 0, icon: UserCog, color: 'bg-indigo-600', desc: 'Kayıtlı kullanıcılar' },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Yönetim Paneli</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.id} className="p-5 cursor-pointer hover:shadow-lg transition-all border hover:border-blue-300 group"
              onClick={() => onNavigate(c.id)} data-testid={`dash-card-${c.id}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-xl ${c.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{c.label}</h3>
                  <p className="text-xs text-slate-500">{c.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">{c.count}</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ==================== AI AGENT PANEL ====================
function AgentPanel({ onClose, onRefresh, selectedProject }) {
  const [messages, setMessages] = useState([
    { role: 'agent', text: `👋 Merhaba! Ben e-Konut Veri Asistanıyım.\n\n📎 **Dosya Yükle:** Ataç ikonuna tıklayarak:\n• **ZIP / RAR** → İçindeki KMZ + resimler + DOCX'tan **otomatik yeni proje oluşturur**\n• **KMZ / KML / GeoJSON** → Seçili projeye harita katmanı ekler\n• **JPG / PNG** → Seçili projeye görsel ekler\n\n💡 **İpucu:** Dosya ekleyip aynı anda proje bilgilerini de yazabilirsiniz:\n_"Ankara Mamak TOKİ, 300 konut, 2025-2027"_\n\n💬 **Yazılı Komutlar:**\n• "Proje ekle / güncelle / sil"\n• "İstanbul'daki projeleri listele"\n\n${selectedProject ? `🎯 Seçili Proje: **${selectedProject.project_name}**` : '📂 Proje seçilmedi — ZIP yüklerseniz yeni proje otomatik oluşturulur.'}` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) setAttachedFile(f);
    e.target.value = '';
  };

  const send = async () => {
    if ((!input.trim() && !attachedFile) || loading) return;

    // --- File upload flow ---
    if (attachedFile) {
      const fileMsg = attachedFile.name;
      const userText = input.trim();
      setMessages(prev => [...prev, { role: 'user', text: `📎 ${fileMsg}${userText ? '\n' + userText : ''}` }]);
      setInput('');
      setAttachedFile(null);
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', attachedFile);
        if (selectedProject) formData.append('project_id', selectedProject.id);
        if (userText) formData.append('message', userText);

        const { data } = await api.post('/admin/agent/upload-zip', formData, {
          headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
        });

        let summary = '';
        if (data.new_project) {
          summary += `✨ **Yeni Proje Oluşturuldu:** ${data.new_project.name}`;
          if (data.new_project.city) summary += ` (${data.new_project.city}${data.new_project.district ? '/' + data.new_project.district : ''})`;
          summary += '\n';
        } else {
          summary += `📁 Proje: **${data.project_name}**\n`;
        }
        if (data.layers_count > 0)  summary += `🗺️ ${data.layers_count} harita katmanı eklendi\n`;
        if (data.images_count > 0)  summary += `🖼️ ${data.images_count} görsel eklendi\n`;
        if (data.location_updated)  summary += `📍 Koordinat otomatik güncellendi\n`;
        if (data.description_extracted) summary += `📝 Açıklama DOCX'tan alındı\n`;

        setMessages(prev => [...prev, { role: 'agent', text: summary.trim() || '✅ Dosya işlendi.' }]);
        onRefresh();
      } catch (e) {
        setMessages(prev => [...prev, { role: 'agent', text: `❌ Dosya yüklenemedi: ${e.response?.data?.detail || e.message}` }]);
      }
      setLoading(false);
      return;
    }

    // --- Text command flow ---
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const { data } = await api.post('/admin/agent/chat',
        { message: userMsg, session_id: 'toki-agent-' + Date.now() },
        { headers: authHeaders() }
      );
      let resultSummary = '';
      for (const r of (data.results || [])) {
        if (r.type === 'create' && r.status === 'ok') resultSummary += `\n✅ Oluşturuldu: ${r.names?.join(', ') || ''}`;
        else if (r.type === 'bulk_create' && r.status === 'ok') resultSummary += `\n✅ ${r.count} proje eklendi:\n${(r.names || []).map(n => '  • ' + n).join('\n')}`;
        else if (r.type === 'update' && r.status === 'ok') resultSummary += `\n✅ Güncellendi: ${r.name}`;
        else if (r.type === 'delete' && r.status === 'ok') resultSummary += `\n🗑️ Silindi: ${r.name}`;
        else if (r.type === 'query' && r.status === 'ok') {
          resultSummary += `\n📋 ${r.count} proje bulundu:`;
          r.projects?.slice(0, 10).forEach(p => { resultSummary += `\n  • ${p.project_name} (${p.city}/${p.district}) — %${p.progress_percentage || 0}`; });
          if (r.count > 10) resultSummary += `\n  ... ve ${r.count - 10} proje daha`;
        }
        else if (r.status === 'not_found') resultSummary += `\n⚠️ Bulunamadı: "${r.search}"`;
        else if (r.status === 'error') resultSummary += `\n❌ Hata: ${r.error}`;
      }
      setMessages(prev => [...prev, { role: 'agent', text: data.message + resultSummary, results: data.results }]);
      if (data.results?.some(r => ['create','bulk_create','update','delete'].includes(r.type) && r.status === 'ok')) onRefresh();
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', text: '❌ Bir hata oluştu. Tekrar deneyin.', error: true }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md h-[600px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'}}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">e-Konut Asistanı</p>
            <p className="text-[10px] text-white/50">Claude Sonnet • Veri & Harita Yönetimi</p>
          </div>
          {selectedProject && (
            <div className="bg-violet-500/20 border border-violet-400/30 rounded-lg px-2 py-1">
              <p className="text-[9px] text-violet-300 font-medium truncate max-w-[100px]">{selectedProject.project_name}</p>
            </div>
          )}
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'agent' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-white/10 text-white/90 rounded-tl-sm border border-white/10'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-2 shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:'0ms'}} />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:'150ms'}} />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:'300ms'}} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Attached file preview */}
        {attachedFile && (
          <div className="mx-3 mb-1 flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 rounded-xl px-3 py-2">
            <FileText className="w-4 h-4 text-violet-300 shrink-0" />
            <span className="text-xs text-violet-200 flex-1 truncate">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="text-violet-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/10">
          <div className="flex gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2 items-end">
            {/* File attach button */}
            <input ref={fileInputRef} type="file" accept=".zip,.rar,.kmz,.kml,.geojson,.json,.jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-violet-300 hover:bg-white/10 transition-colors shrink-0"
              title="RAR, ZIP, KMZ, KML, JPG veya PNG yükle"
              data-testid="agent-attach-btn"
            >
              <FileText className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={attachedFile ? "Mesaj ekleyin (isteğe bağlı)..." : "Komut girin... (Enter ile gönder)"}
              rows={2}
              className="flex-1 bg-transparent text-white text-xs placeholder:text-white/30 resize-none outline-none leading-relaxed"
              data-testid="agent-input"
            />
            <button
              onClick={send}
              disabled={loading || (!input.trim() && !attachedFile)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
              style={{background: (input.trim() || attachedFile) && !loading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.1)'}}
              data-testid="agent-send-btn"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-white/30 text-center mt-1.5">📎 RAR/ZIP → harita + resimler otomatik işlenir</p>
        </div>
      </div>
    </div>
  );
}

// ==================== TOKI PROJECT MANAGEMENT ====================
function TokiManager() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [manageTab, setManageTab] = useState('ada');
  const [projectImporting, setProjectImporting] = useState(false);
  const [projectImportResult, setProjectImportResult] = useState(null);
  const [showAgent, setShowAgent] = useState(false);
  const [subPage, setSubPage] = useState('projects'); // 'projects' | 'shared'

  const load = useCallback(async () => {
    const { data } = await api.get('/projects');
    setProjects(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const refreshSelected = async () => {
    if (!selected) return;
    const { data } = await api.get(`/projects/${selected.id}`);
    setSelected(data);
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Bu proje ve tüm verileri silinecek. Emin misiniz?')) return;
    await api.delete(`/admin/projects/${id}`, { headers: authHeaders() });
    toast.success('Proje silindi');
    setSelected(null);
    load();
  };

  const handleProjectExcelImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setProjectImporting(true); setProjectImportResult(null);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/admin/projects/import-excel', fd, { headers: authHeaders() });
      setProjectImportResult(data);
      if (data.success_count > 0) toast.success(`${data.success_count} proje başarıyla eklendi`);
      if (data.error_count > 0) toast.error(`${data.error_count} satırda hata`);
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Excel import başarısız'); }
    finally { setProjectImporting(false); e.target.value = ''; }
  };

  if (selected) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)} data-testid="back-to-list-btn">
              <ArrowLeft className="w-4 h-4 mr-1" />Liste
            </Button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selected.project_name}</h2>
              <p className="text-xs text-slate-500">{selected.city} / {selected.district}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAgent(true)}
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm"
              data-testid="agent-open-btn"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />AI Asistan
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditing(selected); setShowForm(true); }} data-testid="edit-project-btn">
              <Edit className="w-4 h-4 mr-1" />Düzenle
            </Button>
            <Button variant="destructive" size="sm" onClick={() => deleteProject(selected.id)} data-testid="delete-project-btn">
              <Trash2 className="w-4 h-4 mr-1" />Sil
            </Button>
          </div>
        </div>
        {showForm ? (
          <Card className="p-6"><ProjectForm project={selected} onSave={() => { setShowForm(false); refreshSelected(); load(); }} onCancel={() => setShowForm(false)} /></Card>
        ) : (
          <Tabs value={manageTab} onValueChange={setManageTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="ada" data-testid="tab-ada"><Building2 className="w-4 h-4 mr-1" />Ada/Parsel</TabsTrigger>
              <TabsTrigger value="media" data-testid="tab-media"><ImageIcon className="w-4 h-4 mr-1" />Medya</TabsTrigger>
              <TabsTrigger value="documents" data-testid="tab-docs"><FileText className="w-4 h-4 mr-1" />Belgeler</TabsTrigger>
              <TabsTrigger value="videos" data-testid="tab-videos"><Video className="w-4 h-4 mr-1" />Videolar</TabsTrigger>
              <TabsTrigger value="map" data-testid="tab-map"><Layers className="w-4 h-4 mr-1" />Harita</TabsTrigger>
            </TabsList>
            <TabsContent value="ada" className="mt-4"><AdaParselManager projectId={selected.id} /></TabsContent>
            <TabsContent value="media" className="mt-4"><MediaManager projectId={selected.id} /></TabsContent>
            <TabsContent value="documents" className="mt-4"><DocumentManager projectId={selected.id} /></TabsContent>
            <TabsContent value="videos" className="mt-4"><VideoManager projectId={selected.id} videos={selected.youtube_videos} onRefresh={refreshSelected} /></TabsContent>
            <TabsContent value="map" className="mt-4"><MapLayerManager projectId={selected.id} /></TabsContent>
          </Tabs>
        )}
      </div>
    );
  }

  if (showForm) {
    return (
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">{editing ? 'Proje Düzenle' : 'Yeni Proje Oluştur'}</h2>
        <Card className="p-6"><ProjectForm project={editing} onSave={() => { setShowForm(false); setEditing(null); load(); }} onCancel={() => { setShowForm(false); setEditing(null); }} /></Card>
      </div>
    );
  }

  return (
    <div>
      {/* Alt Sekme Seçici */}
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setSubPage('projects')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${subPage === 'projects' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          data-testid="subtab-projects"
        >
          <Building2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />e-Konut Projeleri
        </button>
        <button
          onClick={() => setSubPage('shared')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${subPage === 'shared' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          data-testid="subtab-shared"
        >
          <Layers className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Ortak Tesisler
        </button>
      </div>

      {subPage === 'shared' ? <SharedFacilitiesManager /> : (
      <div>
      {showAgent && <AgentPanel onClose={() => setShowAgent(false)} onRefresh={load} selectedProject={selected} />}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">e-Konut Projeleri ({projects.length})</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAgent(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
            size="sm"
            data-testid="agent-open-btn"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            AI Asistan
          </Button>
          <Button onClick={() => window.open(`${API_BASE}/api/admin/project-excel-template`, '_blank')} variant="outline" size="sm" data-testid="project-template-btn">
            <Download className="w-4 h-4 mr-1" />Excel Şablonu
          </Button>
          <label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleProjectExcelImport} className="hidden" />
            <Button as="span" variant="outline" size="sm" className="cursor-pointer" disabled={projectImporting}
              onClick={e => e.target.closest('label').querySelector('input').click()} data-testid="project-excel-import-btn">
              <Upload className="w-4 h-4 mr-1" />{projectImporting ? 'Yükleniyor...' : 'Excel Import'}
            </Button>
          </label>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700" data-testid="new-project-btn">
            <Plus className="w-4 h-4 mr-2" />Yeni Proje
          </Button>
        </div>
      </div>

      {projectImportResult && (
        <div className={`p-3 rounded-lg text-sm mb-4 ${projectImportResult.error_count > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'} border`}>
          <p className="font-medium">{projectImportResult.success_count} proje eklendi{projectImportResult.error_count > 0 ? `, ${projectImportResult.error_count} hata` : ''}</p>
          {projectImportResult.errors?.map((err, i) => <p key={i} className="text-red-600 text-xs mt-1">Satır {err.row}: {err.error}</p>)}
        </div>
      )}

      {projects.length === 0 ? (
        <Card className="p-12 text-center"><Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Henüz proje eklenmemiş</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map(p => (
            <Card key={p.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow border hover:border-blue-300" onClick={() => setSelected(p)} data-testid={`project-card-${p.id}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-sm text-slate-900">{p.project_name}</h3>
                <Badge className="bg-blue-100 text-blue-700 text-[10px]">{p.project_type || 'TOKİ'}</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2">{p.city} / {p.district}</p>
              {p.progress_percentage > 0 && <Progress value={p.progress_percentage} className="h-1.5" />}
            </Card>
          ))}
        </div>
      )}
      </div>
      )}
    </div>
  );
}
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
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const url = project ? `/admin/projects/${project.id}` : '/admin/projects';
      await api({ method: project ? 'put' : 'post', url, data: fd, headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
      toast.success(project ? 'Proje güncellendi' : 'Proje oluşturuldu');
      onSave();
    } catch (err) { toast.error(err.response?.data?.detail || 'Hata'); }
    finally { setSaving(false); }
  };
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Proje Adı *</Label><Input value={form.project_name} onChange={e => set('project_name', e.target.value)} required className="mt-1" data-testid="project-name-input" /></div>
        <div><Label>Proje Tipi</Label>
          <Select value={form.project_type} onValueChange={v => set('project_type', v)}>
            <SelectTrigger className="mt-1" data-testid="project-type-select"><SelectValue /></SelectTrigger>
            <SelectContent>{PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>İl *</Label><Input value={form.city} onChange={e => set('city', e.target.value)} required className="mt-1" /></div>
        <div><Label>İlçe *</Label><Input value={form.district} onChange={e => set('district', e.target.value)} required className="mt-1" /></div>
        <div><Label>Mahalle</Label><Input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} className="mt-1" /></div>
        <div><Label>Proje Alanı (m2)</Label><Input type="number" value={form.project_area_sqm} onChange={e => set('project_area_sqm', e.target.value)} className="mt-1" /></div>
      </div>
      <div><Label>Açıklama</Label><Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="mt-1" /></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div><Label className="text-xs">Konut</Label><Input type="number" value={form.total_housing} onChange={e => set('total_housing', e.target.value)} className="mt-1" /></div>
        <div><Label className="text-xs">Ticari</Label><Input type="number" value={form.commercial_count} onChange={e => set('commercial_count', e.target.value)} className="mt-1" /></div>
        <div><Label className="text-xs">Okul</Label><Input type="number" value={form.school_count} onChange={e => set('school_count', e.target.value)} className="mt-1" /></div>
        <div><Label className="text-xs">Cami</Label><Input type="number" value={form.mosque_count} onChange={e => set('mosque_count', e.target.value)} className="mt-1" /></div>
        <div><Label className="text-xs">Sosyal Tesis</Label><Input type="number" value={form.social_facility_count} onChange={e => set('social_facility_count', e.target.value)} className="mt-1" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><Label className="text-xs">Başlangıç Tarihi</Label><Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="mt-1" /></div>
        <div><Label className="text-xs">Bitiş Tarihi</Label><Input type="date" value={form.planned_end_date} onChange={e => set('planned_end_date', e.target.value)} className="mt-1" /></div>
        <div><Label className="text-xs">İlerleme (%{form.progress_percentage})</Label><Input type="range" min="0" max="100" value={form.progress_percentage} onChange={e => set('progress_percentage', e.target.value)} className="mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Enlem</Label><Input type="number" step="any" value={form.location_lat} onChange={e => set('location_lat', e.target.value)} className="mt-1" /></div>
        <div><Label className="text-xs">Boylam</Label><Input type="number" step="any" value={form.location_lng} onChange={e => set('location_lng', e.target.value)} className="mt-1" /></div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700" data-testid="project-save-btn"><Check className="w-4 h-4 mr-1" />{saving ? 'Kaydediliyor...' : (project ? 'Güncelle' : 'Oluştur')}</Button>
        <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-1" />İptal</Button>
      </div>
    </form>
  );
}

// ==================== ADA/PARSEL MANAGER ====================
function AdaParselManager({ projectId }) {
  const [adas, setAdas] = useState([]);
  const [parsels, setParsels] = useState([]);
  const [newAda, setNewAda] = useState('');
  const [newAdaDesc, setNewAdaDesc] = useState('');
  const [expandedAda, setExpandedAda] = useState(null);
  const [newParsel, setNewParsel] = useState({ parsel_no: '', area_sqm: '', note: '' });
  const [importResult, setImportResult] = useState(null);

  const load = useCallback(async () => {
    const [a, p] = await Promise.all([api.get(`/projects/${projectId}/adas`), api.get(`/projects/${projectId}/parsels`)]);
    setAdas(a.data); setParsels(p.data);
  }, [projectId]);
  useEffect(() => { load(); }, [load]);

  const addAda = async () => {
    if (!newAda.trim()) return;
    const fd = new FormData(); fd.append('ada_no', newAda); fd.append('description', newAdaDesc);
    try { await api.post(`/admin/projects/${projectId}/adas`, fd, { headers: authHeaders() }); toast.success(`Ada ${newAda} eklendi`); setNewAda(''); setNewAdaDesc(''); load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Hata'); }
  };
  const deleteAda = async (id, no) => { if (!window.confirm(`Ada ${no} silinsin mi?`)) return; await api.delete(`/admin/adas/${id}`, { headers: authHeaders() }); toast.success('Silindi'); load(); };
  const addParsel = async (adaId) => {
    if (!newParsel.parsel_no.trim()) return;
    const fd = new FormData(); fd.append('parsel_no', newParsel.parsel_no); fd.append('area_sqm', newParsel.area_sqm || '0'); fd.append('note', newParsel.note);
    await api.post(`/admin/adas/${adaId}/parsels`, fd, { headers: authHeaders() }); toast.success('Parsel eklendi'); setNewParsel({ parsel_no: '', area_sqm: '', note: '' }); load();
  };
  const deleteParsel = async (id) => { await api.delete(`/admin/parsels/${id}`, { headers: authHeaders() }); toast.success('Silindi'); load(); };
  const handleExcel = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try { const { data } = await api.post(`/admin/projects/${projectId}/import-excel`, fd, { headers: authHeaders() }); setImportResult(data); if (data.success_count > 0) toast.success(`${data.success_count} parsel eklendi`); load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Import başarısız'); }
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end p-4 bg-slate-50 rounded-lg">
        <div><Label className="text-xs">Ada No</Label><Input value={newAda} onChange={e => setNewAda(e.target.value)} placeholder="33" className="w-20 mt-1" data-testid="new-ada-input" /></div>
        <div><Label className="text-xs">Açıklama</Label><Input value={newAdaDesc} onChange={e => setNewAdaDesc(e.target.value)} placeholder="opsiyonel" className="w-40 mt-1" /></div>
        <Button onClick={addAda} size="sm" className="bg-blue-600" data-testid="add-ada-btn"><Plus className="w-4 h-4 mr-1" />Ada Ekle</Button>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => window.open(`${API_BASE}/api/admin/excel-template`, '_blank')} variant="outline" size="sm" data-testid="download-template-btn"><Download className="w-4 h-4 mr-1" />Şablon</Button>
          <label><input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcel} className="hidden" />
            <Button as="span" variant="outline" size="sm" className="cursor-pointer" onClick={e => e.target.closest('label').querySelector('input').click()} data-testid="excel-import-btn"><Upload className="w-4 h-4 mr-1" />Excel Import</Button>
          </label>
        </div>
      </div>
      {importResult && <div className={`p-3 rounded-lg text-sm ${importResult.error_count > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'} border`}><p className="font-medium">{importResult.success_count} eklendi, {importResult.error_count} hata</p></div>}
      {adas.length === 0 ? <p className="text-center text-slate-400 py-6">Henüz ada yok</p> : adas.map(ada => (
        <Card key={ada.id} className="border">
          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50" onClick={() => setExpandedAda(expandedAda === ada.id ? null : ada.id)} data-testid={`ada-row-${ada.ada_no}`}>
            <div className="flex items-center gap-2"><Badge variant="outline" className="font-mono px-2">Ada {ada.ada_no}</Badge><Badge className="bg-blue-100 text-blue-700 text-xs">{parsels.filter(p => p.ada_id === ada.id).length} parsel</Badge></div>
            <Button variant="ghost" size="sm" className="text-red-500 h-7 w-7 p-0" onClick={e => { e.stopPropagation(); deleteAda(ada.id, ada.ada_no); }}><Trash2 className="w-3 h-3" /></Button>
          </div>
          {expandedAda === ada.id && (
            <div className="px-3 pb-3 border-t bg-slate-50">
              <div className="flex gap-2 items-end my-2 p-2 bg-blue-50 rounded">
                <div><Label className="text-xs">Parsel No</Label><Input value={newParsel.parsel_no} onChange={e => setNewParsel({ ...newParsel, parsel_no: e.target.value })} className="w-16 mt-1" data-testid="new-parsel-input" /></div>
                <div><Label className="text-xs">Alan (m2)</Label><Input type="number" value={newParsel.area_sqm} onChange={e => setNewParsel({ ...newParsel, area_sqm: e.target.value })} className="w-24 mt-1" /></div>
                <div><Label className="text-xs">Not</Label><Input value={newParsel.note} onChange={e => setNewParsel({ ...newParsel, note: e.target.value })} className="w-32 mt-1" /></div>
                <Button size="sm" onClick={() => addParsel(ada.id)} className="bg-blue-600" data-testid="add-parsel-btn"><Plus className="w-3 h-3 mr-1" />Ekle</Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                {parsels.filter(p => p.ada_id === ada.id).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-1.5 bg-white border rounded text-xs">
                    <span className="font-mono font-medium">P.{p.parsel_no}{p.area_sqm ? ` (${p.area_sqm}m2)` : ''}</span>
                    <button className="text-red-400 hover:text-red-600" onClick={() => deleteParsel(p.id)}><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ==================== MEDIA MANAGER ====================
function MediaManager({ projectId }) {
  const [media, setMedia] = useState([]);
  const [category, setCategory] = useState(MEDIA_CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const load = useCallback(async () => { const { data } = await api.get(`/projects/${projectId}/media`); setMedia(data); }, [projectId]);
  useEffect(() => { load(); }, [load]);
  const upload = async (e) => {
    const files = Array.from(e.target.files); if (!files.length) return; setUploading(true);
    for (const f of files) { const fd = new FormData(); fd.append('file', f); fd.append('category', category); try { await api.post(`/admin/projects/${projectId}/media`, fd, { headers: authHeaders() }); } catch { toast.error(`${f.name} yüklenemedi`); } }
    toast.success('Yüklendi'); load(); setUploading(false); e.target.value = '';
  };
  const del = async (id) => { await api.delete(`/admin/media/${id}`, { headers: authHeaders() }); load(); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end p-4 bg-slate-50 rounded-lg">
        <div><Label className="text-xs">Kategori</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="w-44 mt-1"><SelectValue /></SelectTrigger><SelectContent>{MEDIA_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <label><input type="file" accept="image/*" multiple onChange={upload} className="hidden" />
          <Button as="span" className="cursor-pointer bg-purple-600 hover:bg-purple-700" disabled={uploading} onClick={e => e.target.closest('label').querySelector('input').click()} data-testid="media-upload-btn"><Upload className="w-4 h-4 mr-1" />{uploading ? 'Yükleniyor...' : 'Resim Yükle'}</Button></label>
      </div>
      {MEDIA_CATEGORIES.map(cat => { const items = media.filter(m => m.category === cat); if (!items.length) return null;
        return (<div key={cat}><h4 className="font-semibold text-xs text-slate-600 mb-2">{cat} ({items.length})</h4>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">{items.map(m => (
            <div key={m.id} className="relative group rounded overflow-hidden border"><img src={`${API_BASE}/api/files/${m.storage_path}`} alt="" className="w-full h-24 object-cover" />
              <button className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100" onClick={() => del(m.id)}><X className="w-3 h-3" /></button></div>
          ))}</div></div>);
      })}
      {media.length === 0 && <p className="text-center text-slate-400 py-4">Henüz medya yok</p>}
    </div>
  );
}

// ==================== DOCUMENT MANAGER ====================
function DocumentManager({ projectId }) {
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const load = useCallback(async () => { const { data } = await api.get(`/projects/${projectId}/documents`); setDocs(data); }, [projectId]);
  useEffect(() => { load(); }, [load]);
  const upload = async (e) => {
    const file = e.target.files[0]; if (!file || !title.trim()) { toast.error('Başlık zorunlu'); return; }
    const fd = new FormData(); fd.append('file', file); fd.append('title', title); fd.append('doc_type', docType);
    try { await api.post(`/admin/projects/${projectId}/documents`, fd, { headers: authHeaders() }); toast.success('Yüklendi'); setTitle(''); load(); } catch { toast.error('Yükleme başarısız'); }
    e.target.value = '';
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end p-4 bg-slate-50 rounded-lg">
        <div><Label className="text-xs">Başlık</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="w-44 mt-1" data-testid="doc-title-input" /></div>
        <div><Label className="text-xs">Tür</Label><Select value={docType} onValueChange={setDocType}><SelectTrigger className="w-44 mt-1"><SelectValue /></SelectTrigger><SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <label><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={upload} className="hidden" />
          <Button as="span" className="cursor-pointer bg-orange-600 hover:bg-orange-700" onClick={e => e.target.closest('label').querySelector('input').click()} data-testid="doc-upload-btn"><Upload className="w-4 h-4 mr-1" />Belge Yükle</Button></label>
      </div>
      {docs.map(d => (<div key={d.id} className="flex items-center justify-between p-3 bg-white border rounded"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-500" /><div><p className="text-sm font-medium">{d.title}</p><p className="text-xs text-slate-500">{d.doc_type}</p></div></div>
        <div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => window.open(`${API_BASE}/api/files/${d.storage_path}`, '_blank')}>Aç</Button><Button variant="ghost" size="sm" className="text-red-500" onClick={async () => { await api.delete(`/admin/documents/${d.id}`, { headers: authHeaders() }); load(); }}><Trash2 className="w-3 h-3" /></Button></div></div>))}
      {docs.length === 0 && <p className="text-center text-slate-400 py-4">Henüz belge yok</p>}
    </div>
  );
}

// ==================== VIDEO MANAGER ====================
function VideoManager({ projectId, videos, onRefresh }) {
  const [url, setUrl] = useState('');
  const add = async () => { if (!url.trim()) return; const fd = new FormData(); fd.append('youtube_url', url); await api.post(`/admin/projects/${projectId}/videos`, fd, { headers: authHeaders() }); toast.success('Eklendi'); setUrl(''); onRefresh(); };
  const remove = async (v) => { const fd = new FormData(); fd.append('youtube_url', v); await api.delete(`/admin/projects/${projectId}/videos`, { data: fd, headers: authHeaders() }); toast.success('Silindi'); onRefresh(); };
  const ytId = (u) => { const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/); return m ? m[1] : null; };
  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end p-4 bg-slate-50 rounded-lg">
        <div className="flex-1"><Label className="text-xs">YouTube Linki</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1" data-testid="video-url-input" /></div>
        <Button onClick={add} className="bg-red-600 hover:bg-red-700" data-testid="add-video-btn"><Plus className="w-4 h-4 mr-1" />Ekle</Button>
      </div>
      {(!videos || videos.length === 0) ? <p className="text-center text-slate-400 py-4">Henüz video yok</p> :
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{videos.map((v, i) => { const vid = ytId(v); return vid ? (
          <div key={i} className="rounded overflow-hidden border"><iframe src={`https://www.youtube.com/embed/${vid}`} className="w-full h-40" allowFullScreen title={`V${i}`} />
            <div className="flex items-center justify-between p-2"><p className="text-xs truncate flex-1 text-slate-500">{v}</p><button className="text-red-500" onClick={() => remove(v)}><Trash2 className="w-3 h-3" /></button></div></div>) : null; })}</div>}
    </div>
  );
}

// ==================== MAP LAYER MANAGER WITH PREVIEW ====================
function MapLayerManager({ projectId }) {
  const [layers, setLayers] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewName, setPreviewName] = useState('');
  const mapRef = useRef(null);
  const previewLayerRef = useRef(null);

  const load = useCallback(async () => { const { data } = await api.get(`/projects/${projectId}/map-layers`); setLayers(data); }, [projectId]);
  useEffect(() => { load(); }, [load]);

  // Initialize map once
  useEffect(() => {
    let cancelled = false;
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      const container = document.getElementById('admin-map-preview');
      if (!container || container._leaflet_id || cancelled) return;
      const map = L.map(container).setView([39.9, 32.8], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
      mapRef.current = map;
    };
    initMap();
    return () => { cancelled = true; };
  }, []);

  // Render preview data on map
  useEffect(() => {
    if (!mapRef.current) return;
    const loadLeaflet = async () => {
      const L = (await import('leaflet')).default;
      if (previewLayerRef.current) {
        mapRef.current.removeLayer(previewLayerRef.current);
        previewLayerRef.current = null;
      }
      if (previewData) {
        try {
          const layer = L.geoJSON(previewData, {
            style: { color: '#ef4444', weight: 3, fillOpacity: 0.2, fillColor: '#ef4444' },
            onEachFeature: (feature, layer) => {
              if (feature.properties) {
                const props = Object.entries(feature.properties).map(([k, v]) => `<b>${k}:</b> ${v}`).join('<br/>');
                if (props) layer.bindPopup(props);
              }
            }
          }).addTo(mapRef.current);
          previewLayerRef.current = layer;
          mapRef.current.fitBounds(layer.getBounds(), { padding: [20, 20] });
        } catch (err) {
          toast.error('GeoJSON okunamadı: ' + err.message);
        }
      }
    };
    loadLeaflet();
  }, [previewData]);

  // Also render already-uploaded layers on the map
  useEffect(() => {
    if (!mapRef.current || layers.length === 0) return;
    const loadExistingLayers = async () => {
      const L = (await import('leaflet')).default;
      for (const layer of layers) {
        if (layer.file_type === 'GEOJSON' || layer.file_type === 'JSON') {
          try {
            const { data } = await api.get(`/projects/${projectId}/map-layers/${layer.id}/data`);
            L.geoJSON(data, {
              style: { color: '#3b82f6', weight: 2, fillOpacity: 0.15, fillColor: '#3b82f6' }
            }).addTo(mapRef.current);
          } catch (err) { console.error('Map layer load error:', err); }
        }
      }
    };
    loadExistingLayers();
  }, [layers, projectId]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    setPreviewFile(file);
    setPreviewName(file.name);

    if (ext === 'geojson' || ext === 'json') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          setPreviewData(parsed);
          toast.success('GeoJSON haritada gösteriliyor - ön izleme');
        } catch {
          toast.error('GeoJSON dosyası okunamadı');
          setPreviewData(null);
        }
      };
      reader.readAsText(file);
    } else {
      setPreviewData(null);
      toast.info(`${ext.toUpperCase()} dosyası seçildi. Yükle butonuna basarak kaydedebilirsiniz.`);
    }
    e.target.value = '';
  };

  const uploadPreviewFile = async () => {
    if (!previewFile) return;
    const fd = new FormData(); fd.append('file', previewFile);
    try {
      await api.post(`/admin/projects/${projectId}/map-layers`, fd, { headers: authHeaders() });
      toast.success('Harita katmanı yüklendi');
      setPreviewFile(null); setPreviewData(null); setPreviewName('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Yükleme başarısız');
    }
  };

  const cancelPreview = () => {
    setPreviewFile(null); setPreviewData(null); setPreviewName('');
  };

  return (
    <div className="space-y-4">
      {/* Map Preview */}
      <div className="rounded-xl overflow-hidden border shadow-sm">
        <div className="bg-slate-800 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2"><Layers className="w-4 h-4" />Harita Ön İzleme</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span><span className="text-xs">Mevcut</span>
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block ml-2"></span><span className="text-xs">Yeni (ön izleme)</span>
          </div>
        </div>
        <div id="admin-map-preview" className="h-[400px] w-full" data-testid="admin-map-preview" />
      </div>

      {/* Upload Controls */}
      <div className="p-4 bg-slate-50 rounded-lg space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <label>
            <input type="file" accept=".kml,.kmz,.geojson,.json" onChange={handleFileSelect} className="hidden" />
            <Button as="span" variant="outline" className="cursor-pointer" onClick={e => e.target.closest('label').querySelector('input').click()} data-testid="map-file-select-btn">
              <Layers className="w-4 h-4 mr-1" />Dosya Seç (KML / KMZ / GeoJSON)
            </Button>
          </label>
          {previewFile && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border">
              <Layers className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium">{previewName}</span>
              {previewData && <Badge className="bg-green-100 text-green-700 text-xs">Ön izleme aktif</Badge>}
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-7" onClick={uploadPreviewFile} data-testid="map-layer-upload-btn">
                <Upload className="w-3 h-3 mr-1" />Yükle
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-slate-500" onClick={cancelPreview}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Existing Layers */}
      {layers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Yüklü Katmanlar ({layers.length})</h4>
          <div className="space-y-1.5">
            {layers.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{l.original_filename}</span>
                  <Badge variant="outline" className="text-xs">{l.file_type}</Badge>
                  <span className="text-xs text-slate-400">{(l.size / 1024).toFixed(1)} KB</span>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={async () => { await api.delete(`/admin/map-layers/${l.id}`, { headers: authHeaders() }); load(); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== IPAT (LAND PARCELS) MANAGER ====================
function IpatManager() {
  const [parcels, setParcels] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ city: '', district: '', neighborhood: '', ada: '', parsel: '', size_sqm: '', zoning_info: '', development_potential: '', location_lat: 41.0082, location_lng: 28.9784 });

  const load = useCallback(async () => { const { data } = await api.get('/land-parcels'); setParcels(data); }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try { await api.post('/admin/land-parcels', fd, { headers: authHeaders() }); toast.success('Parsel eklendi'); setShowForm(false); setForm({ city: '', district: '', neighborhood: '', ada: '', parsel: '', size_sqm: '', zoning_info: '', development_potential: '', location_lat: 41.0082, location_lng: 28.9784 }); load(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Hata'); }
  };
  const del = async (id) => { if (!window.confirm('Silinsin mi?')) return; await api.delete(`/admin/land-parcels/${id}`, { headers: authHeaders() }); toast.success('Silindi'); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">e-İPAT Arsa Parselleri ({parcels.length})</h2>
        <Button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700" data-testid="new-parcel-btn"><Plus className="w-4 h-4 mr-2" />Yeni Parsel</Button>
      </div>
      {showForm && (
        <Card className="p-5 mb-4">
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs">İl *</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required className="mt-1" /></div>
            <div><Label className="text-xs">İlçe *</Label><Input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} required className="mt-1" /></div>
            <div><Label className="text-xs">Mahalle</Label><Input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Ada *</Label><Input value={form.ada} onChange={e => setForm({ ...form, ada: e.target.value })} required className="mt-1" /></div>
            <div><Label className="text-xs">Parsel *</Label><Input value={form.parsel} onChange={e => setForm({ ...form, parsel: e.target.value })} required className="mt-1" /></div>
            <div><Label className="text-xs">Alan (m2)</Label><Input type="number" value={form.size_sqm} onChange={e => setForm({ ...form, size_sqm: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">İmar Durumu</Label><Input value={form.zoning_info} onChange={e => setForm({ ...form, zoning_info: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Gelişim Potansiyeli</Label><Input value={form.development_potential} onChange={e => setForm({ ...form, development_potential: e.target.value })} className="mt-1" /></div>
            <div className="flex items-end gap-2"><Button type="submit" className="bg-green-600"><Check className="w-4 h-4 mr-1" />Kaydet</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button></div>
          </form>
        </Card>
      )}
      {parcels.length === 0 ? <Card className="p-8 text-center"><Map className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">Henüz arsa parseli yok</p></Card> :
        <div className="space-y-2">{parcels.map(p => (
          <Card key={p.id} className="p-3 flex items-center justify-between hover:shadow-sm" data-testid={`parcel-${p.id}`}>
            <div><span className="font-bold text-sm">{p.city} / {p.district}</span>{p.neighborhood && <span className="text-sm text-slate-500"> / {p.neighborhood}</span>}<div className="flex gap-2 mt-1"><Badge variant="outline" className="text-xs font-mono">Ada {p.ada}</Badge><Badge variant="outline" className="text-xs font-mono">Parsel {p.parsel}</Badge>{p.size_sqm > 0 && <Badge className="bg-green-100 text-green-700 text-xs">{p.size_sqm} m2</Badge>}</div></div>
            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => del(p.id)}><Trash2 className="w-4 h-4" /></Button>
          </Card>
        ))}</div>}
    </div>
  );
}

// ==================== SHARED FACILITIES MANAGER ====================
const FACILITY_TYPES = [
  { value: 'okul',         label: 'Okul',          color: 'bg-sky-100 text-sky-800 border-sky-200' },
  { value: 'cami',         label: 'Cami',          color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'sosyal_tesis', label: 'Sosyal Tesis',  color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'park',         label: 'Park / Yeşil Alan', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'hastane',      label: 'Hastane / Sağlık', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'diger',        label: 'Diğer',         color: 'bg-amber-100 text-amber-800 border-amber-200' },
];

function SharedFacilitiesManager() {
  const [facilities, setFacilities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'okul', lat: '', lng: '', description: '' });
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    const { data } = await api.get('/shared-facilities');
    setFacilities(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.lat || !form.lng) { toast.error('Ad, enlem ve boylam zorunludur'); return; }
    try {
      const payload = { ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng) };
      if (editId) {
        await api.put(`/admin/shared-facilities/${editId}`, payload, { headers: authHeaders() });
        toast.success('Tesis güncellendi');
      } else {
        await api.post('/admin/shared-facilities', payload, { headers: authHeaders() });
        toast.success('Tesis eklendi');
      }
      setShowForm(false); setEditId(null);
      setForm({ name: '', type: 'okul', lat: '', lng: '', description: '' });
      load();
    } catch { toast.error('İşlem başarısız'); }
  };

  const del = async (id) => {
    if (!window.confirm('Bu tesis silinsin mi?')) return;
    await api.delete(`/admin/shared-facilities/${id}`, { headers: authHeaders() });
    toast.success('Silindi'); load();
  };

  const startEdit = (f) => {
    setForm({ name: f.name, type: f.type, lat: f.lat, lng: f.lng, description: f.description || '' });
    setEditId(f.id); setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ortak Tesisler</h2>
          <p className="text-sm text-slate-500 mt-0.5">Tüm proje haritalarında sabit görünecek ortak sosyal alanlar</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', type: 'okul', lat: '', lng: '', description: '' }); }}
          className="bg-emerald-600 hover:bg-emerald-700" data-testid="new-facility-btn">
          <Plus className="w-4 h-4 mr-2" />{showForm && !editId ? 'İptal' : 'Yeni Tesis'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">{editId ? 'Tesis Düzenle' : 'Yeni Tesis Ekle'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-slate-700">Tesis Adı *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Örn: Sazlıbosna Ortaokulu" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Tür *</Label>
              <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {FACILITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Açıklama</Label>
              <Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Kısa açıklama" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Enlem (Lat) *</Label>
              <Input type="number" step="any" value={form.lat} onChange={e => setForm(p => ({...p, lat: e.target.value}))} placeholder="41.152286" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Boylam (Lng) *</Label>
              <Input type="number" step="any" value={form.lng} onChange={e => setForm(p => ({...p, lng: e.target.value}))} placeholder="28.689402" className="mt-1" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">💡 Google Maps'te sağ tıklayıp koordinatı kopyalayabilirsiniz</p>
          <div className="flex gap-2 mt-4">
            <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700">{editId ? 'Güncelle' : 'Ekle'}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>İptal</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {facilities.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Henüz ortak tesis eklenmedi</p>
          </div>
        )}
        {facilities.map(f => {
          const typeInfo = FACILITY_TYPES.find(t => t.value === f.type) || FACILITY_TYPES[5];
          return (
            <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${typeInfo.color} mb-1.5`}>{typeInfo.label}</span>
                  <p className="font-bold text-slate-800 text-sm">{f.name}</p>
                  {f.description && <p className="text-xs text-slate-500 mt-0.5">{f.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(f)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => del(f.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">{f.lat?.toFixed(5)}, {f.lng?.toFixed(5)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== MEGA PROJECTS MANAGER ====================
function MegaManager() {
  const [projects, setProjects]       = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const EMPTY_FORM = { name: '', category: '', description: '', timeline: '', location_lat: 41.0082, location_lng: 28.9784 };
  const [form, setForm] = useState(EMPTY_FORM);
  const CATS = ['Köprü', 'Havalimanı', 'Metro', 'Otoyol', 'Kanal', 'Sanayi Bölgesi', 'TOKİ', 'Diğer'];

  const load = useCallback(async () => { const { data } = await api.get('/mega-projects'); setProjects(data); }, []);
  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setShowForm(false); setEditingProject(null); setForm(EMPTY_FORM); };

  const startEdit = (p) => {
    setEditingProject(p);
    setForm({ name: p.name || '', category: p.category || '', description: p.description || '', timeline: p.timeline || '', location_lat: p.location?.lat || 41.0082, location_lng: p.location?.lng || 28.9784 });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(); Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try {
      if (editingProject) {
        await api.put(`/admin/mega-projects/${editingProject.id}`, fd, { headers: authHeaders() });
        toast.success('Mega proje güncellendi');
      } else {
        await api.post('/admin/mega-projects', fd, { headers: authHeaders() });
        toast.success('Mega proje eklendi');
      }
      resetForm(); load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Hata'); }
  };

  const del = async (id) => {
    if (!window.confirm('Silinsin mi?')) return;
    await api.delete(`/admin/mega-projects/${id}`, { headers: authHeaders() });
    toast.success('Silindi'); load();
  };

  const manualProjects = projects.filter(p => !p.from_projects);
  const autoProjects   = projects.filter(p => p.from_projects);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Mega Projeler</h2>
        <Button onClick={() => { resetForm(); setShowForm(v => !v); }} className="bg-cyan-600 hover:bg-cyan-700" data-testid="new-mega-btn">
          <Plus className="w-4 h-4 mr-2" />Yeni Mega Proje
        </Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-5 border-cyan-200 bg-cyan-50/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">{editingProject ? '✏️ Mega Proje Düzenle' : '➕ Yeni Mega Proje'}</h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Proje Adı *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Örn: Kanal İstanbul" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Kategori *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Zaman Çizelgesi</Label>
              <Input value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} placeholder="2024-2030" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Enlem (Lat)</Label>
                <Input type="number" step="any" value={form.location_lat} onChange={e => setForm({ ...form, location_lat: parseFloat(e.target.value) || 41.0082 })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Boylam (Lng)</Label>
                <Input type="number" step="any" value={form.location_lng} onChange={e => setForm({ ...form, location_lng: parseFloat(e.target.value) || 28.9784 })} className="mt-1" />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold">Açıklama</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Proje hakkında detaylı açıklama giriniz..." className="mt-1" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                <Check className="w-4 h-4 mr-1" />{editingProject ? 'Güncelle' : 'Kaydet'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>İptal</Button>
            </div>
          </form>
        </Card>
      )}

      {autoProjects.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-500 mb-2">TOKİ Projelerinden Otomatik ({autoProjects.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {autoProjects.map(p => (
              <Card key={p.id} className="p-3 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2"><Badge className="bg-blue-100 text-blue-700 text-[10px]">{p.category}</Badge><span className="font-medium text-sm">{p.name}</span></div>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {manualProjects.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Manuel mega proje eklenmemiş</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {manualProjects.map(p => (
            <Card key={p.id} className="p-4" data-testid={`mega-${p.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm text-slate-900">{p.name}</span>
                    <Badge className="bg-cyan-100 text-cyan-700 text-[10px]">{p.category}</Badge>
                    {p.timeline && <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{p.timeline}</span>}
                  </div>
                  {p.description && <p className="text-xs text-slate-600 line-clamp-2 mb-1">{p.description}</p>}
                  {p.location && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{p.location.lat?.toFixed(4)}, {p.location.lng?.toFixed(4)}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50 h-8 w-8 p-0" onClick={() => startEdit(p)} data-testid={`edit-mega-${p.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 h-8 w-8 p-0" onClick={() => del(p.id)} data-testid={`del-mega-${p.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== EDUCATION MANAGER (moved to EducationManager.js) ====================

// ==================== COMMUNITY MANAGER ====================
function CommunityManager() {
  const [posts, setPosts] = useState([]);
  const load = useCallback(async () => { const { data } = await api.get('/community/posts'); setPosts(data); }, []);
  useEffect(() => { load(); }, [load]);
  const del = async (id) => { await api.delete(`/admin/community/posts/${id}`, { headers: authHeaders() }); toast.success('Silindi'); load(); };
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Topluluk Gönderileri ({posts.length})</h2>
      {posts.length === 0 ? <Card className="p-8 text-center"><Users className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">Henüz gönderi yok</p></Card> :
        <div className="space-y-2">{posts.map(p => (<Card key={p.id} className="p-3 flex items-center justify-between"><div><span className="font-bold text-sm">{p.title}</span><Badge className="ml-2 text-xs">{p.category}</Badge><p className="text-xs text-slate-500 mt-0.5">{p.content?.substring(0, 100)}</p></div>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => del(p.id)}><Trash2 className="w-4 h-4" /></Button></Card>))}</div>}
    </div>
  );
}

// ==================== OPPORTUNITIES MANAGER ====================
function OpportunitiesManager() {
  const [opps, setOpps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ location_text: '', parcel_size_sqm: '', zoning_type: '', investment_potential: 'orta', risk_score: 5, development_potential: '', price_per_sqm: '', location_lat: 41.0082, location_lng: 28.9784 });
  const load = useCallback(async () => { const { data } = await api.get('/opportunities'); setOpps(data); }, []);
  useEffect(() => { load(); }, [load]);
  const submit = async (e) => {
    e.preventDefault(); const fd = new FormData(); Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    await api.post('/admin/opportunities', fd, { headers: authHeaders() }); toast.success('Eklendi'); setShowForm(false); load();
  };
  const del = async (id) => { await api.delete(`/admin/opportunities/${id}`, { headers: authHeaders() }); toast.success('Silindi'); load(); };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Arsa Fırsatları ({opps.length})</h2>
        <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700" data-testid="new-opp-btn"><Plus className="w-4 h-4 mr-2" />Yeni Fırsat</Button>
      </div>
      {showForm && (
        <Card className="p-5 mb-4"><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><Label className="text-xs">Konum *</Label><Input value={form.location_text} onChange={e => setForm({ ...form, location_text: e.target.value })} required className="mt-1" /></div>
          <div><Label className="text-xs">Alan (m2)</Label><Input type="number" value={form.parcel_size_sqm} onChange={e => setForm({ ...form, parcel_size_sqm: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">İmar Türü</Label><Input value={form.zoning_type} onChange={e => setForm({ ...form, zoning_type: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Yatırım Potansiyeli</Label>
            <Select value={form.investment_potential} onValueChange={v => setForm({ ...form, investment_potential: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="düşük">Düşük</SelectItem><SelectItem value="orta">Orta</SelectItem><SelectItem value="yüksek">Yüksek</SelectItem></SelectContent></Select></div>
          <div><Label className="text-xs">Risk Skoru (1-10)</Label><Input type="number" min="1" max="10" value={form.risk_score} onChange={e => setForm({ ...form, risk_score: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">m2 Fiyatı (TL)</Label><Input type="number" value={form.price_per_sqm} onChange={e => setForm({ ...form, price_per_sqm: e.target.value })} className="mt-1" /></div>
          <div className="md:col-span-2"><Label className="text-xs">Gelişim Potansiyeli</Label><Input value={form.development_potential} onChange={e => setForm({ ...form, development_potential: e.target.value })} className="mt-1" /></div>
          <div className="flex items-end gap-2"><Button type="submit" className="bg-red-600"><Check className="w-4 h-4 mr-1" />Kaydet</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button></div>
        </form></Card>
      )}
      {opps.length === 0 ? <Card className="p-8 text-center"><Target className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">Henüz fırsat yok</p></Card> :
        <div className="space-y-2">{opps.map(o => (<Card key={o.id} className="p-3 flex items-center justify-between"><div><span className="font-bold text-sm">{o.location}</span><Badge className={`ml-2 text-xs ${o.investment_potential === 'yüksek' ? 'bg-green-100 text-green-700' : o.investment_potential === 'orta' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{o.investment_potential}</Badge>{o.parcel_size_sqm > 0 && <Badge variant="outline" className="ml-1 text-xs">{o.parcel_size_sqm} m2</Badge>}</div>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => del(o.id)}><Trash2 className="w-4 h-4" /></Button></Card>))}</div>}
    </div>
  );
}


// ==================== SEO MANAGER ====================
const SEO_PAGES_META = [
  { id: 'home',          label: 'Ana Sayfa',          icon: '🏠', path: '/' },
  { id: 'e-konut',       label: 'e-Konut Projeleri',  icon: '🏗️', path: '/toki' },
  { id: 'mega-projects', label: 'Mega Projeler',      icon: '🗺️', path: '/mega-projects' },
  { id: 'ipat',          label: 'e-İPAT Arsa',        icon: '📐', path: '/ipar' },
  { id: 'egitim',        label: 'Eğitim Platformu',   icon: '🎓', path: '/egitim' },
  { id: 'topluluk',      label: 'Topluluk Forumu',    icon: '👥', path: '/topluluk' },
  { id: 'yatirim-fonu',  label: 'Yatırım Fonu',       icon: '💼', path: '/yatirim-fonu' },
];

function CharCount({ value = '', min, max }) {
  const len = value.length;
  const ok  = len >= min && len <= max;
  const over = len > max;
  return (
    <span className={`text-xs font-mono ml-2 ${ok ? 'text-emerald-600' : over ? 'text-red-500' : 'text-amber-500'}`}>
      {len}/{max}
    </span>
  );
}

function SeoManager() {
  const [pages, setPages]           = useState({});
  const [activeId, setActiveId]     = useState('home');
  const [form, setForm]             = useState({});
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [progress, setProgress]     = useState('');

  const emptyForm = (pid) => ({
    page_id: pid, title: '', description: '', keywords: '',
    og_title: '', og_description: '', og_image: '', robots: 'index,follow'
  });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/seo', { headers: authHeaders() });
      const map = {};
      data.forEach(p => { map[p.page_id] = p; });
      setPages(map);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Always sync form when activeId or pages change
  useEffect(() => {
    const pageData = pages[activeId];
    setForm(pageData ? { ...pageData } : emptyForm(activeId));
  }, [activeId, pages]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, page_id: activeId };
      await api.put(`/admin/seo/${activeId}`, payload, { headers: authHeaders() });
      setPages(prev => ({ ...prev, [activeId]: payload }));
      toast.success('Kaydedildi');
    } catch { toast.error('Kayıt hatası'); }
    setSaving(false);
  };

  const generateOne = async (pageId) => {
    setGenerating(true);
    try {
      const { data } = await api.post(`/admin/seo/generate/${pageId}`, {}, { headers: authHeaders() });
      const merged = { ...(pages[pageId] || emptyForm(pageId)), ...data, page_id: pageId };
      await api.put(`/admin/seo/${pageId}`, merged, { headers: authHeaders() });
      setPages(prev => ({ ...prev, [pageId]: merged }));
      if (pageId === activeId) setForm({ ...merged });
      toast.success(`${SEO_PAGES_META.find(p => p.id === pageId)?.label} SEO'su oluşturuldu!`);
    } catch (e) { toast.error(e.response?.data?.detail || 'AI hatası'); }
    setGenerating(false);
  };

  const generateAll = async () => {
    setGeneratingAll(true);
    const updated = { ...pages };
    for (const page of SEO_PAGES_META) {
      setProgress(`${page.label} işleniyor...`);
      try {
        const { data } = await api.post(`/admin/seo/generate/${page.id}`, {}, { headers: authHeaders() });
        const merged = { ...(updated[page.id] || emptyForm(page.id)), ...data, page_id: page.id };
        await api.put(`/admin/seo/${page.id}`, merged, { headers: authHeaders() });
        updated[page.id] = merged;
        setPages({ ...updated });
        if (page.id === activeId) setForm({ ...merged });
      } catch {}
    }
    setProgress('');
    setGeneratingAll(false);
    toast.success('Tüm sayfalar için SEO oluşturuldu!');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Kopyalandı'));
  };

  const activePage = SEO_PAGES_META.find(p => p.id === activeId);
  const isComplete = (p) => pages[p.id]?.description?.length > 50 && pages[p.id]?.keywords?.length > 10;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" /> SEO Yönetimi
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">mrxozdemir.com Google sıralamasını güçlendirin</p>
        </div>
        <Button
          onClick={generateAll}
          disabled={generatingAll}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2"
          data-testid="generate-all-seo-btn"
        >
          {generatingAll
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> {progress || 'Oluşturuluyor...'}</>
            : <><Sparkles className="w-4 h-4" /> Tümünü AI ile Doldur</>
          }
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Page list sidebar */}
        <div className="lg:col-span-1 space-y-1">
          {SEO_PAGES_META.map(page => (
            <button
              key={page.id}
              onClick={() => setActiveId(page.id)}
              data-testid={`seo-page-${page.id}`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeId === page.id
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{page.icon}</span>
                <span>{page.label}</span>
              </span>
              {isComplete(page)
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                : <AlertCircle  className="w-4 h-4 text-amber-400 shrink-0" />
              }
            </button>
          ))}
        </div>

        {/* Editor */}
        <Card className="lg:col-span-3 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">
              {activePage?.icon} {activePage?.label}
              <span className="ml-2 text-xs text-slate-400 font-normal">{activePage?.path}</span>
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateOne(activeId)}
              disabled={generating}
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              data-testid="generate-one-seo-btn"
            >
              {generating
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />
              }
              AI ile Doldur
            </Button>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center mb-1">
              <Label className="text-xs font-semibold text-slate-700">Sayfa Başlığı (Title)</Label>
              <CharCount value={form.title} min={50} max={60} />
            </div>
            <div className="relative">
              <Input
                value={form.title || ''}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ana Sayfa | mrxakademi — Türkiye PropTech Platformu"
                className="pr-9"
                data-testid="seo-title-input"
              />
              <button onClick={() => copyToClipboard(form.title || '')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Google arama sonuçlarında gösterilen başlık. 50-60 karakter idealdir.</p>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center mb-1">
              <Label className="text-xs font-semibold text-slate-700">Meta Açıklama (Description)</Label>
              <CharCount value={form.description} min={150} max={160} />
            </div>
            <Textarea
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Google arama sonucunda gösterilen açıklama..."
              data-testid="seo-description-input"
            />
            <p className="text-[10px] text-slate-400 mt-1">150-160 karakter ideal. Anahtar kelimeler + eylem çağrısı içermeli.</p>
          </div>

          {/* Keywords */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 block mb-1">Anahtar Kelimeler (Keywords)</Label>
            <Textarea
              value={form.keywords || ''}
              onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
              rows={2}
              placeholder="TOKİ projeleri, konut yatırımı, İstanbul gayrimenkul, arsa analizi..."
              data-testid="seo-keywords-input"
            />
            <p className="text-[10px] text-slate-400 mt-1">Virgülle ayrılmış 10-12 anahtar kelime.</p>
          </div>

          {/* OG section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <div className="flex items-center mb-1">
                <Label className="text-xs font-semibold text-slate-700">OG Başlığı (Sosyal Medya)</Label>
                <CharCount value={form.og_title} min={40} max={60} />
              </div>
              <Input
                value={form.og_title || ''}
                onChange={e => setForm(f => ({ ...f, og_title: e.target.value }))}
                placeholder="Facebook/Twitter paylaşım başlığı"
                data-testid="seo-og-title-input"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1">OG Görsel URL</Label>
              <Input
                value={form.og_image || ''}
                onChange={e => setForm(f => ({ ...f, og_image: e.target.value }))}
                placeholder="https://mrxozdemir.com/og-image.jpg"
                data-testid="seo-og-image-input"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center mb-1">
                <Label className="text-xs font-semibold text-slate-700">OG Açıklaması</Label>
                <CharCount value={form.og_description} min={90} max={110} />
              </div>
              <Input
                value={form.og_description || ''}
                onChange={e => setForm(f => ({ ...f, og_description: e.target.value }))}
                placeholder="Sosyal medya paylaşım açıklaması..."
                data-testid="seo-og-desc-input"
              />
            </div>
          </div>

          {/* Robots + Save */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-semibold text-slate-700">Robots</Label>
              <select
                value={form.robots || 'index,follow'}
                onChange={e => setForm(f => ({ ...f, robots: e.target.value }))}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                data-testid="seo-robots-select"
              >
                <option value="index,follow">index, follow (Önerilen)</option>
                <option value="noindex,follow">noindex, follow</option>
                <option value="index,nofollow">index, nofollow</option>
                <option value="noindex,nofollow">noindex, nofollow</option>
              </select>
            </div>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              data-testid="save-seo-btn"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Kaydet
            </Button>
          </div>

          {/* Preview card */}
          {(form.title || form.description) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">Google Önizleme</p>
              <p className="text-blue-700 text-sm font-medium leading-tight hover:underline cursor-pointer">
                {form.title || 'Başlık girilmedi'}
              </p>
              <p className="text-emerald-700 text-xs mt-0.5">mrxozdemir.com{activePage?.path}</p>
              <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                {form.description || 'Açıklama girilmedi'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}


// ==================== MARKET DATA MANAGER ====================
function MarketManager() {
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ neighborhood: '', city: '', district: '', avg_price_per_sqm: '', price_change_percentage: '', data_date: '' });
  const load = useCallback(async () => { const res = await api.get('/market-data'); setData(res.data); }, []);
  useEffect(() => { load(); }, [load]);
  const submit = async (e) => {
    e.preventDefault(); const fd = new FormData(); Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    await api.post('/admin/market-data', fd, { headers: authHeaders() }); toast.success('Eklendi'); setShowForm(false); setForm({ neighborhood: '', city: '', district: '', avg_price_per_sqm: '', price_change_percentage: '', data_date: '' }); load();
  };
  const del = async (id) => { await api.delete(`/admin/market-data/${id}`, { headers: authHeaders() }); toast.success('Silindi'); load(); };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Piyasa Analizi ({data.length})</h2>
        <Button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700" data-testid="new-market-btn"><Plus className="w-4 h-4 mr-2" />Yeni Veri</Button>
      </div>
      {showForm && (
        <Card className="p-5 mb-4"><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><Label className="text-xs">Mahalle *</Label><Input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} required className="mt-1" /></div>
          <div><Label className="text-xs">İl *</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required className="mt-1" /></div>
          <div><Label className="text-xs">İlçe</Label><Input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Ort. m2 Fiyat (TL)</Label><Input type="number" value={form.avg_price_per_sqm} onChange={e => setForm({ ...form, avg_price_per_sqm: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Fiyat Değişimi (%)</Label><Input type="number" step="0.01" value={form.price_change_percentage} onChange={e => setForm({ ...form, price_change_percentage: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Veri Tarihi</Label><Input type="date" value={form.data_date} onChange={e => setForm({ ...form, data_date: e.target.value })} className="mt-1" /></div>
          <div className="flex items-end gap-2"><Button type="submit" className="bg-teal-600"><Check className="w-4 h-4 mr-1" />Kaydet</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button></div>
        </form></Card>
      )}
      {data.length === 0 ? <Card className="p-8 text-center"><BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">Henüz piyasa verisi yok</p></Card> :
        <div className="space-y-2">{data.map(d => (<Card key={d.id} className="p-3 flex items-center justify-between"><div><span className="font-bold text-sm">{d.neighborhood} - {d.city}{d.district ? ` / ${d.district}` : ''}</span><div className="flex gap-2 mt-1">{d.avg_price_per_sqm > 0 && <Badge className="bg-teal-100 text-teal-700 text-xs">{Number(d.avg_price_per_sqm).toLocaleString('tr-TR')} TL/m2</Badge>}<Badge className={`text-xs ${d.price_change_percentage >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.price_change_percentage > 0 ? '+' : ''}{d.price_change_percentage}%</Badge></div></div>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => del(d.id)}><Trash2 className="w-4 h-4" /></Button></Card>))}</div>}
    </div>
  );
}

// ==================== MAIN ADMIN PAGE ====================
export default function AdminPanelPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => { if (data.role === 'admin') setUser(data); else localStorage.removeItem('admin_token'); })
        .catch(() => localStorage.removeItem('admin_token'));
    }
  }, []);

  const loadStats = useCallback(async () => {
    try { const { data } = await api.get('/admin/stats', { headers: authHeaders() }); setStats(data); } catch (err) { console.error('Stats load error:', err); }
  }, []);
  useEffect(() => { if (user) loadStats(); }, [user, loadStats]);

  if (!user) return <AdminLogin onLogin={setUser} />;

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardContent stats={stats} onNavigate={setActivePage} />;
      case 'toki': return <TokiManager />;
      case 'ipat': return <IpatManager />;
      case 'mega': return <MegaManager />;
      case 'education': return <EducationManagerPage />;
      case 'community': return <CommunityManager />;
      case 'opportunities': return <OpportunitiesManager />;
      case 'market': return <MarketManager />;
      case 'users': return <UsersManager />;
      case 'seo': return <SeoManager />;
      default: return <DashboardContent stats={stats} onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar active={activePage} onSelect={setActivePage} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} data-testid="go-home-btn"><ArrowLeft className="w-4 h-4 mr-1" />Siteye Dön</Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user.email}</span>
            <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem('admin_token'); setUser(null); }} data-testid="logout-btn"><LogOut className="w-4 h-4 mr-1" />Çıkış</Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
