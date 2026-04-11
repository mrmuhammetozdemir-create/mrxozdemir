import os
"""
Test suite for User Panel endpoints: /api/user/*, /api/live-streams, /api/supervision/events
Tests: progress, files, payments, contracts, exams, live-streams, supervision events, panel auth
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

TEST_EMAIL = os.environ.get("TEST_USER_EMAIL", "testuser@test.com")
TEST_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "Test1234!")


@pytest.fixture(scope="module")
def session_with_cookie():
    """Login as test user and return session with cookie."""
    s = requests.Session()
    resp = s.post(f"{BASE_URL}/api/auth/user-login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    if resp.status_code != 200:
        pytest.skip(f"Login failed: {resp.status_code} - {resp.text}")
    data = resp.json()
    session_token = data.get("session_token")
    if session_token:
        s.cookies.set("session_token", session_token, domain=BASE_URL.replace("https://", "").replace("http://", ""))
    return s, data


# ===== AUTH TESTS =====
class TestUserAuth:
    """Test user authentication endpoints"""

    def test_user_login_success(self):
        """User login returns session_token and user data"""
        resp = requests.post(f"{BASE_URL}/api/auth/user-login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "user" in data, "No user in response"
        assert "session_token" in data, "No session_token in response"
        assert data["user"]["email"] == TEST_EMAIL
        print(f"PASS: Login successful, user_id={data['user'].get('user_id')}")

    def test_user_login_wrong_password(self):
        """Wrong password returns 401"""
        resp = requests.post(f"{BASE_URL}/api/auth/user-login", json={
            "email": TEST_EMAIL, "password": "wrongpass123"
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: Wrong password correctly returns 401")

    def test_user_login_wrong_email(self):
        """Non-existent email returns 401"""
        resp = requests.post(f"{BASE_URL}/api/auth/user-login", json={
            "email": "nonexistent@test.com", "password": TEST_PASSWORD
        })
        assert resp.status_code == 401
        print("PASS: Non-existent email correctly returns 401")


# ===== PUBLIC ENDPOINTS =====
class TestPublicEndpoints:
    """Test public endpoints that don't require auth"""

    def test_live_streams_returns_data(self):
        """GET /live-streams returns list with expected fields"""
        resp = requests.get(f"{BASE_URL}/api/live-streams")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one stream"
        # Check required fields
        stream = data[0]
        assert "id" in stream, "Missing id field"
        assert "title" in stream, "Missing title field"
        assert "date" in stream, "Missing date field"
        assert "status" in stream, "Missing status field"
        print(f"PASS: live-streams returned {len(data)} streams")

    def test_live_streams_status_values(self):
        """Live streams have valid status values"""
        resp = requests.get(f"{BASE_URL}/api/live-streams")
        assert resp.status_code == 200
        data = resp.json()
        valid_statuses = {"live", "upcoming", "ended"}
        for stream in data:
            assert stream["status"] in valid_statuses, f"Invalid status: {stream['status']}"
        print(f"PASS: All {len(data)} streams have valid statuses")

    def test_supervision_events_returns_data(self):
        """GET /supervision/events returns list with expected fields"""
        resp = requests.get(f"{BASE_URL}/api/supervision/events")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one event"
        # Check required fields
        event = data[0]
        assert "id" in event, "Missing id field"
        assert "title" in event, "Missing title field"
        assert "date" in event, "Missing date field"
        assert "location" in event, "Missing location field"
        print(f"PASS: supervision/events returned {len(data)} events")

    def test_supervision_events_status_values(self):
        """Supervision events have valid status values"""
        resp = requests.get(f"{BASE_URL}/api/supervision/events")
        assert resp.status_code == 200
        data = resp.json()
        valid_statuses = {"upcoming", "ended"}
        for event in data:
            assert event["status"] in valid_statuses, f"Invalid status: {event['status']}"
        print(f"PASS: All supervision events have valid statuses")


