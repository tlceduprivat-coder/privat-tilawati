#!/usr/bin/env python3
"""
Backend Integration Test for Privat Tilawati - INTEGRASI DATA Features
Tests new multi-value features: jadwal multi-hari, slot-kosong multi-lokasi, 
absensi batch, progress batch, keuangan with santriId/program
"""

import requests
import json
import sys

BASE_URL = "https://tilawati-learn.preview.emergentagent.com/api"

# Credentials
ADMIN_EMAIL = "privattilawati@gmail.com"
ADMIN_PASSWORD = "admin123"
ASATIDZ_EMAIL = "guru@privattilawati.id"
ASATIDZ_PASSWORD = "guru123"

admin_token = None
asatidz_token = None
test_guru_id = None
test_santri_id = None

def log(msg):
    print(f"✓ {msg}")

def error(msg):
    print(f"✗ ERROR: {msg}")
    
def test_result(name, passed, details=""):
    if passed:
        print(f"✅ PASS: {name}")
        if details:
            print(f"   {details}")
    else:
        print(f"❌ FAIL: {name}")
        if details:
            print(f"   {details}")
    return passed

# ===== SETUP =====
def setup_auth():
    global admin_token, asatidz_token
    
    print("\n=== SETUP: Authentication ===")
    
    # Login as admin
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if resp.status_code == 200:
        admin_token = resp.json()["token"]
        log(f"Admin login successful")
    else:
        error(f"Admin login failed: {resp.status_code} {resp.text}")
        sys.exit(1)
    
    # Login as asatidz
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": ASATIDZ_EMAIL,
        "password": ASATIDZ_PASSWORD
    })
    if resp.status_code == 200:
        asatidz_token = resp.json()["token"]
        log(f"Asatidz login successful")
    else:
        error(f"Asatidz login failed: {resp.status_code} {resp.text}")
        sys.exit(1)

def setup_test_data():
    global test_guru_id, test_santri_id
    
    print("\n=== SETUP: Test Data ===")
    
    # Create test guru
    resp = requests.post(f"{BASE_URL}/asatidz", 
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"nama": "Ustadz Test Integration", "nomorHp": "08123456789"}
    )
    if resp.status_code == 200:
        test_guru_id = resp.json()["data"]["id"]
        log(f"Created test guru: {test_guru_id}")
    else:
        error(f"Failed to create test guru: {resp.status_code} {resp.text}")
        sys.exit(1)
    
    # Create test santri
    resp = requests.post(f"{BASE_URL}/santri",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"nama": "Santri Test Integration", "umur": 10, "gurId": test_guru_id}
    )
    if resp.status_code == 200:
        test_santri_id = resp.json()["data"]["id"]
        log(f"Created test santri: {test_santri_id}")
    else:
        error(f"Failed to create test santri: {resp.status_code} {resp.text}")
        sys.exit(1)

