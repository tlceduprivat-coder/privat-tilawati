#!/usr/bin/env python3
"""
Backend API Test Suite for Privat Tilawati
Tests all endpoints with proper authentication and role-based access control
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from .env
BASE_URL = "https://c0d1b38b-ec5b-4fdb-bc64-91fad6d177ca.preview.emergentagent.com/api"

# Seed accounts
ADMIN_CREDS = {"email": "privattilawati@gmail.com", "password": "admin123"}
ASATIDZ_CREDS = {"email": "guru@privattilawati.id", "password": "guru123"}

# Test state
admin_token = None
asatidz_token = None
test_results = []
created_ids = {}  # Store created resource IDs for cleanup


def log_test(test_name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {test_name}")
    if details:
        print(f"   Details: {details}")
    test_results.append({"test": test_name, "passed": passed, "details": details})


def make_request(method: str, endpoint: str, token: Optional[str] = None, 
                 data: Optional[Dict] = None, expected_status: int = 200) -> tuple:
    """Make HTTP request and return (success, response, status_code)"""
    url = f"{BASE_URL}/{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            resp = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=10)
        else:
            return False, None, 0
        
        success = resp.status_code == expected_status
        try:
            response_data = resp.json()
        except:
            response_data = resp.text
        
        return success, response_data, resp.status_code
    except Exception as e:
        return False, str(e), 0


def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    success, data, status = make_request("GET", "health", expected_status=200)
    if success and isinstance(data, dict) and data.get("ok") == True:
        log_test("GET /api/health", True, f"Response: {data}")
    else:
        log_test("GET /api/health", False, f"Expected ok:true, got status {status}: {data}")


def test_auth():
    """Test authentication endpoints"""
    global admin_token, asatidz_token
    
    print("\n=== Testing Authentication ===")
    
    # Test admin login
    success, data, status = make_request("POST", "auth/login", data=ADMIN_CREDS, expected_status=200)
    if success and isinstance(data, dict) and "token" in data and "user" in data:
        admin_token = data["token"]
        log_test("POST /api/auth/login (admin)", True, f"Got token, user role: {data['user'].get('role')}")
    else:
        log_test("POST /api/auth/login (admin)", False, f"Status {status}: {data}")
        return False
    
    # Test asatidz login
    success, data, status = make_request("POST", "auth/login", data=ASATIDZ_CREDS, expected_status=200)
    if success and isinstance(data, dict) and "token" in data and "user" in data:
        asatidz_token = data["token"]
        log_test("POST /api/auth/login (asatidz)", True, f"Got token, user role: {data['user'].get('role')}")
    else:
        log_test("POST /api/auth/login (asatidz)", False, f"Status {status}: {data}")
        return False
    
    # Test wrong password
    wrong_creds = {"email": "privattilawati@gmail.com", "password": "wrongpass"}
    success, data, status = make_request("POST", "auth/login", data=wrong_creds, expected_status=401)
    if success:
        log_test("POST /api/auth/login (wrong password)", True, f"Correctly rejected with 401")
    else:
        log_test("POST /api/auth/login (wrong password)", False, f"Expected 401, got {status}")
    
    # Test /me without token
    success, data, status = make_request("GET", "auth/me", expected_status=401)
    if success:
        log_test("GET /api/auth/me (no token)", True, "Correctly rejected with 401")
    else:
        log_test("GET /api/auth/me (no token)", False, f"Expected 401, got {status}")
    
    # Test /me with admin token
    success, data, status = make_request("GET", "auth/me", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "user" in data:
        log_test("GET /api/auth/me (admin token)", True, f"User: {data['user'].get('email')}")
    else:
        log_test("GET /api/auth/me (admin token)", False, f"Status {status}: {data}")
    
    return True


def test_registrations():
    """Test public registrations endpoint"""
    print("\n=== Testing Registrations ===")
    
    # Test public POST (no auth required)
    reg_data = {
        "nama": "Ahmad Fauzi",
        "umur": 12,
        "alamat": "Jl. Masjid No. 45, Jakarta",
        "whatsapp": "081234567890",
        "program": "Tahsin Al-Quran",
        "keterangan": "Ingin belajar tajwid"
    }
    success, data, status = make_request("POST", "registrations", data=reg_data, expected_status=200)
    if success and isinstance(data, dict) and data.get("success") and "data" in data:
        created_ids["registration"] = data["data"].get("id")
        log_test("POST /api/registrations (public, no auth)", True, f"Created registration with id: {created_ids['registration']}")
    else:
        log_test("POST /api/registrations (public, no auth)", False, f"Status {status}: {data}")
    
    # Test POST with missing field
    incomplete_data = {"nama": "Test", "umur": 10}
    success, data, status = make_request("POST", "registrations", data=incomplete_data, expected_status=400)
    if success:
        log_test("POST /api/registrations (missing fields)", True, "Correctly rejected with 400")
    else:
        log_test("POST /api/registrations (missing fields)", False, f"Expected 400, got {status}")
    
    # Test GET as admin
    success, data, status = make_request("GET", "registrations", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
        found = any(r.get("id") == created_ids.get("registration") for r in data["data"])
        log_test("GET /api/registrations (admin)", True, f"Got {len(data['data'])} registrations, found created: {found}")
    else:
        log_test("GET /api/registrations (admin)", False, f"Status {status}: {data}")
    
    # Test GET as asatidz (should be forbidden)
    success, data, status = make_request("GET", "registrations", token=asatidz_token, expected_status=403)
    if success:
        log_test("GET /api/registrations (asatidz)", True, "Correctly rejected with 403")
    else:
        log_test("GET /api/registrations (asatidz)", False, f"Expected 403, got {status}")
    
    # Test GET without token
    success, data, status = make_request("GET", "registrations", expected_status=401)
    if success:
        log_test("GET /api/registrations (no token)", True, "Correctly rejected with 401")
    else:
        log_test("GET /api/registrations (no token)", False, f"Expected 401, got {status}")
    
    # Test DELETE as admin
    if created_ids.get("registration"):
        success, data, status = make_request("DELETE", f"registrations/{created_ids['registration']}", 
                                            token=admin_token, expected_status=200)
        if success:
            log_test("DELETE /api/registrations/{id} (admin)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/registrations/{id} (admin)", False, f"Status {status}: {data}")


def test_santri():
    """Test Santri CRUD endpoints"""
    print("\n=== Testing Santri ===")
    
    # Test POST as admin
    santri_data = {
        "nama": "Fatimah Zahra",
        "umur": 10,
        "alamat": "Jl. Pesantren No. 12, Bandung",
        "nomorHp": "082345678901",
        "program": "Tahfidz Quran",
        "status": "aktif"
    }
    success, data, status = make_request("POST", "santri", token=admin_token, data=santri_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and data["data"].get("id"):
        created_ids["santri"] = data["data"]["id"]
        log_test("POST /api/santri (admin)", True, f"Created santri with id: {created_ids['santri']}")
    else:
        log_test("POST /api/santri (admin)", False, f"Status {status}: {data}")
    
    # Test POST as asatidz (should be forbidden)
    success, data, status = make_request("POST", "santri", token=asatidz_token, data=santri_data, expected_status=403)
    if success:
        log_test("POST /api/santri (asatidz)", True, "Correctly rejected with 403")
    else:
        log_test("POST /api/santri (asatidz)", False, f"Expected 403, got {status}")
    
    # Test GET with status filter as admin
    success, data, status = make_request("GET", "santri?status=aktif", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        log_test("GET /api/santri?status=aktif (admin)", True, f"Got {len(data['data'])} active santri")
    else:
        log_test("GET /api/santri?status=aktif (admin)", False, f"Status {status}: {data}")
    
    # Test GET as asatidz (should be allowed)
    success, data, status = make_request("GET", "santri?status=aktif", token=asatidz_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        log_test("GET /api/santri?status=aktif (asatidz)", True, f"Got {len(data['data'])} active santri")
    else:
        log_test("GET /api/santri?status=aktif (asatidz)", False, f"Status {status}: {data}")
    
    # Test PUT as admin
    if created_ids.get("santri"):
        update_data = {"nama": "Fatimah Zahra Updated"}
        success, data, status = make_request("PUT", f"santri/{created_ids['santri']}", 
                                            token=admin_token, data=update_data, expected_status=200)
        if success:
            log_test("PUT /api/santri/{id} (admin)", True, "Successfully updated")
            # Verify update
            success2, data2, status2 = make_request("GET", "santri", token=admin_token, expected_status=200)
            if success2:
                updated = next((s for s in data2["data"] if s.get("id") == created_ids["santri"]), None)
                if updated and updated.get("nama") == "Fatimah Zahra Updated":
                    log_test("PUT /api/santri/{id} verification", True, "Update verified")
                else:
                    log_test("PUT /api/santri/{id} verification", False, "Update not reflected")
        else:
            log_test("PUT /api/santri/{id} (admin)", False, f"Status {status}: {data}")
    
    # Test DELETE as admin
    if created_ids.get("santri"):
        success, data, status = make_request("DELETE", f"santri/{created_ids['santri']}", 
                                            token=admin_token, expected_status=200)
        if success:
            log_test("DELETE /api/santri/{id} (admin)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/santri/{id} (admin)", False, f"Status {status}: {data}")


def test_asatidz():
    """Test Asatidz CRUD endpoints"""
    print("\n=== Testing Asatidz ===")
    
    # Test POST as admin
    asatidz_data = {
        "nama": "Ustadz Abdullah",
        "nomorHp": "083456789012",
        "alamat": "Jl. Dakwah No. 7, Yogyakarta",
        "status": "aktif"
    }
    success, data, status = make_request("POST", "asatidz", token=admin_token, data=asatidz_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and data["data"].get("id"):
        created_ids["asatidz"] = data["data"]["id"]
        log_test("POST /api/asatidz (admin)", True, f"Created asatidz with id: {created_ids['asatidz']}")
    else:
        log_test("POST /api/asatidz (admin)", False, f"Status {status}: {data}")
    
    # Test GET as admin (should include jumlahSantri)
    success, data, status = make_request("GET", "asatidz", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
        has_count = all("jumlahSantri" in item for item in data["data"])
        log_test("GET /api/asatidz (admin)", True, f"Got {len(data['data'])} asatidz, jumlahSantri field present: {has_count}")
    else:
        log_test("GET /api/asatidz (admin)", False, f"Status {status}: {data}")
    
    # Test PUT as admin
    if created_ids.get("asatidz"):
        update_data = {"nama": "Ustadz Abdullah Updated"}
        success, data, status = make_request("PUT", f"asatidz/{created_ids['asatidz']}", 
                                            token=admin_token, data=update_data, expected_status=200)
        if success:
            log_test("PUT /api/asatidz/{id} (admin)", True, "Successfully updated")
        else:
            log_test("PUT /api/asatidz/{id} (admin)", False, f"Status {status}: {data}")
    
    # Test DELETE as admin
    if created_ids.get("asatidz"):
        success, data, status = make_request("DELETE", f"asatidz/{created_ids['asatidz']}", 
                                            token=admin_token, expected_status=200)
        if success:
            log_test("DELETE /api/asatidz/{id} (admin)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/asatidz/{id} (admin)", False, f"Status {status}: {data}")


def test_jadwal():
    """Test Jadwal CRUD endpoints"""
    print("\n=== Testing Jadwal ===")
    
    # Test POST as admin
    jadwal_data = {
        "guruNama": "Ustadz Ahmad",
        "santriNama": "Fatimah",
        "hari": "Senin",
        "jam": "16:00-17:00",
        "lokasi": "Offline"
    }
    success, data, status = make_request("POST", "jadwal", token=admin_token, data=jadwal_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and data["data"].get("id"):
        created_ids["jadwal"] = data["data"]["id"]
        log_test("POST /api/jadwal (admin)", True, f"Created jadwal with id: {created_ids['jadwal']}")
    else:
        log_test("POST /api/jadwal (admin)", False, f"Status {status}: {data}")
    
    # Test GET as admin
    success, data, status = make_request("GET", "jadwal", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        log_test("GET /api/jadwal (admin)", True, f"Got {len(data['data'])} jadwal")
    else:
        log_test("GET /api/jadwal (admin)", False, f"Status {status}: {data}")
    
    # Test GET as asatidz (should be allowed)
    success, data, status = make_request("GET", "jadwal", token=asatidz_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        log_test("GET /api/jadwal (asatidz)", True, f"Got {len(data['data'])} jadwal")
    else:
        log_test("GET /api/jadwal (asatidz)", False, f"Status {status}: {data}")
    
    # Test PUT and DELETE
    if created_ids.get("jadwal"):
        update_data = {"jam": "17:00-18:00"}
        success, data, status = make_request("PUT", f"jadwal/{created_ids['jadwal']}", 
                                            token=admin_token, data=update_data, expected_status=200)
        if success:
            log_test("PUT /api/jadwal/{id} (admin)", True, "Successfully updated")
        else:
            log_test("PUT /api/jadwal/{id} (admin)", False, f"Status {status}: {data}")
        
        success, data, status = make_request("DELETE", f"jadwal/{created_ids['jadwal']}", 
                                            token=admin_token, expected_status=200)
        if success:
            log_test("DELETE /api/jadwal/{id} (admin)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/jadwal/{id} (admin)", False, f"Status {status}: {data}")


def test_progress():
    """Test Progress CRUD endpoints"""
    print("\n=== Testing Progress ===")
    
    # Test POST as asatidz
    progress_data = {
        "santriNama": "Fatimah",
        "guruNama": "Ustadz Ahmad",
        "materi": "Surah Al-Baqarah",
        "halaman": "1-5",
        "catatan": "Sudah lancar membaca",
        "tanggal": "2025-01-15"
    }
    success, data, status = make_request("POST", "progress", token=asatidz_token, data=progress_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and data["data"].get("id"):
        created_ids["progress_asatidz"] = data["data"]["id"]
        log_test("POST /api/progress (asatidz)", True, f"Created progress with id: {created_ids['progress_asatidz']}")
    else:
        log_test("POST /api/progress (asatidz)", False, f"Status {status}: {data}")
    
    # Test POST as admin
    success, data, status = make_request("POST", "progress", token=admin_token, data=progress_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and data["data"].get("id"):
        created_ids["progress_admin"] = data["data"]["id"]
        log_test("POST /api/progress (admin)", True, f"Created progress with id: {created_ids['progress_admin']}")
    else:
        log_test("POST /api/progress (admin)", False, f"Status {status}: {data}")
    
    # Test GET
    success, data, status = make_request("GET", "progress", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        log_test("GET /api/progress (admin)", True, f"Got {len(data['data'])} progress records")
    else:
        log_test("GET /api/progress (admin)", False, f"Status {status}: {data}")
    
    # Test DELETE
    if created_ids.get("progress_asatidz"):
        success, data, status = make_request("DELETE", f"progress/{created_ids['progress_asatidz']}", 
                                            token=admin_token, expected_status=200)
        if success:
            log_test("DELETE /api/progress/{id} (admin)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/progress/{id} (admin)", False, f"Status {status}: {data}")
    
    if created_ids.get("progress_admin"):
        success, data, status = make_request("DELETE", f"progress/{created_ids['progress_admin']}", 
                                            token=asatidz_token, expected_status=200)
        if success:
            log_test("DELETE /api/progress/{id} (asatidz)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/progress/{id} (asatidz)", False, f"Status {status}: {data}")


def test_keuangan():
    """Test Keuangan CRUD endpoints"""
    print("\n=== Testing Keuangan ===")
    
    # Test POST as admin
    keuangan_data = {
        "santriNama": "Fatimah",
        "bulan": "Januari",
        "nominal": 150000,
        "status": "Belum",
        "catatan": "SPP bulan Januari"
    }
    success, data, status = make_request("POST", "keuangan", token=admin_token, data=keuangan_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and data["data"].get("id"):
        created_ids["keuangan"] = data["data"]["id"]
        log_test("POST /api/keuangan (admin)", True, f"Created keuangan with id: {created_ids['keuangan']}")
    else:
        log_test("POST /api/keuangan (admin)", False, f"Status {status}: {data}")
    
    # Test POST as asatidz (should be forbidden)
    success, data, status = make_request("POST", "keuangan", token=asatidz_token, data=keuangan_data, expected_status=403)
    if success:
        log_test("POST /api/keuangan (asatidz)", True, "Correctly rejected with 403")
    else:
        log_test("POST /api/keuangan (asatidz)", False, f"Expected 403, got {status}")
    
    # Test GET as admin
    success, data, status = make_request("GET", "keuangan", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        log_test("GET /api/keuangan (admin)", True, f"Got {len(data['data'])} keuangan records")
    else:
        log_test("GET /api/keuangan (admin)", False, f"Status {status}: {data}")
    
    # Test GET as asatidz (should be forbidden)
    success, data, status = make_request("GET", "keuangan", token=asatidz_token, expected_status=403)
    if success:
        log_test("GET /api/keuangan (asatidz)", True, "Correctly rejected with 403")
    else:
        log_test("GET /api/keuangan (asatidz)", False, f"Expected 403, got {status}")
    
    # Test PUT as admin (update status to Lunas)
    if created_ids.get("keuangan"):
        update_data = {"status": "Lunas"}
        success, data, status = make_request("PUT", f"keuangan/{created_ids['keuangan']}", 
                                            token=admin_token, data=update_data, expected_status=200)
        if success:
            log_test("PUT /api/keuangan/{id} (admin, status to Lunas)", True, "Successfully updated")
        else:
            log_test("PUT /api/keuangan/{id} (admin, status to Lunas)", False, f"Status {status}: {data}")
    
    # Test DELETE as admin
    if created_ids.get("keuangan"):
        success, data, status = make_request("DELETE", f"keuangan/{created_ids['keuangan']}", 
                                            token=admin_token, expected_status=200)
        if success:
            log_test("DELETE /api/keuangan/{id} (admin)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/keuangan/{id} (admin)", False, f"Status {status}: {data}")


def test_stats():
    """Test Stats endpoint"""
    print("\n=== Testing Stats ===")
    
    # Test GET as admin
    success, data, status = make_request("GET", "stats", token=admin_token, expected_status=200)
    if success and isinstance(data, dict):
        required_fields = ["santriAktif", "santriNon", "asatidz", "pendingReg", "lunas", "belum"]
        has_all = all(field in data for field in required_fields)
        all_numbers = all(isinstance(data.get(field), int) for field in required_fields)
        if has_all and all_numbers:
            log_test("GET /api/stats (admin)", True, f"Got all stats: {data}")
        else:
            log_test("GET /api/stats (admin)", False, f"Missing fields or wrong types: {data}")
    else:
        log_test("GET /api/stats (admin)", False, f"Status {status}: {data}")
    
    # Test GET as asatidz (should be allowed)
    success, data, status = make_request("GET", "stats", token=asatidz_token, expected_status=200)
    if success and isinstance(data, dict):
        log_test("GET /api/stats (asatidz)", True, f"Got stats: {data}")
    else:
        log_test("GET /api/stats (asatidz)", False, f"Status {status}: {data}")


def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for r in test_results if r["passed"])
    failed = sum(1 for r in test_results if not r["passed"])
    total = len(test_results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if failed > 0:
        print("\nFailed Tests:")
        for r in test_results:
            if not r["passed"]:
                print(f"  ❌ {r['test']}")
                if r["details"]:
                    print(f"     {r['details']}")
    
    print("="*60)
    
    return failed == 0


def main():
    """Run all tests"""
    print("="*60)
    print("PRIVAT TILAWATI - BACKEND API TEST SUITE")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print("="*60)
    
    try:
        # Run tests in order
        test_health()
        
        if not test_auth():
            print("\n❌ Authentication failed. Cannot proceed with other tests.")
            sys.exit(1)
        
        test_registrations()
        test_santri()
        test_asatidz()
        test_jadwal()
        test_progress()
        test_keuangan()
        test_stats()
        
        # Print summary
        all_passed = print_summary()
        
        sys.exit(0 if all_passed else 1)
        
    except Exception as e:
        print(f"\n❌ Test suite error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
