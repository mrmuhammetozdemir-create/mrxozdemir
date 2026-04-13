from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from datetime import datetime, timezone
import uuid, json, tempfile, os

from database import db
from auth_utils import require_admin

router = APIRouter()


# ============= MRXAKADEMİ KAPSAMLI YÖNETİM =============

@router.get("/admin/academy-stats")
async def admin_academy_stats(admin: dict = Depends(require_admin)):
    courses = await db.courses.count_documents({"status": "active"})
    seminars = await db.seminars.count_documents({})
    students = await db.app_users.count_documents({"role": "user"})
    streams = await db.live_streams.count_documents({})
    supervision = await db.supervision_events.count_documents({})
    exams = await db.course_exams.count_documents({})
    payments = await db.user_payments.count_documents({})
    contracts = await db.user_contracts.count_documents({})
    files = await db.user_files.count_documents({})
    exam_attempts = await db.user_exam_attempts.count_documents({})
    passed = await db.user_exam_attempts.count_documents({"passed": True})
    return {
        "courses": courses, "seminars": seminars, "students": students,
        "streams": streams, "supervision": supervision, "exams": exams,
        "payments": payments, "contracts": contracts, "files": files,
        "exam_attempts": exam_attempts, "passed_exams": passed,
    }


@router.get("/admin/students")
async def admin_get_students(admin: dict = Depends(require_admin)):
    users = await db.app_users.find({"role": "user"}, {"_id": 0, "password": 0, "hashed_password": 0}).to_list(1000)
    result = []
    for user in users:
        uid = user.get("user_id")
        prog_records = await db.user_progress.find({"user_id": uid}, {"_id": 0}).to_list(100)
        attempts = await db.user_exam_attempts.find({"user_id": uid}, {"_id": 0}).to_list(100)
        completed_lessons = sum(len(p.get("completed_lessons", [])) for p in prog_records)
        last_activity = max([p.get("updated_at", "") for p in prog_records], default=None)
        best_score = max([a.get("score", 0) for a in attempts], default=0)
        result.append({
            **{k: v for k, v in user.items() if k not in ("_id",)},
            "completed_lessons": completed_lessons,
            "exam_attempts": len(attempts),
            "best_score": best_score,
            "courses_enrolled": len(prog_records),
            "last_activity": last_activity,
        })
    return result


