#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Arabic Employee Management System
Tests all CRUD operations, authentication, and Arabic text handling
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from frontend environment
BASE_URL = "https://sharkdelta.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_resources = {
            'users': [],
            'employees': [],
            'sectors': []
        }
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response': response_data
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url)
            else:
                return False, f"Unsupported method: {method}", 400
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
        except requests.exceptions.RequestException as e:
            return False, str(e), 0
        except json.JSONDecodeError:
            return False, "Invalid JSON response", response.status_code if 'response' in locals() else 0

    def test_health_check(self):
        """Test basic health endpoints"""
        print("=== HEALTH CHECK TESTS ===")
        
        # Test root endpoint
        success, data, status = self.make_request('GET', '/')
        self.log_test("Root endpoint", success, f"Status: {status}", data)
        
        # Test health endpoint
        success, data, status = self.make_request('GET', '/health')
        self.log_test("Health check endpoint", success, f"Status: {status}", data)

    def test_authentication(self):
        """Test authentication endpoints"""
        print("=== AUTHENTICATION TESTS ===")
        
        # Test login with default admin credentials
        login_data = {"username": "zahab", "password": "9999"}
        success, data, status = self.make_request('POST', '/auth/login', login_data)
        
        if success and data.get('role') == 'admin':
            self.log_test("Admin login", True, f"Logged in as {data.get('username')} with role {data.get('role')}")
        else:
            self.log_test("Admin login", False, f"Status: {status}", data)
        
        # Test login with invalid credentials
        invalid_login = {"username": "invalid", "password": "wrong"}
        success, data, status = self.make_request('POST', '/auth/login', invalid_login)
        
        if not success and status == 401:
            self.log_test("Invalid login rejection", True, "Correctly rejected invalid credentials")
        else:
            self.log_test("Invalid login rejection", False, f"Should return 401, got {status}", data)
        
        # Test user registration
        new_user_data = {
            "username": "مدير_اختبار",
            "password": "test123",
            "role": "manager"
        }
        success, data, status = self.make_request('POST', '/auth/register', new_user_data)
        
        if success and data.get('username') == new_user_data['username']:
            self.created_resources['users'].append(data.get('id'))
            self.log_test("User registration", True, f"Created user: {data.get('username')}")
        else:
            self.log_test("User registration", False, f"Status: {status}", data)
        
        # Test duplicate username registration
        success, data, status = self.make_request('POST', '/auth/register', new_user_data)
        
        if not success and status == 400:
            self.log_test("Duplicate username rejection", True, "Correctly rejected duplicate username")
        else:
            self.log_test("Duplicate username rejection", False, f"Should return 400, got {status}", data)

    def test_user_management(self):
        """Test user management endpoints"""
        print("=== USER MANAGEMENT TESTS ===")
        
        # Test get all users
        success, data, status = self.make_request('GET', '/users')
        
        if success and isinstance(data, list):
            self.log_test("Get all users", True, f"Retrieved {len(data)} users")
        else:
            self.log_test("Get all users", False, f"Status: {status}", data)
        
        # Test delete user (if we created one)
        if self.created_resources['users']:
            user_id = self.created_resources['users'][0]
            success, data, status = self.make_request('DELETE', f'/users/{user_id}')
            
            if success:
                self.log_test("Delete user", True, "User deleted successfully")
                self.created_resources['users'].remove(user_id)
            else:
                self.log_test("Delete user", False, f"Status: {status}", data)

    def test_sectors_management(self):
        """Test sectors CRUD operations"""
        print("=== SECTORS MANAGEMENT TESTS ===")
        
        # Test get all sectors
        success, data, status = self.make_request('GET', '/sectors')
        
        if success and isinstance(data, list):
            self.log_test("Get all sectors", True, f"Retrieved {len(data)} sectors")
            # Check for default sectors
            sector_names = [s.get('name') for s in data]
            expected_sectors = ["القطاع الأول", "القطاع الثاني", "القطاع الثالث"]
            has_defaults = any(sector in sector_names for sector in expected_sectors)
            if has_defaults:
                self.log_test("Default sectors exist", True, "Found default Arabic sectors")
        else:
            self.log_test("Get all sectors", False, f"Status: {status}", data)
        
        # Test create new sector
        new_sector = {"name": "قطاع الاختبار"}
        success, data, status = self.make_request('POST', '/sectors', new_sector)
        
        if success and data.get('name') == new_sector['name']:
            sector_id = data.get('id')
            self.created_resources['sectors'].append(sector_id)
            self.log_test("Create sector", True, f"Created sector: {data.get('name')}")
            
            # Test update sector
            updated_sector = {"name": "قطاع الاختبار المحدث"}
            success, data, status = self.make_request('PUT', f'/sectors/{sector_id}', updated_sector)
            
            if success:
                self.log_test("Update sector", True, "Sector updated successfully")
            else:
                self.log_test("Update sector", False, f"Status: {status}", data)
            
            # Test delete sector
            success, data, status = self.make_request('DELETE', f'/sectors/{sector_id}')
            
            if success:
                self.log_test("Delete sector", True, "Sector deleted successfully")
                self.created_resources['sectors'].remove(sector_id)
            else:
                self.log_test("Delete sector", False, f"Status: {status}", data)
        else:
            self.log_test("Create sector", False, f"Status: {status}", data)

    def test_employees_crud(self):
        """Test employee CRUD operations"""
        print("=== EMPLOYEE CRUD TESTS ===")
        
        # Test get all employees (initially empty)
        success, data, status = self.make_request('GET', '/employees')
        
        if success and isinstance(data, list):
            self.log_test("Get all employees", True, f"Retrieved {len(data)} employees")
        else:
            self.log_test("Get all employees", False, f"Status: {status}", data)
        
        # Test create employee with Arabic data
        new_employee = {
            "name": "أحمد محمد علي",
            "rank": "مهندس أول",
            "seniority": "خبرة 10 سنوات",
            "phone": "01234567890",
            "assigned_work": "تطوير الأنظمة",
            "sector": "القطاع الأول"
        }
        success, data, status = self.make_request('POST', '/employees', new_employee)
        
        if success and data.get('name') == new_employee['name']:
            employee_id = data.get('id')
            self.created_resources['employees'].append(employee_id)
            self.log_test("Create employee", True, f"Created employee: {data.get('name')}")
            
            # Test get single employee
            success, data, status = self.make_request('GET', f'/employees/{employee_id}')
            
            if success and data.get('name') == new_employee['name']:
                self.log_test("Get single employee", True, f"Retrieved employee: {data.get('name')}")
            else:
                self.log_test("Get single employee", False, f"Status: {status}", data)
            
            # Test update employee
            updated_employee = {
                "name": "أحمد محمد علي المحدث",
                "rank": "مهندس رئيسي"
            }
            success, data, status = self.make_request('PUT', f'/employees/{employee_id}', updated_employee)
            
            if success and data.get('name') == updated_employee['name']:
                self.log_test("Update employee", True, f"Updated employee: {data.get('name')}")
            else:
                self.log_test("Update employee", False, f"Status: {status}", data)
            
        else:
            self.log_test("Create employee", False, f"Status: {status}", data)
        
        # Create another employee for search testing
        second_employee = {
            "name": "فاطمة أحمد حسن",
            "rank": "محاسبة",
            "seniority": "خبرة 5 سنوات",
            "phone": "01987654321",
            "assigned_work": "المحاسبة والمالية",
            "sector": "القطاع الثاني"
        }
        success, data, status = self.make_request('POST', '/employees', second_employee)
        
        if success:
            self.created_resources['employees'].append(data.get('id'))
            self.log_test("Create second employee", True, f"Created employee: {data.get('name')}")
        else:
            self.log_test("Create second employee", False, f"Status: {status}", data)

    def test_employee_search_filter(self):
        """Test employee search and filtering"""
        print("=== EMPLOYEE SEARCH & FILTER TESTS ===")
        
        # Test search by name
        success, data, status = self.make_request('GET', '/employees', params={'search': 'أحمد'})
        
        if success and isinstance(data, list):
            found_ahmed = any('أحمد' in emp.get('name', '') for emp in data)
            self.log_test("Search by name (أحمد)", found_ahmed, f"Found {len(data)} employees")
        else:
            self.log_test("Search by name (أحمد)", False, f"Status: {status}", data)
        
        # Test filter by sector
        success, data, status = self.make_request('GET', '/employees', params={'sector': 'القطاع الأول'})
        
        if success and isinstance(data, list):
            correct_sector = all(emp.get('sector') == 'القطاع الأول' for emp in data)
            self.log_test("Filter by sector", correct_sector, f"Found {len(data)} employees in القطاع الأول")
        else:
            self.log_test("Filter by sector", False, f"Status: {status}", data)
        
        # Test filter by seniority
        success, data, status = self.make_request('GET', '/employees', params={'seniority': 'خبرة 10 سنوات'})
        
        if success and isinstance(data, list):
            self.log_test("Filter by seniority", True, f"Found {len(data)} employees with 10 years experience")
        else:
            self.log_test("Filter by seniority", False, f"Status: {status}", data)

    def test_settings_management(self):
        """Test settings management"""
        print("=== SETTINGS MANAGEMENT TESTS ===")
        
        # Test get settings
        success, data, status = self.make_request('GET', '/settings')
        
        if success and data.get('header_text'):
            expected_header = "منطقة شرق الدلتا"
            expected_footer = "تصميم مقدم د. / رامي ابو الذهب"
            
            header_correct = data.get('header_text') == expected_header
            footer_correct = data.get('footer_text') == expected_footer
            
            self.log_test("Get settings", True, f"Header: {data.get('header_text')}, Footer: {data.get('footer_text')}")
            self.log_test("Default Arabic settings", header_correct and footer_correct, 
                         "Verified default Arabic header and footer text")
        else:
            self.log_test("Get settings", False, f"Status: {status}", data)
        
        # Test update settings
        updated_settings = {
            "header_text": "منطقة شرق الدلتا - محدث",
            "footer_text": "تصميم محدث"
        }
        success, data, status = self.make_request('PUT', '/settings', updated_settings)
        
        if success and data.get('header_text') == updated_settings['header_text']:
            self.log_test("Update settings", True, f"Updated header: {data.get('header_text')}")
            
            # Restore original settings
            original_settings = {
                "header_text": "منطقة شرق الدلتا",
                "footer_text": "تصميم مقدم د. / رامي ابو الذهب"
            }
            self.make_request('PUT', '/settings', original_settings)
        else:
            self.log_test("Update settings", False, f"Status: {status}", data)

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("=== CLEANUP TEST DATA ===")
        
        # Delete created employees
        for employee_id in self.created_resources['employees']:
            success, data, status = self.make_request('DELETE', f'/employees/{employee_id}')
            if success:
                print(f"✅ Deleted employee: {employee_id}")
            else:
                print(f"❌ Failed to delete employee: {employee_id}")
        
        # Delete created sectors
        for sector_id in self.created_resources['sectors']:
            success, data, status = self.make_request('DELETE', f'/sectors/{sector_id}')
            if success:
                print(f"✅ Deleted sector: {sector_id}")
            else:
                print(f"❌ Failed to delete sector: {sector_id}")
        
        # Delete created users
        for user_id in self.created_resources['users']:
            success, data, status = self.make_request('DELETE', f'/users/{user_id}')
            if success:
                print(f"✅ Deleted user: {user_id}")
            else:
                print(f"❌ Failed to delete user: {user_id}")

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests for Arabic Employee Management System")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 80)
        
        try:
            self.test_health_check()
            self.test_authentication()
            self.test_user_management()
            self.test_sectors_management()
            self.test_employees_crud()
            self.test_employee_search_filter()
            self.test_settings_management()
        finally:
            self.cleanup_test_data()
        
        # Summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)