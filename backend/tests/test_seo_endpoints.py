import os
"""
SEO Endpoints Test Suite
Tests for SEO Manager functionality:
- GET /api/seo (public endpoint)
- GET /api/admin/seo (admin endpoint with auth)
- PUT /api/admin/seo/{page_id} (update specific page)
- POST /api/admin/seo/generate/{page_id} (AI generation)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = os.environ.get("ADMIN_TEST_EMAIL", "ipatarazi@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_TEST_PASSWORD", "As537273")

# SEO page IDs to test
SEO_PAGE_IDS = ['home', 'e-konut', 'mega-projects', 'ipat', 'egitim', 'topluluk', 'yatirim-fonu']


@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token for authenticated requests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert "access_token" in data, "No access_token in login response"
    return data["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    """Return headers with admin JWT token"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestPublicSEOEndpoint:
    """Tests for public GET /api/seo endpoint"""
    
    def test_public_seo_returns_200(self):
        """Public SEO endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/seo")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_public_seo_returns_dict_keyed_by_page_id(self):
        """Public SEO should return {page_id: settings} format"""
        response = requests.get(f"{BASE_URL}/api/seo")
        assert response.status_code == 200
        data = response.json()
        
        # Should be a dict, not a list
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"
        
        # Check that keys are page IDs
        for page_id in data.keys():
            assert page_id in SEO_PAGE_IDS, f"Unexpected page_id: {page_id}"
    
    def test_public_seo_has_different_data_per_page(self):
        """Each page should have unique SEO data"""
        response = requests.get(f"{BASE_URL}/api/seo")
        assert response.status_code == 200
        data = response.json()
        
        # Collect titles to check uniqueness
        titles = []
        descriptions = []
        
        for page_id, settings in data.items():
            if settings.get('title'):
                titles.append(settings['title'])
            if settings.get('description'):
                descriptions.append(settings['description'])
        
        # Titles should be unique (if populated)
        if len(titles) > 1:
            unique_titles = set(titles)
            assert len(unique_titles) == len(titles), f"Duplicate titles found: {titles}"
        
        # Descriptions should be unique (if populated)
        if len(descriptions) > 1:
            unique_descriptions = set(descriptions)
            assert len(unique_descriptions) == len(descriptions), "Duplicate descriptions found"
    
    def test_public_seo_home_page_has_data(self):
        """Home page should have SEO data"""
        response = requests.get(f"{BASE_URL}/api/seo")
        assert response.status_code == 200
        data = response.json()
        
        assert 'home' in data, "Home page SEO not found"
        home_seo = data['home']
        
        # Check required fields exist
        assert 'title' in home_seo, "Home SEO missing title"
        assert 'description' in home_seo, "Home SEO missing description"
        assert home_seo['title'], "Home SEO title is empty"
        assert home_seo['description'], "Home SEO description is empty"
    
    def test_public_seo_e_konut_page_has_data(self):
        """e-Konut page should have SEO data"""
        response = requests.get(f"{BASE_URL}/api/seo")
        assert response.status_code == 200
        data = response.json()
        
        assert 'e-konut' in data, "e-Konut page SEO not found"
        ekonut_seo = data['e-konut']
        
        assert ekonut_seo.get('title'), "e-Konut SEO title is empty"
        assert ekonut_seo.get('description'), "e-Konut SEO description is empty"
    
    def test_public_seo_mega_projects_page_has_data(self):
        """Mega Projects page should have SEO data"""
        response = requests.get(f"{BASE_URL}/api/seo")
        assert response.status_code == 200
        data = response.json()
        
        assert 'mega-projects' in data, "Mega Projects page SEO not found"
        mega_seo = data['mega-projects']
        
        assert mega_seo.get('title'), "Mega Projects SEO title is empty"
        assert mega_seo.get('description'), "Mega Projects SEO description is empty"
    
    def test_public_seo_yatirim_fonu_page_has_data(self):
        """Yatirim Fonu page should have SEO data"""
        response = requests.get(f"{BASE_URL}/api/seo")
        assert response.status_code == 200
        data = response.json()
        
        assert 'yatirim-fonu' in data, "Yatirim Fonu page SEO not found"
        yf_seo = data['yatirim-fonu']
        
        assert yf_seo.get('title'), "Yatirim Fonu SEO title is empty"


class TestAdminSEOEndpoint:
    """Tests for admin GET /api/admin/seo endpoint"""
    
    def test_admin_seo_requires_auth(self):
        """Admin SEO endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/seo")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_admin_seo_returns_list_with_auth(self, auth_headers):
        """Admin SEO endpoint should return list of all pages"""
        response = requests.get(f"{BASE_URL}/api/admin/seo", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
    
    def test_admin_seo_returns_all_7_pages(self, auth_headers):
        """Admin SEO should return all 7 SEO pages"""
        response = requests.get(f"{BASE_URL}/api/admin/seo", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        page_ids = [item['page_id'] for item in data]
        
        for expected_id in SEO_PAGE_IDS:
            assert expected_id in page_ids, f"Missing page_id: {expected_id}"
    
    def test_admin_seo_each_page_has_required_fields(self, auth_headers):
        """Each SEO page should have required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/seo", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ['page_id', 'title', 'description', 'keywords', 'robots']
        
        for page in data:
            for field in required_fields:
                assert field in page, f"Page {page.get('page_id')} missing field: {field}"


class TestUpdateSEOEndpoint:
    """Tests for PUT /api/admin/seo/{page_id} endpoint"""
    
    def test_update_seo_requires_auth(self):
        """Update SEO endpoint should require authentication"""
        response = requests.put(
            f"{BASE_URL}/api/admin/seo/home",
            json={"title": "Test Title"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_update_seo_home_page(self, auth_headers):
        """Should be able to update home page SEO"""
        # First get current data
        get_response = requests.get(f"{BASE_URL}/api/seo")
        original_data = get_response.json().get('home', {})
        original_title = original_data.get('title', '')
        
        # Update with test data
        test_title = f"TEST_Updated Home Title | mrxakademi"
        update_payload = {
            "title": test_title,
            "description": original_data.get('description', 'Test description'),
            "keywords": original_data.get('keywords', 'test, keywords'),
            "og_title": original_data.get('og_title', 'Test OG Title'),
            "og_description": original_data.get('og_description', 'Test OG Desc'),
            "robots": "index,follow"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/seo/home",
            json=update_payload,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/seo")
        assert verify_response.status_code == 200
        updated_data = verify_response.json().get('home', {})
        assert updated_data.get('title') == test_title, "Title update not persisted"
        
        # Restore original title
        if original_title:
            restore_payload = {**update_payload, "title": original_title}
            requests.put(
                f"{BASE_URL}/api/admin/seo/home",
                json=restore_payload,
                headers=auth_headers
            )
    
    def test_update_seo_specific_page_only(self, auth_headers):
        """Updating one page should not affect other pages"""
        # Get all SEO data before update
        before_response = requests.get(f"{BASE_URL}/api/seo")
        before_data = before_response.json()
        
        # Update e-konut page
        ekonut_original = before_data.get('e-konut', {})
        test_title = "TEST_e-Konut Specific Update | mrxakademi"
        
        update_payload = {
            "title": test_title,
            "description": ekonut_original.get('description', 'Test'),
            "keywords": ekonut_original.get('keywords', 'test'),
            "robots": "index,follow"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/seo/e-konut",
            json=update_payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Verify other pages unchanged
        after_response = requests.get(f"{BASE_URL}/api/seo")
        after_data = after_response.json()
        
        # Home page should be unchanged
        assert after_data.get('home', {}).get('title') == before_data.get('home', {}).get('title'), \
            "Home page was affected by e-konut update"
        
        # mega-projects should be unchanged
        assert after_data.get('mega-projects', {}).get('title') == before_data.get('mega-projects', {}).get('title'), \
            "Mega-projects page was affected by e-konut update"
        
        # Restore original e-konut title
        if ekonut_original.get('title'):
            restore_payload = {**update_payload, "title": ekonut_original['title']}
            requests.put(
                f"{BASE_URL}/api/admin/seo/e-konut",
                json=restore_payload,
                headers=auth_headers
            )


class TestAIGenerateSEOEndpoint:
    """Tests for POST /api/admin/seo/generate/{page_id} endpoint"""
    
    def test_generate_seo_requires_auth(self):
        """AI generate SEO endpoint should require authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/seo/generate/home")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_generate_seo_returns_valid_json(self, auth_headers):
        """AI generate should return valid SEO JSON structure"""
        # Use a less frequently tested page to avoid rate limits
        response = requests.post(
            f"{BASE_URL}/api/admin/seo/generate/topluluk",
            headers=auth_headers,
            timeout=60  # AI generation can take time
        )
        
        # May fail if LLM key is invalid or rate limited
        if response.status_code == 500:
            error_detail = response.json().get('detail', '')
            if 'LLM key' in error_detail or 'AI' in error_detail:
                pytest.skip("LLM key issue - skipping AI generation test")
        
        assert response.status_code == 200, f"AI generation failed: {response.text}"
        
        data = response.json()
        # Should have SEO fields
        assert 'title' in data, "Generated SEO missing title"
        assert 'description' in data, "Generated SEO missing description"
        assert 'keywords' in data, "Generated SEO missing keywords"


class TestSEODataIntegrity:
    """Tests for SEO data integrity across endpoints"""
    
    def test_public_and_admin_data_consistency(self, auth_headers):
        """Public and admin endpoints should return consistent data"""
        # Get public data
        public_response = requests.get(f"{BASE_URL}/api/seo")
        assert public_response.status_code == 200
        public_data = public_response.json()
        
        # Get admin data
        admin_response = requests.get(f"{BASE_URL}/api/admin/seo", headers=auth_headers)
        assert admin_response.status_code == 200
        admin_data = admin_response.json()
        
        # Convert admin list to dict for comparison
        admin_dict = {item['page_id']: item for item in admin_data}
        
        # Check that public data matches admin data
        for page_id, public_settings in public_data.items():
            assert page_id in admin_dict, f"Page {page_id} in public but not admin"
            admin_settings = admin_dict[page_id]
            
            # Titles should match
            assert public_settings.get('title') == admin_settings.get('title'), \
                f"Title mismatch for {page_id}"
            
            # Descriptions should match
            assert public_settings.get('description') == admin_settings.get('description'), \
                f"Description mismatch for {page_id}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
