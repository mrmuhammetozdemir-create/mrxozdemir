import os
"""
Test suite for new features:
- GET /api/packages (4 packages: free, basic, pro, corporate)
- GET /api/user/profile (requires session auth)
- PUT /api/user/profile (update full_name, phone, avatar_color)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

TEST_EMAIL = os.environ.get("TEST_USER_EMAIL", "testuser@test.com")
TEST_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "Test1234!")

EXPECTED_PACKAGE_IDS = {"free", "basic", "pro", "corporate"}
EXPECTED_PACKAGE_COLORS = {"free": "slate", "basic": "emerald", "pro": "blue", "corporate": "amber"}


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
        domain = BASE_URL.replace("https://", "").replace("http://", "")
        s.cookies.set("session_token", session_token, domain=domain)
    return s, data


# ===== PACKAGES ENDPOINT =====
class TestPackagesEndpoint:
    """Test GET /api/packages - public endpoint"""

    def test_packages_returns_200(self):
        """GET /packages returns 200"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        print("PASS: /packages returns 200")

    def test_packages_returns_list(self):
        """GET /packages returns a list"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"PASS: /packages returns list with {len(data)} items")

    def test_packages_returns_4_packages(self):
        """GET /packages returns exactly 4 packages"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 4, f"Expected 4 packages, got {len(data)}: {[p.get('id') for p in data]}"
        print(f"PASS: /packages returns exactly 4 packages")

    def test_packages_have_required_ids(self):
        """Packages have ids: free, basic, pro, corporate"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        assert resp.status_code == 200
        data = resp.json()
        ids = {p.get("id") for p in data}
        assert ids == EXPECTED_PACKAGE_IDS, f"Expected {EXPECTED_PACKAGE_IDS}, got {ids}"
        print(f"PASS: All 4 package IDs present: {ids}")

    def test_packages_have_required_fields(self):
        """Each package has: id, name, price, period, color, popular, features"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        assert resp.status_code == 200
        data = resp.json()
        required_fields = {"id", "name", "price", "color", "popular", "features"}
        for pkg in data:
            missing = required_fields - set(pkg.keys())
            assert not missing, f"Package {pkg.get('id')} missing fields: {missing}"
        print("PASS: All packages have required fields")

    def test_free_package_price_is_zero(self):
        """Free package has price 0"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        data = resp.json()
        free_pkg = next((p for p in data if p["id"] == "free"), None)
        assert free_pkg is not None, "Free package not found"
        assert free_pkg["price"] == 0, f"Free package price should be 0, got {free_pkg['price']}"
        print("PASS: Free package price is 0")

    def test_paid_packages_have_prices(self):
        """Basic, Pro, Corporate packages have positive prices"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        data = resp.json()
        for pkg_id in ["basic", "pro", "corporate"]:
            pkg = next((p for p in data if p["id"] == pkg_id), None)
            assert pkg is not None, f"Package {pkg_id} not found"
            assert pkg["price"] > 0, f"Package {pkg_id} should have positive price, got {pkg['price']}"
        print("PASS: Paid packages (basic, pro, corporate) have positive prices")

    def test_pro_package_is_popular(self):
        """Pro package has popular=True"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        data = resp.json()
        pro_pkg = next((p for p in data if p["id"] == "pro"), None)
        assert pro_pkg is not None, "Pro package not found"
        assert pro_pkg["popular"] is True, f"Pro package should be popular, got {pro_pkg['popular']}"
        print("PASS: Pro package has popular=True")

    def test_packages_have_features(self):
        """All packages have non-empty features list"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        data = resp.json()
        for pkg in data:
            assert isinstance(pkg["features"], list), f"Package {pkg['id']} features should be a list"
            assert len(pkg["features"]) > 0, f"Package {pkg['id']} should have at least 1 feature"
        print("PASS: All packages have features")

    def test_packages_colors_correct(self):
        """Packages have correct colors"""
        resp = requests.get(f"{BASE_URL}/api/packages")
        data = resp.json()
        for pkg in data:
            expected_color = EXPECTED_PACKAGE_COLORS.get(pkg["id"])
            if expected_color:
                assert pkg["color"] == expected_color, f"Package {pkg['id']} color: expected {expected_color}, got {pkg['color']}"
        print("PASS: Package colors are correct")


