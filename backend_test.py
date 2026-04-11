#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for mrxakademi Platform
Tests all major backend endpoints after code quality fixes
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8001/api"

# Test credentials from /app/memory/test_credentials.md
TEST_USER_EMAIL = "testuser@test.com"
TEST_USER_PASSWORD = "Test1234!"
ADMIN_EMAIL = "ipatarazi@gmail.com"
ADMIN_PASSWORD = "As537273"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'mrxakademi-backend-tester/1.0'
        })
        self.test_results = []
        self.user_token = None
        self.admin_token = None
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_packages_endpoint(self):
        """Test GET /api/packages - should return 4 packages"""
        try:
            response = self.session.get(f"{BACKEND_URL}/packages")
            
            if response.status_code == 200:
                packages = response.json()
                if isinstance(packages, list) and len(packages) == 4:
                    self.log_test("GET /api/packages", True, f"Returned {len(packages)} packages as expected", packages)
                else:
                    self.log_test("GET /api/packages", False, f"Expected 4 packages, got {len(packages) if isinstance(packages, list) else 'non-list'}", packages)
            else:
                self.log_test("GET /api/packages", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/packages", False, f"Exception: {str(e)}")
    
    def test_user_login(self):
        """Test POST /api/auth/user-login with test user credentials"""
        try:
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/user-login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "session_token" in data:
                    self.user_token = data["session_token"]
                    self.log_test("POST /api/auth/user-login (user)", True, f"Login successful, session token received", {"user": data.get("user", {})})
                elif "access_token" in data:
                    self.user_token = data["access_token"]
                    self.log_test("POST /api/auth/user-login (user)", True, f"Login successful, access token received", {"user": data.get("user", {})})
                else:
                    self.log_test("POST /api/auth/user-login (user)", False, "No session_token or access_token in response", data)
            else:
                self.log_test("POST /api/auth/user-login (user)", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST /api/auth/user-login (user)", False, f"Exception: {str(e)}")
    
    def test_admin_login(self):
        """Test POST /api/auth/login with admin credentials"""
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.admin_token = data["access_token"]
                    self.log_test("POST /api/auth/login (admin)", True, f"Admin login successful, token received", {"user": data.get("user", {})})
                else:
                    self.log_test("POST /api/auth/login (admin)", False, "No access_token in response", data)
            else:
                self.log_test("POST /api/auth/login (admin)", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST /api/auth/login (admin)", False, f"Exception: {str(e)}")
    
    def test_user_profile_get(self):
        """Test GET /api/user/profile with authentication"""
        if not self.user_token:
            self.log_test("GET /api/user/profile", False, "No user token available - login failed")
            return
            
        try:
            # For session tokens, use Authorization header with Bearer
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = self.session.get(f"{BACKEND_URL}/user/profile", headers=headers)
            
            if response.status_code == 200:
                profile = response.json()
                self.log_test("GET /api/user/profile", True, f"Profile retrieved successfully", {"email": profile.get("email", "N/A")})
            else:
                self.log_test("GET /api/user/profile", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/user/profile", False, f"Exception: {str(e)}")
    
    def test_user_profile_update(self):
        """Test PUT /api/user/profile with authentication"""
        if not self.user_token:
            self.log_test("PUT /api/user/profile", False, "No user token available - login failed")
            return
            
        try:
            # For session tokens, use Authorization header with Bearer
            headers = {"Authorization": f"Bearer {self.user_token}"}
            update_data = {
                "full_name": "Test User Updated",
                "phone": "+905551234567"
            }
            
            response = self.session.put(f"{BACKEND_URL}/user/profile", json=update_data, headers=headers)
            
            if response.status_code == 200:
                updated_profile = response.json()
                self.log_test("PUT /api/user/profile", True, f"Profile updated successfully", {"full_name": updated_profile.get("full_name", "N/A")})
            else:
                self.log_test("PUT /api/user/profile", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("PUT /api/user/profile", False, f"Exception: {str(e)}")
    
    def test_admin_academy_stats(self):
        """Test GET /api/admin/academy-stats (admin endpoint)"""
        if not self.admin_token:
            self.log_test("GET /api/admin/academy-stats", False, "No admin token available - admin login failed")
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{BACKEND_URL}/admin/academy-stats", headers=headers)
            
            if response.status_code == 200:
                stats = response.json()
                self.log_test("GET /api/admin/academy-stats", True, f"Academy stats retrieved successfully", stats)
            else:
                self.log_test("GET /api/admin/academy-stats", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/admin/academy-stats", False, f"Exception: {str(e)}")
    
    def test_projects_endpoint(self):
        """Test GET /api/projects - should return project data"""
        try:
            response = self.session.get(f"{BACKEND_URL}/projects")
            
            if response.status_code == 200:
                projects = response.json()
                if isinstance(projects, list):
                    self.log_test("GET /api/projects", True, f"Returned {len(projects)} projects", {"count": len(projects)})
                else:
                    self.log_test("GET /api/projects", False, f"Expected list, got {type(projects)}", projects)
            else:
                self.log_test("GET /api/projects", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/projects", False, f"Exception: {str(e)}")
    
    def test_auth_me_endpoint(self):
        """Test GET /api/auth/me with user token"""
        if not self.user_token:
            self.log_test("GET /api/auth/me", False, "No user token available - login failed")
            return
            
        try:
            # For session tokens, use Authorization header with Bearer
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                self.log_test("GET /api/auth/me", True, f"User data retrieved successfully", {"email": user_data.get("email", "N/A")})
            else:
                self.log_test("GET /api/auth/me", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/auth/me", False, f"Exception: {str(e)}")
    
    def test_admin_app_users(self):
        """Test GET /api/admin/app-users (admin endpoint)"""
        if not self.admin_token:
            self.log_test("GET /api/admin/app-users", False, "No admin token available - admin login failed")
            return
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{BACKEND_URL}/admin/app-users", headers=headers)
            
            if response.status_code == 200:
                users_data = response.json()
                self.log_test("GET /api/admin/app-users", True, f"App users retrieved successfully", {"total": users_data.get("total", 0)})
            else:
                self.log_test("GET /api/admin/app-users", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/admin/app-users", False, f"Exception: {str(e)}")
    
    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        try:
            # Test with Origin header to trigger CORS
            headers = {"Origin": "https://example.com"}
            response = self.session.get(f"{BACKEND_URL}/packages", headers=headers)
            
            if response.status_code == 200:
                cors_origin = response.headers.get('access-control-allow-origin')
                cors_credentials = response.headers.get('access-control-allow-credentials')
                
                if cors_origin:
                    self.log_test("CORS Headers Check", True, f"CORS headers present", {
                        "access-control-allow-origin": cors_origin,
                        "access-control-allow-credentials": cors_credentials
                    })
                else:
                    self.log_test("CORS Headers Check", False, "No CORS headers found")
            else:
                self.log_test("CORS Headers Check", False, f"GET request failed: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("CORS Headers Check", False, f"Exception: {str(e)}")
    
    def test_error_handling(self):
        """Test proper error handling for invalid requests"""
        try:
            # Test invalid endpoint
            response = self.session.get(f"{BACKEND_URL}/nonexistent-endpoint")
            
            if response.status_code == 404:
                self.log_test("Error Handling (404)", True, f"Proper 404 response for invalid endpoint")
            else:
                self.log_test("Error Handling (404)", False, f"Expected 404, got {response.status_code}")
                
            # Test invalid login
            invalid_login = {"email": "invalid@test.com", "password": "wrongpassword"}
            response = self.session.post(f"{BACKEND_URL}/auth/user-login", json=invalid_login)
            
            if response.status_code == 401:
                self.log_test("Error Handling (401)", True, f"Proper 401 response for invalid credentials")
            else:
                self.log_test("Error Handling (401)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling", False, f"Exception: {str(e)}")
    
    def test_database_operations(self):
        """Test database operations are working (SEED_DATA import verification)"""
        try:
            # Check if projects from seed data are present
            response = self.session.get(f"{BACKEND_URL}/projects")
            
            if response.status_code == 200:
                projects = response.json()
                # Look for specific project from seed data
                test_project = next((p for p in projects if p.get("id") == "f70c57f6-28a6-4dbd-a4d3-5ea8e4bce6a6"), None)
                
                if test_project:
                    self.log_test("Database Operations", True, f"Seed data projects found in database", {"project_name": test_project.get("project_name")})
                else:
                    self.log_test("Database Operations", False, f"Test project from seed data not found")
            else:
                self.log_test("Database Operations", False, f"Failed to retrieve projects: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Database Operations", False, f"Exception: {str(e)}")
    
    def test_seed_data_import(self):
        """Test if SEED_DATA import is working by checking if test user exists"""
        try:
            # Try to login with test user - if SEED_DATA import worked, this should succeed
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/user-login", json=login_data)
            
            if response.status_code == 200:
                self.log_test("SEED_DATA Import Check", True, "Test user from seed data exists and can login")
            else:
                self.log_test("SEED_DATA Import Check", False, f"Test user login failed - SEED_DATA may not be imported properly: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("SEED_DATA Import Check", False, f"Exception during seed data check: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting mrxakademi Backend API Testing")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test basic endpoints first
        self.test_packages_endpoint()
        self.test_projects_endpoint()
        
        # Test SEED_DATA import
        self.test_seed_data_import()
        
        # Test authentication
        self.test_user_login()
        self.test_admin_login()
        
        # Test authenticated endpoints
        self.test_auth_me_endpoint()
        self.test_user_profile_get()
        self.test_user_profile_update()
        
        # Test admin endpoints
        self.test_admin_academy_stats()
        self.test_admin_app_users()
        
        # Test additional functionality
        self.test_cors_headers()
        self.test_error_handling()
        self.test_database_operations()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        return passed, failed

if __name__ == "__main__":
    tester = BackendTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(0 if failed == 0 else 1)