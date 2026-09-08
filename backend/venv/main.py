from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from datetime import date
import math
import hashlib

app = FastAPI(title="KisanSetu Unified Mandi Procurement & Logistics Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Official agro-climatic state yield limits (Quintals/Acre)
CROP_YIELD_CAPS = {
    "Wheat": 25.0,
    "Paddy": 28.0,
    "Mustard": 10.0
}

USERS_DB = {
    "9876543210": {
        "name": "Ramesh Kumar",
        "pin": "1234",
        "village": "Taraori",
        "district": "Karnal",
        "pincode": "132116",
        "registered_acres": 2.5,
        "khasra_no": "KH-142/08",
        "aadhaar_masked": "XXXX-XXXX-4819",
        "bank_name": "State Bank of India (IFSC: SBIN0001234)"
    },
    "9123456780": {
        "name": "Suresh Singh",
        "pin": "1234",
        "village": "Nilokheri",
        "district": "Karnal",
        "pincode": "132117",
        "registered_acres": 1.8,
        "khasra_no": "KH-99/12",
        "aadhaar_masked": "XXXX-XXXX-8921",
        "bank_name": "Punjab National Bank (IFSC: PUNB0123400)"
    }
}

ADMIN_CREDENTIALS = {
    "admin_id": "APMC-KARNAL-01",
    "pin": "9999",
    "officer": "Inspector V. Sharma"
}

MANDI_CENTERS = [
    {"id": "MND-01", "name": "Taraori Sub-Mandi Yard", "district": "Karnal", "lat": 29.8000, "lon": 76.9200, "active_trucks": 3, "status": "Optimal Load"},
    {"id": "MND-02", "name": "Karnal Central Main Mandi", "district": "Karnal", "lat": 29.6857, "lon": 76.9907, "active_trucks": 14, "status": "Heavy Congestion"},
    {"id": "MND-03", "name": "Gharaunda Procurement Center", "district": "Karnal", "lat": 29.5414, "lon": 76.9723, "active_trucks": 1, "status": "Fast Clearance"}
]

FARMER_LOCATION = {"lat": 29.8050, "lon": 76.9300}

def generate_hq_hash(token_id: str, farmer_phone: str, crop: str) -> str:
    salt = "DoCA_HQ_SECURE_APMC_2026"
    return hashlib.sha256(f"{token_id}-{farmer_phone}-{crop}-{salt}".encode()).hexdigest()[:16].upper()

def calculate_distance_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)

SLOT_CAPACITY = {
    "09:00 AM - 09:30 AM": 4,
    "09:30 AM - 10:00 AM": 2,
    "10:00 AM - 10:30 AM": 1,
    "10:30 AM - 11:00 AM": 5,
    "11:00 AM - 11:30 AM": 0
}

SLOTS_DB: List[Dict] = [
    {
        "id": "TKN-101",
        "hq_hash": generate_hq_hash("TKN-101", "9876543210", "Wheat"),
        "farmer_phone": "9876543210",
        "farmer_name": "Ramesh Kumar",
        "farmer_address": "Vill: Taraori, Dist: Karnal (132116)",
        "khasra_no": "KH-142/08",
        "registered_acres": 2.5,
        "max_allowable_yield": 62.5,
        "arbitrage_flag": False,
        "assigned_mandi": "Taraori Sub-Mandi Yard (1.2 km away)",
        "crop": "Wheat",
        "quantity_quintals": 45.0,
        "vehicle_type": "Tractor Trolley",
        "is_green_corridor": False,
        "booking_date": str(date.today()),
        "time_slot": "10:00 AM - 10:30 AM",
        "moisture_percent": 11.5,
        "quality_grade": "Grade A (Zero Penalty)",
        "status": "Booked",
        "queue_position": 2,
        "estimated_wait_mins": 25,
        "base_msp": 2275,
        "net_payout": 102375,
        "assigned_bay": "Bay-02 (Heavy Tractor)",
        "is_listed_for_swap": False,
        "dbt_details": {
            "aadhaar": "XXXX-XXXX-4819",
            "bank": "SBI (...4102)",
            "payout_status": "Ready for Auto-Disbursal"
        },
        "notification_log": [
            "HQ Secure Pass issued for Taraori Sub-Mandi Yard (Bay-02).",
            "Proof-of-Harvest Verified: 45 Qtl within legal acreage quota."
        ]
    },
    {
        "id": "TKN-102",
        "hq_hash": generate_hq_hash("TKN-102", "9123456780", "Paddy"),
        "farmer_phone": "9123456780",
        "farmer_name": "Suresh Singh",
        "farmer_address": "Vill: Nilokheri, Dist: Karnal (132117)",
        "khasra_no": "KH-99/12",
        "registered_acres": 1.8,
        "max_allowable_yield": 50.4,
        "arbitrage_flag": False,
        "assigned_mandi": "Taraori Sub-Mandi Yard (1.2 km away)",
        "crop": "Paddy",
        "quantity_quintals": 35.0,
        "vehicle_type": "Pickup Truck (Bolero)",
        "is_green_corridor": False,
        "booking_date": str(date.today()),
        "time_slot": "02:00 PM - 02:30 PM",
        "moisture_percent": 12.0,
        "quality_grade": "Grade A (Zero Penalty)",
        "status": "Booked",
        "queue_position": 1,
        "estimated_wait_mins": 10,
        "base_msp": 2183,
        "net_payout": 76405,
        "assigned_bay": "Bay-01 (Express Light)",
        "is_listed_for_swap": True,
        "swap_reason": "Tractor breakdown - Need earlier or later window",
        "dbt_details": {
            "aadhaar": "XXXX-XXXX-8921",
            "bank": "PNB (...9120)",
            "payout_status": "Ready for Auto-Disbursal"
        },
        "notification_log": ["Slot listed on P2P Swap Board by Suresh Singh."]
    }
]

