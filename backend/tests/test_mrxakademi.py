import os
"""
Backend tests for MrxAkademi Admin APIs:
- Academy Stats: GET /admin/academy-stats
- Students: GET /admin/students, GET /admin/students/{id}
- Payments: GET/POST/PUT/DELETE /admin/payments
- Contracts: GET/POST/PUT/DELETE /admin/contracts
- Files: GET /admin/all-files, POST/DELETE /admin/files/{user_id}
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_EMAIL = os.environ.get("ADMIN_TEST_EMAIL", "ipatarazi@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_TEST_PASSWORD", "As537273")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if resp.status_code == 200:
        data = resp.json()
        return data.get("access_token") or data.get("token")
    pytest.skip(f"Admin login failed: {resp.status_code} {resp.text}")


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def student_id(auth_headers):
    """Get first student user_id for testing"""
    resp = requests.get(f"{BASE_URL}/api/admin/students", headers=auth_headers)
    if resp.status_code == 200 and len(resp.json()) > 0:
        return resp.json()[0]["user_id"]
    return None


# ─── Academy Stats Tests ──────────────────────────────────────────────────────

class TestAcademyStats:
    """Tests for GET /admin/academy-stats"""

    def test_academy_stats_authenticated(self, auth_headers):
        """Academy stats returns 200 with valid token"""
        resp = requests.get(f"{BASE_URL}/api/admin/academy-stats", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_academy_stats_structure(self, auth_headers):
        """Academy stats response has all required fields"""
        resp = requests.get(f"{BASE_URL}/api/admin/academy-stats", headers=auth_headers)
        data = resp.json()
        required_fields = ["students", "courses", "streams", "supervision", "exams",
                           "payments", "contracts", "exam_attempts"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

    def test_academy_stats_values_are_integers(self, auth_headers):
        """All stats values should be integers"""
        resp = requests.get(f"{BASE_URL}/api/admin/academy-stats", headers=auth_headers)
        data = resp.json()
        for key, value in data.items():
            assert isinstance(value, int), f"Field {key} should be int, got {type(value)}: {value}"

    def test_academy_stats_no_auth(self):
        """Academy stats requires auth - returns 401/403/422 without token"""
        resp = requests.get(f"{BASE_URL}/api/admin/academy-stats")
        assert resp.status_code in [401, 403, 422], f"Expected 401/403/422, got {resp.status_code}"

    def test_academy_stats_students_count(self, auth_headers):
        """Students count should be >= 0"""
        resp = requests.get(f"{BASE_URL}/api/admin/academy-stats", headers=auth_headers)
        data = resp.json()
        assert data["students"] >= 0, "Students count must be non-negative"


# ─── Students Tests ───────────────────────────────────────────────────────────

class TestStudents:
    """Tests for GET /admin/students and GET /admin/students/{id}"""

    def test_get_students_authenticated(self, auth_headers):
        """Students list returns 200 with valid token"""
        resp = requests.get(f"{BASE_URL}/api/admin/students", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_get_students_returns_list(self, auth_headers):
        """Students endpoint returns a list"""
        resp = requests.get(f"{BASE_URL}/api/admin/students", headers=auth_headers)
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"

    def test_get_students_has_expected_count(self, auth_headers):
        """Should have at least 1 student (testuser@test.com seeded)"""
        resp = requests.get(f"{BASE_URL}/api/admin/students", headers=auth_headers)
        data = resp.json()
        assert len(data) >= 1, f"Expected at least 1 student, got {len(data)}"

    def test_get_students_structure(self, auth_headers):
        """Each student has required fields"""
        resp = requests.get(f"{BASE_URL}/api/admin/students", headers=auth_headers)
        data = resp.json()
        if len(data) > 0:
            student = data[0]
            required_fields = ["user_id", "email", "courses_enrolled", "completed_lessons",
                               "exam_attempts", "best_score"]
            for field in required_fields:
                assert field in student, f"Missing student field: {field}"

    def test_get_students_no_password_field(self, auth_headers):
        """Student records should not contain password"""
        resp = requests.get(f"{BASE_URL}/api/admin/students", headers=auth_headers)
        data = resp.json()
        for s in data:
            assert "password" not in s, "Student record should not contain password"
            assert "hashed_password" not in s, "Student record should not contain hashed_password"

    def test_get_student_detail(self, auth_headers, student_id):
        """Student detail endpoint returns full student info"""
        if not student_id:
            pytest.skip("No students available for detail test")
        resp = requests.get(f"{BASE_URL}/api/admin/students/{student_id}", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_student_detail_structure(self, auth_headers, student_id):
        """Student detail has user, progress, exam_attempts, files, payments, contracts"""
        if not student_id:
            pytest.skip("No students available for detail test")
        resp = requests.get(f"{BASE_URL}/api/admin/students/{student_id}", headers=auth_headers)
        data = resp.json()
        required_keys = ["user", "progress", "exam_attempts", "files", "payments", "contracts"]
        for key in required_keys:
            assert key in data, f"Missing key in student detail: {key}"

    def test_student_detail_404_for_invalid_id(self, auth_headers):
        """Student detail returns 404 for non-existent user"""
        resp = requests.get(f"{BASE_URL}/api/admin/students/nonexistent-user-id-12345",
                            headers=auth_headers)
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"

    def test_get_students_no_auth(self):
        """Students endpoint requires auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/students")
        assert resp.status_code in [401, 403, 422], f"Expected 401/403/422, got {resp.status_code}"


