from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone, timedelta
import uuid

from database import db
from auth_utils import get_session_user

router = APIRouter()


# ============= USER PANEL APIs =============

@router.get("/user/profile")
async def get_user_profile(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    doc = await db.app_users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password": 0, "hashed_password": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return {
        "user_id": doc.get("user_id"),
        "full_name": doc.get("full_name", ""),
        "email": doc.get("email", ""),
        "phone": doc.get("phone", ""),
        "avatar_color": doc.get("avatar_color", "emerald"),
        "plan": doc.get("plan", "free"),
        "created_at": doc.get("created_at", ""),
        "auth_provider": doc.get("auth_provider", "email"),
    }


@router.put("/user/profile")
async def update_user_profile(body: dict, request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    allowed = {}
    if body.get("full_name", "").strip():
        allowed["full_name"] = body["full_name"].strip()
    if "phone" in body:
        allowed["phone"] = body["phone"].strip()
    if "avatar_color" in body:
        allowed["avatar_color"] = body["avatar_color"]
    allowed["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.app_users.update_one({"user_id": user["user_id"]}, {"$set": allowed})
    doc = await db.app_users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password": 0, "hashed_password": 0})
    return {
        "user_id": doc.get("user_id"),
        "full_name": doc.get("full_name", ""),
        "email": doc.get("email", ""),
        "phone": doc.get("phone", ""),
        "avatar_color": doc.get("avatar_color", "emerald"),
        "plan": doc.get("plan", "free"),
    }


@router.get("/packages")
async def get_packages():
    return [
        {
            "id": "free", "name": "Ücretsiz", "price": 0, "period": "",
            "color": "slate", "popular": False,
            "features": ["Ücretsiz seminerlere erişim", "Topluluk forumuna katılım", "Temel içerikler ve makaleler", "Aylık 1 canlı yayın"],
        },
        {
            "id": "basic", "name": "Temel", "price": 499, "period": "ay",
            "color": "emerald", "popular": False,
            "features": ["Tüm aktif kurslar", "Eğitim sınavları ve değerlendirmeler", "Tamamlama sertifikaları", "Dosya indirme erişimi", "E-posta desteği"],
        },
        {
            "id": "pro", "name": "Pro", "price": 999, "period": "ay",
            "color": "blue", "popular": True,
            "features": ["Temel paket + tüm özellikler", "Sınırsız canlı yayın erişimi", "Süpervizyon eğitimleri", "Öncelikli destek hattı", "Özel grup oturumları", "İndirimli seminer biletleri"],
        },
        {
            "id": "corporate", "name": "Kurumsal", "price": 2499, "period": "ay",
            "color": "amber", "popular": False,
            "features": ["Tüm Pro özellikler", "Birebir özel danışmanlık", "Kurumsal grup eğitimleri", "Özelleştirilmiş sözleşme", "7/24 öncelikli destek", "Yıllık yatırım raporu"],
        },
    ]


@router.get("/user/progress")
async def get_user_progress(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    user_id = user.get("user_id")
    courses = await db.courses.find({"status": "active"}, {"_id": 0}).to_list(100)
    # Batch fetch all progress records in one query (avoid N+1)
    progress_docs = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    progress_map = {p["course_id"]: p for p in progress_docs}
    result = []
    for course in courses:
        cid = course.get("id")
        prog = progress_map.get(cid)
        total_lessons = sum(len(m.get("lessons", [])) for m in course.get("modules", []))
        completed = prog.get("completed_lessons", []) if prog else []
        pct = round(len(completed) / total_lessons * 100) if total_lessons > 0 else 0
        result.append({
            "course_id": cid, "title": course.get("title", ""), "cover_image": course.get("cover_image", ""),
            "total_lessons": total_lessons, "completed_lessons": len(completed),
            "progress_pct": pct, "last_lesson_id": prog.get("last_lesson_id") if prog else None,
        })
    return result


@router.post("/user/progress/{course_id}/{lesson_id}")
async def update_lesson_progress(course_id: str, lesson_id: str, request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    user_id = user.get("user_id")
    await db.user_progress.update_one(
        {"user_id": user_id, "course_id": course_id},
        {"$addToSet": {"completed_lessons": lesson_id}, "$set": {"last_lesson_id": lesson_id, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "İlerleme kaydedildi"}


@router.get("/user/files")
async def get_user_files(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    return await db.user_files.find({"user_id": user.get("user_id")}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.delete("/user/files/{file_id}")
async def delete_user_file(file_id: str, request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    await db.user_files.delete_one({"id": file_id, "user_id": user.get("user_id")})
    return {"message": "Dosya silindi"}


@router.get("/user/payments")
async def get_user_payments(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    return await db.user_payments.find({"user_id": user.get("user_id")}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.get("/user/contracts")
async def get_user_contracts(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    return await db.user_contracts.find({"user_id": user.get("user_id")}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.get("/user/exams")
async def get_user_exams(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    user_id = user.get("user_id")
    exams = await db.course_exams.find({}, {"_id": 0}).to_list(100)
    # Batch fetch all attempts in one query (avoid N+1)
    all_attempts = await db.user_exam_attempts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    attempts_map = {a["exam_id"]: a for a in all_attempts}
    return [{**exam, "attempt": attempts_map.get(exam.get("id"))} for exam in exams]


@router.post("/user/exams/{exam_id}/submit")
async def submit_exam(exam_id: str, body: dict, request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    exam = await db.course_exams.find_one({"id": exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Sınav bulunamadı")
    answers = body.get("answers", {})
    questions = exam.get("questions", [])
    correct = sum(1 for q in questions if answers.get(q["id"]) == q.get("correct_answer"))
    score = round(correct / len(questions) * 100) if questions else 0
    attempt = {
        "id": str(uuid.uuid4()), "user_id": user.get("user_id"), "exam_id": exam_id,
        "score": score, "answers": answers, "completed_at": datetime.now(timezone.utc).isoformat(),
        "passed": score >= exam.get("pass_score", 70)
    }
    await db.user_exam_attempts.insert_one(attempt)
    attempt.pop("_id", None)
    return attempt


@router.get("/user/certificates")
async def get_user_certificates(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    user_id = user.get("user_id")
    courses = await db.courses.find({"status": "active"}, {"_id": 0}).to_list(100)
    # Batch fetch all progress in one query (avoid N+1)
    progress_docs = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    progress_map = {p["course_id"]: p for p in progress_docs}
    result = []
    for course in courses:
        cid = course.get("id")
        prog = progress_map.get(cid)
        total = sum(len(m.get("lessons", [])) for m in course.get("modules", []))
        completed = len(prog.get("completed_lessons", [])) if prog else 0
        pct = round(completed / total * 100) if total > 0 else 0
        result.append({
            "course_id": cid, "title": course.get("title", ""), "cover_image": course.get("cover_image", ""),
            "progress_pct": pct, "eligible": pct >= 90,
            "certificate_url": f"/certificates/{user_id}/{cid}" if pct >= 90 else None
        })
    return result


@router.get("/user/transcript")
async def get_user_transcript(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor")
    user_id = user.get("user_id")
    courses = await db.courses.find({"status": "active"}, {"_id": 0}).to_list(100)
    # Batch fetch progress + best attempt in 2 queries (avoid N+1)
    progress_docs = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    progress_map = {p["course_id"]: p for p in progress_docs}
    best_attempt = await db.user_exam_attempts.find_one(
        {"user_id": user_id}, {"_id": 0}, sort=[("score", -1)]
    )
    result = []
    for course in courses:
        cid = course.get("id")
        prog = progress_map.get(cid)
        total = sum(len(m.get("lessons", [])) for m in course.get("modules", []))
        completed = len(prog.get("completed_lessons", [])) if prog else 0
        pct = round(completed / total * 100) if total > 0 else 0
        if pct >= 90:
            result.append({
                "course_id": cid, "title": course.get("title", ""), "progress_pct": pct,
                "score": best_attempt.get("score", 0) if best_attempt else 0,
                "completed_at": prog.get("updated_at") if prog else None
            })
    return result


@router.get("/live-streams")
async def get_live_streams():
    streams = await db.live_streams.find({}, {"_id": 0}).sort("date", -1).to_list(100)
    if not streams:
        now = datetime.now(timezone.utc)
        streams = [
            {"id": "ls1", "title": "Arsa Yatırımı Temelleri - Canlı Ders", "date": (now + timedelta(days=2)).isoformat(), "status": "upcoming", "platform": "Zoom", "join_url": "#", "thumbnail": ""},
            {"id": "ls2", "title": "Tapu ve Kadastro Hukuku", "date": (now + timedelta(days=7)).isoformat(), "status": "upcoming", "platform": "Zoom", "join_url": "#", "thumbnail": ""},
            {"id": "ls3", "title": "Arsa Değerleme Metodolojisi", "date": now.isoformat(), "status": "live", "platform": "Zoom", "join_url": "#", "thumbnail": ""},
            {"id": "ls4", "title": "İmar Planı Okuma Teknikleri", "date": (now - timedelta(days=5)).isoformat(), "status": "ended", "platform": "Zoom", "join_url": "#", "thumbnail": ""},
            {"id": "ls5", "title": "Yatırım Analizi Workshop", "date": (now - timedelta(days=12)).isoformat(), "status": "ended", "platform": "Zoom", "join_url": "#", "thumbnail": ""},
        ]
    return streams


@router.get("/supervision/events")
async def get_supervision_events():
    events = await db.supervision_events.find({}, {"_id": 0}).sort("date", 1).to_list(100)
    if not events:
        now = datetime.now(timezone.utc)
        events = [
            {"id": "sv1", "title": "İstanbul Arsa Analiz Süpervizyon", "location": "İstanbul - Kadıköy Ofis", "city": "İstanbul", "date": (now + timedelta(days=3)).isoformat(), "status": "upcoming", "capacity": 15, "registered": 8},
            {"id": "sv2", "title": "Ankara Mega Proje İnceleme", "location": "Ankara - Çankaya Merkez", "city": "Ankara", "date": (now + timedelta(days=10)).isoformat(), "status": "upcoming", "capacity": 20, "registered": 12},
            {"id": "sv3", "title": "İzmir Kıyı Arsa Gezisi", "location": "İzmir - Alsancak", "city": "İzmir", "date": (now + timedelta(days=18)).isoformat(), "status": "upcoming", "capacity": 10, "registered": 6},
            {"id": "sv4", "title": "Bursa OSB Yatırım Turu", "location": "Bursa - Nilüfer", "city": "Bursa", "date": (now - timedelta(days=7)).isoformat(), "status": "ended", "capacity": 12, "registered": 12},
        ]
    return events


async def seed_exams():
    """Seed initial exam data if none exists."""
    count = await db.course_exams.count_documents({})
    if count == 0:
        courses = await db.courses.find({"status": "active"}, {"_id": 0}).to_list(10)
        for course in courses[:3]:
            exam = {
                "id": str(uuid.uuid4()), "course_id": course.get("id"),
                "title": f"{course.get('title', 'Kurs')} - Değerlendirme Sınavı",
                "pass_score": 70, "duration_minutes": 30,
                "questions": [
                    {"id": "q1", "text": "Arsa yatırımında en önemli kriter nedir?", "options": ["Lokasyon", "Fiyat", "Büyüklük", "Şekil"], "correct_answer": "Lokasyon"},
                    {"id": "q2", "text": "İmar planı hangi kurum tarafından hazırlanır?", "options": ["Belediye", "Tapu Müdürlüğü", "Kadastro", "Maliye"], "correct_answer": "Belediye"},
                    {"id": "q3", "text": "Tapu tescili için hangi belge gereklidir?", "options": ["Nüfus cüzdanı", "Satış vaadi sözleşmesi", "Tapu senedi", "İmar belgesi"], "correct_answer": "Tapu senedi"},
                    {"id": "q4", "text": "Parsel numarası neyi ifade eder?", "options": ["Taşınmaz kimliği", "Bina katı", "Kat planı", "Bina yaşı"], "correct_answer": "Taşınmaz kimliği"},
                    {"id": "q5", "text": "E.M.S.A.L. kısaltması ne anlama gelir?", "options": ["Emsal değeri", "Emsalsiz Mülk Satış Alanı", "Emsal Miktarı Standart Arazi Listesi", "Emsalli"], "correct_answer": "Emsal değeri"},
                ]
            }
            await db.course_exams.insert_one(exam)