# Request Models
class LoginRequest(BaseModel):
    phone: str
    pin: str

class AdminLoginRequest(BaseModel):
    admin_id: str
    pin: str

class SlotBookingRequest(BaseModel):
    phone: str
    farmer_name: str
    village: str
    district: str
    pincode: str
    khasra_no: str
    registered_acres: float
    mandi_id: str
    crop: str
    quantity_quintals: float
    vehicle_type: str
    is_green_corridor: bool
    booking_date: str
    time_slot: str
    moisture_percent: float

class AdminVerifyRequest(BaseModel):
    raw_qr_input: str

class ListSwapRequest(BaseModel):
    token_id: str
    reason: str

class ExecuteSwapRequest(BaseModel):
    my_token_id: str
    target_token_id: str

class CancelSlotRequest(BaseModel):
    token_id: str
    phone: str
    reason: str

# Endpoints
@app.post("/api/login")
def login(creds: LoginRequest):
    user = USERS_DB.get(creds.phone)
    if not user or user["pin"] != creds.pin:
        USERS_DB[creds.phone] = {
            "name": "Kisan Demo User", "pin": creds.pin, "village": "Taraori",
            "district": "Karnal", "pincode": "132116", "registered_acres": 2.5,
            "khasra_no": "KH-142/08", "aadhaar_masked": "XXXX-XXXX-9912", "bank_name": "Punjab National Bank"
        }
        user = USERS_DB[creds.phone]
    return {"success": True, "phone": creds.phone, **user}

@app.post("/api/admin/login")
def admin_login(creds: AdminLoginRequest):
    if creds.admin_id == ADMIN_CREDENTIALS["admin_id"] and creds.pin == ADMIN_CREDENTIALS["pin"]:
        return {"success": True, "officer": ADMIN_CREDENTIALS["officer"], "mandi": "Karnal Mandi Gate #2"}
    return {"success": False, "message": "Invalid Admin Credentials."}

@app.get("/api/admin/dashboard-stats")
def get_admin_stats():
    return {
        "total_passes": len(SLOTS_DB),
        "admitted_today": len([s for s in SLOTS_DB if s["status"] in ["At Weighbridge", "Unloaded"]]),
        "pending_queue": len([s for s in SLOTS_DB if s["status"] == "Booked"]),
        "green_corridor_trucks": len([s for s in SLOTS_DB if s.get("is_green_corridor")]),
        "all_passes": SLOTS_DB
    }

@app.post("/api/admin/verify-ticket")
def admin_verify_ticket(req: AdminVerifyRequest):
    search_str = req.raw_qr_input.strip()
    target = next((s for s in SLOTS_DB if s["id"].lower() == search_str.lower() or s["hq_hash"].lower() in search_str.lower()), None)
    
    if not target:
        return {"success": False, "status": "COUNTERFEIT_OR_INVALID", "message": "Security Alert: Invalid Token or Tampered QR Payload!"}

    if target["status"] == "Cancelled":
        return {"success": False, "status": "CANCELLED", "message": f"Denied: Pass {target['id']} was CANCELLED by the farmer."}

    if target["status"] == "At Weighbridge":
        return {"success": False, "status": "ALREADY_USED", "message": f"Pass {target['id']} has already entered the weighbridge!"}

    expected_hash = generate_hq_hash(target["id"], target["farmer_phone"], target["crop"])
    if target["hq_hash"] != expected_hash:
        return {"success": False, "status": "TAMPERED", "message": "Tampered Hash: Digital certificate mismatch!"}

    target["status"] = "At Weighbridge"
    target["queue_position"] = 0
    target["estimated_wait_mins"] = 0
    target["dbt_details"]["payout_status"] = "DBT Disbursal Initialized"
    target["notification_log"].insert(0, f"Gate Entry Authorized by {ADMIN_CREDENTIALS['officer']} at Gate #2 -> {target['assigned_bay']}.")

    return {
        "success": True,
        "status": "AUTHORIZED",
        "message": f"Pass Verified: {target['farmer_name']} cleared for entry!",
        "token": target
    }

