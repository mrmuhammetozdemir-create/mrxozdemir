import os
"""
Test suite for Admin Panel Manager endpoints:
- /api/admin/live-streams (GET, POST, PUT, DELETE)
- /api/admin/supervision (GET, POST, PUT, DELETE)
- /api/admin/exams (GET, POST, PUT, DELETE)
- /api/admin/panel-stats (GET)
All endpoints require admin JWT auth.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

ADMIN_EMAIL = os.environ.get("ADMIN_TEST_EMAIL", "ipatarazi@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_TEST_PASSWORD", "As537273")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token."""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if resp.status_code != 200:
        pytest.skip(f"Admin login failed: {resp.status_code} - {resp.text}")
    data = resp.json()
    token = data.get("access_token")
    if not token:
        pytest.skip("No access_token returned from admin login")
    print(f"PASS: Admin login successful. Token prefix: {token[:20]}...")
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    """Return auth headers for admin."""
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ===== AUTH TESTS =====
class TestAdminAuth:
    """Test admin authentication"""

    def test_admin_login_success(self):
        """Admin login returns access_token"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "access_token" in data, "No access_token in response"
        assert data["user"]["role"] == "admin", f"Expected admin role, got {data['user']['role']}"
        print(f"PASS: Admin login success, role={data['user']['role']}")

    def test_admin_login_wrong_password(self):
        """Wrong password returns 401"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": "wrongpass"
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: Wrong password returns 401")

    def test_unauthenticated_live_streams(self):
        """Accessing admin endpoints without auth returns 401 or 403"""
        resp = requests.get(f"{BASE_URL}/api/admin/live-streams")
        assert resp.status_code in [401, 403, 422], f"Expected auth error, got {resp.status_code}"
        print(f"PASS: Unauthenticated returns {resp.status_code}")

    def test_unauthenticated_panel_stats(self):
        """Accessing panel-stats without auth returns 401 or 403"""
        resp = requests.get(f"{BASE_URL}/api/admin/panel-stats")
        assert resp.status_code in [401, 403, 422], f"Expected auth error, got {resp.status_code}"
        print(f"PASS: Unauthenticated panel-stats returns {resp.status_code}")


# ===== PANEL STATS TEST =====
class TestPanelStats:
    """Test panel stats endpoint"""

    def test_panel_stats_structure(self, auth_headers):
        """GET /admin/panel-stats returns streams, supervision, exams, active_users"""
        resp = requests.get(f"{BASE_URL}/api/admin/panel-stats", headers=auth_headers)
        assert resp.status_code == 200, f"panel-stats failed: {resp.text}"
        data = resp.json()
        assert "streams" in data, "Missing 'streams' in response"
        assert "supervision" in data, "Missing 'supervision' in response"
        assert "exams" in data, "Missing 'exams' in response"
        assert "active_users" in data, "Missing 'active_users' in response"
        assert isinstance(data["streams"], int), "streams should be int"
        assert isinstance(data["supervision"], int), "supervision should be int"
        assert isinstance(data["exams"], int), "exams should be int"
        assert isinstance(data["active_users"], int), "active_users should be int"
        print(f"PASS: Panel stats - streams={data['streams']}, supervision={data['supervision']}, exams={data['exams']}, active_users={data['active_users']}")


