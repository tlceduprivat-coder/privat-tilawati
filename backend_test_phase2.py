#!/usr/bin/env python3
"""
Backend API Test Suite for Privat Tilawati - Phase 2
Tests new endpoints: Users, Auth Profile, Absensi, Slot Kosong, Receipts, Charts, Wali Role
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
wali_token = None
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


def test_auth():
    """Test authentication to get tokens"""
    global admin_token, asatidz_token
    
    print("\n=== Getting Auth Tokens ===")
    
    # Get admin token
    success, data, status = make_request("POST", "auth/login", data=ADMIN_CREDS, expected_status=200)
    if success and isinstance(data, dict) and "token" in data:
        admin_token = data["token"]
        log_test("Admin login", True, f"Got admin token")
    else:
        log_test("Admin login", False, f"Status {status}: {data}")
        return False
    
    # Get asatidz token
    success, data, status = make_request("POST", "auth/login", data=ASATIDZ_CREDS, expected_status=200)
    if success and isinstance(data, dict) and "token" in data:
        asatidz_token = data["token"]
        log_test("Asatidz login", True, f"Got asatidz token")
    else:
        log_test("Asatidz login", False, f"Status {status}: {data}")
        return False
    
    return True


def test_users_management():
    """Test Users Management endpoints (admin only)"""
    print("\n=== Testing Users Management (Admin Only) ===")
    
    # 1. POST /api/users as admin with role='asatidz'
    user_data = {
        "name": "Ustadz Demo",
        "email": "ustadzdemo@test.com",
        "role": "asatidz",
        "whatsapp": "081234567890"
    }
    success, data, status = make_request("POST", "users", token=admin_token, data=user_data, expected_status=200)
    if success and isinstance(data, dict) and data.get("success") and "plainPassword" in data.get("data", {}):
        created_ids["user_asatidz"] = data["data"]["id"]
        plain_pass = data["data"]["plainPassword"]
        log_test("POST /api/users (admin, role=asatidz)", True, f"Created user with plainPassword: {plain_pass} (length: {len(plain_pass)})")
        # Verify password is 8 chars
        if len(plain_pass) == 8:
            log_test("POST /api/users plainPassword length check", True, "Password is 8 characters")
        else:
            log_test("POST /api/users plainPassword length check", False, f"Expected 8 chars, got {len(plain_pass)}")
    else:
        log_test("POST /api/users (admin, role=asatidz)", False, f"Status {status}: {data}")
    
    # 2. Create santri first for wali user
    santri_data = {
        "nama": "Anak Test",
        "umur": 10,
        "alamat": "Jl. Test No. 1",
        "nomorHp": "081111111111",
        "program": "Tahfidz",
        "status": "aktif"
    }
    success, data, status = make_request("POST", "santri", token=admin_token, data=santri_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        created_ids["santri_for_wali"] = data["data"]["id"]
        log_test("POST /api/santri (for wali test)", True, f"Created santri: {created_ids['santri_for_wali']}")
    else:
        log_test("POST /api/santri (for wali test)", False, f"Status {status}: {data}")
    
    # 3. POST /api/users as admin with role='wali'
    wali_data = {
        "name": "Wali Test",
        "email": "wali1@test.com",
        "role": "wali",
        "santriId": created_ids.get("santri_for_wali")
    }
    success, data, status = make_request("POST", "users", token=admin_token, data=wali_data, expected_status=200)
    if success and isinstance(data, dict) and data.get("success"):
        created_ids["user_wali"] = data["data"]["id"]
        created_ids["wali_password"] = data["data"]["plainPassword"]
        log_test("POST /api/users (admin, role=wali)", True, f"Created wali user with password: {created_ids['wali_password']}")
    else:
        log_test("POST /api/users (admin, role=wali)", False, f"Status {status}: {data}")
    
    # 4. POST /api/users with duplicate email
    duplicate_data = {
        "name": "Duplicate User",
        "email": "ustadzdemo@test.com",  # Same as first user
        "role": "asatidz"
    }
    success, data, status = make_request("POST", "users", token=admin_token, data=duplicate_data, expected_status=400)
    if success:
        log_test("POST /api/users (duplicate email)", True, "Correctly rejected with 400")
    else:
        log_test("POST /api/users (duplicate email)", False, f"Expected 400, got {status}")
    
    # 5. GET /api/users as admin
    success, data, status = make_request("GET", "users", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
        log_test("GET /api/users (admin)", True, f"Got {len(data['data'])} users")
    else:
        log_test("GET /api/users (admin)", False, f"Status {status}: {data}")
    
    # 6. GET /api/users as asatidz (should be forbidden)
    success, data, status = make_request("GET", "users", token=asatidz_token, expected_status=403)
    if success:
        log_test("GET /api/users (asatidz)", True, "Correctly rejected with 403")
    else:
        log_test("GET /api/users (asatidz)", False, f"Expected 403, got {status}")
    
    # 7. PUT /api/users/{id} as admin
    if created_ids.get("user_asatidz"):
        update_data = {"name": "Ustadz Demo Updated"}
        success, data, status = make_request("PUT", f"users/{created_ids['user_asatidz']}", 
                                            token=admin_token, data=update_data, expected_status=200)
        if success:
            log_test("PUT /api/users/{id} (admin)", True, "Successfully updated user")
        else:
            log_test("PUT /api/users/{id} (admin)", False, f"Status {status}: {data}")
    
    # 8. POST /api/users/{id}/reset-password as admin
    if created_ids.get("user_asatidz"):
        success, data, status = make_request("POST", f"users/{created_ids['user_asatidz']}/reset-password", 
                                            token=admin_token, expected_status=200)
        if success and isinstance(data, dict) and "plainPassword" in data.get("data", {}):
            new_pass = data["data"]["plainPassword"]
            log_test("POST /api/users/{id}/reset-password (admin)", True, f"Got new plainPassword: {new_pass}")
        else:
            log_test("POST /api/users/{id}/reset-password (admin)", False, f"Status {status}: {data}")
    
    # 9. DELETE /api/users/{id} as admin (create temp user first)
    temp_user = {
        "name": "Temp User",
        "email": "tempuser@test.com",
        "role": "asatidz"
    }
    success, data, status = make_request("POST", "users", token=admin_token, data=temp_user, expected_status=200)
    if success:
        temp_id = data["data"]["id"]
        success2, data2, status2 = make_request("DELETE", f"users/{temp_id}", token=admin_token, expected_status=200)
        if success2:
            log_test("DELETE /api/users/{id} (admin)", True, "Successfully deleted user")
        else:
            log_test("DELETE /api/users/{id} (admin)", False, f"Status {status2}: {data2}")
    
    # 10. Try to DELETE self (admin) - should fail
    success, data, status = make_request("GET", "auth/me", token=admin_token, expected_status=200)
    if success and "user" in data:
        admin_id = data["user"]["id"]
        success2, data2, status2 = make_request("DELETE", f"users/{admin_id}", token=admin_token, expected_status=400)
        if success2:
            log_test("DELETE /api/users/{id} (delete self)", True, "Correctly rejected with 400")
        else:
            log_test("DELETE /api/users/{id} (delete self)", False, f"Expected 400, got {status2}")


def test_auth_profile_update():
    """Test Auth Profile Update (all roles)"""
    global admin_token
    
    print("\n=== Testing Auth Profile Update ===")
    
    # 1. PUT /api/auth/update-profile as admin (name change)
    update_data = {"name": "Admin New Name"}
    success, data, status = make_request("PUT", "auth/update-profile", token=admin_token, data=update_data, expected_status=200)
    if success:
        log_test("PUT /api/auth/update-profile (admin, name)", True, "Successfully updated name")
    else:
        log_test("PUT /api/auth/update-profile (admin, name)", False, f"Status {status}: {data}")
    
    # 2. PUT /api/auth/update-profile as admin (password change)
    new_password = "newpass123"
    update_data = {"password": new_password}
    success, data, status = make_request("PUT", "auth/update-profile", token=admin_token, data=update_data, expected_status=200)
    if success:
        log_test("PUT /api/auth/update-profile (admin, password)", True, "Successfully updated password")
        
        # 3. Login with new password
        new_creds = {"email": ADMIN_CREDS["email"], "password": new_password}
        success2, data2, status2 = make_request("POST", "auth/login", data=new_creds, expected_status=200)
        if success2 and "token" in data2:
            log_test("Login with new password", True, "Successfully logged in with new password")
            # Update admin token
            admin_token = data2["token"]
        else:
            log_test("Login with new password", False, f"Status {status2}: {data2}")
        
        # 4. Try login with old password (should fail)
        success3, data3, status3 = make_request("POST", "auth/login", data=ADMIN_CREDS, expected_status=401)
        if success3:
            log_test("Login with old password", True, "Correctly rejected with 401")
        else:
            log_test("Login with old password", False, f"Expected 401, got {status3}")
        
        # 5. Restore password to original
        restore_data = {"password": ADMIN_CREDS["password"]}
        success4, data4, status4 = make_request("PUT", "auth/update-profile", token=admin_token, data=restore_data, expected_status=200)
        if success4:
            log_test("Restore password to admin123", True, "Password restored")
            # Get new token with original password
            success5, data5, status5 = make_request("POST", "auth/login", data=ADMIN_CREDS, expected_status=200)
            if success5:
                admin_token = data5["token"]
        else:
            log_test("Restore password to admin123", False, f"Status {status4}: {data4}")
    else:
        log_test("PUT /api/auth/update-profile (admin, password)", False, f"Status {status}: {data}")


def test_absensi():
    """Test Absensi endpoints"""
    print("\n=== Testing Absensi ===")
    
    # 1. POST /api/absensi as asatidz
    absensi_data = {
        "santriNama": "Fatimah Zahra",
        "program": "Kelas Mandiri (Offline)",
        "tanggal": "2025-06-15",
        "status": "Hadir",
        "jam": "16:00"
    }
    success, data, status = make_request("POST", "absensi", token=asatidz_token, data=absensi_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        created_ids["absensi1"] = data["data"]["id"]
        verified = data["data"].get("verified")
        log_test("POST /api/absensi (asatidz)", True, f"Created absensi, verified={verified}")
        if verified == False:
            log_test("POST /api/absensi verified field", True, "verified is False as expected")
        else:
            log_test("POST /api/absensi verified field", False, f"Expected verified=False, got {verified}")
    else:
        log_test("POST /api/absensi (asatidz)", False, f"Status {status}: {data}")
    
    # 2. GET /api/absensi?bulan=2025-06 as admin
    success, data, status = make_request("GET", "absensi?bulan=2025-06", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        filtered = [a for a in data["data"] if a.get("tanggal", "").startswith("2025-06")]
        log_test("GET /api/absensi?bulan=2025-06 (admin)", True, f"Got {len(data['data'])} records, {len(filtered)} match filter")
    else:
        log_test("GET /api/absensi?bulan=2025-06 (admin)", False, f"Status {status}: {data}")
    
    # 3. GET /api/absensi?guruNama=Ustadz Demo as admin
    success, data, status = make_request("GET", "absensi?guruNama=Ustadz Demo", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        log_test("GET /api/absensi?guruNama=Ustadz Demo (admin)", True, f"Got {len(data['data'])} records")
    else:
        log_test("GET /api/absensi?guruNama=Ustadz Demo (admin)", False, f"Status {status}: {data}")
    
    # 4. POST /api/absensi/{id}/verify as admin
    if created_ids.get("absensi1"):
        success, data, status = make_request("POST", f"absensi/{created_ids['absensi1']}/verify", 
                                            token=admin_token, expected_status=200)
        if success:
            log_test("POST /api/absensi/{id}/verify (admin)", True, "Successfully verified")
            # Verify it's actually verified
            success2, data2, status2 = make_request("GET", "absensi", token=admin_token, expected_status=200)
            if success2:
                verified_record = next((a for a in data2["data"] if a.get("id") == created_ids["absensi1"]), None)
                if verified_record and verified_record.get("verified") == True:
                    log_test("GET /api/absensi verify check", True, "verified=True confirmed")
                else:
                    log_test("GET /api/absensi verify check", False, f"verified not True: {verified_record}")
        else:
            log_test("POST /api/absensi/{id}/verify (admin)", False, f"Status {status}: {data}")
    
    # 5. POST /api/absensi/{id}/verify as asatidz (should be forbidden)
    if created_ids.get("absensi1"):
        success, data, status = make_request("POST", f"absensi/{created_ids['absensi1']}/verify", 
                                            token=asatidz_token, expected_status=403)
        if success:
            log_test("POST /api/absensi/{id}/verify (asatidz)", True, "Correctly rejected with 403")
        else:
            log_test("POST /api/absensi/{id}/verify (asatidz)", False, f"Expected 403, got {status}")
    
    # 6. PUT /api/absensi/{id}
    if created_ids.get("absensi1"):
        update_data = {"catatan": "Updated catatan"}
        success, data, status = make_request("PUT", f"absensi/{created_ids['absensi1']}", 
                                            token=admin_token, data=update_data, expected_status=200)
        if success:
            log_test("PUT /api/absensi/{id} (admin)", True, "Successfully updated")
        else:
            log_test("PUT /api/absensi/{id} (admin)", False, f"Status {status}: {data}")
    
    # 7. DELETE /api/absensi/{id}
    if created_ids.get("absensi1"):
        success, data, status = make_request("DELETE", f"absensi/{created_ids['absensi1']}", 
                                            token=admin_token, expected_status=200)
        if success:
            log_test("DELETE /api/absensi/{id} (admin)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/absensi/{id} (admin)", False, f"Status {status}: {data}")
    
    # 8. Verify wali cannot access absensi
    if wali_token:
        success, data, status = make_request("GET", "absensi", token=wali_token, expected_status=403)
        if success:
            log_test("GET /api/absensi (wali)", True, "Correctly rejected with 403")
        else:
            log_test("GET /api/absensi (wali)", False, f"Expected 403, got {status}")


def test_slot_kosong():
    """Test Slot Kosong endpoints"""
    print("\n=== Testing Slot Kosong ===")
    
    # 1. POST /api/slot-kosong as asatidz
    slot_data = {
        "hari": "Senin",
        "jam": "15:00-16:00",
        "lokasi": "Online"
    }
    success, data, status = make_request("POST", "slot-kosong", token=asatidz_token, data=slot_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data and data["data"].get("id"):
        created_ids["slot"] = data["data"]["id"]
        log_test("POST /api/slot-kosong (asatidz)", True, f"Created slot: {created_ids['slot']}")
    else:
        log_test("POST /api/slot-kosong (asatidz)", False, f"Status {status}: {data}")
    
    # 2. GET /api/slot-kosong as admin
    success, data, status = make_request("GET", "slot-kosong", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        log_test("GET /api/slot-kosong (admin)", True, f"Got {len(data['data'])} slots")
    else:
        log_test("GET /api/slot-kosong (admin)", False, f"Status {status}: {data}")
    
    # 3. DELETE /api/slot-kosong/{id} as asatidz
    if created_ids.get("slot"):
        success, data, status = make_request("DELETE", f"slot-kosong/{created_ids['slot']}", 
                                            token=asatidz_token, expected_status=200)
        if success:
            log_test("DELETE /api/slot-kosong/{id} (asatidz)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/slot-kosong/{id} (asatidz)", False, f"Status {status}: {data}")


def test_receipts():
    """Test Receipts endpoints"""
    print("\n=== Testing Receipts ===")
    
    # Create 3 absensi records with status='Hadir' for receipt calculation
    absensi_records = [
        {"santriNama": "Ahmad", "program": "Kelas Mandiri (Offline)", "tanggal": "2025-06-01", "status": "Hadir", "jam": "16:00", "guruNama": "Ustadz Demo"},
        {"santriNama": "Fatimah", "program": "Kelas Mentoring (Offline)", "tanggal": "2025-06-05", "status": "Hadir", "jam": "17:00", "guruNama": "Ustadz Demo"},
        {"santriNama": "Zainab", "program": "Kelas Mandiri (Offline)", "tanggal": "2025-06-10", "status": "Hadir", "jam": "16:00", "guruNama": "Ustadz Demo"}
    ]
    
    for i, absensi in enumerate(absensi_records):
        success, data, status = make_request("POST", "absensi", token=asatidz_token, data=absensi, expected_status=200)
        if success:
            created_ids[f"absensi_receipt_{i}"] = data["data"]["id"]
            log_test(f"Create absensi {i+1} for receipt test", True, f"Created: {data['data']['id']}")
        else:
            log_test(f"Create absensi {i+1} for receipt test", False, f"Status {status}: {data}")
    
    # 1. POST /api/receipts/calculate as admin
    calculate_data = {
        "guruNama": "Ustadz Demo",
        "bulan": "2025-06",
        "potonganPersen": 20,
        "tarifMap": {
            "Kelas Mandiri (Offline)": 85000,
            "Kelas Mentoring (Offline)": 150000
        }
    }
    success, data, status = make_request("POST", "receipts/calculate", token=admin_token, data=calculate_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        calc_result = data["data"]
        items = calc_result.get("items", [])
        subtotal = calc_result.get("subtotal", 0)
        potongan = calc_result.get("potongan", 0)
        total = calc_result.get("total", 0)
        jumlah = calc_result.get("jumlahPertemuan", 0)
        
        # Expected: 2 x 85000 + 1 x 150000 = 320000
        # Potongan 20% = 64000
        # Total = 256000
        expected_subtotal = 2 * 85000 + 1 * 150000
        expected_potongan = int(expected_subtotal * 0.2)
        expected_total = expected_subtotal - expected_potongan
        
        log_test("POST /api/receipts/calculate (admin)", True, 
                f"items={len(items)}, subtotal={subtotal}, potongan={potongan} ({calc_result.get('potonganPersen')}%), total={total}, jumlahPertemuan={jumlah}")
        
        if len(items) == 3 and jumlah == 3:
            log_test("Receipt calculate: items count", True, "3 items as expected")
        else:
            log_test("Receipt calculate: items count", False, f"Expected 3 items, got {len(items)}")
        
        if subtotal == expected_subtotal:
            log_test("Receipt calculate: subtotal", True, f"Subtotal correct: {subtotal}")
        else:
            log_test("Receipt calculate: subtotal", False, f"Expected {expected_subtotal}, got {subtotal}")
        
        if potongan == expected_potongan:
            log_test("Receipt calculate: potongan", True, f"Potongan correct: {potongan}")
        else:
            log_test("Receipt calculate: potongan", False, f"Expected {expected_potongan}, got {potongan}")
        
        if total == expected_total:
            log_test("Receipt calculate: total", True, f"Total correct: {total}")
        else:
            log_test("Receipt calculate: total", False, f"Expected {expected_total}, got {total}")
        
        # Store for creating receipt
        created_ids["receipt_calc"] = calc_result
    else:
        log_test("POST /api/receipts/calculate (admin)", False, f"Status {status}: {data}")
    
    # 2. POST /api/receipts/calculate as asatidz (should be forbidden)
    success, data, status = make_request("POST", "receipts/calculate", token=asatidz_token, data=calculate_data, expected_status=403)
    if success:
        log_test("POST /api/receipts/calculate (asatidz)", True, "Correctly rejected with 403")
    else:
        log_test("POST /api/receipts/calculate (asatidz)", False, f"Expected 403, got {status}")
    
    # 3. POST /api/receipts with calculated result
    if created_ids.get("receipt_calc"):
        receipt_data = created_ids["receipt_calc"]
        success, data, status = make_request("POST", "receipts", token=admin_token, data=receipt_data, expected_status=200)
        if success and isinstance(data, dict) and "data" in data:
            created_ids["receipt"] = data["data"]["id"]
            nomor = data["data"].get("nomor", "")
            log_test("POST /api/receipts (admin)", True, f"Created receipt: {created_ids['receipt']}, nomor={nomor}")
            # Check nomor format PT/YYYY/xxxxxx
            if nomor.startswith("PT/") and "/2025/" in nomor:
                log_test("Receipt nomor format", True, f"Format correct: {nomor}")
            else:
                log_test("Receipt nomor format", False, f"Expected PT/YYYY/xxxxxx, got {nomor}")
        else:
            log_test("POST /api/receipts (admin)", False, f"Status {status}: {data}")
    
    # 4. GET /api/receipts as admin (should see all)
    success, data, status = make_request("GET", "receipts", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        log_test("GET /api/receipts (admin)", True, f"Got {len(data['data'])} receipts (all)")
    else:
        log_test("GET /api/receipts (admin)", False, f"Status {status}: {data}")
    
    # 5. GET /api/receipts as asatidz (should only see own)
    success, data, status = make_request("GET", "receipts", token=asatidz_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        # Check if all receipts belong to asatidz
        asatidz_receipts = [r for r in data["data"] if r.get("guruNama") == "Ustadz Demo"]
        log_test("GET /api/receipts (asatidz)", True, 
                f"Got {len(data['data'])} receipts, {len(asatidz_receipts)} belong to Ustadz Demo")
    else:
        log_test("GET /api/receipts (asatidz)", False, f"Status {status}: {data}")
    
    # 6. DELETE /api/receipts/{id} as admin
    if created_ids.get("receipt"):
        success, data, status = make_request("DELETE", f"receipts/{created_ids['receipt']}", 
                                            token=admin_token, expected_status=200)
        if success:
            log_test("DELETE /api/receipts/{id} (admin)", True, "Successfully deleted")
        else:
            log_test("DELETE /api/receipts/{id} (admin)", False, f"Status {status}: {data}")
    
    # 7. DELETE as asatidz (should be forbidden) - create new receipt first
    if created_ids.get("receipt_calc"):
        success, data, status = make_request("POST", "receipts", token=admin_token, data=created_ids["receipt_calc"], expected_status=200)
        if success:
            temp_receipt_id = data["data"]["id"]
            success2, data2, status2 = make_request("DELETE", f"receipts/{temp_receipt_id}", 
                                                    token=asatidz_token, expected_status=403)
            if success2:
                log_test("DELETE /api/receipts/{id} (asatidz)", True, "Correctly rejected with 403")
            else:
                log_test("DELETE /api/receipts/{id} (asatidz)", False, f"Expected 403, got {status2}")
            # Cleanup
            make_request("DELETE", f"receipts/{temp_receipt_id}", token=admin_token, expected_status=200)
    
    # Cleanup absensi records
    for i in range(3):
        if created_ids.get(f"absensi_receipt_{i}"):
            make_request("DELETE", f"absensi/{created_ids[f'absensi_receipt_{i}']}", token=admin_token)


def test_charts():
    """Test Charts endpoints (admin only)"""
    print("\n=== Testing Charts ===")
    
    # 1. GET /api/charts?range=month as admin
    success, data, status = make_request("GET", "charts?range=month", token=admin_token, expected_status=200)
    if success and isinstance(data, dict):
        has_masuk = "masukKeluar" in data and isinstance(data["masukKeluar"], list)
        has_keuangan = "keuangan" in data and isinstance(data["keuangan"], list)
        has_santri = "santriPerAsatidz" in data and isinstance(data["santriPerAsatidz"], list)
        
        if has_masuk and has_keuangan and has_santri:
            log_test("GET /api/charts?range=month (admin)", True, 
                    f"Got all fields: masukKeluar({len(data['masukKeluar'])}), keuangan({len(data['keuangan'])}), santriPerAsatidz({len(data['santriPerAsatidz'])})")
        else:
            log_test("GET /api/charts?range=month (admin)", False, f"Missing fields: {data.keys()}")
    else:
        log_test("GET /api/charts?range=month (admin)", False, f"Status {status}: {data}")
    
    # 2. Test other ranges
    for range_val in ["day", "week", "year"]:
        success, data, status = make_request("GET", f"charts?range={range_val}", token=admin_token, expected_status=200)
        if success:
            log_test(f"GET /api/charts?range={range_val} (admin)", True, "200 OK")
        else:
            log_test(f"GET /api/charts?range={range_val} (admin)", False, f"Status {status}: {data}")
    
    # 3. GET /api/charts as asatidz (should be forbidden)
    success, data, status = make_request("GET", "charts?range=month", token=asatidz_token, expected_status=403)
    if success:
        log_test("GET /api/charts (asatidz)", True, "Correctly rejected with 403")
    else:
        log_test("GET /api/charts (asatidz)", False, f"Expected 403, got {status}")


def test_wali_role():
    """Test Wali Role - Filtered Access"""
    print("\n=== Testing Wali Role - Filtered Access ===")
    
    global wali_token
    
    # 1. Login as wali
    if created_ids.get("wali_password"):
        wali_creds = {"email": "wali1@test.com", "password": created_ids["wali_password"]}
        success, data, status = make_request("POST", "auth/login", data=wali_creds, expected_status=200)
        if success and "token" in data:
            wali_token = data["token"]
            log_test("Login as wali", True, "Got wali token")
        else:
            log_test("Login as wali", False, f"Status {status}: {data}")
            return
    else:
        log_test("Wali role test", False, "Wali user not created")
        return
    
    # 2. Create 2 progress records: 1 for 'Anak Test', 1 for other santri
    progress1 = {
        "santriNama": "Anak Test",
        "guruNama": "Ustadz Demo",
        "materi": "Jilid 1",
        "tanggal": "2025-06-01"
    }
    success, data, status = make_request("POST", "progress", token=admin_token, data=progress1, expected_status=200)
    if success:
        created_ids["progress_wali_child"] = data["data"]["id"]
        log_test("Create progress for 'Anak Test'", True, f"Created: {created_ids['progress_wali_child']}")
    
    progress2 = {
        "santriNama": "Other Santri",
        "guruNama": "Ustadz Demo",
        "materi": "Jilid 2",
        "tanggal": "2025-06-01"
    }
    success, data, status = make_request("POST", "progress", token=admin_token, data=progress2, expected_status=200)
    if success:
        created_ids["progress_other"] = data["data"]["id"]
        log_test("Create progress for 'Other Santri'", True, f"Created: {created_ids['progress_other']}")
    
    # 3. GET /api/progress as wali (should only see 'Anak Test')
    success, data, status = make_request("GET", "progress", token=wali_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        wali_progress = data["data"]
        anak_test_count = sum(1 for p in wali_progress if p.get("santriNama") == "Anak Test")
        other_count = sum(1 for p in wali_progress if p.get("santriNama") != "Anak Test")
        
        log_test("GET /api/progress (wali)", True, 
                f"Got {len(wali_progress)} records: {anak_test_count} for 'Anak Test', {other_count} for others")
        
        if other_count == 0 and anak_test_count >= 1:
            log_test("Wali progress filtering", True, "Only sees own child's progress")
        else:
            log_test("Wali progress filtering", False, f"Should only see 'Anak Test', but got {other_count} other records")
    else:
        log_test("GET /api/progress (wali)", False, f"Status {status}: {data}")
    
    # 4. Create 2 keuangan records: 1 for 'Anak Test', 1 for other santri
    keuangan1 = {
        "santriNama": "Anak Test",
        "bulan": "Juni 2025",
        "nominal": 200000,
        "status": "Lunas"
    }
    success, data, status = make_request("POST", "keuangan", token=admin_token, data=keuangan1, expected_status=200)
    if success:
        created_ids["keuangan_wali_child"] = data["data"]["id"]
        log_test("Create keuangan for 'Anak Test'", True, f"Created: {created_ids['keuangan_wali_child']}")
    
    keuangan2 = {
        "santriNama": "Other Santri",
        "bulan": "Juni 2025",
        "nominal": 200000,
        "status": "Belum"
    }
    success, data, status = make_request("POST", "keuangan", token=admin_token, data=keuangan2, expected_status=200)
    if success:
        created_ids["keuangan_other"] = data["data"]["id"]
        log_test("Create keuangan for 'Other Santri'", True, f"Created: {created_ids['keuangan_other']}")
    
    # 5. GET /api/keuangan as wali (should only see 'Anak Test')
    success, data, status = make_request("GET", "keuangan", token=wali_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        wali_keuangan = data["data"]
        anak_test_count = sum(1 for k in wali_keuangan if k.get("santriNama") == "Anak Test")
        other_count = sum(1 for k in wali_keuangan if k.get("santriNama") != "Anak Test")
        
        log_test("GET /api/keuangan (wali)", True, 
                f"Got {len(wali_keuangan)} records: {anak_test_count} for 'Anak Test', {other_count} for others")
        
        if other_count == 0 and anak_test_count >= 1:
            log_test("Wali keuangan filtering", True, "Only sees own child's SPP")
        else:
            log_test("Wali keuangan filtering", False, f"Should only see 'Anak Test', but got {other_count} other records")
    else:
        log_test("GET /api/keuangan (wali)", False, f"Status {status}: {data}")
    
    # 6. POST /api/santri as wali (should be forbidden)
    santri_data = {"nama": "Test Santri", "umur": 10}
    success, data, status = make_request("POST", "santri", token=wali_token, data=santri_data, expected_status=403)
    if success:
        log_test("POST /api/santri (wali)", True, "Correctly rejected with 403")
    else:
        log_test("POST /api/santri (wali)", False, f"Expected 403, got {status}")
    
    # 7. POST /api/absensi as wali (should be forbidden)
    absensi_data = {"santriNama": "Test", "program": "Test", "status": "Hadir"}
    success, data, status = make_request("POST", "absensi", token=wali_token, data=absensi_data, expected_status=403)
    if success:
        log_test("POST /api/absensi (wali)", True, "Correctly rejected with 403")
    else:
        log_test("POST /api/absensi (wali)", False, f"Expected 403, got {status}")
    
    # Cleanup
    for key in ["progress_wali_child", "progress_other", "keuangan_wali_child", "keuangan_other"]:
        if created_ids.get(key):
            if "progress" in key:
                make_request("DELETE", f"progress/{created_ids[key]}", token=admin_token)
            else:
                make_request("DELETE", f"keuangan/{created_ids[key]}", token=admin_token)


def test_progress_with_nilai():
    """Test Progress with nilai fields"""
    print("\n=== Testing Progress with Nilai ===")
    
    # 1. POST /api/progress with nilai and nilaiAngka
    progress_data = {
        "santriNama": "Ahmad Fauzi",
        "guruNama": "Ustadz Demo",
        "materi": "Jilid 3",
        "nilai": "A",
        "nilaiAngka": 90,
        "tanggal": "2025-06-15"
    }
    success, data, status = make_request("POST", "progress", token=asatidz_token, data=progress_data, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        created_ids["progress_nilai"] = data["data"]["id"]
        nilai = data["data"].get("nilai")
        nilaiAngka = data["data"].get("nilaiAngka")
        
        log_test("POST /api/progress (with nilai)", True, f"Created with nilai={nilai}, nilaiAngka={nilaiAngka}")
        
        if nilai == "A" and nilaiAngka == 90:
            log_test("Progress nilai fields stored", True, "Both nilai and nilaiAngka stored correctly")
        else:
            log_test("Progress nilai fields stored", False, f"Expected nilai=A, nilaiAngka=90, got nilai={nilai}, nilaiAngka={nilaiAngka}")
    else:
        log_test("POST /api/progress (with nilai)", False, f"Status {status}: {data}")
    
    # 2. GET /api/progress and verify fields
    success, data, status = make_request("GET", "progress", token=admin_token, expected_status=200)
    if success and isinstance(data, dict) and "data" in data:
        progress_with_nilai = next((p for p in data["data"] if p.get("id") == created_ids.get("progress_nilai")), None)
        if progress_with_nilai:
            has_nilai = "nilai" in progress_with_nilai
            has_nilaiAngka = "nilaiAngka" in progress_with_nilai
            log_test("GET /api/progress (verify nilai fields)", True, 
                    f"nilai field present: {has_nilai}, nilaiAngka field present: {has_nilaiAngka}")
        else:
            log_test("GET /api/progress (verify nilai fields)", False, "Progress record not found")
    else:
        log_test("GET /api/progress (verify nilai fields)", False, f"Status {status}: {data}")
    
    # Cleanup
    if created_ids.get("progress_nilai"):
        make_request("DELETE", f"progress/{created_ids['progress_nilai']}", token=admin_token)


def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY - PHASE 2")
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
    """Run all Phase 2 tests"""
    print("="*60)
    print("PRIVAT TILAWATI - BACKEND API TEST SUITE (PHASE 2)")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print("="*60)
    
    try:
        # Get auth tokens
        if not test_auth():
            print("\n❌ Authentication failed. Cannot proceed.")
            sys.exit(1)
        
        # Run Phase 2 tests
        test_users_management()
        test_auth_profile_update()
        test_absensi()
        test_slot_kosong()
        test_receipts()
        test_charts()
        test_wali_role()
        test_progress_with_nilai()
        
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
