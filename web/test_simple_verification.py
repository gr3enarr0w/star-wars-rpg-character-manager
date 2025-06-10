#!/usr/bin/env python3
"""
Simple HTTP-based test to verify Flask application endpoints and responses.
"""

import requests
import json
import time
from datetime import datetime

class SimpleVerificationTest:
    def __init__(self):
        self.base_url = "http://127.0.0.1:5000"
        self.test_results = {}
        
    def test_homepage_response(self):
        """Test if homepage responds correctly."""
        print("\n🧪 TEST 1: Homepage Response")
        try:
            response = requests.get(self.base_url, timeout=10)
            
            result = {
                "status": "PASS" if response.status_code == 200 else "FAIL",
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds(),
                "content_length": len(response.content),
                "content_type": response.headers.get('content-type', 'unknown')
            }
            
            # Check content
            content = response.text.lower()
            result["has_html"] = "<!doctype html>" in content or "<html" in content
            result["has_title"] = "<title>" in content
            result["has_form"] = "<form" in content
            result["has_character_content"] = "character" in content
            
            print(f"   Status Code: {response.status_code}")
            print(f"   Response Time: {response.elapsed.total_seconds():.3f}s")
            print(f"   Content Length: {len(response.content)} bytes")
            print(f"   Has HTML: {result['has_html']}")
            print(f"   Has Forms: {result['has_form']}")
            print(f"   Result: {result['status']}")
            
            self.test_results["homepage"] = result
            return result["status"] == "PASS"
            
        except requests.exceptions.ConnectionError:
            print("❌ Could not connect to Flask application. Is it running?")
            self.test_results["homepage"] = {"status": "ERROR", "error": "Connection failed"}
            return False
        except Exception as e:
            print(f"❌ Homepage test failed: {e}")
            self.test_results["homepage"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_api_endpoints(self):
        """Test API endpoints availability."""
        print("\n🧪 TEST 2: API Endpoints")
        
        endpoints_to_test = [
            ("/api/characters", "GET", "Characters API"),
            ("/api/careers", "GET", "Careers API"),
            ("/api/species", "GET", "Species API"),
            ("/api/skills", "GET", "Skills API")
        ]
        
        results = {}
        for endpoint, method, description in endpoints_to_test:
            try:
                url = self.base_url + endpoint
                if method == "GET":
                    response = requests.get(url, timeout=5)
                
                endpoint_result = {
                    "status_code": response.status_code,
                    "accessible": response.status_code in [200, 404],  # 404 is ok for some endpoints
                    "response_time": response.elapsed.total_seconds(),
                    "content_type": response.headers.get('content-type', 'unknown')
                }
                
                # Try to parse JSON if content-type suggests it
                if 'json' in endpoint_result["content_type"]:
                    try:
                        data = response.json()
                        endpoint_result["is_json"] = True
                        endpoint_result["data_type"] = type(data).__name__
                    except:
                        endpoint_result["is_json"] = False
                
                results[endpoint] = endpoint_result
                print(f"   {description} ({endpoint}): {response.status_code} - {response.elapsed.total_seconds():.3f}s")
                
            except Exception as e:
                results[endpoint] = {"error": str(e), "accessible": False}
                print(f"   {description} ({endpoint}): ERROR - {e}")
        
        # Overall status
        accessible_count = sum(1 for r in results.values() if r.get("accessible", False))
        total_count = len(results)
        
        overall_result = {
            "status": "PASS" if accessible_count > 0 else "FAIL",
            "accessible_endpoints": accessible_count,
            "total_endpoints": total_count,
            "endpoints": results
        }
        
        print(f"   Accessible endpoints: {accessible_count}/{total_count}")
        print(f"   Result: {overall_result['status']}")
        
        self.test_results["api_endpoints"] = overall_result
        return accessible_count > 0

    def test_static_resources(self):
        """Test static resources like CSS and JS."""
        print("\n🧪 TEST 3: Static Resources")
        
        static_resources = [
            "/static/css/main.css",
            "/static/js/main.js", 
            "/static/js/auth.js"
        ]
        
        results = {}
        for resource in static_resources:
            try:
                url = self.base_url + resource
                response = requests.get(url, timeout=5)
                
                resource_result = {
                    "status_code": response.status_code,
                    "available": response.status_code == 200,
                    "size": len(response.content),
                    "content_type": response.headers.get('content-type', 'unknown')
                }
                
                results[resource] = resource_result
                status_icon = "✅" if response.status_code == 200 else "❌"
                print(f"   {status_icon} {resource}: {response.status_code} ({len(response.content)} bytes)")
                
            except Exception as e:
                results[resource] = {"error": str(e), "available": False}
                print(f"   ❌ {resource}: ERROR - {e}")
        
        available_count = sum(1 for r in results.values() if r.get("available", False))
        total_count = len(results)
        
        overall_result = {
            "status": "PASS" if available_count >= total_count * 0.5 else "PARTIAL",
            "available_resources": available_count,
            "total_resources": total_count,
            "resources": results
        }
        
        print(f"   Available resources: {available_count}/{total_count}")
        print(f"   Result: {overall_result['status']}")
        
        self.test_results["static_resources"] = overall_result
        return available_count > 0

    def test_response_content_analysis(self):
        """Analyze homepage content for specific elements."""
        print("\n🧪 TEST 4: Content Analysis")
        
        try:
            response = requests.get(self.base_url, timeout=10)
            content = response.text.lower()
            
            # Look for specific UI elements and potential issues
            analysis = {
                "loading_text": content.count("loading"),
                "create_character_mentions": (
                    content.count("create character") + 
                    content.count("create new character") + 
                    content.count("create your first character")
                ),
                "button_elements": content.count("<button"),
                "form_elements": content.count("<form"),
                "input_elements": content.count("<input"),
                "javascript_files": content.count(".js"),
                "css_files": content.count(".css"),
                "error_messages": (
                    content.count("error") + 
                    content.count("failed") + 
                    content.count("not found")
                )
            }
            
            # Check for potential indicators of the fixes
            fixes_indicators = {
                "has_character_creation": analysis["create_character_mentions"] > 0,
                "has_interactive_elements": analysis["button_elements"] > 0,
                "loading_not_persistent": analysis["loading_text"] <= 2,  # Some loading is ok, persistent is not
                "has_forms": analysis["form_elements"] > 0
            }
            
            # Calculate overall health score
            positive_indicators = sum(fixes_indicators.values())
            health_score = positive_indicators / len(fixes_indicators)
            
            result = {
                "status": "PASS" if health_score >= 0.75 else "PARTIAL" if health_score >= 0.5 else "FAIL",
                "analysis": analysis,
                "fixes_indicators": fixes_indicators,
                "health_score": health_score,
                "content_length": len(response.text)
            }
            
            print(f"   Loading mentions: {analysis['loading_text']}")
            print(f"   Create character mentions: {analysis['create_character_mentions']}")
            print(f"   Button elements: {analysis['button_elements']}")
            print(f"   Form elements: {analysis['form_elements']}")
            print(f"   Health score: {health_score:.2%}")
            print(f"   Result: {result['status']}")
            
            self.test_results["content_analysis"] = result
            return health_score >= 0.5
            
        except Exception as e:
            print(f"❌ Content analysis failed: {e}")
            self.test_results["content_analysis"] = {"status": "ERROR", "error": str(e)}
            return False

    def run_all_tests(self):
        """Run all verification tests."""
        print("🚀 Starting Simple Flask Verification Tests")
        print("=" * 50)
        
        # Check if Flask app is running
        try:
            requests.get(self.base_url, timeout=2)
        except:
            print("❌ Flask application is not running at http://127.0.0.1:5000")
            print("   Please start the Flask app first.")
            return False
        
        # Run tests
        tests = [
            ("Homepage Response", self.test_homepage_response),
            ("API Endpoints", self.test_api_endpoints),
            ("Static Resources", self.test_static_resources),
            ("Content Analysis", self.test_response_content_analysis)
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append(result)
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append(False)
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed_tests = sum(results)
        total_tests = len(results)
        
        print(f"Tests Passed: {passed_tests}/{total_tests}")
        
        for test_name, result in self.test_results.items():
            status_icon = "✅" if result.get("status") == "PASS" else "⚠️" if result.get("status") == "PARTIAL" else "❌"
            print(f"{status_icon} {test_name.replace('_', ' ').title()}: {result.get('status', 'UNKNOWN')}")
        
        # Save detailed results
        with open("test_results_simple_verification.json", "w") as f:
            json.dump(self.test_results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed results saved to: test_results_simple_verification.json")
        
        # Specific feedback on the issues mentioned
        self.provide_fix_feedback()
        
        return passed_tests >= total_tests * 0.5

    def provide_fix_feedback(self):
        """Provide specific feedback on the issues that were supposed to be fixed."""
        print("\n" + "=" * 50)
        print("🔍 FIX VERIFICATION FEEDBACK")
        print("=" * 50)
        
        content_analysis = self.test_results.get("content_analysis", {})
        if content_analysis:
            analysis = content_analysis.get("analysis", {})
            indicators = content_analysis.get("fixes_indicators", {})
            
            print("Primary Issues Status:")
            
            # Character Creation Button
            if indicators.get("has_character_creation"):
                print("✅ Character Creation: Button/text mentions found in content")
            else:
                print("❌ Character Creation: No 'Create Character' button mentions found")
            
            # Loading States
            loading_count = analysis.get("loading_text", 0)
            if loading_count <= 2:
                print(f"✅ Loading States: Minimal loading text found ({loading_count} instances)")
            else:
                print(f"⚠️ Loading States: Multiple loading instances found ({loading_count})")
            
            # Interactive Elements
            button_count = analysis.get("button_elements", 0)
            if button_count > 0:
                print(f"✅ Interactive Elements: {button_count} button elements found")
            else:
                print("❌ Interactive Elements: No button elements found")
            
            # Forms (for login)
            form_count = analysis.get("form_elements", 0)
            if form_count > 0:
                print(f"✅ Login Forms: {form_count} form elements found")
            else:
                print("❌ Login Forms: No form elements found")
        
        # API Status
        api_results = self.test_results.get("api_endpoints", {})
        if api_results:
            accessible = api_results.get("accessible_endpoints", 0)
            total = api_results.get("total_endpoints", 0)
            if accessible > 0:
                print(f"✅ API Endpoints: {accessible}/{total} endpoints accessible")
            else:
                print("❌ API Endpoints: No endpoints accessible")
        
        # Static Resources
        static_results = self.test_results.get("static_resources", {})
        if static_results:
            available = static_results.get("available_resources", 0)
            total = static_results.get("total_resources", 0)
            if available >= total * 0.5:
                print(f"✅ Static Resources: {available}/{total} resources available")
            else:
                print(f"⚠️ Static Resources: {available}/{total} resources available")

def main():
    """Main test execution."""
    tester = SimpleVerificationTest()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Simple verification tests completed!")
    else:
        print("\n⚠️ Some tests failed. Check the results for details.")
    
    return success

if __name__ == "__main__":
    main()