@app.post("/api/cancel-slot")
def cancel_slot(req: CancelSlotRequest):
    slot = next((s for s in SLOTS_DB if s["id"] == req.token_id and s["farmer_phone"] == req.phone), None)
    
    if not slot:
        return {"success": False, "message": "Ticket not found or unauthorized."}
    
    if slot["status"] in ["At Weighbridge", "Unloaded"]:
        return {"success": False, "message": "Cannot cancel: Vehicle has already entered the weighbridge."}
    
    if slot["status"] == "Cancelled":
        return {"success": False, "message": "This pass is already cancelled."}

    # 1. Cancel ticket
    slot["status"] = "Cancelled"
    slot["is_listed_for_swap"] = False
    
    # 2. Release capacity
    time_window = slot.get("time_slot")
    if time_window in SLOT_CAPACITY and SLOT_CAPACITY[time_window] > 0:
        SLOT_CAPACITY[time_window] -= 1
        
    # 3. Decrement downstream wait times for others in that bay
    for s in SLOTS_DB:
        if (
            s["assigned_bay"] == slot["assigned_bay"] 
            and s["status"] == "Booked" 
            and s["queue_position"] > slot["queue_position"]
        ):
            s["queue_position"] = max(1, s["queue_position"] - 1)
            s["estimated_wait_mins"] = max(5, s["estimated_wait_mins"] - 15)

    slot["notification_log"].insert(
        0, f"🛑 Ticket cancelled by farmer. Reason: {req.reason}. Bay quota released back to system."
    )
    
    return {
        "success": True, 
        "message": f"Pass {req.token_id} successfully cancelled. Capacity returned to pool.",
        "token": slot
    }

@app.get("/api/swap-market")
def get_swap_market(exclude_phone: str = ""):
    market_slots = [
        s for s in SLOTS_DB
        if s.get("is_listed_for_swap") and s["farmer_phone"] != exclude_phone and s["status"] == "Booked"
    ]
    return {"market_slots": market_slots}

@app.post("/api/list-for-swap")
def list_slot_for_swap(req: ListSwapRequest):
    slot = next((s for s in SLOTS_DB if s["id"] == req.token_id), None)
    if not slot:
        return {"success": False, "message": "Slot not found."}
    slot["is_listed_for_swap"] = True
    slot["swap_reason"] = req.reason
    slot["notification_log"].insert(0, f"🔄 Listed on P2P Swap Board: '{req.reason}'.")
    return {"success": True, "message": f"Token {req.token_id} listed on the Swap Board!"}

@app.post("/api/execute-swap")
def execute_slot_swap(req: ExecuteSwapRequest):
    slot_a = next((s for s in SLOTS_DB if s["id"] == req.my_token_id), None)
    slot_b = next((s for s in SLOTS_DB if s["id"] == req.target_token_id), None)
    if not slot_a or not slot_b:
        return {"success": False, "message": "One or both slots not found."}

    time_a, date_a = slot_a["time_slot"], slot_a["booking_date"]
    slot_a["time_slot"] = slot_b["time_slot"]
    slot_a["booking_date"] = slot_b["booking_date"]
    slot_a["is_listed_for_swap"] = False

    slot_b["time_slot"] = time_a
    slot_b["booking_date"] = date_a
    slot_b["is_listed_for_swap"] = False

    slot_a["notification_log"].insert(0, f"🤝 Traded slot with {slot_b['farmer_name']}. New window: {slot_a['time_slot']}.")
    slot_b["notification_log"].insert(0, f"🤝 Traded slot with {slot_a['farmer_name']}. New window: {slot_b['time_slot']}.")
    return {"success": True, "message": f"Traded slot! Your new delivery window is {slot_a['time_slot']}."}

@app.get("/api/nearest-mandis")
def get_nearest_mandis():
    mandi_list = []
    for m in MANDI_CENTERS:
        dist = calculate_distance_km(FARMER_LOCATION["lat"], FARMER_LOCATION["lon"], m["lat"], m["lon"])
        mandi_list.append({"id": m["id"], "name": m["name"], "distance_km": dist, "active_trucks": m["active_trucks"], "status": m["status"]})
    mandi_list.sort(key=lambda x: x["distance_km"])
    return mandi_list

