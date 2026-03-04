import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Search, X, Save, UserX, UserCheck, Shield, LogOut as EndSession,
  ChevronLeft, ChevronRight, RefreshCw, Tag, Clock, Activity,
  Users, Ban, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import api from '@/utils/api';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('admin_token')}` };
}

const MODULES = [
  { key: 'projects', label: 'Projeler (TOKİ)' },
  { key: 'parcels', label: 'Ada/Parsel' },
  { key: 'maps', label: 'Harita (KML/KMZ/GeoJSON)' },
  { key: 'documents', label: 'Belgeler' },
  { key: 'videos', label: 'Videolar' },
  { key: 'media', label: 'Medya/Galeri' },
  { key: 'analysis', label: 'Analiz' },
  { key: 'education', label: 'Eğitim İçerikleri' },
  { key: 'reports', label: 'Raporlar' },
];

const PERMISSION_LEVELS = [
  { value: 'none', label: 'Erişim Yok' },
  { value: 'view', label: 'Görüntüle' },
  { value: 'edit', label: 'Düzenle' },
  { value: 'admin', label: 'Tam Yetki' },
];

const STATUS_CONFIG = {
  active: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  passive: { label: 'Pasif', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  banned: { label: 'Banlı', color: 'bg-red-100 text-red-700 border-red-200' },
};

const PLAN_CONFIG = {
  free: { label: 'Ücretsiz', color: 'bg-slate-100 text-slate-600' },
  pro: { label: 'Pro', color: 'bg-blue-100 text-blue-700' },
  yearly: { label: 'Yıllık', color: 'bg-purple-100 text-purple-700' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: 'Bilinmiyor', color: 'bg-slate-100 text-slate-500' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>;
}

function PlanBadge({ plan }) {
  const cfg = PLAN_CONFIG[plan] || { label: plan || 'Ücretsiz', color: 'bg-slate-100 text-slate-500' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>;
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return dateStr; }
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toISOString().split('T')[0]; }
  catch { return ''; }
}

// ==================== USER DRAWER ====================
function UserDrawer({ user: initialUser, onClose, onUpdated }) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState('summary');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Summary fields
  const [fullName, setFullName] = useState(initialUser.full_name || '');
  const [phone, setPhone] = useState(initialUser.phone || '');
  const [role, setRole] = useState(initialUser.role || 'user');

  // Membership
  const [plan, setPlan] = useState(initialUser.membership_plan || 'free');
  const [membershipStart, setMembershipStart] = useState(fmtDate(initialUser.membership_start_at));
  const [membershipEnd, setMembershipEnd] = useState(fmtDate(initialUser.membership_end_at));
  const [membershipActive, setMembershipActive] = useState(initialUser.membership_active ?? true);
  const [extendDays, setExtendDays] = useState(30);

  // Permissions
  const [permissions, setPermissions] = useState(initialUser.permissions || {});

  // Notes
  const [adminNote, setAdminNote] = useState(initialUser.admin_note || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(initialUser.tags || []);

  // Activity
  const [activity, setActivity] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPages, setActivityPages] = useState(1);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const markDirty = () => setIsDirty(true);

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istiyor musunuz?')) return;
    }
    onClose();
  };

  const fetchActivity = useCallback(async (page = 1) => {
    setLoadingActivity(true);
    try {
      const { data } = await api.get(`/admin/app-users/${user.user_id}/activity?page=${page}&limit=15`, { headers: authHeaders() });
      setActivity(data.logs);
      setActivityTotal(data.total);
      setActivityPages(data.pages);
      setActivityPage(page);
    } catch { toast.error('Aktivite yüklenemedi'); }
    finally { setLoadingActivity(false); }
  }, [user.user_id]);

  useEffect(() => {
    if (tab === 'activity') fetchActivity(1);
  }, [tab, fetchActivity]);

  const saveSummary = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/app-users/${user.user_id}`, { full_name: fullName, phone, role }, { headers: authHeaders() });
      setUser(data); setIsDirty(false);
      toast.success('Kaydedildi'); onUpdated();
    } catch (e) { toast.error(e.response?.data?.detail || 'Kayıt başarısız'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (status) => {
    try {
      await api.put(`/admin/app-users/${user.user_id}/status?status=${status}`, {}, { headers: authHeaders() });
      setUser(u => ({ ...u, status }));
      toast.success(`Durum: ${STATUS_CONFIG[status]?.label}`); onUpdated();
    } catch { toast.error('Durum güncellenemedi'); }
  };

  const endSessions = async () => {
    if (!window.confirm('Bu kullanıcının tüm oturumları sonlandırılacak?')) return;
    try {
      const { data } = await api.post(`/admin/app-users/${user.user_id}/end-sessions`, {}, { headers: authHeaders() });
      toast.success(`${data.deleted_count} oturum sonlandırıldı`);
    } catch { toast.error('Oturum sonlandırılamadı'); }
  };

  const saveMembership = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/app-users/${user.user_id}/membership`, {
        membership_plan: plan,
        membership_start_at: membershipStart || null,
        membership_end_at: membershipEnd || null,
        membership_active: membershipActive,
      }, { headers: authHeaders() });
      setUser(data); setIsDirty(false);
      toast.success('Üyelik kaydedildi'); onUpdated();
    } catch { toast.error('Üyelik güncellenemedi'); }
    finally { setSaving(false); }
  };

  const extendMembership = async () => {
    if (!extendDays || extendDays < 1) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/app-users/${user.user_id}/membership`, { extend_days: parseInt(extendDays) }, { headers: authHeaders() });
      setUser(data);
      setMembershipEnd(fmtDate(data.membership_end_at));
      toast.success(`${extendDays} gün uzatıldı`); onUpdated();
    } catch { toast.error('Uzatma başarısız'); }
    finally { setSaving(false); }
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/app-users/${user.user_id}/permissions`, { permissions }, { headers: authHeaders() });
      setIsDirty(false); toast.success('Yetkiler kaydedildi'); onUpdated();
    } catch { toast.error('Yetkiler güncellenemedi'); }
    finally { setSaving(false); }
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/app-users/${user.user_id}/note`, { admin_note: adminNote, tags }, { headers: authHeaders() });
      setIsDirty(false); toast.success('Not kaydedildi'); onUpdated();
    } catch { toast.error('Not güncellenemedi'); }
    finally { setSaving(false); }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) { setTags(t => [...t, tagInput.trim()]); markDirty(); }
      setTagInput('');
    }
  };

  const ACTION_LOG_LABELS = {
    login: 'Giriş yaptı', logout: 'Çıkış yaptı',
    status_changed_active: 'Aktif yapıldı', status_changed_passive: 'Pasif yapıldı', status_changed_banned: 'Banlı yapıldı',
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-full sm:w-[620px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden" data-testid="user-drawer">
        {/* Header */}
        <div className="flex-shrink-0 border-b px-5 py-4 bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 truncate" data-testid="drawer-user-name">{user.full_name || user.email}</h2>
                <StatusBadge status={user.status || 'active'} />
                {user.membership_plan && <PlanBadge plan={user.membership_plan} />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{user.user_id}</p>
            </div>
            <button onClick={handleClose} className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-1" data-testid="drawer-close-btn">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick status actions */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {(user.status !== 'active') && (
              <button onClick={() => changeStatus('active')} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors" data-testid="btn-activate">
                <CheckCircle2 className="w-3.5 h-3.5" />Aktif Yap
              </button>
            )}
            {(user.status !== 'passive') && (
              <button onClick={() => changeStatus('passive')} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors" data-testid="btn-passive">
                <XCircle className="w-3.5 h-3.5" />Pasif Yap
              </button>
            )}
            {(user.status !== 'banned') && (
              <button onClick={() => changeStatus('banned')} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors" data-testid="btn-ban">
                <Ban className="w-3.5 h-3.5" />Banla
              </button>
            )}
            <button onClick={endSessions} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors" data-testid="btn-end-sessions">
              <EndSession className="w-3.5 h-3.5" />Oturumları Sonlandır
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-shrink-0 grid grid-cols-5 mx-5 mt-3 h-9">
            <TabsTrigger value="summary" className="text-xs" data-testid="tab-summary">Özet</TabsTrigger>
            <TabsTrigger value="membership" className="text-xs" data-testid="tab-membership">Üyelik</TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs" data-testid="tab-permissions">Yetkiler</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs" data-testid="tab-activity">Aktivite</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs" data-testid="tab-notes">Notlar</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* SUMMARY */}
            <TabsContent value="summary" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Ad Soyad</Label>
                  <Input value={fullName} onChange={e => { setFullName(e.target.value); markDirty(); }} className="mt-1 h-9 text-sm" data-testid="input-fullname" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Telefon</Label>
                  <Input value={phone} onChange={e => { setPhone(e.target.value); markDirty(); }} className="mt-1 h-9 text-sm" placeholder="+90..." data-testid="input-phone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">E-posta</Label>
                  <Input value={user.email} readOnly className="mt-1 h-9 text-sm bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Rol</Label>
                  <Select value={role} onValueChange={v => { setRole(v); markDirty(); }}>
                    <SelectTrigger className="mt-1 h-9 text-sm" data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Kullanıcı</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Read-only info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Giriş Yöntemi</span>
                  <span className="font-medium text-slate-800 capitalize">{user.auth_provider || 'email'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Son Giriş</span>
                  <span className="font-medium text-slate-800">{fmt(user.last_login_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Kayıt Tarihi</span>
                  <span className="font-medium text-slate-800">{fmt(user.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Güncelleme</span>
                  <span className="font-medium text-slate-800">{fmt(user.updated_at)}</span>
                </div>
              </div>

              <Button onClick={saveSummary} disabled={saving || !isDirty} className="w-full bg-slate-900 hover:bg-slate-800 h-10" data-testid="btn-save-summary">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </Button>
            </TabsContent>

            {/* MEMBERSHIP */}
            <TabsContent value="membership" className="mt-0 space-y-4">
              <div>
                <Label className="text-xs text-slate-500">Üyelik Planı</Label>
                <Select value={plan} onValueChange={v => { setPlan(v); markDirty(); }}>
                  <SelectTrigger className="mt-1 h-9 text-sm" data-testid="select-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Ücretsiz (Free)</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="yearly">Yıllık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Başlangıç Tarihi</Label>
                  <Input type="date" value={membershipStart} onChange={e => { setMembershipStart(e.target.value); markDirty(); }} className="mt-1 h-9 text-sm" data-testid="input-membership-start" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Bitiş Tarihi</Label>
                  <Input type="date" value={membershipEnd} onChange={e => { setMembershipEnd(e.target.value); markDirty(); }} className="mt-1 h-9 text-sm" data-testid="input-membership-end" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={membershipActive} onChange={e => { setMembershipActive(e.target.checked); markDirty(); }} className="w-4 h-4 rounded" />
                  <span className="text-sm text-slate-700">Üyelik Aktif</span>
                </label>
              </div>

              <Button onClick={saveMembership} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 h-10" data-testid="btn-save-membership">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Kaydediliyor...' : 'Üyeliği Kaydet'}
              </Button>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-slate-600 mb-3">Üyeliği Uzat</p>
                <div className="flex gap-2">
                  <Input type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)} className="h-9 text-sm w-24" min={1} max={3650} placeholder="Gün" />
                  <span className="text-sm text-slate-500 self-center">gün</span>
                  <Button onClick={extendMembership} disabled={saving} className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-sm" data-testid="btn-extend-membership">
                    Uzat
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Mevcut bitiş tarihine eklenir. Yoksa bugünden başlar.</p>
              </div>
            </TabsContent>

            {/* PERMISSIONS */}
            <TabsContent value="permissions" className="mt-0 space-y-3">
              <p className="text-xs text-slate-500 mb-3">Her modül için erişim seviyesini belirleyin.</p>
              {MODULES.map(mod => (
                <div key={mod.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-700">{mod.label}</span>
                  <Select
                    value={permissions[mod.key] || 'none'}
                    onValueChange={v => { setPermissions(p => ({ ...p, [mod.key]: v })); markDirty(); }}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs" data-testid={`perm-${mod.key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSION_LEVELS.map(lv => (
                        <SelectItem key={lv.value} value={lv.value} className="text-xs">{lv.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button onClick={savePermissions} disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800 h-10 mt-2" data-testid="btn-save-permissions">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Kaydediliyor...' : 'Yetkileri Kaydet'}
              </Button>
            </TabsContent>

            {/* ACTIVITY */}
            <TabsContent value="activity" className="mt-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500">{activityTotal} kayıt</p>
                <button onClick={() => fetchActivity(1)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                  <RefreshCw className="w-3.5 h-3.5" />Yenile
                </button>
              </div>
              {loadingActivity ? (
                <div className="text-center py-10"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : activity.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz aktivite yok</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {activity.map(log => (
                      <div key={log.log_id} className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0" data-testid={`activity-${log.log_id}`}>
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{ACTION_LOG_LABELS[log.action_type] || log.action_type}</p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{JSON.stringify(log.metadata)}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">{fmt(log.created_at)}</span>
                      </div>
                    ))}
                  </div>
                  {activityPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <button disabled={activityPage <= 1} onClick={() => fetchActivity(activityPage - 1)} className="flex items-center gap-1 text-xs text-slate-600 disabled:opacity-40"><ChevronLeft className="w-4 h-4" />Önceki</button>
                      <span className="text-xs text-slate-500">{activityPage} / {activityPages}</span>
                      <button disabled={activityPage >= activityPages} onClick={() => fetchActivity(activityPage + 1)} className="flex items-center gap-1 text-xs text-slate-600 disabled:opacity-40">Sonraki<ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* NOTES */}
            <TabsContent value="notes" className="mt-0 space-y-4">
              <div>
                <Label className="text-xs text-slate-500">Admin Notu</Label>
                <Textarea
                  value={adminNote}
                  onChange={e => { setAdminNote(e.target.value); markDirty(); }}
                  className="mt-1 text-sm min-h-[120px] resize-none"
                  placeholder="Bu kullanıcı hakkında notlar..."
                  data-testid="input-admin-note"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-500">Etiketler</Label>
                <p className="text-xs text-slate-400 mb-1.5">Eklemek için Enter'a basın: Yatırımcı, Danışman, Kurumsal, Bayi...</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                      <Tag className="w-3 h-3" />{tag}
                      <button onClick={() => { setTags(t => t.filter(x => x !== tag)); markDirty(); }} className="text-blue-400 hover:text-blue-700">×</button>
                    </span>
                  ))}
                </div>
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Etiket ekle... (Enter)"
                  className="h-9 text-sm"
                  data-testid="input-tag"
                />
              </div>

              <Button onClick={saveNote} disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800 h-10" data-testid="btn-save-note">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Kaydediliyor...' : 'Notu Kaydet'}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}

// ==================== USERS LIST ====================
export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (planFilter) params.set('plan', planFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/app-users?${params}`, { headers: authHeaders() });
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    } catch { toast.error('Kullanıcılar yüklenemedi'); }
    finally { setLoading(false); }
  }, [search, roleFilter, planFilter, statusFilter]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const openUser = async (u) => {
    try {
      const { data } = await api.get(`/admin/app-users/${u.user_id}`, { headers: authHeaders() });
      setSelectedUser(data);
    } catch { setSelectedUser(u); }
  };

  return (
    <div data-testid="users-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kullanıcılar</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} kullanıcı</p>
        </div>
        <button onClick={() => fetchUsers(page)} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <RefreshCw className="w-4 h-4" />Yenile
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-4 border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="İsim, email, telefon, ID ara..."
              className="pl-9 h-9 text-sm" data-testid="search-input"
              onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
            />
          </div>
          <Select value={roleFilter || 'all'} onValueChange={v => setRoleFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 text-sm" data-testid="filter-role"><SelectValue placeholder="Tüm Roller" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Roller</SelectItem>
              <SelectItem value="user">Kullanıcı</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter || 'all'} onValueChange={v => setPlanFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 text-sm" data-testid="filter-plan"><SelectValue placeholder="Tüm Planlar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Planlar</SelectItem>
              <SelectItem value="free">Ücretsiz</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="yearly">Yıllık</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter || 'all'} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 text-sm" data-testid="filter-status"><SelectValue placeholder="Tüm Durumlar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="passive">Pasif</SelectItem>
              <SelectItem value="banned">Banlı</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-slate-500 text-sm">Yükleniyor...</p></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Kullanıcı bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ad Soyad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email / Telefon</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Son Giriş</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr
                    key={u.user_id}
                    onClick={() => openUser(u)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    data-testid={`user-row-${u.user_id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-slate-600">{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{u.full_name || '—'}</p>
                          <p className="text-xs text-slate-400 font-mono">{u.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{u.email}</p>
                      {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{u.role === 'admin' ? 'Admin' : 'Kullanıcı'}</span>
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={u.membership_plan} /></td>
                    <td className="px-4 py-3"><StatusBadge status={u.status || 'active'} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.last_login_at ? fmt(u.last_login_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">{total} kullanıcıdan {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} gösteriliyor</p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => fetchUsers(page - 1)} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors" data-testid="prev-page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-700 px-2">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => fetchUsers(page + 1)} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors" data-testid="next-page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={() => fetchUsers(page)}
        />
      )}
    </div>
  );
}