# ===== TEST 1: Jadwal Multi-Hari =====
def test_jadwal_multi_hari():
    print("\n=== TEST 1: Jadwal Multi-Hari ===")
    
    # Test 1a: POST with array of days
    resp = requests.post(f"{BASE_URL}/jadwal",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "guruId": test_guru_id,
            "guruNama": "Ust X",
            "santriId": test_santri_id,
            "santriNama": "Santri X",
            "program": "Kelas Mandiri (Offline)",
            "hari": ["Senin", "Rabu", "Jumat"],
            "jam": "16:00-17:00",
            "lokasi": "Offline (Home Visit)"
        }
    )
    
    if resp.status_code != 200:
        return test_result("1a. POST jadwal multi-hari", False, f"Status {resp.status_code}: {resp.text}")
    
    data = resp.json().get("data", [])
    if not isinstance(data, list):
        return test_result("1a. POST jadwal multi-hari", False, f"Expected array, got {type(data)}")
    
    if len(data) != 3:
        return test_result("1a. POST jadwal multi-hari", False, f"Expected 3 entries, got {len(data)}")
    
    # Check each entry has unique id and correct hari
    ids = [d.get("id") for d in data]
    haris = [d.get("hari") for d in data]
    
    if len(set(ids)) != 3:
        return test_result("1a. POST jadwal multi-hari", False, f"IDs not unique: {ids}")
    
    if set(haris) != {"Senin", "Rabu", "Jumat"}:
        return test_result("1a. POST jadwal multi-hari", False, f"Hari mismatch: {haris}")
    
    # Check all have guruId, santriId, program
    for d in data:
        if d.get("guruId") != test_guru_id:
            return test_result("1a. POST jadwal multi-hari", False, f"guruId mismatch: {d.get('guruId')}")
        if d.get("santriId") != test_santri_id:
            return test_result("1a. POST jadwal multi-hari", False, f"santriId mismatch: {d.get('santriId')}")
        if d.get("program") != "Kelas Mandiri (Offline)":
            return test_result("1a. POST jadwal multi-hari", False, f"program mismatch: {d.get('program')}")
    
    test_result("1a. POST jadwal multi-hari", True, f"Created 3 entries with unique IDs for Senin, Rabu, Jumat")
    
    # Test 1b: GET jadwal should return all 3 entries
    resp = requests.get(f"{BASE_URL}/jadwal",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    if resp.status_code != 200:
        return test_result("1b. GET jadwal returns 3 entries", False, f"Status {resp.status_code}")
    
    all_jadwal = resp.json().get("data", [])
    matching = [j for j in all_jadwal if j.get("guruId") == test_guru_id and j.get("santriId") == test_santri_id]
    
    if len(matching) < 3:
        return test_result("1b. GET jadwal returns 3 entries", False, f"Expected at least 3, got {len(matching)}")
    
    test_result("1b. GET jadwal returns 3 entries", True, f"Found {len(matching)} entries with guruId, santriId, program stored")
    
    # Test 1c: Fallback - hari as string
    resp = requests.post(f"{BASE_URL}/jadwal",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "guruId": test_guru_id,
            "guruNama": "Ust Y",
            "santriId": test_santri_id,
            "santriNama": "Santri Y",
            "program": "Kelas Ta'lim (Offline)",
            "hari": "Sabtu",
            "jam": "10:00-11:00",
            "lokasi": "Di Tempat Kami"
        }
    )
    
    if resp.status_code != 200:
        return test_result("1c. Fallback: hari as string", False, f"Status {resp.status_code}")
    
    data = resp.json().get("data", [])
    if not isinstance(data, list) or len(data) != 1:
        return test_result("1c. Fallback: hari as string", False, f"Expected array with 1 element, got {len(data) if isinstance(data, list) else 'not array'}")
    
    if data[0].get("hari") != "Sabtu":
        return test_result("1c. Fallback: hari as string", False, f"Expected hari='Sabtu', got {data[0].get('hari')}")
    
    test_result("1c. Fallback: hari as string", True, "String hari converted to array with 1 element")
    
    return True