# ─── Payments Tests ───────────────────────────────────────────────────────────

class TestPayments:
    """Tests for CRUD /admin/payments"""

    created_payment_id = None

    def test_get_payments_authenticated(self, auth_headers):
        """Payments list returns 200"""
        resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    def test_get_payments_returns_list(self, auth_headers):
        """Payments endpoint returns a list"""
        resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        assert isinstance(resp.json(), list)

    def test_create_payment(self, auth_headers, student_id):
        """Create a new payment and verify it's persisted"""
        if not student_id:
            pytest.skip("No students available for payment test")
        payload = {
            "user_id": student_id,
            "course_name": "TEST_Arsa Yatırım Uzmanlığı",
            "amount": "₺2.500",
            "status": "pending",
            "notes": "Test payment"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/payments", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data, "Created payment should have id"
        assert data["course_name"] == "TEST_Arsa Yatırım Uzmanlığı"
        assert data["user_id"] == student_id
        TestPayments.created_payment_id = data["id"]

    def test_payment_persisted_in_db(self, auth_headers):
        """Verify created payment appears in GET /admin/payments"""
        if not TestPayments.created_payment_id:
            pytest.skip("No payment created to verify")
        resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        ids = [p["id"] for p in resp.json()]
        assert TestPayments.created_payment_id in ids, "Created payment not found in list"

    def test_update_payment(self, auth_headers):
        """Update payment status"""
        if not TestPayments.created_payment_id:
            pytest.skip("No payment created to update")
        resp = requests.put(
            f"{BASE_URL}/api/admin/payments/{TestPayments.created_payment_id}",
            json={"status": "completed", "course_name": "TEST_Arsa Yatırım Uzmanlığı Updated"},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_delete_payment(self, auth_headers):
        """Delete the test payment"""
        if not TestPayments.created_payment_id:
            pytest.skip("No payment created to delete")
        resp = requests.delete(
            f"{BASE_URL}/api/admin/payments/{TestPayments.created_payment_id}",
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_payment_deleted_from_db(self, auth_headers):
        """Verify deleted payment no longer appears in list"""
        if not TestPayments.created_payment_id:
            pytest.skip("No payment created to verify deletion")
        resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        ids = [p["id"] for p in resp.json()]
        assert TestPayments.created_payment_id not in ids, "Deleted payment still in list"

    def test_payments_no_auth(self):
        """Payments require auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/payments")
        assert resp.status_code in [401, 403, 422]


# ─── Contracts Tests ──────────────────────────────────────────────────────────

class TestContracts:
    """Tests for CRUD /admin/contracts"""

    created_contract_id = None

    def test_get_contracts_authenticated(self, auth_headers):
        """Contracts list returns 200"""
        resp = requests.get(f"{BASE_URL}/api/admin/contracts", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    def test_get_contracts_returns_list(self, auth_headers):
        """Contracts endpoint returns a list"""
        resp = requests.get(f"{BASE_URL}/api/admin/contracts", headers=auth_headers)
        assert isinstance(resp.json(), list)

    def test_create_contract(self, auth_headers, student_id):
        """Create a new contract"""
        if not student_id:
            pytest.skip("No students available for contract test")
        payload = {
            "user_id": student_id,
            "contract_name": "TEST_Eğitim Hizmet Sözleşmesi",
            "status": "pending",
            "notes": "Test contract"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/contracts", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data
        assert data["contract_name"] == "TEST_Eğitim Hizmet Sözleşmesi"
        TestContracts.created_contract_id = data["id"]

    def test_contract_persisted_in_db(self, auth_headers):
        """Verify created contract appears in GET /admin/contracts"""
        if not TestContracts.created_contract_id:
            pytest.skip("No contract created to verify")
        resp = requests.get(f"{BASE_URL}/api/admin/contracts", headers=auth_headers)
        ids = [c["id"] for c in resp.json()]
        assert TestContracts.created_contract_id in ids

    def test_update_contract(self, auth_headers):
        """Update contract status to approved"""
        if not TestContracts.created_contract_id:
            pytest.skip("No contract created to update")
        resp = requests.put(
            f"{BASE_URL}/api/admin/contracts/{TestContracts.created_contract_id}",
            json={"status": "approved", "contract_name": "TEST_Eğitim Hizmet Sözleşmesi Updated"},
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_delete_contract(self, auth_headers):
        """Delete the test contract"""
        if not TestContracts.created_contract_id:
            pytest.skip("No contract created to delete")
        resp = requests.delete(
            f"{BASE_URL}/api/admin/contracts/{TestContracts.created_contract_id}",
            headers=auth_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_contract_deleted_from_db(self, auth_headers):
        """Verify deleted contract no longer in list"""
        if not TestContracts.created_contract_id:
            pytest.skip("No contract created to verify")
        resp = requests.get(f"{BASE_URL}/api/admin/contracts", headers=auth_headers)
        ids = [c["id"] for c in resp.json()]
        assert TestContracts.created_contract_id not in ids

    def test_contracts_no_auth(self):
        """Contracts require auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/contracts")
        assert resp.status_code in [401, 403, 422]


# ─── Files Tests ──────────────────────────────────────────────────────────────

class TestFiles:
    """Tests for /admin/all-files and /admin/files/{user_id}"""

    created_file_id = None

    def test_get_all_files_authenticated(self, auth_headers):
        """All files list returns 200"""
        resp = requests.get(f"{BASE_URL}/api/admin/all-files", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    def test_get_all_files_returns_list(self, auth_headers):
        """All files endpoint returns a list"""
        resp = requests.get(f"{BASE_URL}/api/admin/all-files", headers=auth_headers)
        assert isinstance(resp.json(), list)

    def test_add_file_for_student(self, auth_headers, student_id):
        """Add file for a student"""
        if not student_id:
            pytest.skip("No students available for file test")
        payload = {
            "file_name": "TEST_Sertifika.pdf",
            "file_url": "https://example.com/test_cert.pdf",
            "file_type": "document"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/files/{student_id}", json=payload, headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data
        assert data["file_name"] == "TEST_Sertifika.pdf"
        assert data["user_id"] == student_id
        TestFiles.created_file_id = data["id"]

    def test_file_persisted_in_db(self, auth_headers):
        """Verify created file appears in GET /admin/all-files"""
        if not TestFiles.created_file_id:
            pytest.skip("No file created to verify")
        resp = requests.get(f"{BASE_URL}/api/admin/all-files", headers=auth_headers)
        ids = [f["id"] for f in resp.json()]
        assert TestFiles.created_file_id in ids

    def test_delete_file(self, auth_headers):
        """Delete the test file"""
        if not TestFiles.created_file_id:
            pytest.skip("No file created to delete")
        resp = requests.delete(f"{BASE_URL}/api/admin/files/{TestFiles.created_file_id}", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

    def test_file_deleted_from_db(self, auth_headers):
        """Verify deleted file no longer in list"""
        if not TestFiles.created_file_id:
            pytest.skip("No file created to verify")
        resp = requests.get(f"{BASE_URL}/api/admin/all-files", headers=auth_headers)
        ids = [f["id"] for f in resp.json()]
        assert TestFiles.created_file_id not in ids

    def test_files_no_auth(self):
        """Files endpoint requires auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/all-files")
        assert resp.status_code in [401, 403, 422]
