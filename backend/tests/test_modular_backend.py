"""
Backend tests for modularized PropTech Turkey API (server.py → routers)
Tests all required endpoints from the review request.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

ADMIN_EMAIL = "ipatarazi@gmail.com"
ADMIN_PASSWORD = "As537273"
TEST_USER_EMAIL = "testuser@test.com"
TEST_USER_PASSWORD = "Test1234!"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token via POST /api/auth/login"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert resp.status_code == 200, f"Admin login failed: {resp.status_code} {resp.text}"
    data = resp.json()
    assert "token" in data, f"No token in response: {data}"
    return data["token"]


@pytest.fixture(scope="module")
def admin_session(admin_token):
    """Requests session with admin Bearer token"""
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"})
    return session


# ============= AUTH ENDPOINTS =============

class TestAuth:
    """Auth endpoints: admin login, user login, httpOnly cookie"""

    def test_admin_login_success(self):
        """POST /api/auth/login - admin login returns token + sets httpOnly cookie"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "token" in data, "No token in admin login response"
        assert "user" in data, "No user in admin login response"
        assert data["user"]["email"] == ADMIN_EMAIL
        # Check httpOnly cookie is set
        cookies = resp.cookies
        assert "admin_token" in cookies, f"admin_token cookie not set. Cookies: {dict(cookies)}"
        print(f"PASS: Admin login OK, token={data['token'][:20]}..., cookie set={bool(cookies.get('admin_token'))}")

    def test_admin_login_wrong_password(self):
        """POST /api/auth/login - wrong password returns 401"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpassword"})
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: Admin login with wrong password returns 401")

    def test_user_login_success(self):
        """POST /api/auth/user-login - test user login"""
        resp = requests.post(f"{BASE_URL}/api/auth/user-login", json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD})
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "user" in data, "No user in response"
        assert "session_token" in data, "No session_token in response"
        assert data["user"]["email"] == TEST_USER_EMAIL
        # Check httpOnly cookie is set
        cookies = resp.cookies
        assert "session_token" in cookies, f"session_token cookie not set. Cookies: {dict(cookies)}"
        print(f"PASS: User login OK, session_token={data['session_token'][:15]}..., cookie set={bool(cookies.get('session_token'))}")

    def test_user_login_wrong_password(self):
        """POST /api/auth/user-login - wrong password returns 401"""
        resp = requests.post(f"{BASE_URL}/api/auth/user-login", json={"email": TEST_USER_EMAIL, "password": "wrongpass"})
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: User login with wrong password returns 401")


# ============= PUBLIC PROJECT ENDPOINTS =============

class TestProjects:
    """Project endpoints"""

    def test_get_projects(self):
        """GET /api/projects - should return 3 projects"""
        resp = requests.get(f"{BASE_URL}/api/projects")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) >= 3, f"Expected >= 3 projects, got {len(data)}"
        # Verify no _id field
        for p in data:
            assert "_id" not in p, f"MongoDB _id leaked in project response"
        print(f"PASS: GET /api/projects returned {len(data)} projects")

    def test_get_projects_response_structure(self):
        """GET /api/projects - verify data structure"""
        resp = requests.get(f"{BASE_URL}/api/projects")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        project = data[0]
        assert "id" in project
        assert "project_name" in project
        assert "city" in project
        print(f"PASS: Project structure OK: {project.get('project_name')} in {project.get('city')}")

    def test_get_project_by_id(self):
        """GET /api/projects/{id} - get specific project"""
        # First get a project id
        resp = requests.get(f"{BASE_URL}/api/projects")
        assert resp.status_code == 200
        projects = resp.json()
        assert len(projects) > 0
        project_id = projects[0]["id"]

        detail_resp = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert detail_resp.status_code == 200, f"Status {detail_resp.status_code}"
        detail = detail_resp.json()
        assert detail["id"] == project_id
        print(f"PASS: GET /api/projects/{project_id} OK")

    def test_get_mega_projects(self):
        """GET /api/mega-projects"""
        resp = requests.get(f"{BASE_URL}/api/mega-projects")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: GET /api/mega-projects returned {len(data)} projects")


# ============= PUBLIC CONTENT ENDPOINTS =============

class TestPublicContent:
    """Public content endpoints"""

    def test_get_packages(self):
        """GET /api/packages - should return 4 packages"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) == 4, f"Expected 4 packages, got {len(data)}"
        ids = [p["id"] for p in data]
        assert "free" in ids
        assert "basic" in ids
        assert "pro" in ids
        assert "corporate" in ids
        print(f"PASS: GET /api/packages returned {len(data)} packages: {ids}")

    def test_get_education_courses(self):
        """GET /api/education/courses"""
        resp = requests.get(f"{BASE_URL}/api/education/courses")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: GET /api/education/courses returned {len(data)} courses")

    def test_get_opportunities(self):
        """GET /api/opportunities"""
        resp = requests.get(f"{BASE_URL}/api/opportunities")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: GET /api/opportunities returned {len(data)} opportunities")

    def test_get_live_streams(self):
        """GET /api/live-streams"""
        resp = requests.get(f"{BASE_URL}/api/live-streams")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        assert len(data) >= 1, f"Expected at least 1 live stream (fallback data), got {len(data)}"
        stream = data[0]
        assert "id" in stream
        assert "title" in stream
        print(f"PASS: GET /api/live-streams returned {len(data)} streams")

    def test_get_land_parcels(self):
        """GET /api/land-parcels"""
        resp = requests.get(f"{BASE_URL}/api/land-parcels")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: GET /api/land-parcels returned {len(data)} parcels")