@app.get("/api/slot-capacities")
def get_slot_capacities():
    return {slot: {"booked": count, "max": 5} for slot, count in SLOT_CAPACITY.items()}

@app.get("/api/queue-status/{phone}")
def get_farmer_slots(phone: str):
    return {"slots": [s for s in SLOTS_DB if s["farmer_phone"] == phone]}

@app.post("/api/book-slot")
def book_slot(req: SlotBookingRequest):
    token_id = f"TKN-{len(SLOTS_DB) + 101}"
    msp_rates = {"Wheat": 2275, "Paddy": 2183, "Mustard": 5650}
    base_rate = msp_rates.get(req.crop, 2200)

    # 1. Proof-of-Harvest Cap Check
    cap_per_acre = CROP_YIELD_CAPS.get(req.crop, 25.0)
    max_allowable_yield = round(req.registered_acres * cap_per_acre, 1)

    arbitrage_flag = False
    booked_quantity = req.quantity_quintals
    alert_msg = None

    if booked_quantity > max_allowable_yield:
        arbitrage_flag = True
        booked_quantity = max_allowable_yield
        alert_msg = f"⚠️ Capped: Claimed quantity exceeded legal ceiling ({max_allowable_yield} Qtl for {req.registered_acres} Acres)."

    # 2. Moisture Quality Evaluation
    deduction_rate = 0.0
    if req.moisture_percent <= 12.0:
        quality_grade = "Grade A (Optimal - 100% MSP)"
    elif 12.0 < req.moisture_percent <= 14.0:
        excess = req.moisture_percent - 12.0
        deduction_rate = round((excess * 0.015) * base_rate, 2)
        quality_grade = f"Grade B (₹{deduction_rate}/Qtl deduction)"
    else:
        quality_grade = "Grade C (Heavy Moisture: Advisory to Sun-Dry)"
        deduction_rate = round(0.05 * base_rate, 2)

    net_rate = max(base_rate - deduction_rate, 1000)
    final_payment = int(net_rate * booked_quantity)

    # 3. Bay Assignment
    assigned_bay = "Bay-00 (FPO Green Corridor)" if req.is_green_corridor else ("Bay-01 (Express Light)" if "Bolero" in req.vehicle_type or "Pickup" in req.vehicle_type else "Bay-02 (Heavy Tractor)")

    selected_mandi = next((m for m in MANDI_CENTERS if m["id"] == req.mandi_id), MANDI_CENTERS[0])
    dist = calculate_distance_km(FARMER_LOCATION["lat"], FARMER_LOCATION["lon"], selected_mandi["lat"], selected_mandi["lon"])
    hq_security_hash = generate_hq_hash(token_id, req.phone, req.crop)

    # Increment slot count
    SLOT_CAPACITY[req.time_slot] = SLOT_CAPACITY.get(req.time_slot, 0) + 1

    new_booking = {
        "id": token_id,
        "hq_hash": hq_security_hash,
        "farmer_phone": req.phone,
        "farmer_name": req.farmer_name,
        "farmer_address": f"Vill: {req.village}, Dist: {req.district} ({req.pincode})",
        "khasra_no": req.khasra_no,
        "registered_acres": req.registered_acres,
        "max_allowable_yield": max_allowable_yield,
        "arbitrage_flag": arbitrage_flag,
        "assigned_mandi": f"{selected_mandi['name']} ({dist} km away)",
        "crop": req.crop,
        "quantity_quintals": booked_quantity,
        "vehicle_type": req.vehicle_type,
        "is_green_corridor": req.is_green_corridor,
        "booking_date": req.booking_date,
        "time_slot": req.time_slot,
        "moisture_percent": req.moisture_percent,
        "quality_grade": quality_grade,
        "status": "Booked",
        "queue_position": len(SLOTS_DB) + 1,
        "estimated_wait_mins": 5 if req.is_green_corridor else 20,
        "base_msp": base_rate,
        "net_payout": final_payment,
        "assigned_bay": assigned_bay,
        "is_listed_for_swap": False,
        "dbt_details": {"aadhaar": USERS_DB.get(req.phone, {}).get("aadhaar_masked", "XXXX-XXXX-9912"), "bank": "SBI Mandi Branch", "payout_status": "Ready for Auto-Disbursal"},
        "notification_log": [f"HQ Cryptographic Token generated: {token_id} (Sig: {hq_security_hash})"]
    }
    SLOTS_DB.append(new_booking)
    return {"success": True, "token": new_booking, "alert": alert_msg}