# e-ipat.com - mrxakademi Kullanici Entegrasyon Kilavuzu

mrxakademi merkezi auth sunucusu olarak calisir. e-ipat.com tum kullanici islemleri icin mrxakademi API'sini kullanir.

## mrxakademi API Base URL
Deploy URL'nizi kullanin (ornek: `https://arazi-invest.preview.emergentagent.com`)

---

## SENARYO 1: Kullanici mrxakademi'den e-ipat'a tiklar
mrxakademi otomatik olarak URL'ye `?cst=TOKEN` ekler.

### e-ipat.com tarafinda yapilacak:
```javascript
// Sayfa yuklendiginde URL'de cst parametresi var mi kontrol et
const params = new URLSearchParams(window.location.search);
const cst = params.get('cst');
if (cst) {
  // mrxakademi API'sine token'i dogrula
  const resp = await fetch(`${MRXAKADEMI_API}/api/auth/verify-cross-site-token?token=${cst}`);
  if (resp.ok) {
    const data = await resp.json();
    // data = { valid: true, user_id, email, full_name, phone, plan }
    // Kullaniciyi otomatik giris yap
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('session_source', 'mrxakademi');
  }
  // URL'den cst parametresini temizle
  window.history.replaceState({}, '', window.location.pathname);
}
```

---

## SENARYO 2: Kullanici dogrudan e-ipat.com'a gelir (Login)
e-ipat.com kendi login formunu gosterir ama mrxakademi API'sine istek atar.

### Endpoint: `POST /api/auth/remote/login`
```javascript
const resp = await fetch(`${MRXAKADEMI_API}/api/auth/remote/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await resp.json();
// data = { user: { user_id, full_name, email, phone, plan, role }, session_token }
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('session_token', data.session_token);
```

### Hata kodlari:
- 401: E-posta veya sifre hatali
- 401: Google hesabi (Google ile giris yapilmali)
- 403: Hesap askiya alinmis

---

## SENARYO 3: Kullanici dogrudan e-ipat.com'da kayit olur
Kayit mrxakademi veritabanina yapilir, iki sitede de gecerli olur.

### Endpoint: `POST /api/auth/remote/register`
```javascript
const resp = await fetch(`${MRXAKADEMI_API}/api/auth/remote/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ full_name, phone, email, password })
});
const data = await resp.json();
// data = { user: { user_id, full_name, email, ... registered_from: "e-ipat.com" }, session_token }
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('session_token', data.session_token);
```

### Hata kodlari:
- 409: Bu e-posta zaten kayitli

---

## SENARYO 4: Oturum dogrulama (her sayfa yuklemesinde)
e-ipat.com her korunmus sayfada session token'i dogrular.

### Endpoint: `GET /api/auth/remote/verify?token=SESSION_TOKEN`
```javascript
const token = localStorage.getItem('session_token');
if (token) {
  const resp = await fetch(`${MRXAKADEMI_API}/api/auth/remote/verify?token=${token}`);
  if (resp.ok) {
    const data = await resp.json();
    // data = { valid: true, user: { user_id, full_name, email, phone, plan, role } }
  } else {
    // Oturum gecersiz, cikis yap
    localStorage.removeItem('user');
    localStorage.removeItem('session_token');
  }
}
```

---

## SENARYO 5: Cikis yapma

### Endpoint: `POST /api/auth/remote/logout?token=SESSION_TOKEN`
```javascript
const token = localStorage.getItem('session_token');
await fetch(`${MRXAKADEMI_API}/api/auth/remote/logout?token=${token}`, { method: 'POST' });
localStorage.removeItem('user');
localStorage.removeItem('session_token');
```

---

## OZET: Tum Endpoint'ler

| Endpoint | Method | Aciklama |
|---|---|---|
| `/api/auth/verify-cross-site-token?token=X` | GET | mrxakademi'den gelen token dogrulama |
| `/api/auth/remote/login` | POST | Email/sifre ile giris |
| `/api/auth/remote/register` | POST | Yeni kullanici kaydi |
| `/api/auth/remote/verify?token=X` | GET | Session dogrulama |
| `/api/auth/remote/logout?token=X` | POST | Cikis |

## CORS
mrxakademi backend'i `*` origin kabul ediyor, ek CORS ayari gerekmez.
