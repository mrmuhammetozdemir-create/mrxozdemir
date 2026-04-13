from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid, os, requests as pyrequests

from database import db
from auth_utils import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin, get_session_user
)

router = APIRouter()

EMERGENT_AUTH_URL = "https://integrations.emergentagent.com/api/v1/auth/google/user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    full_name: str
    phone: str = ""
    email: EmailStr
    password: str


# ============= ADMIN AUTH =============

@router.post("/auth/login")
async def admin_login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": credentials.email, "role": user.get("role", "admin")})
    response = JSONResponse(content={"token": token, "user": {"email": credentials.email, "role": user.get("role", "admin")}})
    response.set_cookie("admin_token", token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    return response


# ============= USER AUTH =============

@router.post("/auth/register")
async def register_user(data: UserRegister):
    existing = await db.app_users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=409, detail="Bu e-posta zaten kayıtlı")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    new_user = {
        "user_id": user_id, "full_name": data.full_name, "phone": data.phone,
        "email": data.email, "password": hash_password(data.password),
        "role": "user", "plan": "free", "status": "active",
        "auth_provider": "email",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.app_users.insert_one(new_user)
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    user_resp = {k: v for k, v in new_user.items() if k not in ("_id", "password")}
    response = JSONResponse(content={"user": user_resp, "session_token": session_token})
    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    return response


@router.post("/auth/user-login")
async def user_login(credentials: UserLogin):
    user = await db.app_users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    if user.get("auth_provider") == "google":
        raise HTTPException(status_code=401, detail="Bu hesap Google ile oluşturulmuş. Google ile giriş yapın.")
    if not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    if user.get("status") == "banned":
        raise HTTPException(status_code=403, detail="Hesabınız askıya alınmıştır")
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user["user_id"], "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    user_resp = {k: v for k, v in user.items() if k not in ("_id", "password")}
    response = JSONResponse(content={"user": user_resp, "session_token": session_token})
    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    return response


@router.get("/auth/me")
async def get_auth_me(request: Request):
    user = await get_session_user(request)
    if not user:
        token = request.cookies.get("admin_token")
        if token:
            from jose import jwt, JWTError
            from auth_utils import SECRET_KEY, ALGORITHM
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                email = payload.get("sub")
                admin = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
                if admin:
                    return {"user": admin, "type": "admin"}
            except JWTError:
                pass
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": user, "type": "session"}


# ============= GOOGLE OAUTH =============

@router.post("/auth/google")
async def google_auth(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    try:
        resp = pyrequests.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id}, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail=f"Google auth failed: {resp.json().get('detail', {}).get('error_description', 'Unknown error')}")
    except pyrequests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail="Auth service unavailable")
    google_data = resp.json()
    email = google_data.get("email")
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")
    existing = await db.app_users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.app_users.update_one({"user_id": user_id}, {"$set": {"full_name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.app_users.insert_one({
            "user_id": user_id, "full_name": name, "email": email, "phone": "",
            "password": None, "picture": picture, "role": "user",
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    response = JSONResponse(content={
        "user": {"user_id": user_id, "full_name": name, "email": email, "role": "user", "picture": picture},
        "session_token": session_token,
    })
    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    return response


@router.post("/auth/logout")
async def logout_user(request: Request):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token", path="/")
    return response


# ============= CROSS-SITE AUTH =============

@router.post("/auth/cross-site-token")
async def create_cross_site_token(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    token = str(uuid.uuid4())
    await db.cross_site_tokens.insert_one({
        "token": token, "user_id": user["user_id"],
        "email": user.get("email", ""), "full_name": user.get("full_name", ""),
        "phone": user.get("phone", ""), "plan": user.get("plan", "free"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
        "used": False,
    })
    return {"token": token}


@router.get("/auth/verify-cross-site-token")
async def verify_cross_site_token(token: str = Query(...)):
    doc = await db.cross_site_tokens.find_one({"token": token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=401, detail="Geçersiz token")
    if doc.get("used"):
        raise HTTPException(status_code=401, detail="Token zaten kullanıldı")
    expires_at = datetime.fromisoformat(doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    await db.cross_site_tokens.update_one({"token": token}, {"$set": {"used": True}})
    return {
        "valid": True, "user_id": doc["user_id"], "email": doc["email"],
        "full_name": doc["full_name"], "phone": doc.get("phone", ""),
        "plan": doc.get("plan", "free"),
    }


@router.post("/auth/remote/login")
async def remote_login(credentials: UserLogin):
    user = await db.app_users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    if user.get("auth_provider") == "google":
        raise HTTPException(status_code=401, detail="Bu hesap Google ile oluşturulmuş. Google ile giriş yapın.")
    if not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    if user.get("status") == "banned":
        raise HTTPException(status_code=403, detail="Hesabınız askıya alınmıştır")
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "session_token": session_token, "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "source": "e-ipat.com",
    })
    return {
        "user": {"user_id": user["user_id"], "full_name": user.get("full_name", ""),
                 "email": user["email"], "phone": user.get("phone", ""),
                 "plan": user.get("plan", "free"), "role": user.get("role", "user")},
        "session_token": session_token,
    }


@router.post("/auth/remote/register")
async def remote_register(data: UserRegister):
    existing = await db.app_users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=409, detail="Bu e-posta zaten kayıtlı")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    new_user = {
        "user_id": user_id, "full_name": data.full_name, "phone": data.phone,
        "email": data.email, "password": hash_password(data.password),
        "role": "user", "plan": "free", "status": "active",
        "auth_provider": "email", "registered_from": "e-ipat.com",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.app_users.insert_one(new_user)
    new_user.pop("_id", None)
    new_user.pop("password", None)
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "session_token": session_token, "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "source": "e-ipat.com",
    })
    return {"user": new_user, "session_token": session_token}


@router.get("/auth/remote/verify")
async def remote_verify_session(token: str = Query(...)):
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Geçersiz oturum")
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Oturum süresi dolmuş")
    user = await db.app_users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    return {
        "valid": True,
        "user": {"user_id": user["user_id"], "full_name": user.get("full_name", ""),
                 "email": user.get("email", ""), "phone": user.get("phone", ""),
                 "plan": user.get("plan", "free"), "role": user.get("role", "user")}
    }


@router.post("/auth/remote/logout")
async def remote_logout(token: str = Query(...)):
    await db.user_sessions.delete_one({"session_token": token})
    return {"message": "Oturum sonlandırıldı"}
