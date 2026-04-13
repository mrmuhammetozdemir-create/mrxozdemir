import os
"""
PropTech Turkey Admin API Tests
Tests admin authentication, project CRUD, ada/parsel management, and related features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = os.environ.get("ADMIN_TEST_EMAIL", "ipatarazi@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_TEST_PASSWORD", "As537273")

class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_login_success(self):
        """Test successful admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Missing access_token"
        assert "user" in data, "Missing user data"
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        
    def test_get_me_with_valid_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"


@pytest.fixture(scope="module")
def auth_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Authentication failed")


@pytest.fixture(scope="module")
def created_project(auth_token):
    """Create a test project and return its data, cleanup after tests"""
    # Create project using FormData
    response = requests.post(
        f"{BASE_URL}/api/admin/projects",
        headers={"Authorization": f"Bearer {auth_token}"},
        data={
            "project_name": "TEST_Deneme Projesi",
            "city": "İstanbul",
            "district": "Kadıköy",
            "neighborhood": "Caferağa",
            "description": "Test proje açıklaması",
            "project_type": "TOKİ",
            "total_housing": 100,
            "commercial_count": 5,
            "school_count": 1,
            "mosque_count": 1,
            "social_facility_count": 2,
            "project_area_sqm": 50000,
            "start_date": "2024-01-01",
            "planned_end_date": "2025-12-31",
            "progress_percentage": 35,
            "location_lat": 40.9907,
            "location_lng": 29.0287
        }
    )
    assert response.status_code == 200, f"Failed to create project: {response.text}"
    project = response.json()
    
    yield project
    
    # Cleanup: Delete project after tests
    try:
        requests.delete(
            f"{BASE_URL}/api/admin/projects/{project['id']}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    except:
        pass


class TestProjectCRUD:
    """Project CRUD operations tests"""
    
    def test_create_project(self, auth_token):
        """Test creating a new project with FormData"""
        response = requests.post(
            f"{BASE_URL}/api/admin/projects",
            headers={"Authorization": f"Bearer {auth_token}"},
            data={
                "project_name": "TEST_Yeni Proje",
                "city": "Ankara",
                "district": "Çankaya",
                "neighborhood": "Kızılay",
                "description": "Test açıklaması",
                "project_type": "Emlak Konut",
                "total_housing": 200,
                "commercial_count": 10,
                "progress_percentage": 50
            }
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        
        data = response.json()
        assert data["project_name"] == "TEST_Yeni Proje"
        assert data["city"] == "Ankara"
        assert data["district"] == "Çankaya"
        assert data["project_type"] == "Emlak Konut"
        assert data["total_housing"] == 200
        assert "id" in data
        
        # Cleanup
        project_id = data["id"]
        requests.delete(
            f"{BASE_URL}/api/admin/projects/{project_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
    def test_get_projects_list(self, auth_token, created_project):
        """Test getting list of projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        
        projects = response.json()
        assert isinstance(projects, list)
        # Find our test project
        found = any(p["id"] == created_project["id"] for p in projects)
        assert found, "Created project not found in list"
        
    def test_get_single_project(self, created_project):
        """Test getting a single project by ID"""
        response = requests.get(f"{BASE_URL}/api/projects/{created_project['id']}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == created_project["id"]
        assert data["project_name"] == created_project["project_name"]
        assert data["city"] == created_project["city"]
        
    def test_update_project(self, auth_token, created_project):
        """Test updating a project"""
        response = requests.put(
            f"{BASE_URL}/api/admin/projects/{created_project['id']}",
            headers={"Authorization": f"Bearer {auth_token}"},
            data={
                "project_name": "TEST_Güncellenmiş Proje",
                "city": "İstanbul",
                "district": "Beşiktaş",
                "progress_percentage": 75
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["project_name"] == "TEST_Güncellenmiş Proje"
        assert data["district"] == "Beşiktaş"
        assert data["progress_percentage"] == 75
        
        # Verify via GET
        get_resp = requests.get(f"{BASE_URL}/api/projects/{created_project['id']}")
        assert get_resp.status_code == 200
        assert get_resp.json()["project_name"] == "TEST_Güncellenmiş Proje"
        
    def test_delete_project(self, auth_token):
        """Test deleting a project with cascade"""
        # Create a project to delete
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/projects",
            headers={"Authorization": f"Bearer {auth_token}"},
            data={
                "project_name": "TEST_Silinecek Proje",
                "city": "Bursa",
                "district": "Nilüfer"
            }
        )
        project_id = create_resp.json()["id"]
        
        # Delete project
        response = requests.delete(
            f"{BASE_URL}/api/admin/projects/{project_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert "deleted" in response.json().get("message", "").lower()
        
        # Verify deletion
        get_resp = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert get_resp.status_code == 404


class TestAdaParsel:
    """Ada and Parsel management tests"""
    
    def test_create_ada(self, auth_token, created_project):
        """Test creating an ada (block)"""
        response = requests.post(
            f"{BASE_URL}/api/admin/projects/{created_project['id']}/adas",
            headers={"Authorization": f"Bearer {auth_token}"},
            data={
                "ada_no": "33",
                "description": "Test ada açıklaması"
            }
        )
        assert response.status_code == 200, f"Create ada failed: {response.text}"
        
        data = response.json()
        assert data["ada_no"] == "33"
        assert data["project_id"] == created_project["id"]
        assert "id" in data
        
    def test_get_adas(self, created_project):
        """Test getting adas for a project"""
        response = requests.get(f"{BASE_URL}/api/projects/{created_project['id']}/adas")
        assert response.status_code == 200
        
        adas = response.json()
        assert isinstance(adas, list)
        
    def test_create_parsel(self, auth_token, created_project):
        """Test creating a parsel (parcel)"""
        # First get or create an ada
        adas_resp = requests.get(f"{BASE_URL}/api/projects/{created_project['id']}/adas")
        adas = adas_resp.json()
        
        if not adas:
            # Create ada first
            ada_resp = requests.post(
                f"{BASE_URL}/api/admin/projects/{created_project['id']}/adas",
                headers={"Authorization": f"Bearer {auth_token}"},
                data={"ada_no": "TEST_99", "description": ""}
            )
            ada_id = ada_resp.json()["id"]
        else:
            ada_id = adas[0]["id"]
        
        # Create parsel
        response = requests.post(
            f"{BASE_URL}/api/admin/adas/{ada_id}/parsels",
            headers={"Authorization": f"Bearer {auth_token}"},
            data={
                "parsel_no": "1",
                "area_sqm": "500",
                "note": "Test parsel notu"
            }
        )
        assert response.status_code == 200, f"Create parsel failed: {response.text}"
        
        data = response.json()
        assert data["parsel_no"] == "1"
        assert data["ada_id"] == ada_id
        
    def test_get_parsels(self, created_project):
        """Test getting all parsels for a project"""
        response = requests.get(f"{BASE_URL}/api/projects/{created_project['id']}/parsels")
        assert response.status_code == 200
        
        parsels = response.json()
        assert isinstance(parsels, list)
        
    def test_delete_ada_cascades(self, auth_token, created_project):
        """Test that deleting an ada deletes its parsels too"""
        # Create ada
        ada_resp = requests.post(
            f"{BASE_URL}/api/admin/projects/{created_project['id']}/adas",
            headers={"Authorization": f"Bearer {auth_token}"},
            data={"ada_no": "TEST_CASCADE", "description": ""}
        )
        ada_id = ada_resp.json()["id"]
        
        # Create parsel in that ada
        requests.post(
            f"{BASE_URL}/api/admin/adas/{ada_id}/parsels",
            headers={"Authorization": f"Bearer {auth_token}"},
            data={"parsel_no": "CASCADE_TEST", "area_sqm": "100", "note": ""}
        )
        
        # Delete ada
        response = requests.delete(
            f"{BASE_URL}/api/admin/adas/{ada_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200


class TestExcelImport:
    """Excel template and import tests"""
    
    def test_download_excel_template(self):
        """Test downloading Excel template"""
        response = requests.get(f"{BASE_URL}/api/admin/excel-template")
        assert response.status_code == 200
        assert "spreadsheet" in response.headers.get("content-type", "").lower() or \
               "octet-stream" in response.headers.get("content-type", "").lower()
        assert len(response.content) > 0, "Template file is empty"


class TestVideoManagement:
    """YouTube video management tests"""
    
    def test_add_youtube_video(self, auth_token, created_project):
        """Test adding a YouTube video to project"""
        response = requests.post(
            f"{BASE_URL}/api/admin/projects/{created_project['id']}/videos",
            headers={"Authorization": f"Bearer {auth_token}"},
            data={"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
        )
        assert response.status_code == 200
        assert "added" in response.json().get("message", "").lower()
        
        # Verify video was added
        project_resp = requests.get(f"{BASE_URL}/api/projects/{created_project['id']}")
        project = project_resp.json()
        assert "https://www.youtube.com/watch?v=dQw4w9WgXcQ" in project.get("youtube_videos", [])


class TestTOKIEndpoints:
    """Test backward compatibility TOKI endpoints"""
    
    def test_get_toki_projects(self):
        """Test getting projects from TOKI endpoint"""
        response = requests.get(f"{BASE_URL}/api/toki/projects")
        assert response.status_code == 200
        
        projects = response.json()
        assert isinstance(projects, list)


class TestMediaEndpoints:
    """Test media-related GET endpoints"""
    
    def test_get_project_media(self, created_project):
        """Test getting media for a project"""
        response = requests.get(f"{BASE_URL}/api/projects/{created_project['id']}/media")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_get_project_documents(self, created_project):
        """Test getting documents for a project"""
        response = requests.get(f"{BASE_URL}/api/projects/{created_project['id']}/documents")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_get_map_layers(self, created_project):
        """Test getting map layers for a project"""
        response = requests.get(f"{BASE_URL}/api/projects/{created_project['id']}/map-layers")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestUnauthorizedAccess:
    """Test that admin endpoints require authentication"""
    
    def test_create_project_without_auth(self):
        """Test that creating project without auth fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/projects",
            data={"project_name": "Unauthorized", "city": "Test", "district": "Test"}
        )
        assert response.status_code in [401, 403]
        
    def test_delete_project_without_auth(self):
        """Test that deleting project without auth fails"""
        response = requests.delete(f"{BASE_URL}/api/admin/projects/fake-id")
        assert response.status_code in [401, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