# ============= ADMIN ENDPOINTS =============

class TestAdminEndpoints:
    """Admin-protected endpoints requiring Bearer token"""

    def test_admin_stats(self, admin_session):
        """GET /api/admin/stats"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "projects" in data, f"No 'projects' key in stats: {data}"
        assert "courses" in data
        assert "app_users" in data
        assert isinstance(data["projects"], int), f"Expected int, got {type(data['projects'])}"
        assert data["projects"] >= 3, f"Expected >= 3 projects in stats, got {data['projects']}"
        print(f"PASS: GET /api/admin/stats: projects={data['projects']}, app_users={data['app_users']}")

    def test_admin_app_users(self, admin_session):
        """GET /api/admin/app-users"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/app-users")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "users" in data, f"No 'users' key: {data}"
        assert "total" in data
        assert isinstance(data["users"], list)
        # Verify no password fields leak
        for u in data["users"]:
            assert "password" not in u, "Password leaked in user response"
            assert "_id" not in u, "_id leaked in user response"
        print(f"PASS: GET /api/admin/app-users returned {data['total']} users")

    def test_admin_stats_without_token(self):
        """GET /api/admin/stats without auth should return 403 or 401"""
        resp = requests.get(f"{BASE_URL}/api/admin/stats")
        assert resp.status_code in [401, 403, 422], f"Expected auth error, got {resp.status_code}"
        print(f"PASS: Admin stats without token returns {resp.status_code}")

    def test_admin_app_users_without_token(self):
        """GET /api/admin/app-users without auth should fail"""
        resp = requests.get(f"{BASE_URL}/api/admin/app-users")
        assert resp.status_code in [401, 403, 422], f"Expected auth error, got {resp.status_code}"
        print(f"PASS: Admin app-users without token returns {resp.status_code}")


# ============= ADDITIONAL ENDPOINTS =============

class TestAdditionalEndpoints:
    """Validate additional endpoints"""

    def test_get_market_data(self):
        """GET /api/market-data"""
        resp = requests.get(f"{BASE_URL}/api/market-data")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/market-data returned {len(data)} records")

    def test_get_education_live(self):
        """GET /api/education/live"""
        resp = requests.get(f"{BASE_URL}/api/education/live")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "title" in data
        print(f"PASS: GET /api/education/live: {data.get('title')}")

    def test_get_community_posts(self):
        """GET /api/community/posts"""
        resp = requests.get(f"{BASE_URL}/api/community/posts")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/community/posts returned {len(data)} posts")

    def test_get_seo_public(self):
        """GET /api/seo"""
        resp = requests.get(f"{BASE_URL}/api/seo")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, dict)
        print(f"PASS: GET /api/seo returned {len(data)} SEO pages")

    def test_get_supervision_events(self):
        """GET /api/supervision/events"""
        resp = requests.get(f"{BASE_URL}/api/supervision/events")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/supervision/events returned {len(data)} events")

    def test_toki_compat_endpoint(self):
        """GET /api/toki/projects - backward compat"""
        resp = requests.get(f"{BASE_URL}/api/toki/projects")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/toki/projects returned {len(data)} projects")

    def test_shared_facilities(self):
        """GET /api/shared-facilities"""
        resp = requests.get(f"{BASE_URL}/api/shared-facilities")
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/shared-facilities returned {len(data)} facilities")