# ===== PROTECTED ENDPOINTS (require session) =====
class TestProtectedEndpoints:
    """Test user endpoints that require authentication"""

    def test_user_progress_without_auth_returns_401(self):
        """GET /user/progress without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/user/progress")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: /user/progress without auth returns 401")

    def test_user_files_without_auth_returns_401(self):
        """GET /user/files without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/user/files")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: /user/files without auth returns 401")

    def test_user_payments_without_auth_returns_401(self):
        """GET /user/payments without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/user/payments")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: /user/payments without auth returns 401")

    def test_user_contracts_without_auth_returns_401(self):
        """GET /user/contracts without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/user/contracts")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: /user/contracts without auth returns 401")

    def test_user_exams_without_auth_returns_401(self):
        """GET /user/exams without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/user/exams")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: /user/exams without auth returns 401")


class TestAuthenticatedEndpoints:
    """Test user endpoints with valid session"""

    def test_user_progress_with_auth(self, session_with_cookie):
        """GET /user/progress with auth returns list"""
        s, login_data = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/progress")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: /user/progress returned {len(data)} courses")
        if data:
            course = data[0]
            assert "course_id" in course, "Missing course_id"
            assert "title" in course, "Missing title"
            assert "progress_pct" in course, "Missing progress_pct"
            assert "total_lessons" in course, "Missing total_lessons"

    def test_user_files_with_auth(self, session_with_cookie):
        """GET /user/files with auth returns list"""
        s, _ = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/files")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: /user/files returned {len(data)} files (expected empty for new user)")

    def test_user_payments_with_auth(self, session_with_cookie):
        """GET /user/payments with auth returns list"""
        s, _ = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/payments")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: /user/payments returned {len(data)} payments (mock data fallback expected)")

    def test_user_contracts_with_auth(self, session_with_cookie):
        """GET /user/contracts with auth returns list"""
        s, _ = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/contracts")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: /user/contracts returned {len(data)} contracts (mock data fallback expected)")

    def test_user_exams_with_auth(self, session_with_cookie):
        """GET /user/exams with auth returns list of exam objects"""
        s, _ = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/exams")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: /user/exams returned {len(data)} exams")
        if data:
            exam = data[0]
            assert "id" in exam, "Missing id in exam"
            assert "title" in exam, "Missing title in exam"
            assert "questions" in exam, "Missing questions in exam"

    def test_exam_submit_with_auth(self, session_with_cookie):
        """POST /user/exams/{exam_id}/submit correctly scores an exam"""
        s, _ = session_with_cookie
        # First get exams
        exams_resp = s.get(f"{BASE_URL}/api/user/exams")
        if exams_resp.status_code != 200 or not exams_resp.json():
            pytest.skip("No exams available to test submission")
        exam = exams_resp.json()[0]
        exam_id = exam["id"]
        questions = exam.get("questions", [])
        if not questions:
            pytest.skip("Exam has no questions")
        # Submit with first option for each question (may not all be correct - OK)
        answers = {q["id"]: q["options"][0] for q in questions}
        submit_resp = s.post(f"{BASE_URL}/api/user/exams/{exam_id}/submit", json={"answers": answers})
        assert submit_resp.status_code == 200, f"Submit failed: {submit_resp.status_code}: {submit_resp.text}"
        result = submit_resp.json()
        assert "score" in result, "Missing score in result"
        assert "passed" in result, "Missing passed in result"
        assert isinstance(result["score"], (int, float)), "Score should be numeric"
        print(f"PASS: Exam submitted successfully, score={result['score']}, passed={result['passed']}")

    def test_exam_submit_correct_answers(self, session_with_cookie):
        """Submit correct answers should get 100 score"""
        s, _ = session_with_cookie
        exams_resp = s.get(f"{BASE_URL}/api/user/exams")
        if exams_resp.status_code != 200 or not exams_resp.json():
            pytest.skip("No exams available")
        exam = exams_resp.json()[0]
        exam_id = exam["id"]
        questions = exam.get("questions", [])
        if not questions:
            pytest.skip("Exam has no questions")
        # Submit with correct answers
        answers = {q["id"]: q["correct_answer"] for q in questions if "correct_answer" in q}
        if not answers:
            pytest.skip("No correct_answer fields in exam")
        submit_resp = s.post(f"{BASE_URL}/api/user/exams/{exam_id}/submit", json={"answers": answers})
        assert submit_resp.status_code == 200
        result = submit_resp.json()
        assert result["score"] == 100, f"Expected 100 score with all correct answers, got {result['score']}"
        assert result["passed"] is True, "Should pass with 100 score"
        print(f"PASS: Perfect score achieved with correct answers")

    def test_logout(self, session_with_cookie):
        """POST /auth/logout clears session"""
        s, _ = session_with_cookie
        resp = s.post(f"{BASE_URL}/api/auth/logout")
        assert resp.status_code == 200, f"Logout failed: {resp.status_code}"
        data = resp.json()
        assert "message" in data
        print("PASS: Logout successful")
