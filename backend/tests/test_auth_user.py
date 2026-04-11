import os
"""
Backend tests for user authentication:
- POST /api/auth/register - New user registration
- POST /api/auth/user-login - User login with email/password
- GET /api/auth/me - Get current user
- POST /api/auth/logout - Logout
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

EXISTING_EMAIL = os.environ.get("TEST_USER_EMAIL", "testuser@test.com")
EXISTING_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "Test1234!")
NEW_EMAIL = f"TEST_newuser_{uuid.uuid4().hex[:6]}@test.com"
NEW_PASSWORD = "TestNew1234!"


class TestUserRegistration:
    """Tests for POST /api/auth/register"""

    def test_register_new_user_success(self):
        """Register a brand new user successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "full_name": "TEST User",
            "phone": "+905001234567",
            "email": NEW_EMAIL,
            "password": NEW_PASSWORD,
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "user" in data, "Response missing 'user'"
        assert "session_token" in data, "Response missing 'session_token'"
        assert data["user"]["email"] == NEW_EMAIL
        assert data["user"]["full_name"] == "TEST User"
        assert data["user"]["role"] == "user"
        assert "user_id" in data["user"]
        print(f"[PASS] New user registered: {NEW_EMAIL}, session_token present")

    def test_register_duplicate_email_returns_400(self):
        """Registering with an already-registered email should return 400"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "full_name": "Duplicate User",
            "phone": "",
            "email": NEW_EMAIL,  # already registered in previous test
            "password": NEW_PASSWORD,
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"[PASS] Duplicate email returns 400: {data['detail']}")

    def test_register_without_kvkk_validation_happens_at_frontend(self):
        """Backend accepts registration without KVKK (validation is frontend only)"""
        unique_email = f"TEST_nkvkk_{uuid.uuid4().hex[:6]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "full_name": "KVKK Test",
            "phone": "",
            "email": unique_email,
            "password": "TestKvkk1234!",
        })
        # Backend should accept it (KVKK is frontend-only validation)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"[PASS] Backend accepts registration without KVKK (frontend validates)")


class TestUserLogin:
    """Tests for POST /api/auth/user-login"""

    def test_login_existing_user_success(self):
        """Login with existing test user credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/user-login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD,
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "user" in data, "Response missing 'user'"
        assert "session_token" in data, "Response missing 'session_token'"
        assert data["user"]["email"] == EXISTING_EMAIL
        assert data["user"]["role"] == "user"
        print(f"[PASS] Existing user login successful, session_token: {data['session_token'][:20]}...")

    def test_login_wrong_password_returns_401(self):
        """Login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/user-login", json={
            "email": EXISTING_EMAIL,
            "password": "WrongPassword123!",
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"[PASS] Wrong password returns 401: {data['detail']}")

    def test_login_nonexistent_email_returns_401(self):
        """Login with non-existent email returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/user-login", json={
            "email": "nonexistent@nowhere.com",
            "password": "Password123!",
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print(f"[PASS] Non-existent email returns 401")

    def test_login_newly_registered_user(self):
        """Login with newly registered user credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/user-login", json={
            "email": NEW_EMAIL,
            "password": NEW_PASSWORD,
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["user"]["email"] == NEW_EMAIL
        print(f"[PASS] Newly registered user can login")


class TestSessionAndMe:
    """Tests for GET /api/auth/me with session token"""

    def test_get_me_with_valid_session(self):
        """GET /api/auth/me with valid session token"""
        # First login to get session token
        login_resp = requests.post(f"{BASE_URL}/api/auth/user-login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD,
        })
        assert login_resp.status_code == 200
        session_token = login_resp.json()["session_token"]

        # Use session token in Bearer header
        me_resp = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {session_token}"
        })
        assert me_resp.status_code == 200, f"Expected 200, got {me_resp.status_code}: {me_resp.text}"
        data = me_resp.json()
        assert data["email"] == EXISTING_EMAIL
        print(f"[PASS] /auth/me returns user data: {data.get('email')}")

    def test_get_me_without_token_returns_401(self):
        """GET /api/auth/me without token returns 401"""
        me_resp = requests.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 401, f"Expected 401, got {me_resp.status_code}"
        print(f"[PASS] /auth/me without token returns 401")


class TestLogout:
    """Tests for POST /api/auth/logout"""

    def test_logout_success(self):
        """Logout endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/auth/logout", json={})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"[PASS] Logout returns 200: {data['message']}")


class TestAdminLogin:
    """Tests for admin login (POST /api/auth/login)"""

    def test_admin_login_success(self):
        """Admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ipatarazi@gmail.com",
            "password": "As537273",
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"[PASS] Admin login successful")