# ===== TEST 2: Slot Kosong Multi-Lokasi =====
def test_slot_kosong_multi_lokasi():
    print("\n=== TEST 2: Slot Kosong Multi-Lokasi ===")
    
    # Test 2a: POST with array of lokasi
    resp = requests.post(f"{BASE_URL}/slot-kosong",
        headers={"Authorization": f"Bearer {asatidz_token}"},
        json={
            "guruNama": "Ust Y",
            "hari": "Senin",
            "jam": "15:00-16:00",
            "lokasi": ["Offline (Home Visit)", "Online (Zoom/Meet)", "Di Tempat Kami"]
        }
    )
    
    if resp.status_code != 200:
        return test_result("2a. POST slot-kosong multi-lokasi", False, f"Status {resp.status_code}: {resp.text}")
    
    data = resp.json().get("data", {})
    lokasi = data.get("lokasi")
    
    if not isinstance(lokasi, list):
        return test_result("2a. POST slot-kosong multi-lokasi", False, f"Expected lokasi as array, got {type(lokasi)}")
    
    if len(lokasi) != 3:
        return test_result("2a. POST slot-kosong multi-lokasi", False, f"Expected 3 lokasi, got {len(lokasi)}")
    
    expected_lokasi = {"Offline (Home Visit)", "Online (Zoom/Meet)", "Di Tempat Kami"}
    if set(lokasi) != expected_lokasi:
        return test_result("2a. POST slot-kosong multi-lokasi", False, f"Lokasi mismatch: {lokasi}")
    
    slot_id = data.get("id")
    test_result("2a. POST slot-kosong multi-lokasi", True, f"Created slot with 3 lokasi: {lokasi}")
    
    # Test 2b: GET slot-kosong should return entry with lokasi array
    resp = requests.get(f"{BASE_URL}/slot-kosong",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    if resp.status_code != 200:
        return test_result("2b. GET slot-kosong returns lokasi array", False, f"Status {resp.status_code}")
    
    all_slots = resp.json().get("data", [])
    matching = [s for s in all_slots if s.get("id") == slot_id]
    
    if len(matching) != 1:
        return test_result("2b. GET slot-kosong returns lokasi array", False, f"Slot not found")
    
    if not isinstance(matching[0].get("lokasi"), list):
        return test_result("2b. GET slot-kosong returns lokasi array", False, f"lokasi not array in GET response")
    
    test_result("2b. GET slot-kosong returns lokasi array", True, f"Lokasi stored as array: {matching[0].get('lokasi')}")
    
    # Test 2c: Fallback - lokasi as string
    resp = requests.post(f"{BASE_URL}/slot-kosong",
        headers={"Authorization": f"Bearer {asatidz_token}"},
        json={
            "guruNama": "Ust Z",
            "hari": "Selasa",
            "jam": "14:00-15:00",
            "lokasi": "Offline"
        }
    )
    
    if resp.status_code != 200:
        return test_result("2c. Fallback: lokasi as string", False, f"Status {resp.status_code}")
    
    data = resp.json().get("data", {})
    lokasi = data.get("lokasi")
    
    if not isinstance(lokasi, list) or len(lokasi) != 1:
        return test_result("2c. Fallback: lokasi as string", False, f"Expected array with 1 element, got {lokasi}")
    
    if lokasi[0] != "Offline":
        return test_result("2c. Fallback: lokasi as string", False, f"Expected ['Offline'], got {lokasi}")
    
    test_result("2c. Fallback: lokasi as string", True, "String lokasi converted to array ['Offline']")
    
    return True

# ===== TEST 3: Absensi Batch =====
def test_absensi_batch():
    print("\n=== TEST 3: Absensi Batch (Multiple Tanggal) ===")
    
    # Test 3a: POST with entries array
    resp = requests.post(f"{BASE_URL}/absensi",
        headers={"Authorization": f"Bearer {asatidz_token}"},
        json={
            "santriId": test_santri_id,
            "santriNama": "Santri Z",
            "program": "Kelas Mentoring (Offline)",
            "entries": [
                {"tanggal": "2025-06-01", "status": "Hadir", "catatan": "Bagus"},
                {"tanggal": "2025-06-03", "status": "Hadir"},
                {"tanggal": "2025-06-05", "status": "Izin"}
            ]
        }
    )
    
    if resp.status_code != 200:
        return test_result("3a. POST absensi batch", False, f"Status {resp.status_code}: {resp.text}")
    
    result = resp.json()
    data = result.get("data", [])
    count = result.get("count", 0)
    
    if not isinstance(data, list):
        return test_result("3a. POST absensi batch", False, f"Expected data as array, got {type(data)}")
    
    if len(data) != 3 or count != 3:
        return test_result("3a. POST absensi batch", False, f"Expected 3 entries, got data={len(data)}, count={count}")
    
    # Check each entry
    tanggals = [d.get("tanggal") for d in data]
    statuses = [d.get("status") for d in data]
    
    if set(tanggals) != {"2025-06-01", "2025-06-03", "2025-06-05"}:
        return test_result("3a. POST absensi batch", False, f"Tanggal mismatch: {tanggals}")
    
    if statuses.count("Hadir") != 2 or statuses.count("Izin") != 1:
        return test_result("3a. POST absensi batch", False, f"Status mismatch: {statuses}")
    
    # Check all have santriId and program
    for d in data:
        if d.get("santriId") != test_santri_id:
            return test_result("3a. POST absensi batch", False, f"santriId mismatch")
        if d.get("program") != "Kelas Mentoring (Offline)":
            return test_result("3a. POST absensi batch", False, f"program mismatch")
    
    test_result("3a. POST absensi batch", True, f"Created 3 entries: {tanggals} with statuses {statuses}")
    
    # Test 3b: GET absensi with bulan filter
    resp = requests.get(f"{BASE_URL}/absensi?bulan=2025-06",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    if resp.status_code != 200:
        return test_result("3b. GET absensi with bulan filter", False, f"Status {resp.status_code}")
    
    all_absensi = resp.json().get("data", [])
    matching = [a for a in all_absensi if a.get("santriId") == test_santri_id and a.get("tanggal", "").startswith("2025-06")]
    
    if len(matching) < 3:
        return test_result("3b. GET absensi with bulan filter", False, f"Expected at least 3, got {len(matching)}")
    
    test_result("3b. GET absensi with bulan filter", True, f"Found {len(matching)} entries for 2025-06")
    
    # Test 3c: Single-entry POST (fallback)
    resp = requests.post(f"{BASE_URL}/absensi",
        headers={"Authorization": f"Bearer {asatidz_token}"},
        json={
            "santriId": test_santri_id,
            "santriNama": "Santri Single",
            "program": "Kelas Mandiri (Offline)",
            "tanggal": "2025-06-10",
            "status": "Hadir"
        }
    )
    
    if resp.status_code != 200:
        return test_result("3c. Single-entry POST (fallback)", False, f"Status {resp.status_code}")
    
    data = resp.json().get("data", {})
    if isinstance(data, list):
        return test_result("3c. Single-entry POST (fallback)", False, f"Expected single object, got array")
    
    if data.get("tanggal") != "2025-06-10":
        return test_result("3c. Single-entry POST (fallback)", False, f"Tanggal mismatch")
    
    test_result("3c. Single-entry POST (fallback)", True, "Single entry mode still works")
    
    return True

# ===== TEST 4: Progress Batch Kelas Grup =====
def test_progress_batch_grup():
    print("\n=== TEST 4: Progress Batch Kelas Grup ===")
    
    # Create second santri for group test
    resp = requests.post(f"{BASE_URL}/santri",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"nama": "Santri B Integration", "umur": 11, "gurId": test_guru_id}
    )
    
    if resp.status_code != 200:
        error(f"Failed to create second santri: {resp.status_code}")
        return False
    
    santri_b_id = resp.json()["data"]["id"]
    log(f"Created second santri: {santri_b_id}")
    
    # Test 4a: POST with entries array (grup mode)
    resp = requests.post(f"{BASE_URL}/progress",
        headers={"Authorization": f"Bearer {asatidz_token}"},
        json={
            "materi": "Jilid 2",
            "halaman": "hal 1-10",
            "program": "Kelas Ta'lim (Offline)",
            "tipeKelas": "grup",
            "tanggal": "2025-06-10",
            "entries": [
                {
                    "santriId": test_santri_id,
                    "santriNama": "A",
                    "nilai": "A",
                    "nilaiAngka": 90,
                    "catatan": "Bagus"
                },
                {
                    "santriId": santri_b_id,
                    "santriNama": "B",
                    "nilai": "B",
                    "nilaiAngka": 80,
                    "catatan": "Lumayan"
                }
            ]
        }
    )
    
    if resp.status_code != 200:
        return test_result("4a. POST progress batch grup", False, f"Status {resp.status_code}: {resp.text}")
    
    result = resp.json()
    data = result.get("data", [])
    count = result.get("count", 0)
    
    if not isinstance(data, list):
        return test_result("4a. POST progress batch grup", False, f"Expected data as array, got {type(data)}")
    
    if len(data) != 2 or count != 2:
        return test_result("4a. POST progress batch grup", False, f"Expected 2 entries, got data={len(data)}, count={count}")
    
    # Check each entry
    for d in data:
        if d.get("tipeKelas") != "grup":
            return test_result("4a. POST progress batch grup", False, f"tipeKelas should be 'grup', got {d.get('tipeKelas')}")
        if d.get("materi") != "Jilid 2":
            return test_result("4a. POST progress batch grup", False, f"materi mismatch")
        if d.get("tanggal") != "2025-06-10":
            return test_result("4a. POST progress batch grup", False, f"tanggal mismatch")
    
    # Check different santri and nilai
    santri_names = [d.get("santriNama") for d in data]
    nilais = [d.get("nilai") for d in data]
    nilai_angkas = [d.get("nilaiAngka") for d in data]
    
    if set(santri_names) != {"A", "B"}:
        return test_result("4a. POST progress batch grup", False, f"santriNama mismatch: {santri_names}")
    
    if set(nilais) != {"A", "B"}:
        return test_result("4a. POST progress batch grup", False, f"nilai mismatch: {nilais}")
    
    if set(nilai_angkas) != {90, 80}:
        return test_result("4a. POST progress batch grup", False, f"nilaiAngka mismatch: {nilai_angkas}")
    
    test_result("4a. POST progress batch grup", True, f"Created 2 entries with tipeKelas='grup', same materi/tanggal, different santri & nilai")
    
    # Test 4b: Single mode (mandiri)
    resp = requests.post(f"{BASE_URL}/progress",
        headers={"Authorization": f"Bearer {asatidz_token}"},
        json={
            "santriId": test_santri_id,
            "santriNama": "Santri Mandiri",
            "materi": "Jilid 1",
            "halaman": "hal 5",
            "program": "Kelas Mandiri (Offline)",
            "tipeKelas": "mandiri",
            "tanggal": "2025-06-11"
        }
    )
    
    if resp.status_code != 200:
        return test_result("4b. Single mode (mandiri)", False, f"Status {resp.status_code}")
    
    data = resp.json().get("data", {})
    if isinstance(data, list):
        return test_result("4b. Single mode (mandiri)", False, f"Expected single object, got array")
    
    if data.get("tipeKelas") != "mandiri":
        return test_result("4b. Single mode (mandiri)", False, f"tipeKelas should be 'mandiri', got {data.get('tipeKelas')}")
    
    test_result("4b. Single mode (mandiri)", True, "Single entry mode with tipeKelas='mandiri' works")
    
    return True

# ===== TEST 5: Keuangan with santriId & program =====
def test_keuangan_with_santri_program():
    print("\n=== TEST 5: Keuangan with santriId & program ===")
    
    # Test 5a: POST with santriId and program
    resp = requests.post(f"{BASE_URL}/keuangan",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "santriId": test_santri_id,
            "santriNama": "X",
            "program": "Kelas Mandiri (Offline)",
            "bulan": "Juni",
            "nominal": 85000,
            "status": "Belum"
        }
    )
    
    if resp.status_code != 200:
        return test_result("5a. POST keuangan with santriId & program", False, f"Status {resp.status_code}: {resp.text}")
    
    data = resp.json().get("data", {})
    
    if data.get("santriId") != test_santri_id:
        return test_result("5a. POST keuangan with santriId & program", False, f"santriId not stored: {data.get('santriId')}")
    
    if data.get("program") != "Kelas Mandiri (Offline)":
        return test_result("5a. POST keuangan with santriId & program", False, f"program not stored: {data.get('program')}")
    
    if data.get("nominal") != 85000:
        return test_result("5a. POST keuangan with santriId & program", False, f"nominal mismatch: {data.get('nominal')}")
    
    keuangan_id = data.get("id")
    test_result("5a. POST keuangan with santriId & program", True, f"Created with santriId={test_santri_id}, program='Kelas Mandiri (Offline)'")
    
    # Test 5b: GET keuangan should return with santriId and program
    resp = requests.get(f"{BASE_URL}/keuangan",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    if resp.status_code != 200:
        return test_result("5b. GET keuangan returns santriId & program", False, f"Status {resp.status_code}")
    
    all_keuangan = resp.json().get("data", [])
    matching = [k for k in all_keuangan if k.get("id") == keuangan_id]
    
    if len(matching) != 1:
        return test_result("5b. GET keuangan returns santriId & program", False, f"Keuangan not found")
    
    k = matching[0]
    if k.get("santriId") != test_santri_id:
        return test_result("5b. GET keuangan returns santriId & program", False, f"santriId not in GET response")
    
    if k.get("program") != "Kelas Mandiri (Offline)":
        return test_result("5b. GET keuangan returns santriId & program", False, f"program not in GET response")
    
    test_result("5b. GET keuangan returns santriId & program", True, f"Fields present: santriId={k.get('santriId')}, program={k.get('program')}")
    
    return True

# ===== TEST 6: Verify GET endpoints (no regression) =====
def test_get_endpoints_no_regression():
    print("\n=== TEST 6: Verify GET Endpoints (No Regression) ===")
    
    # Test 6a: GET /api/santri?status=aktif
    resp = requests.get(f"{BASE_URL}/santri?status=aktif",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    if resp.status_code != 200:
        return test_result("6a. GET /api/santri?status=aktif", False, f"Status {resp.status_code}")
    
    data = resp.json().get("data", [])
    if not isinstance(data, list):
        return test_result("6a. GET /api/santri?status=aktif", False, f"Expected array, got {type(data)}")
    
    test_result("6a. GET /api/santri?status=aktif", True, f"Returns list with {len(data)} santri")
    
    # Test 6b: GET /api/asatidz
    resp = requests.get(f"{BASE_URL}/asatidz",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    if resp.status_code != 200:
        return test_result("6b. GET /api/asatidz", False, f"Status {resp.status_code}")
    
    data = resp.json().get("data", [])
    if not isinstance(data, list):
        return test_result("6b. GET /api/asatidz", False, f"Expected array, got {type(data)}")
    
    # Check jumlahSantri field exists
    if len(data) > 0 and "jumlahSantri" not in data[0]:
        return test_result("6b. GET /api/asatidz", False, f"jumlahSantri field missing")
    
    test_result("6b. GET /api/asatidz", True, f"Returns list with jumlahSantri field")
    
    # Test 6c: GET /api/stats
    resp = requests.get(f"{BASE_URL}/stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    if resp.status_code != 200:
        return test_result("6c. GET /api/stats", False, f"Status {resp.status_code}")
    
    data = resp.json()
    required_fields = ["santriAktif", "santriNon", "asatidz", "pendingReg", "lunas", "belum"]
    
    for field in required_fields:
        if field not in data:
            return test_result("6c. GET /api/stats", False, f"Missing field: {field}")
        if not isinstance(data[field], int):
            return test_result("6c. GET /api/stats", False, f"Field {field} should be int, got {type(data[field])}")
    
    test_result("6c. GET /api/stats", True, f"Returns all 6 fields as numbers")
    
    # Test 6d: GET /api/auth/me
    resp = requests.get(f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    if resp.status_code != 200:
        return test_result("6d. GET /api/auth/me", False, f"Status {resp.status_code}")
    
    data = resp.json().get("user", {})
    if not data.get("id") or not data.get("email"):
        return test_result("6d. GET /api/auth/me", False, f"User object incomplete")
    
    test_result("6d. GET /api/auth/me", True, f"Returns user object")
    
    return True

# ===== MAIN =====
def main():
    print("=" * 70)
    print("BACKEND INTEGRATION TEST - INTEGRASI DATA FEATURES")
    print("Testing: Jadwal Multi-Hari, Slot Multi-Lokasi, Absensi Batch,")
    print("         Progress Batch Grup, Keuangan with santriId/program")
    print("=" * 70)
    
    try:
        setup_auth()
        setup_test_data()
        
        results = []
        results.append(("Jadwal Multi-Hari", test_jadwal_multi_hari()))
        results.append(("Slot Kosong Multi-Lokasi", test_slot_kosong_multi_lokasi()))
        results.append(("Absensi Batch", test_absensi_batch()))
        results.append(("Progress Batch Grup", test_progress_batch_grup()))
        results.append(("Keuangan with santriId & program", test_keuangan_with_santri_program()))
        results.append(("GET Endpoints No Regression", test_get_endpoints_no_regression()))
        
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for _, r in results if r)
        total = len(results)
        
        for name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {name}")
        
        print(f"\nTotal: {passed}/{total} tests passed ({passed*100//total}%)")
        
        if passed == total:
            print("\n🎉 ALL INTEGRATION TESTS PASSED!")
            return 0
        else:
            print(f"\n⚠️  {total - passed} test(s) failed")
            return 1
            
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