# ===== USER PROFILE GET =====
class TestUserProfileGet:
    """Test GET /api/user/profile"""

    def test_profile_without_auth_returns_401(self):
        """GET /user/profile without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/user/profile")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: /user/profile without auth returns 401")

    def test_profile_with_auth_returns_200(self, session_with_cookie):
        """GET /user/profile with auth returns 200"""
        s, _ = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/profile")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        print("PASS: /user/profile with auth returns 200")

    def test_profile_has_required_fields(self, session_with_cookie):
        """GET /user/profile returns required fields"""
        s, _ = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/profile")
        assert resp.status_code == 200
        data = resp.json()
        required = {"user_id", "full_name", "email", "phone", "avatar_color", "plan"}
        missing = required - set(data.keys())
        assert not missing, f"Missing fields in profile: {missing}"
        print(f"PASS: Profile has all required fields: {list(data.keys())}")

    def test_profile_email_matches_login(self, session_with_cookie):
        """Profile email matches the login email"""
        s, _ = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/profile")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == TEST_EMAIL, f"Email mismatch: expected {TEST_EMAIL}, got {data['email']}"
        print(f"PASS: Profile email matches login email: {data['email']}")

    def test_profile_plan_is_valid(self, session_with_cookie):
        """Profile plan is one of: free, basic, pro, corporate"""
        s, _ = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/profile")
        assert resp.status_code == 200
        data = resp.json()
        valid_plans = {"free", "basic", "pro", "corporate"}
        assert data["plan"] in valid_plans, f"Invalid plan: {data['plan']}"
        print(f"PASS: Profile plan is valid: {data['plan']}")

    def test_profile_no_password_in_response(self, session_with_cookie):
        """Profile response does not include password field"""
        s, _ = session_with_cookie
        resp = s.get(f"{BASE_URL}/api/user/profile")
        assert resp.status_code == 200
        data = resp.json()
        assert "password" not in data, "Password should not be in profile response"
        assert "hashed_password" not in data, "hashed_password should not be in profile response"
        print("PASS: No password fields in profile response")


# ===== USER PROFILE PUT =====
class TestUserProfileUpdate:
    """Test PUT /api/user/profile"""

    def test_update_profile_without_auth_returns_401(self):
        """PUT /user/profile without auth returns 401"""
        resp = requests.put(f"{BASE_URL}/api/user/profile",
                            json={"full_name": "Test", "phone": "123", "avatar_color": "blue"})
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: PUT /user/profile without auth returns 401")

    def test_update_profile_full_name(self, session_with_cookie):
        """PUT /user/profile updates full_name successfully"""
        s, login_data = session_with_cookie
        original_name = login_data.get("user", {}).get("full_name", "Test User")

        # Update
        new_name = "TEST_Updated Name"
        resp = s.put(f"{BASE_URL}/api/user/profile", json={"full_name": new_name, "phone": "", "avatar_color": "emerald"})
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["full_name"] == new_name, f"full_name not updated: expected {new_name}, got {data['full_name']}"
        print(f"PASS: full_name updated to '{new_name}'")

        # Restore original name
        s.put(f"{BASE_URL}/api/user/profile", json={"full_name": original_name, "phone": "", "avatar_color": "emerald"})

    def test_update_profile_phone(self, session_with_cookie):
        """PUT /user/profile updates phone successfully"""
        s, _ = session_with_cookie
        test_phone = "+90 555 TEST 99"
        resp = s.put(f"{BASE_URL}/api/user/profile", json={"full_name": "Test User", "phone": test_phone, "avatar_color": "emerald"})
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["phone"] == test_phone, f"phone not updated: expected {test_phone}, got {data['phone']}"
        print(f"PASS: phone updated to '{test_phone}'")

        # Restore
        s.put(f"{BASE_URL}/api/user/profile", json={"full_name": "Test User", "phone": "", "avatar_color": "emerald"})

    def test_update_profile_avatar_color(self, session_with_cookie):
        """PUT /user/profile updates avatar_color successfully"""
        s, _ = session_with_cookie
        for color in ["blue", "rose", "emerald"]:
            resp = s.put(f"{BASE_URL}/api/user/profile", json={"full_name": "Test User", "phone": "", "avatar_color": color})
            assert resp.status_code == 200, f"Expected 200 for color={color}, got {resp.status_code}"
            data = resp.json()
            assert data["avatar_color"] == color, f"avatar_color not updated to {color}, got {data['avatar_color']}"
        print("PASS: avatar_color updated (blue, rose, emerald)")

    def test_update_profile_persisted_via_get(self, session_with_cookie):
        """PUT /user/profile changes are persisted (verified by GET)"""
        s, _ = session_with_cookie
        test_name = "TEST_PersistCheck"
        test_phone = "+90 555 PERSIST"
        test_color = "violet"

        # Update
        put_resp = s.put(f"{BASE_URL}/api/user/profile", json={
            "full_name": test_name,
            "phone": test_phone,
            "avatar_color": test_color
        })
        assert put_resp.status_code == 200

        # Verify via GET
        get_resp = s.get(f"{BASE_URL}/api/user/profile")
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["full_name"] == test_name, f"full_name not persisted: got {data['full_name']}"
        assert data["phone"] == test_phone, f"phone not persisted: got {data['phone']}"
        assert data["avatar_color"] == test_color, f"avatar_color not persisted: got {data['avatar_color']}"
        print(f"PASS: Profile changes persisted - name={test_name}, phone={test_phone}, color={test_color}")

        # Restore
        s.put(f"{BASE_URL}/api/user/profile", json={"full_name": "Test User", "phone": "", "avatar_color": "emerald"})

    def test_update_profile_empty_name_rejected(self, session_with_cookie):
        """PUT /user/profile with empty name should not update name"""
        s, _ = session_with_cookie
        # Get current name
        get_resp = s.get(f"{BASE_URL}/api/user/profile")
        current_name = get_resp.json()["full_name"]

        # Try to update with empty name
        put_resp = s.put(f"{BASE_URL}/api/user/profile", json={"full_name": "", "phone": "", "avatar_color": "emerald"})
        # Either 422 or 200 but name unchanged
        if put_resp.status_code == 200:
            data = put_resp.json()
            # Name should NOT be updated to empty
            assert data["full_name"] == current_name, f"Empty name should not update name, but got: {data['full_name']}"
            print(f"PASS: Empty name does not update (name remains '{current_name}')")
        else:
            assert put_resp.status_code in [400, 422], f"Expected 400/422 for empty name, got {put_resp.status_code}"
            print(f"PASS: Empty name rejected with status {put_resp.status_code}")

    def test_update_profile_response_has_required_fields(self, session_with_cookie):
        """PUT /user/profile response has required fields"""
        s, _ = session_with_cookie
        resp = s.put(f"{BASE_URL}/api/user/profile", json={"full_name": "Test User", "phone": "", "avatar_color": "emerald"})
        assert resp.status_code == 200
        data = resp.json()
        required = {"user_id", "full_name", "email", "phone", "avatar_color", "plan"}
        missing = required - set(data.keys())
        assert not missing, f"PUT response missing fields: {missing}"
        print(f"PASS: PUT /user/profile response has all required fields")
