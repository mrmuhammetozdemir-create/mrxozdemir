from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
import uuid

from database import db
from auth_utils import require_admin

router = APIRouter()


class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    admin_note: Optional[str] = None
    tags: Optional[List[str]] = None


class MembershipUpdate(BaseModel):
    membership_plan: Optional[str] = None
    membership_start_at: Optional[str] = None
    membership_end_at: Optional[str] = None
    membership_active: Optional[bool] = None
    extend_days: Optional[int] = None


class PermissionsUpdate(BaseModel):
    permissions: Dict[str, str]


class NoteUpdate(BaseModel):
    admin_note: str = ""
    tags: List[str] = []


@router.get("/admin/app-users")
async def list_app_users(
    admin: dict = Depends(require_admin),
    search: str = Query(""), role: str = Query(""),
    plan: str = Query(""), status: str = Query(""),
    page: int = Query(1), limit: int = Query(20)
):
    query = {}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"user_id": {"$regex": search, "$options": "i"}},
        ]
    if role: query["role"] = role
    if plan: query["membership_plan"] = plan
    if status: query["status"] = status
    total = await db.app_users.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.app_users.find(query, {"_id": 0, "password": 0}).skip(skip).limit(limit).sort("created_at", -1)
    users = await cursor.to_list(length=limit)
    return {"users": users, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}


@router.get("/admin/app-users/{user_id}")
async def get_app_user(user_id: str, admin: dict = Depends(require_admin)):
    user = await db.app_users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return user


@router.put("/admin/app-users/{user_id}")
async def update_app_user(user_id: str, data: UserUpdateAdmin, admin: dict = Depends(require_admin)):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.app_users.update_one({"user_id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    user = await db.app_users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    return user


@router.put("/admin/app-users/{user_id}/status")
async def update_user_status(user_id: str, status: str = Query(...), admin: dict = Depends(require_admin)):
    if status not in ["active", "passive", "banned"]:
        raise HTTPException(status_code=400, detail="Geçersiz durum")
    await db.app_users.update_one(
        {"user_id": user_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    await db.activity_logs.insert_one({
        "log_id": str(uuid.uuid4()), "user_id": user_id, "action_type": f"status_changed_{status}",
        "metadata": {"by_admin": admin.get("email"), "new_status": status},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": status}


@router.put("/admin/app-users/{user_id}/membership")
async def update_user_membership(user_id: str, data: MembershipUpdate, admin: dict = Depends(require_admin)):
    user = await db.app_users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.membership_plan is not None: update_data["membership_plan"] = data.membership_plan
    if data.membership_start_at is not None: update_data["membership_start_at"] = data.membership_start_at
    if data.membership_end_at is not None: update_data["membership_end_at"] = data.membership_end_at
    if data.membership_active is not None: update_data["membership_active"] = data.membership_active
    if data.extend_days:
        current_end = user.get("membership_end_at")
        try:
            end_dt = datetime.fromisoformat(current_end.replace("Z", "+00:00")) if current_end else datetime.now(timezone.utc)
        except Exception:
            end_dt = datetime.now(timezone.utc)
        if end_dt.tzinfo is None: end_dt = end_dt.replace(tzinfo=timezone.utc)
        update_data["membership_end_at"] = (end_dt + timedelta(days=data.extend_days)).isoformat()
    await db.app_users.update_one({"user_id": user_id}, {"$set": update_data})
    updated = await db.app_users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    return updated


@router.put("/admin/app-users/{user_id}/permissions")
async def update_user_permissions(user_id: str, data: PermissionsUpdate, admin: dict = Depends(require_admin)):
    await db.app_users.update_one(
        {"user_id": user_id},
        {"$set": {"permissions": data.permissions, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"permissions": data.permissions}


@router.put("/admin/app-users/{user_id}/note")
async def update_user_note(user_id: str, data: NoteUpdate, admin: dict = Depends(require_admin)):
    await db.app_users.update_one(
        {"user_id": user_id},
        {"$set": {"admin_note": data.admin_note, "tags": data.tags, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"admin_note": data.admin_note, "tags": data.tags}


@router.get("/admin/app-users/{user_id}/activity")
async def get_user_activity(
    user_id: str, admin: dict = Depends(require_admin),
    page: int = Query(1), limit: int = Query(20)
):
    query = {"user_id": user_id}
    total = await db.activity_logs.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.activity_logs.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
    logs = await cursor.to_list(length=limit)
    return {"logs": logs, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}


@router.post("/admin/app-users/{user_id}/end-sessions")
async def end_user_sessions(user_id: str, admin: dict = Depends(require_admin)):
    result = await db.user_sessions.delete_many({"user_id": user_id})
    return {"deleted_count": result.deleted_count}