@router.get("/admin/students/{user_id}")
async def admin_get_student_detail(user_id: str, admin: dict = Depends(require_admin)):
    user = await db.app_users.find_one({"user_id": user_id}, {"_id": 0, "password": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    courses = await db.courses.find({"status": "active"}, {"_id": 0, "modules": 1, "title": 1, "id": 1, "cover_image": 1}).to_list(100)
    progress_list = []
    for course in courses:
        prog = await db.user_progress.find_one({"user_id": user_id, "course_id": course.get("id")}, {"_id": 0})
        total = sum(len(m.get("lessons", [])) for m in course.get("modules", []))
        completed = len(prog.get("completed_lessons", [])) if prog else 0
        pct = round(completed / total * 100) if total > 0 else 0
        progress_list.append({
            "course_id": course.get("id"), "title": course.get("title"),
            "cover_image": course.get("cover_image", ""), "progress_pct": pct,
            "completed": completed, "total": total,
            "last_lesson": prog.get("last_lesson_id") if prog else None
        })
    attempts = await db.user_exam_attempts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    for a in attempts:
        exam = await db.course_exams.find_one({"id": a.get("exam_id")}, {"_id": 0, "title": 1})
        a["exam_title"] = exam.get("title", "Sınav") if exam else "Sınav"
    files = await db.user_files.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    payments = await db.user_payments.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    contracts = await db.user_contracts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return {"user": user, "progress": progress_list, "exam_attempts": attempts, "files": files, "payments": payments, "contracts": contracts}


@router.get("/admin/payments")
async def admin_get_all_payments(admin: dict = Depends(require_admin)):
    return await db.user_payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.post("/admin/payments")
async def admin_create_payment(body: dict, admin: dict = Depends(require_admin)):
    payment = {
        "id": str(uuid.uuid4()), "user_id": body.get("user_id", ""), "course_name": body.get("course_name", ""),
        "amount": body.get("amount", ""), "status": body.get("status", "pending"),
        "notes": body.get("notes", ""), "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_payments.insert_one(payment)
    payment.pop("_id", None)
    return payment


@router.put("/admin/payments/{payment_id}")
async def admin_update_payment(payment_id: str, body: dict, admin: dict = Depends(require_admin)):
    update = {k: v for k, v in body.items() if k in ("course_name", "amount", "status", "notes")}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.user_payments.update_one({"id": payment_id}, {"$set": update})
    return {"message": "Güncellendi"}


@router.delete("/admin/payments/{payment_id}")
async def admin_delete_payment(payment_id: str, admin: dict = Depends(require_admin)):
    await db.user_payments.delete_one({"id": payment_id})
    return {"message": "Silindi"}


@router.get("/admin/contracts")
async def admin_get_all_contracts(admin: dict = Depends(require_admin)):
    return await db.user_contracts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.post("/admin/contracts")
async def admin_create_contract(body: dict, admin: dict = Depends(require_admin)):
    contract = {
        "id": str(uuid.uuid4()), "user_id": body.get("user_id", ""), "contract_name": body.get("contract_name", ""),
        "status": body.get("status", "pending"), "notes": body.get("notes", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_contracts.insert_one(contract)
    contract.pop("_id", None)
    return contract


@router.put("/admin/contracts/{contract_id}")
async def admin_update_contract(contract_id: str, body: dict, admin: dict = Depends(require_admin)):
    update = {k: v for k, v in body.items() if k in ("contract_name", "status", "notes")}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.user_contracts.update_one({"id": contract_id}, {"$set": update})
    return {"message": "Güncellendi"}


@router.delete("/admin/contracts/{contract_id}")
async def admin_delete_contract(contract_id: str, admin: dict = Depends(require_admin)):
    await db.user_contracts.delete_one({"id": contract_id})
    return {"message": "Silindi"}


@router.get("/admin/all-files")
async def admin_get_all_files(admin: dict = Depends(require_admin)):
    return await db.user_files.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.post("/admin/files/{user_id}")
async def admin_add_file(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    f = {
        "id": str(uuid.uuid4()), "user_id": user_id, "file_name": body.get("file_name", ""),
        "file_url": body.get("file_url", ""), "file_type": body.get("file_type", "document"),
        "status": "active", "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_files.insert_one(f)
    f.pop("_id", None)
    return f


@router.delete("/admin/files/{file_id}")
async def admin_delete_file(file_id: str, admin: dict = Depends(require_admin)):
    await db.user_files.delete_one({"id": file_id})
    return {"message": "Silindi"}


# ============= AI SINAV ÇIKARICI (PDF → Sorular) =============

@router.post("/admin/exams/extract-from-pdf")
async def extract_exam_from_pdf(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage as LlmUserMessage, FileContentWithMimeType
    llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not llm_key:
        raise HTTPException(status_code=500, detail="LLM key bulunamadı")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Sadece PDF dosyası yükleyin")

    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"exam_extract_{uuid.uuid4()}",
            system_message="Sen bir eğitim içeriği asistanısın. PDF dosyasındaki sınav sorularını çıkarıp JSON formatında döndürüyorsun. SADECE geçerli JSON döndür, başka hiçbir şey yazma. Türkçe içeriği koru."
        ).with_model("gemini", "gemini-2.5-flash")

        pdf_file = FileContentWithMimeType(file_path=tmp_path, mime_type="application/pdf")
        prompt = """{
  "title": "Sınav başlığı (yoksa PDF adından türet)",
  "pass_score": 70,
  "duration_minutes": 30,
  "questions": [{"id": "q1","text": "Soru metni","options": ["Şık A","Şık B","Şık C","Şık D"],"correct_answer": "Doğru şıkkın tam metni"}]
}

Kurallar: Tam 4 şık, correct_answer tam metinle eşleşmeli, sadece JSON döndür."""

        response = await chat.send_message(LlmUserMessage(text=prompt, file_contents=[pdf_file]))
        raw = response.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        data = json.loads(raw)
        for i, q in enumerate(data.get("questions", []), 1):
            q["id"] = f"q{i}"
            if len(q.get("options", [])) < 4:
                q["options"] = q["options"] + [""] * (4 - len(q["options"]))
        return data

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail="AI yanıtı JSON olarak ayrıştırılamadı")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF işlenirken hata oluştu: {str(e)[:100]}")
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# ============= ADMIN PANEL YÖNETİMİ (Canlı Yayın, Süpervizyon, Sınavlar) =============

@router.get("/admin/live-streams")
async def admin_get_live_streams(admin: dict = Depends(require_admin)):
    return await db.live_streams.find({}, {"_id": 0}).sort("date", -1).to_list(200)


@router.post("/admin/live-streams")
async def admin_create_live_stream(body: dict, admin: dict = Depends(require_admin)):
    stream = {
        "id": str(uuid.uuid4()), "title": body.get("title", ""), "date": body.get("date", ""),
        "status": body.get("status", "upcoming"), "platform": body.get("platform", "Zoom"),
        "join_url": body.get("join_url", ""), "thumbnail": body.get("thumbnail", ""),
        "description": body.get("description", ""), "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.live_streams.insert_one(stream)
    stream.pop("_id", None)
    return stream


@router.put("/admin/live-streams/{stream_id}")
async def admin_update_live_stream(stream_id: str, body: dict, admin: dict = Depends(require_admin)):
    update = {k: v for k, v in body.items() if k in ("title", "date", "status", "platform", "join_url", "thumbnail", "description")}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.live_streams.update_one({"id": stream_id}, {"$set": update})
    return {"message": "Güncellendi"}


@router.delete("/admin/live-streams/{stream_id}")
async def admin_delete_live_stream(stream_id: str, admin: dict = Depends(require_admin)):
    await db.live_streams.delete_one({"id": stream_id})
    return {"message": "Silindi"}


@router.get("/admin/supervision")
async def admin_get_supervision(admin: dict = Depends(require_admin)):
    return await db.supervision_events.find({}, {"_id": 0}).sort("date", 1).to_list(200)


@router.post("/admin/supervision")
async def admin_create_supervision(body: dict, admin: dict = Depends(require_admin)):
    event = {
        "id": str(uuid.uuid4()), "title": body.get("title", ""), "location": body.get("location", ""),
        "city": body.get("city", ""), "date": body.get("date", ""),
        "status": body.get("status", "upcoming"), "capacity": int(body.get("capacity", 20)),
        "registered": int(body.get("registered", 0)), "description": body.get("description", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.supervision_events.insert_one(event)
    event.pop("_id", None)
    return event


@router.put("/admin/supervision/{event_id}")
async def admin_update_supervision(event_id: str, body: dict, admin: dict = Depends(require_admin)):
    update = {k: v for k, v in body.items() if k in ("title", "location", "city", "date", "status", "capacity", "registered", "description")}
    if "capacity" in update: update["capacity"] = int(update["capacity"])
    if "registered" in update: update["registered"] = int(update["registered"])
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.supervision_events.update_one({"id": event_id}, {"$set": update})
    return {"message": "Güncellendi"}


@router.delete("/admin/supervision/{event_id}")
async def admin_delete_supervision(event_id: str, admin: dict = Depends(require_admin)):
    await db.supervision_events.delete_one({"id": event_id})
    return {"message": "Silindi"}


@router.get("/admin/exams")
async def admin_get_exams(admin: dict = Depends(require_admin)):
    return await db.course_exams.find({}, {"_id": 0}).to_list(200)


@router.post("/admin/exams")
async def admin_create_exam(body: dict, admin: dict = Depends(require_admin)):
    exam = {
        "id": str(uuid.uuid4()), "course_id": body.get("course_id", ""), "title": body.get("title", ""),
        "pass_score": int(body.get("pass_score", 70)), "duration_minutes": int(body.get("duration_minutes", 30)),
        "questions": body.get("questions", []), "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.course_exams.insert_one(exam)
    exam.pop("_id", None)
    return exam


@router.put("/admin/exams/{exam_id}")
async def admin_update_exam(exam_id: str, body: dict, admin: dict = Depends(require_admin)):
    update = {k: v for k, v in body.items() if k in ("course_id", "title", "pass_score", "duration_minutes", "questions")}
    if "pass_score" in update: update["pass_score"] = int(update["pass_score"])
    if "duration_minutes" in update: update["duration_minutes"] = int(update["duration_minutes"])
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.course_exams.update_one({"id": exam_id}, {"$set": update})
    return {"message": "Güncellendi"}


@router.delete("/admin/exams/{exam_id}")
async def admin_delete_exam(exam_id: str, admin: dict = Depends(require_admin)):
    await db.course_exams.delete_one({"id": exam_id})
    return {"message": "Silindi"}


@router.get("/admin/panel-stats")
async def admin_panel_stats(admin: dict = Depends(require_admin)):
    streams = await db.live_streams.count_documents({})
    supervision = await db.supervision_events.count_documents({})
    exams = await db.course_exams.count_documents({})
    panel_users = await db.user_progress.distinct("user_id")
    return {"streams": streams, "supervision": supervision, "exams": exams, "active_users": len(panel_users)}
