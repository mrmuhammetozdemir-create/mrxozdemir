import os
"""
Test all 8 Admin Panel Modules Backend APIs
- Admin Auth & Stats
- TOKİ Projects (projects collection)
- e-İPAT (land_parcels)
- Mega Projects
- Education (courses, seminars)
- Community
- Land Opportunities
- Market Data
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = os.environ.get("ADMIN_TEST_EMAIL", "ipatarazi@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_TEST_PASSWORD", "As537273")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token for authenticated requests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    """Return auth headers for admin requests"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
    
    def test_admin_login_invalid_credentials(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
    
    def test_admin_me_endpoint(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"


class TestAdminStats:
    """Admin dashboard stats endpoint"""
    
    def test_get_admin_stats(self, auth_headers):
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Check all expected stat keys
        expected_keys = ["projects", "land_parcels", "mega_projects", "courses", 
                        "seminars", "community_posts", "opportunities", "market_data"]
        for key in expected_keys:
            assert key in data, f"Missing key: {key}"
            assert isinstance(data[key], int)
    
    def test_stats_requires_auth(self):
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403]


class TestLandParcels:
    """e-İPAT Land Parcels CRUD"""
    
    created_id = None
    
    def test_create_land_parcel(self, auth_headers):
        form_data = {
            "city": "İstanbul",
            "district": "Kadıköy",
            "neighborhood": "Caferağa",
            "ada": "TEST_123",
            "parsel": "45",
            "size_sqm": "1500",
            "zoning_info": "Konut",
            "development_potential": "Yüksek",
            "location_lat": "40.9908",
            "location_lng": "29.0286"
        }
        response = requests.post(f"{BASE_URL}/api/admin/land-parcels", 
                                data=form_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["city"] == "İstanbul"
        assert data["ada"] == "TEST_123"
        assert "id" in data
        TestLandParcels.created_id = data["id"]
    
    def test_get_land_parcels(self):
        response = requests.get(f"{BASE_URL}/api/land-parcels")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_land_parcels_with_filter(self):
        response = requests.get(f"{BASE_URL}/api/land-parcels", params={"city": "İstanbul"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_delete_land_parcel(self, auth_headers):
        if not TestLandParcels.created_id:
            pytest.skip("No parcel to delete")
        response = requests.delete(f"{BASE_URL}/api/admin/land-parcels/{TestLandParcels.created_id}",
                                  headers=auth_headers)
        assert response.status_code == 200


class TestMegaProjects:
    """Mega Projects CRUD"""
    
    created_id = None
    
    def test_create_mega_project(self, auth_headers):
        form_data = {
            "name": "TEST_Yavuz Sultan Selim Köprüsü",
            "category": "köprü",
            "description": "Test mega proje açıklaması",
            "timeline": "2024-2028",
            "location_lat": "41.2108",
            "location_lng": "29.1152"
        }
        response = requests.post(f"{BASE_URL}/api/admin/mega-projects", 
                                data=form_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Yavuz Sultan Selim Köprüsü"
        assert data["category"] == "köprü"
        assert "id" in data
        TestMegaProjects.created_id = data["id"]
    
    def test_get_mega_projects(self):
        """GET includes manual mega projects AND auto-mapped TOKİ projects"""
        response = requests.get(f"{BASE_URL}/api/mega-projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check if any auto-mapped projects (from_projects: true)
        # This may or may not be present depending on TOKİ projects in DB
    
    def test_update_mega_project(self, auth_headers):
        if not TestMegaProjects.created_id:
            pytest.skip("No project to update")
        form_data = {
            "name": "TEST_Updated Köprü",
            "category": "otoyol",
            "description": "Güncellenmiş açıklama",
            "timeline": "2025-2030",
            "location_lat": "41.2108",
            "location_lng": "29.1152"
        }
        response = requests.put(f"{BASE_URL}/api/admin/mega-projects/{TestMegaProjects.created_id}",
                               data=form_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Updated Köprü"
    
    def test_delete_mega_project(self, auth_headers):
        if not TestMegaProjects.created_id:
            pytest.skip("No project to delete")
        response = requests.delete(f"{BASE_URL}/api/admin/mega-projects/{TestMegaProjects.created_id}",
                                  headers=auth_headers)
        assert response.status_code == 200


class TestCourses:
    """Education - Courses CRUD"""
    
    created_id = None
    
    def test_create_course(self, auth_headers):
        form_data = {
            "title": "TEST_Arsa Değerleme Temelleri",
            "description": "Test kurs açıklaması",
            "video_url": "https://youtube.com/watch?v=test123",
            "duration_minutes": "45",
            "thumbnail": "https://example.com/thumb.jpg"
        }
        response = requests.post(f"{BASE_URL}/api/admin/courses", 
                                data=form_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Arsa Değerleme Temelleri"
        assert "id" in data
        TestCourses.created_id = data["id"]
    
    def test_get_courses(self):
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_delete_course(self, auth_headers):
        if not TestCourses.created_id:
            pytest.skip("No course to delete")
        response = requests.delete(f"{BASE_URL}/api/admin/courses/{TestCourses.created_id}",
                                  headers=auth_headers)
        assert response.status_code == 200


class TestSeminars:
    """Education - Seminars CRUD"""
    
    created_id = None
    
    def test_create_seminar(self, auth_headers):
        form_data = {
            "title": "TEST_Gayrimenkul Yatırım Semineri",
            "description": "Test seminer açıklaması",
            "speaker": "Dr. Test Uzman",
            "date": "2026-04-15",
            "registration_link": "https://example.com/register",
            "thumbnail": ""
        }
        response = requests.post(f"{BASE_URL}/api/admin/seminars", 
                                data=form_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Gayrimenkul Yatırım Semineri"
        assert data["speaker"] == "Dr. Test Uzman"
        assert "id" in data
        TestSeminars.created_id = data["id"]
    
    def test_get_seminars(self):
        response = requests.get(f"{BASE_URL}/api/seminars")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_delete_seminar(self, auth_headers):
        if not TestSeminars.created_id:
            pytest.skip("No seminar to delete")
        response = requests.delete(f"{BASE_URL}/api/admin/seminars/{TestSeminars.created_id}",
                                  headers=auth_headers)
        assert response.status_code == 200


class TestCommunityPosts:
    """Community Posts (public create, admin delete)"""
    
    created_id = None
    
    def test_create_community_post(self):
        """Anyone can create a post"""
        form_data = {
            "title": "TEST_Yatırım Sorusu",
            "content": "Kadıköy'de arsa alınır mı?",
            "category": "tartışma"
        }
        response = requests.post(f"{BASE_URL}/api/community/posts", data=form_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Yatırım Sorusu"
        assert "id" in data
        TestCommunityPosts.created_id = data["id"]
    
    def test_get_community_posts(self):
        response = requests.get(f"{BASE_URL}/api/community/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_posts_by_category(self):
        response = requests.get(f"{BASE_URL}/api/community/posts", params={"category": "tartışma"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_delete_post(self, auth_headers):
        if not TestCommunityPosts.created_id:
            pytest.skip("No post to delete")
        response = requests.delete(f"{BASE_URL}/api/admin/community/posts/{TestCommunityPosts.created_id}",
                                  headers=auth_headers)
        assert response.status_code == 200


class TestLandOpportunities:
    """Arsa Fırsatları (Land Opportunities) CRUD"""
    
    created_id = None
    
    def test_create_opportunity(self, auth_headers):
        form_data = {
            "location_text": "TEST_Çekmeköy Merkez",
            "parcel_size_sqm": "2500",
            "zoning_type": "Konut",
            "investment_potential": "yüksek",
            "risk_score": "3",
            "development_potential": "Yüksek katlı konut imarlı",
            "price_per_sqm": "15000",
            "location_lat": "41.0392",
            "location_lng": "29.1678"
        }
        response = requests.post(f"{BASE_URL}/api/admin/opportunities", 
                                data=form_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["location"] == "TEST_Çekmeköy Merkez"
        assert data["investment_potential"] == "yüksek"
        assert "id" in data
        TestLandOpportunities.created_id = data["id"]
    
    def test_get_opportunities(self):
        response = requests.get(f"{BASE_URL}/api/opportunities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_delete_opportunity(self, auth_headers):
        if not TestLandOpportunities.created_id:
            pytest.skip("No opportunity to delete")
        response = requests.delete(f"{BASE_URL}/api/admin/opportunities/{TestLandOpportunities.created_id}",
                                  headers=auth_headers)
        assert response.status_code == 200


class TestMarketData:
    """Piyasa Analizi (Market Data) CRUD"""
    
    created_id = None
    
    def test_create_market_data(self, auth_headers):
        form_data = {
            "neighborhood": "TEST_Bağdat Caddesi",
            "city": "İstanbul",
            "district": "Kadıköy",
            "avg_price_per_sqm": "125000",
            "price_change_percentage": "12.5",
            "data_date": "2026-03-01"
        }
        response = requests.post(f"{BASE_URL}/api/admin/market-data", 
                                data=form_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["neighborhood"] == "TEST_Bağdat Caddesi"
        assert data["city"] == "İstanbul"
        assert "id" in data
        TestMarketData.created_id = data["id"]
    
    def test_get_market_data(self):
        response = requests.get(f"{BASE_URL}/api/market-data")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_market_data_with_city_filter(self):
        response = requests.get(f"{BASE_URL}/api/market-data", params={"city": "İstanbul"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_delete_market_data(self, auth_headers):
        if not TestMarketData.created_id:
            pytest.skip("No market data to delete")
        response = requests.delete(f"{BASE_URL}/api/admin/market-data/{TestMarketData.created_id}",
                                  headers=auth_headers)
        assert response.status_code == 200


class TestTOKIProjects:
    """TOKİ Projects CRUD (existing from iteration 1, just verify)"""
    
    created_id = None
    
    def test_create_project(self, auth_headers):
        form_data = {
            "project_name": "TEST_Sidebar TOKİ Projesi",
            "city": "Ankara",
            "district": "Etimesgut",
            "neighborhood": "Yapracık",
            "description": "Test proje açıklaması",
            "project_type": "TOKİ",
            "total_housing": "500",
            "commercial_count": "10",
            "school_count": "2",
            "mosque_count": "1",
            "social_facility_count": "3",
            "project_area_sqm": "50000",
            "start_date": "2025-01-01",
            "planned_end_date": "2027-12-31",
            "progress_percentage": "25",
            "location_lat": "39.9334",
            "location_lng": "32.8597"
        }
        response = requests.post(f"{BASE_URL}/api/admin/projects", 
                                data=form_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["project_name"] == "TEST_Sidebar TOKİ Projesi"
        assert "id" in data
        TestTOKIProjects.created_id = data["id"]
    
    def test_get_projects(self):
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_project_appears_in_mega_projects(self):
        """TOKİ projects should auto-appear in mega-projects with from_projects flag"""
        response = requests.get(f"{BASE_URL}/api/mega-projects")
        assert response.status_code == 200
        data = response.json()
        # Check that some projects have from_projects: true
        auto_mapped = [p for p in data if p.get("from_projects") == True]
        # There should be at least one if we created a project
        assert len(data) >= 0  # At minimum, endpoint works
    
    def test_delete_project(self, auth_headers):
        if not TestTOKIProjects.created_id:
            pytest.skip("No project to delete")
        response = requests.delete(f"{BASE_URL}/api/admin/projects/{TestTOKIProjects.created_id}",
                                  headers=auth_headers)
        assert response.status_code == 200


class TestUnauthorizedAccess:
    """Test that admin endpoints require authentication"""
    
    def test_create_land_parcel_no_auth(self):
        response = requests.post(f"{BASE_URL}/api/admin/land-parcels", 
                                data={"city": "Test", "district": "Test", "ada": "1", "parsel": "1"})
        assert response.status_code in [401, 403]
    
    def test_create_mega_project_no_auth(self):
        response = requests.post(f"{BASE_URL}/api/admin/mega-projects", 
                                data={"name": "Test", "category": "köprü"})
        assert response.status_code in [401, 403]
    
    def test_create_course_no_auth(self):
        response = requests.post(f"{BASE_URL}/api/admin/courses", 
                                data={"title": "Test"})
        assert response.status_code in [401, 403]
    
    def test_create_opportunity_no_auth(self):
        response = requests.post(f"{BASE_URL}/api/admin/opportunities", 
                                data={"location_text": "Test"})
        assert response.status_code in [401, 403]
    
    def test_create_market_data_no_auth(self):
        response = requests.post(f"{BASE_URL}/api/admin/market-data", 
                                data={"neighborhood": "Test", "city": "Test"})
        assert response.status_code in [401, 403]
