"""
Tests for Admin App-Users Management API
Tests: GET/PUT /api/admin/app-users/* endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://arazi-invest.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = "ipatarazi@gmail.com"
ADMIN_PASSWORD = "As537273"
TEST_USER_EMAIL = "testuser@test.com"


@pytest.fixture(scope="module")
def admin_token():
    """Get JWT admin token via /api/auth/login"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    token = resp.json().get("access_token")
    assert token, "No access_token returned"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def test_user_id(admin_headers):
    """Get a real user_id from the app_users collection via listing"""
    resp = requests.get(f"{BASE_URL}/api/admin/app-users?limit=20", headers=admin_headers)
    assert resp.status_code == 200
    users = resp.json().get("users", [])
    # Find a non-admin user
    for u in users:
        if u.get("email") == TEST_USER_EMAIL:
            return u["user_id"]
    # fallback: take first user that is not the admin
    for u in users:
        if u.get("email") != ADMIN_EMAIL:
            return u["user_id"]
    pytest.skip("No suitable test user found")


class TestAdminUsersListAndGet:
    """Test listing and getting app users"""

    def test_list_users_returns_200(self, admin_headers):
        """GET /api/admin/app-users should return users list"""
        resp = requests.get(f"{BASE_URL}/api/admin/app-users", headers=admin_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "users" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        assert isinstance(data["users"], list)
        print(f"PASS: List users - total={data['total']}")

    def test_list_users_unauthenticated(self):
        """GET /api/admin/app-users without token should return 401/403"""
        resp = requests.get(f"{BASE_URL}/api/admin/app-users")
        assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"
        print(f"PASS: Unauthenticated list returns {resp.status_code}")

    def test_search_by_email(self, admin_headers):
        """GET /api/admin/app-users?search=test should filter results"""
        resp = requests.get(f"{BASE_URL}/api/admin/app-users?search=test", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "users" in data
        # Should only return users matching "test"
        for u in data["users"]:
            match = (
                "test" in (u.get("email") or "").lower() or
                "test" in (u.get("full_name") or "").lower()
            )
            assert match, f"User {u.get('email')} doesn't match search 'test'"
        print(f"PASS: Search returns {data['total']} matching users")

    def test_filter_by_role(self, admin_headers):
        """GET /api/admin/app-users?role=user should filter by role"""
        resp = requests.get(f"{BASE_URL}/api/admin/app-users?role=user", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        for u in data["users"]:
            assert u.get("role") == "user", f"Expected role=user, got {u.get('role')}"
        print(f"PASS: Role filter returns {data['total']} users")

    def test_get_single_user(self, admin_headers, test_user_id):
        """GET /api/admin/app-users/{user_id} should return user details"""
        resp = requests.get(f"{BASE_URL}/api/admin/app-users/{test_user_id}", headers=admin_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        user = resp.json()
        assert "user_id" in user
        assert "email" in user
        assert "password" not in user  # password must be excluded
        assert "_id" not in user  # MongoDB _id must be excluded
        print(f"PASS: Get single user {user.get('email')}")

    def test_get_nonexistent_user(self, admin_headers):
        """GET /api/admin/app-users/{bad_id} should return 404"""
        resp = requests.get(f"{BASE_URL}/api/admin/app-users/nonexistent_user_id_xyz", headers=admin_headers)
        assert resp.status_code == 404
        print("PASS: Nonexistent user returns 404")


class TestAdminUserUpdate:
    """Test updating user info"""

    def test_update_full_name(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id} should update full_name"""
        new_name = f"Test User Updated {uuid.uuid4().hex[:4]}"
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}",
            json={"full_name": new_name},
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        user = resp.json()
        assert user.get("full_name") == new_name, f"Name not updated: {user.get('full_name')}"

        # Verify persistence via GET
        get_resp = requests.get(f"{BASE_URL}/api/admin/app-users/{test_user_id}", headers=admin_headers)
        assert get_resp.status_code == 200
        assert get_resp.json().get("full_name") == new_name
        print(f"PASS: Full name updated and persisted")

    def test_update_role(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id} with role update"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}",
            json={"role": "user"},  # reset to user role
            headers=admin_headers
        )
        assert resp.status_code == 200
        user = resp.json()
        assert user.get("role") == "user"
        print("PASS: Role update works")


class TestAdminUserStatus:
    """Test user status changes"""

    def test_set_passive_status(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id}/status?status=passive"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/status?status=passive",
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("status") == "passive"

        # Verify persisted
        get_resp = requests.get(f"{BASE_URL}/api/admin/app-users/{test_user_id}", headers=admin_headers)
        assert get_resp.json().get("status") == "passive"
        print("PASS: Status set to passive")

    def test_set_banned_status(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id}/status?status=banned"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/status?status=banned",
            headers=admin_headers
        )
        assert resp.status_code == 200
        assert resp.json().get("status") == "banned"
        print("PASS: Status set to banned")

    def test_set_active_status(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id}/status?status=active"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/status?status=active",
            headers=admin_headers
        )
        assert resp.status_code == 200
        assert resp.json().get("status") == "active"
        print("PASS: Status restored to active")

    def test_invalid_status(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id}/status?status=invalid should return 400"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/status?status=invalid_status",
            headers=admin_headers
        )
        assert resp.status_code == 400
        print("PASS: Invalid status returns 400")


class TestAdminUserMembership:
    """Test membership update and extension"""

    def test_update_membership_plan(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id}/membership with plan"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/membership",
            json={"membership_plan": "pro", "membership_active": True},
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        user = resp.json()
        assert user.get("membership_plan") == "pro"
        print("PASS: Membership plan updated to pro")

    def test_extend_membership(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id}/membership with extend_days"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/membership",
            json={"extend_days": 30},
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        user = resp.json()
        assert "membership_end_at" in user
        assert user.get("membership_end_at") is not None
        print(f"PASS: Membership extended, end_at={user.get('membership_end_at')}")

    def test_reset_membership(self, admin_headers, test_user_id):
        """Reset membership plan to free"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/membership",
            json={"membership_plan": "free"},
            headers=admin_headers
        )
        assert resp.status_code == 200
        assert resp.json().get("membership_plan") == "free"
        print("PASS: Membership reset to free")


class TestAdminUserPermissions:
    """Test permissions update"""

    def test_update_permissions(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id}/permissions"""
        perms = {
            "projects": "view",
            "parcels": "edit",
            "maps": "none",
            "documents": "view"
        }
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/permissions",
            json={"permissions": perms},
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("permissions") == perms

        # Verify persisted
        get_resp = requests.get(f"{BASE_URL}/api/admin/app-users/{test_user_id}", headers=admin_headers)
        saved_perms = get_resp.json().get("permissions", {})
        assert saved_perms.get("projects") == "view"
        assert saved_perms.get("parcels") == "edit"
        print("PASS: Permissions updated and persisted")


class TestAdminUserNote:
    """Test admin note update"""

    def test_save_note(self, admin_headers, test_user_id):
        """PUT /api/admin/app-users/{user_id}/note"""
        note_text = "Test admin note - automated test"
        tags = ["TestTag", "AutoTest"]
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/note",
            json={"admin_note": note_text, "tags": tags},
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("admin_note") == note_text
        assert data.get("tags") == tags

        # Verify persisted
        get_resp = requests.get(f"{BASE_URL}/api/admin/app-users/{test_user_id}", headers=admin_headers)
        user = get_resp.json()
        assert user.get("admin_note") == note_text
        assert user.get("tags") == tags
        print("PASS: Note and tags saved and persisted")

    def test_clear_note(self, admin_headers, test_user_id):
        """Clear note and tags"""
        resp = requests.put(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/note",
            json={"admin_note": "", "tags": []},
            headers=admin_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("admin_note") == ""
        assert data.get("tags") == []
        print("PASS: Note cleared")


class TestAdminUserActivity:
    """Test activity log retrieval"""

    def test_get_activity_logs(self, admin_headers, test_user_id):
        """GET /api/admin/app-users/{user_id}/activity"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/activity",
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "logs" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        assert isinstance(data["logs"], list)
        # Verify no _id in logs
        for log in data["logs"]:
            assert "_id" not in log
        print(f"PASS: Activity logs returned, total={data['total']}")

    def test_activity_pagination(self, admin_headers, test_user_id):
        """GET /api/admin/app-users/{user_id}/activity?page=1&limit=5"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/activity?page=1&limit=5",
            headers=admin_headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == 1
        assert len(data["logs"]) <= 5
        print("PASS: Activity pagination works")


class TestAdminUserEndSessions:
    """Test end sessions"""

    def test_end_sessions(self, admin_headers, test_user_id):
        """POST /api/admin/app-users/{user_id}/end-sessions"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/app-users/{test_user_id}/end-sessions",
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "deleted_count" in data
        assert isinstance(data["deleted_count"], int)
        print(f"PASS: End sessions returned deleted_count={data['deleted_count']}")


class TestAdminUserFilters:
    """Test filter combinations"""

    def test_filter_by_status(self, admin_headers):
        """GET /api/admin/app-users?status=active"""
        resp = requests.get(f"{BASE_URL}/api/admin/app-users?status=active", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        for u in data["users"]:
            assert u.get("status") == "active", f"Expected status=active, got {u.get('status')}"
        print(f"PASS: Status filter - {data['total']} active users")

    def test_pagination(self, admin_headers):
        """GET /api/admin/app-users?page=1&limit=5"""
        resp = requests.get(f"{BASE_URL}/api/admin/app-users?page=1&limit=5", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == 1
        assert len(data["users"]) <= 5
        print("PASS: Pagination works")
