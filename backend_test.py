import requests
import sys
import json
from datetime import datetime

class AssessmentAPITester:
    def __init__(self, base_url="https://assess-segment.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.admin_token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Unexpected error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_get_questions(self):
        """Test questions endpoint"""
        success, response = self.run_test("Get Questions", "GET", "questions", 200)
        if success and isinstance(response, list) and len(response) == 10:
            print(f"   ✓ Found {len(response)} questions")
            return True, response
        elif success:
            self.log_test("Questions Validation", False, f"Expected 10 questions, got {len(response) if isinstance(response, list) else 'invalid format'}")
        return success, response

    def test_admin_registration(self):
        """Test admin registration"""
        admin_data = {
            "email": f"test_admin_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestAdmin123!",
            "name": "Test Admin"
        }
        
        success, response = self.run_test(
            "Admin Registration", 
            "POST", 
            "admin/register", 
            200, 
            admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   ✓ Admin token obtained")
            return True, admin_data
        
        return success, admin_data

    def test_admin_login(self, admin_data):
        """Test admin login"""
        login_data = {
            "email": admin_data["email"],
            "password": admin_data["password"]
        }
        
        success, response = self.run_test(
            "Admin Login", 
            "POST", 
            "admin/login", 
            200, 
            login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   ✓ Login successful")
        
        return success, response

    def test_admin_profile(self):
        """Test admin profile endpoint"""
        return self.run_test("Admin Profile", "GET", "admin/me", 200)

    def test_user_capture(self):
        """Test user info capture (new email capture functionality)"""
        user_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"testuser_{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "+1234567890"
        }
        
        success, response = self.run_test(
            "User Info Capture", 
            "POST", 
            "assessment/capture", 
            200, 
            user_data
        )
        
        if success:
            expected_fields = ['success', 'user_id', 'message']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                self.log_test("User Capture Response Validation", False, f"Missing fields: {missing_fields}")
            else:
                print(f"   ✓ User captured with ID: {response.get('user_id')}")
                print(f"   ✓ Message: {response.get('message')}")
        
        return success, response

    def test_assessment_submission_with_capture(self):
        """Test full assessment flow: capture -> submit"""
        # First capture user info
        capture_success, capture_response = self.test_user_capture()
        if not capture_success:
            return False, {}
        
        user_id = capture_response.get('user_id')
        if not user_id:
            self.log_test("Assessment Flow", False, "No user_id from capture")
            return False, {}
        
        # Get questions to create valid responses
        questions_success, questions = self.test_get_questions()
        if not questions_success:
            return False, {}
        
        # Create responses for all questions
        responses = []
        for question in questions:
            responses.append({
                "question": question["question"],
                "answer": question["options"][0]["label"],  # Select first option
                "score": question["options"][0]["score"]
            })
        
        assessment_data = {
            "user_id": user_id,
            "responses": responses
        }
        
        success, response = self.run_test(
            "Assessment Submission", 
            "POST", 
            "assessment/submit", 
            200, 
            assessment_data
        )
        
        if success:
            expected_fields = ['success', 'user_id', 'score', 'level', 'integrations']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                self.log_test("Assessment Response Validation", False, f"Missing fields: {missing_fields}")
            else:
                print(f"   ✓ Assessment completed for user ID: {response.get('user_id')}")
                print(f"   ✓ Score: {response.get('score')}, Level: {response.get('level')}")
                print(f"   ✓ Mock integrations: {response.get('integrations', {}).keys()}")
        
        return success, response

    def test_get_users(self):
        """Test get users endpoint (admin protected)"""
        return self.run_test("Get Users", "GET", "admin/users", 200)

    def test_get_users_with_filter(self):
        """Test get users with level filter"""
        return self.run_test("Get Users (Level 1)", "GET", "admin/users?level=1", 200)

    def test_get_users_with_status_filter(self):
        """Test get users with status filter"""
        success_completed, _ = self.run_test("Get Users (Completed)", "GET", "admin/users?status_filter=completed", 200)
        success_abandoned, _ = self.run_test("Get Users (Abandoned)", "GET", "admin/users?status_filter=abandoned", 200)
        return success_completed and success_abandoned

    def test_get_users_with_search(self):
        """Test get users with search"""
        return self.run_test("Get Users (Search)", "GET", "admin/users?search=test", 200)

    def test_export_csv(self):
        """Test CSV export"""
        success, response = self.run_test("Export CSV", "GET", "admin/export", 200)
        if success and 'csv' in response and 'count' in response:
            print(f"   ✓ CSV export contains {response.get('count')} users")
            # Check if CSV includes status column
            csv_content = response.get('csv', '')
            if 'Status' in csv_content:
                print(f"   ✓ CSV includes Status column")
            else:
                self.log_test("CSV Status Column", False, "Status column missing from CSV")
        return success, response

    def test_export_csv_with_status_filter(self):
        """Test CSV export with status filter"""
        success_completed, response_completed = self.run_test("Export CSV (Completed)", "GET", "admin/export?status_filter=completed", 200)
        success_abandoned, response_abandoned = self.run_test("Export CSV (Abandoned)", "GET", "admin/export?status_filter=abandoned", 200)
        
        if success_completed and success_abandoned:
            print(f"   ✓ Completed users export: {response_completed.get('count', 0)} users")
            print(f"   ✓ Abandoned users export: {response_abandoned.get('count', 0)} users")
        
        return success_completed and success_abandoned

    def test_user_detail(self, user_id):
        """Test user detail endpoint"""
        return self.run_test("User Detail", "GET", f"admin/users/{user_id}", 200)

    def test_score_calculation(self):
        """Test score calculation logic"""
        print("\n🔍 Testing Score Calculation Logic...")
        
        test_cases = [
            (10, 1), (14, 1),  # Level 1: 10-14
            (15, 2), (18, 2),  # Level 2: 15-18
            (19, 3), (22, 3),  # Level 3: 19-22
            (23, 4), (26, 4),  # Level 4: 23-26
            (27, 5), (30, 5),  # Level 5: 27-30
        ]
        
        all_passed = True
        for score, expected_level in test_cases:
            # Calculate level using same logic as backend
            if score <= 14:
                calculated_level = 1
            elif score <= 18:
                calculated_level = 2
            elif score <= 22:
                calculated_level = 3
            elif score <= 26:
                calculated_level = 4
            else:
                calculated_level = 5
            
            if calculated_level == expected_level:
                print(f"   ✓ Score {score} → Level {calculated_level}")
            else:
                print(f"   ❌ Score {score} → Expected Level {expected_level}, got {calculated_level}")
                all_passed = False
        
        self.log_test("Score Calculation Logic", all_passed)
        return all_passed

def main():
    print("🚀 Starting Assessment Platform API Tests")
    print("=" * 50)
    
    tester = AssessmentAPITester()
    
    # Test basic endpoints
    tester.test_root_endpoint()
    tester.test_get_questions()
    
    # Test score calculation logic
    tester.test_score_calculation()
    
    # Test new email capture functionality
    tester.test_user_capture()
    
    # Test admin functionality
    admin_success, admin_data = tester.test_admin_registration()
    if admin_success:
        tester.test_admin_login(admin_data)
        tester.test_admin_profile()
    
    # Test full assessment flow (capture -> submit)
    assessment_success, assessment_response = tester.test_assessment_submission_with_capture()
    
    # Test admin endpoints (if admin token available)
    if tester.admin_token:
        users_success, users_response = tester.test_get_users()
        tester.test_get_users_with_filter()
        tester.test_get_users_with_status_filter()  # New status filter test
        tester.test_get_users_with_search()
        tester.test_export_csv()
        tester.test_export_csv_with_status_filter()  # New status filter CSV test
        
        # Test user detail if we have a user ID from assessment
        if assessment_success and 'user_id' in assessment_response:
            tester.test_user_detail(assessment_response['user_id'])
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Print failed tests
    failed_tests = [test for test in tester.test_results if not test['success']]
    if failed_tests:
        print("\n❌ FAILED TESTS:")
        for test in failed_tests:
            print(f"   • {test['test']}: {test['details']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())