# ===== LIVE STREAMS CRUD =====
class TestLiveStreams:
    """Test live stream CRUD operations"""
    stream_id = None

    def test_get_live_streams(self, auth_headers):
        """GET /admin/live-streams returns a list"""
        resp = requests.get(f"{BASE_URL}/api/admin/live-streams", headers=auth_headers)
        assert resp.status_code == 200, f"GET live-streams failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET live-streams returns {len(data)} items")

    def test_create_live_stream(self, auth_headers):
        """POST /admin/live-streams creates a new stream"""
        payload = {
            "title": "TEST_Canlı Yayın Test",
            "date": "2026-03-15T14:00:00",
            "status": "upcoming",
            "platform": "Zoom",
            "join_url": "https://zoom.us/j/test123",
            "description": "Test canlı yayın description"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/live-streams", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"POST live-streams failed: {resp.text}"
        data = resp.json()
        assert data["title"] == payload["title"], f"Title mismatch: {data['title']}"
        assert data["status"] == "upcoming", f"Status mismatch: {data['status']}"
        assert data["platform"] == "Zoom", f"Platform mismatch: {data['platform']}"
        assert "id" in data, "No id in response"
        TestLiveStreams.stream_id = data["id"]
        print(f"PASS: Created stream id={data['id']}, title={data['title']}")

    def test_get_live_streams_after_create(self, auth_headers):
        """After create, stream should appear in list"""
        resp = requests.get(f"{BASE_URL}/api/admin/live-streams", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        ids = [s["id"] for s in data]
        assert TestLiveStreams.stream_id in ids, f"Created stream {TestLiveStreams.stream_id} not in list"
        print(f"PASS: Created stream persisted in DB")

    def test_update_live_stream(self, auth_headers):
        """PUT /admin/live-streams/{id} updates a stream"""
        if not TestLiveStreams.stream_id:
            pytest.skip("No stream_id from previous test")
        payload = {
            "title": "TEST_Canlı Yayın Updated",
            "date": "2026-03-16T15:00:00",
            "status": "live",
            "platform": "YouTube",
            "join_url": "https://youtube.com/live/test",
            "description": "Updated description"
        }
        resp = requests.put(f"{BASE_URL}/api/admin/live-streams/{TestLiveStreams.stream_id}", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"PUT live-streams failed: {resp.text}"
        print(f"PASS: Updated stream {TestLiveStreams.stream_id}")

    def test_get_live_streams_after_update(self, auth_headers):
        """After update, stream should have new title"""
        resp = requests.get(f"{BASE_URL}/api/admin/live-streams", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        updated = next((s for s in data if s["id"] == TestLiveStreams.stream_id), None)
        assert updated is not None, "Updated stream not found"
        assert updated["title"] == "TEST_Canlı Yayın Updated", f"Title not updated: {updated['title']}"
        assert updated["status"] == "live", f"Status not updated: {updated['status']}"
        print(f"PASS: Update verified - title={updated['title']}, status={updated['status']}")

    def test_delete_live_stream(self, auth_headers):
        """DELETE /admin/live-streams/{id} removes stream"""
        if not TestLiveStreams.stream_id:
            pytest.skip("No stream_id from previous test")
        resp = requests.delete(f"{BASE_URL}/api/admin/live-streams/{TestLiveStreams.stream_id}", headers=auth_headers)
        assert resp.status_code == 200, f"DELETE live-streams failed: {resp.text}"
        print(f"PASS: Deleted stream {TestLiveStreams.stream_id}")

    def test_get_live_streams_after_delete(self, auth_headers):
        """After delete, stream should not appear in list"""
        resp = requests.get(f"{BASE_URL}/api/admin/live-streams", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        ids = [s["id"] for s in data]
        assert TestLiveStreams.stream_id not in ids, f"Deleted stream {TestLiveStreams.stream_id} still in list"
        print(f"PASS: Stream removal from DB verified")


# ===== SUPERVISION EVENTS CRUD =====
class TestSupervision:
    """Test supervision event CRUD operations"""
    event_id = None

    def test_get_supervision(self, auth_headers):
        """GET /admin/supervision returns a list"""
        resp = requests.get(f"{BASE_URL}/api/admin/supervision", headers=auth_headers)
        assert resp.status_code == 200, f"GET supervision failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET supervision returns {len(data)} items")

    def test_create_supervision(self, auth_headers):
        """POST /admin/supervision creates a new event"""
        payload = {
            "title": "TEST_Süpervizyon Etkinliği",
            "location": "TEST - İstanbul Kadıköy Ofis",
            "city": "İstanbul",
            "date": "2026-04-20T10:00:00",
            "status": "upcoming",
            "capacity": 25,
            "registered": 5,
            "description": "Test supervision event description"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/supervision", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"POST supervision failed: {resp.text}"
        data = resp.json()
        assert data["title"] == payload["title"], f"Title mismatch: {data['title']}"
        assert data["city"] == "İstanbul", f"City mismatch: {data['city']}"
        assert data["capacity"] == 25, f"Capacity mismatch: {data['capacity']}"
        assert "id" in data, "No id in response"
        TestSupervision.event_id = data["id"]
        print(f"PASS: Created supervision event id={data['id']}, title={data['title']}")

    def test_get_supervision_after_create(self, auth_headers):
        """After create, event should appear in list"""
        resp = requests.get(f"{BASE_URL}/api/admin/supervision", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        ids = [e["id"] for e in data]
        assert TestSupervision.event_id in ids, f"Created event {TestSupervision.event_id} not in list"
        print(f"PASS: Created event persisted in DB")

    def test_update_supervision(self, auth_headers):
        """PUT /admin/supervision/{id} updates an event"""
        if not TestSupervision.event_id:
            pytest.skip("No event_id from previous test")
        payload = {
            "title": "TEST_Süpervizyon Updated",
            "location": "TEST - Ankara Merkez",
            "city": "Ankara",
            "date": "2026-04-21T11:00:00",
            "status": "upcoming",
            "capacity": 30,
            "registered": 10,
            "description": "Updated description"
        }
        resp = requests.put(f"{BASE_URL}/api/admin/supervision/{TestSupervision.event_id}", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"PUT supervision failed: {resp.text}"
        print(f"PASS: Updated supervision event {TestSupervision.event_id}")

    def test_get_supervision_after_update(self, auth_headers):
        """After update, event should have new data"""
        resp = requests.get(f"{BASE_URL}/api/admin/supervision", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        updated = next((e for e in data if e["id"] == TestSupervision.event_id), None)
        assert updated is not None, "Updated event not found"
        assert updated["title"] == "TEST_Süpervizyon Updated", f"Title not updated: {updated['title']}"
        assert updated["city"] == "Ankara", f"City not updated: {updated['city']}"
        assert updated["capacity"] == 30, f"Capacity not updated: {updated['capacity']}"
        print(f"PASS: Update verified - title={updated['title']}, city={updated['city']}")

    def test_delete_supervision(self, auth_headers):
        """DELETE /admin/supervision/{id} removes event"""
        if not TestSupervision.event_id:
            pytest.skip("No event_id from previous test")
        resp = requests.delete(f"{BASE_URL}/api/admin/supervision/{TestSupervision.event_id}", headers=auth_headers)
        assert resp.status_code == 200, f"DELETE supervision failed: {resp.text}"
        print(f"PASS: Deleted supervision event {TestSupervision.event_id}")

    def test_get_supervision_after_delete(self, auth_headers):
        """After delete, event should not appear in list"""
        resp = requests.get(f"{BASE_URL}/api/admin/supervision", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        ids = [e["id"] for e in data]
        assert TestSupervision.event_id not in ids, f"Deleted event {TestSupervision.event_id} still in list"
        print(f"PASS: Event removal from DB verified")


# ===== EXAMS CRUD =====
class TestExams:
    """Test exam CRUD operations"""
    exam_id = None

    def test_get_exams(self, auth_headers):
        """GET /admin/exams returns a list"""
        resp = requests.get(f"{BASE_URL}/api/admin/exams", headers=auth_headers)
        assert resp.status_code == 200, f"GET exams failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET exams returns {len(data)} items")

    def test_create_exam_with_questions(self, auth_headers):
        """POST /admin/exams creates exam with questions"""
        payload = {
            "title": "TEST_Gayrimenkul Temel Sınavı",
            "course_id": "",
            "pass_score": 70,
            "duration_minutes": 30,
            "questions": [
                {
                    "id": "q_test_1",
                    "text": "Türkiye'de tapu sicili hangi kurum tarafından tutulur?",
                    "options": ["Belediye", "Tapu Kadastro Genel Müdürlüğü", "Maliye Bakanlığı", "Çevre Bakanlığı"],
                    "correct_answer": "Tapu Kadastro Genel Müdürlüğü"
                },
                {
                    "id": "q_test_2",
                    "text": "Kat irtifakı nedir?",
                    "options": ["İnşaat ruhsatı", "Tamamlanmamış yapı için tapu", "İmar planı", "Yapı kullanma izni"],
                    "correct_answer": "Tamamlanmamış yapı için tapu"
                }
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/admin/exams", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"POST exams failed: {resp.text}"
        data = resp.json()
        assert data["title"] == payload["title"], f"Title mismatch: {data['title']}"
        assert data["pass_score"] == 70, f"Pass score mismatch: {data['pass_score']}"
        assert len(data["questions"]) == 2, f"Expected 2 questions, got {len(data['questions'])}"
        assert "id" in data, "No id in response"
        TestExams.exam_id = data["id"]
        print(f"PASS: Created exam id={data['id']}, questions={len(data['questions'])}")

    def test_get_exams_after_create(self, auth_headers):
        """After create, exam should appear in list"""
        resp = requests.get(f"{BASE_URL}/api/admin/exams", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        ids = [e["id"] for e in data]
        assert TestExams.exam_id in ids, f"Created exam {TestExams.exam_id} not in list"
        print(f"PASS: Created exam persisted in DB")

    def test_update_exam(self, auth_headers):
        """PUT /admin/exams/{id} updates an exam"""
        if not TestExams.exam_id:
            pytest.skip("No exam_id from previous test")
        payload = {
            "title": "TEST_Gayrimenkul Sınavı Updated",
            "pass_score": 75,
            "duration_minutes": 45,
            "questions": [
                {
                    "id": "q_updated_1",
                    "text": "İmar planı nedir?",
                    "options": ["Tapu belgesi", "Arazi kullanım planı", "Yapı ruhsatı", "Kat mülkiyeti"],
                    "correct_answer": "Arazi kullanım planı"
                }
            ]
        }
        resp = requests.put(f"{BASE_URL}/api/admin/exams/{TestExams.exam_id}", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"PUT exams failed: {resp.text}"
        print(f"PASS: Updated exam {TestExams.exam_id}")

    def test_get_exams_after_update(self, auth_headers):
        """After update, exam should have new data"""
        resp = requests.get(f"{BASE_URL}/api/admin/exams", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        updated = next((e for e in data if e["id"] == TestExams.exam_id), None)
        assert updated is not None, "Updated exam not found"
        assert updated["title"] == "TEST_Gayrimenkul Sınavı Updated", f"Title not updated: {updated['title']}"
        assert updated["pass_score"] == 75, f"Pass score not updated: {updated['pass_score']}"
        print(f"PASS: Update verified - title={updated['title']}, pass_score={updated['pass_score']}")

    def test_delete_exam(self, auth_headers):
        """DELETE /admin/exams/{id} removes exam"""
        if not TestExams.exam_id:
            pytest.skip("No exam_id from previous test")
        resp = requests.delete(f"{BASE_URL}/api/admin/exams/{TestExams.exam_id}", headers=auth_headers)
        assert resp.status_code == 200, f"DELETE exams failed: {resp.text}"
        print(f"PASS: Deleted exam {TestExams.exam_id}")

    def test_get_exams_after_delete(self, auth_headers):
        """After delete, exam should not appear in list"""
        resp = requests.get(f"{BASE_URL}/api/admin/exams", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        ids = [e["id"] for e in data]
        assert TestExams.exam_id not in ids, f"Deleted exam {TestExams.exam_id} still in list"
        print(f"PASS: Exam removal from DB verified")


# ===== USER PANEL DATA VISIBILITY =====
class TestUserPanelDataVisibility:
    """Test that data created by admin is visible in user panel endpoints"""

    stream_id = None
    event_id = None

    def test_create_and_verify_stream_in_user_panel(self, auth_headers):
        """Stream created by admin should appear in public /api/live-streams"""
        payload = {
            "title": "TEST_User Panel Visibility Stream",
            "date": "2026-05-01T18:00:00",
            "status": "upcoming",
            "platform": "YouTube",
            "join_url": "https://youtube.com/live/visibility-test",
            "description": "Visibility test stream"
        }
        # Create via admin endpoint
        resp = requests.post(f"{BASE_URL}/api/admin/live-streams", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"Create stream failed: {resp.text}"
        data = resp.json()
        TestUserPanelDataVisibility.stream_id = data["id"]

        # Verify in public user panel endpoint
        user_resp = requests.get(f"{BASE_URL}/api/live-streams")
        assert user_resp.status_code == 200, f"GET /api/live-streams failed: {user_resp.text}"
        user_data = user_resp.json()
        ids = [s["id"] for s in user_data]
        assert data["id"] in ids, f"Stream created by admin NOT visible in user panel!"
        print(f"PASS: Stream {data['id']} visible in user panel /api/live-streams")

    def test_create_and_verify_supervision_in_user_panel(self, auth_headers):
        """Supervision event created by admin should appear in public /api/supervision/events"""
        payload = {
            "title": "TEST_User Panel Visibility Supervision",
            "location": "Test Location",
            "city": "İstanbul",
            "date": "2026-05-10T09:00:00",
            "status": "upcoming",
            "capacity": 20,
            "registered": 0,
            "description": "Visibility test supervision"
        }
        # Create via admin endpoint
        resp = requests.post(f"{BASE_URL}/api/admin/supervision", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"Create supervision failed: {resp.text}"
        data = resp.json()
        TestUserPanelDataVisibility.event_id = data["id"]

        # Verify in public user panel endpoint
        user_resp = requests.get(f"{BASE_URL}/api/supervision/events")
        assert user_resp.status_code == 200, f"GET /api/supervision/events failed: {user_resp.text}"
        user_data = user_resp.json()
        ids = [e["id"] for e in user_data]
        assert data["id"] in ids, f"Supervision event created by admin NOT visible in user panel!"
        print(f"PASS: Supervision event {data['id']} visible in user panel /api/supervision/events")

    def test_cleanup_visibility_test_data(self, auth_headers):
        """Clean up test data created for visibility tests"""
        if TestUserPanelDataVisibility.stream_id:
            requests.delete(f"{BASE_URL}/api/admin/live-streams/{TestUserPanelDataVisibility.stream_id}", headers=auth_headers)
            print(f"Cleaned up stream {TestUserPanelDataVisibility.stream_id}")
        if TestUserPanelDataVisibility.event_id:
            requests.delete(f"{BASE_URL}/api/admin/supervision/{TestUserPanelDataVisibility.event_id}", headers=auth_headers)
            print(f"Cleaned up event {TestUserPanelDataVisibility.event_id}")
        print("PASS: Cleanup done")
