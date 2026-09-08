import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000/api";

const CROP_CEILINGS = {
  Wheat: 25.0,
  Paddy: 28.0,
  Mustard: 10.0,
};

export default function App() {
  const [portalMode, setPortalMode] = useState("farmer");

  // Farmer State
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("9876543210");
  const [pin, setPin] = useState("1234");
  const [slots, setSlots] = useState([]);
  const [marketSlots, setMarketSlots] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [capacities, setCapacities] = useState({});
  const [activeTab, setActiveTab] = useState("tracker");

  // Booking Form State
  const [village, setVillage] = useState("Taraori");
  const [district, setDistrict] = useState("Karnal");
  const [pincode, setPincode] = useState("132116");
  const [khasraNo, setKhasraNo] = useState("KH-142/08");
  const [registeredAcres, setRegisteredAcres] = useState(2.5);
  const [selectedMandi, setSelectedMandi] = useState("");
  const [crop, setCrop] = useState("Wheat");
  const [qty, setQty] = useState(40);
  const [vehicle, setVehicle] = useState("Tractor Trolley");
  const [isGreenCorridor, setIsGreenCorridor] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeSlot, setTimeSlot] = useState("10:00 AM - 10:30 AM");
  const [moisture, setMoisture] = useState(11.5);
  const [msg, setMsg] = useState("");

  // P2P Swap State
  const [listingTokenId, setListingTokenId] = useState("");
  const [swapReason, setSwapReason] = useState("Machinery/Harvester delayed");

  // Ticket Cancellation State
  const [cancellingTokenId, setCancellingTokenId] = useState("");
  const [cancelReason, setCancelReason] = useState("Harvest not ready / Labor delay");

  // Driver WhatsApp Share State
  const [sharingTokenId, setSharingTokenId] = useState("");
  const [driverPhone, setDriverPhone] = useState("");

  // Admin Portal State
  const [adminUser, setAdminUser] = useState(null);
  const [adminId, setAdminId] = useState("APMC-KARNAL-01");
  const [adminPin, setAdminPin] = useState("9999");
  const [adminStats, setAdminStats] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);

  // Assayer Bench State
  const [assayTokenId, setAssayTokenId] = useState("TKN-101");
  const [measuredMoisture, setMeasuredMoisture] = useState(12.5);
  const [foreignMatter, setForeignMatter] = useState(0.5);
  const [assayerNotes, setAssayerNotes] = useState("Standard physical probe inspection passed.");
  const [assayMsg, setAssayMsg] = useState("");
  const [isSubmittingAssay, setIsSubmittingAssay] = useState(false);

  const maxAllowable = (parseFloat(registeredAcres || 0) * (CROP_CEILINGS[crop] || 25.0)).toFixed(1);
  const isOverCeiling = parseFloat(qty) > parseFloat(maxAllowable);

  const handleFarmerLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data);
        fetchSlots(data.phone);
        fetchMarketSlots(data.phone);
        fetchNearestMandis();
        fetchCapacities();
      }
    } catch (err) {
      alert("Backend connection failed.");
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId, pin: adminPin }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminUser(data);
        fetchAdminStats();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Admin login failed.");
    }
  };

  const fetchSlots = async (userPhone) => {
    try {
      const res = await fetch(`${API_BASE}/queue-status/${userPhone}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMarketSlots = async (userPhone) => {
    try {
      const res = await fetch(`${API_BASE}/swap-market?exclude_phone=${userPhone}`);
      const data = await res.json();
      setMarketSlots(data.market_slots || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard-stats`);
      const data = await res.json();
      setAdminStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNearestMandis = async () => {
    try {
      const res = await fetch(`${API_BASE}/nearest-mandis`);
      const data = await res.json();
      setMandis(data || []);
      if (data && data.length > 0) setSelectedMandi(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCapacities = async () => {
    try {
      const res = await fetch(`${API_BASE}/slot-capacities`);
      const data = await res.json();
      setCapacities(data || {});
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/book-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user.phone,
          farmer_name: user.name,
          village,
          district,
          pincode,
          khasra_no: khasraNo,
          registered_acres: parseFloat(registeredAcres),
          mandi_id: selectedMandi,
          crop,
          quantity_quintals: parseFloat(qty),
          vehicle_type: vehicle,
          is_green_corridor: isGreenCorridor,
          booking_date: date,
          time_slot: timeSlot,
          moisture_percent: parseFloat(moisture),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(data.alert || `Pass ${data.token.id} created with HQ security QR!`);
        fetchSlots(user.phone);
        fetchCapacities();
        setActiveTab("tracker");
      }
    } catch (err) {
      alert("Error booking slot.");
    }
  };

  const handleWeatherReschedule = async (token, safeDate) => {
    try {
      const res = await fetch(`${API_BASE}/reschedule-weather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_id: token.id,
          phone: user.phone,
          target_date: safeDate,
          target_slot: "10:00 AM - 10:30 AM",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(data.message);
        fetchSlots(user.phone);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Rescheduling request failed.");
    }
  };

  const handleListForSwap = async (tokenId) => {
    try {
      const res = await fetch(`${API_BASE}/list-for-swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_id: tokenId, reason: swapReason }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(data.message);
        setListingTokenId("");
        fetchSlots(user.phone);
        fetchMarketSlots(user.phone);
      }
    } catch (err) {
      alert("Error listing slot.");
    }
  };

  const handleExecuteSwap = async (targetTokenId) => {
    if (slots.length === 0) {
      alert("You need an active slot to trade with another farmer!");
      return;
    }
    const myToken = slots[0];
    try {
      const res = await fetch(`${API_BASE}/execute-swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          my_token_id: myToken.id,
          target_token_id: targetTokenId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(data.message);
        fetchSlots(user.phone);
        fetchMarketSlots(user.phone);
        setActiveTab("tracker");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Swap execution failed.");
    }
  };

  const handleCancelSlot = async (tokenId) => {
    try {
      const res = await fetch(`${API_BASE}/cancel-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_id: tokenId,
          phone: user.phone,
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(data.message);
        setCancellingTokenId("");
        fetchSlots(user.phone);
        fetchCapacities();
        fetchMarketSlots(user.phone);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to cancel slot.");
    }
  };

  const handleSendToDriver = (token) => {
    if (!driverPhone || driverPhone.trim().length < 10) {
      alert("Please enter a valid 10-digit mobile number for the driver.");
      return;
    }

    const cleanPhone = driverPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = 
`🌾 *KISANSETU APMC MANDI GATE PASS*
━━━━━━━━━━━━━━━━━━━━━━
🚜 *Pass ID:* ${token.id}
👤 *Farmer:* ${token.farmer_name}
📍 *Mandi Destination:* ${token.assigned_mandi}
🚪 *Designated Bay:* ${token.assigned_bay}
⏰ *Arrival Window:* ${token.time_slot} (${token.booking_date})
⚖️ *Allocated Load:* ${token.quantity_quintals} Qtl (${token.crop})
🚚 *Vehicle Type:* ${token.vehicle_type}
🔐 *HQ Digital Sig:* ${token.hq_hash}

🗺️ *Gate #2 Navigation:* https://maps.google.com/?q=29.8000,76.9200
━━━━━━━━━━━━━━━━━━━━━━
_Show this pass at Gate Checkpost #2 for priority entry._`;

    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
    window.open(waUrl, "_blank");
    setSharingTokenId("");
    setDriverPhone("");
  };

  const handleAdminVerify = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/admin/verify-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_qr_input: scanInput.trim() }),
      });
      const data = await res.json();
      setScanResult(data);
      if (data.success && data.token) {
        setAssayTokenId(data.token.id);
        setMeasuredMoisture(data.token.moisture_percent || 12.0);
      }
      fetchAdminStats();
      if (user) fetchSlots(user.phone);
    } catch (err) {
      alert("Verification request failed.");
    }
  };

  const handleQualitySubmit = async () => {
    if (!assayTokenId || assayTokenId.trim() === "") {
      alert("Please specify a Token ID first (e.g., TKN-101) or click any row in the yard manifest.");
      return;
    }

    const moistureVal = parseFloat(measuredMoisture);
    const foreignVal = parseFloat(foreignMatter);

    if (isNaN(moistureVal) || moistureVal < 5 || moistureVal > 30) {
      alert("Please enter a realistic moisture percentage between 5% and 30%.");
      return;
    }

    setIsSubmittingAssay(true);
    setAssayMsg("");

    try {
      const res = await fetch(`${API_BASE}/admin/assess-quality`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_id: assayTokenId.trim(),
          measured_moisture: moistureVal,
          foreign_matter_percent: isNaN(foreignVal) ? 0.0 : foreignVal,
          assayer_notes: assayerNotes || "Standard probe test certified"
        }),
      });

      const data = await res.json();
      setIsSubmittingAssay(false);

      if (data.success) {
        setAssayMsg(data.message);
        fetchAdminStats();
        if (user) fetchSlots(user.phone);
      } else {
        alert(data.message || "Failed to certify quality.");
      }
    } catch (err) {
      setIsSubmittingAssay(false);
      console.error(err);
      alert("Network Error: Could not connect to FastAPI backend on http://127.0.0.1:8000.");
    }
  };

  return (
    <div className="app-container">
      {/* Universal Mode Switcher */}
      <div className="top-banner-bar">
        <div className="banner-left">
          <span>🏛️ Ministry of Consumer Affairs, Food & Public Distribution</span>
        </div>
        <div className="mode-toggle-group">
          <button
            className={`mode-btn ${portalMode === "farmer" ? "active" : ""}`}
            onClick={() => setPortalMode("farmer")}
          >
            🌾 Farmer Portal
          </button>
          <button
            className={`mode-btn admin ${portalMode === "admin" ? "active" : ""}`}
            onClick={() => { setPortalMode("admin"); if (adminUser) fetchAdminStats(); }}
          >
            🛡️ Mandi Official / HQ Scanner
          </button>
        </div>
      </div>

      {/* 1. FARMER PORTAL */}
      {portalMode === "farmer" && (
        <>
          {!user ? (
            <div className="auth-wrapper">
              <div className="auth-card">
                <div className="logo-badge">🌾 KisanSetu</div>
                <h2>Farmer Access Portal</h2>
                <p className="subtitle">Book verified mandi delivery slots with dynamic queue routing</p>
                <form onSubmit={handleFarmerLogin}>
                  <div className="input-group">
                    <label>Registered Mobile Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Security PIN</label>
                    <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} required />
                  </div>
                  <button type="submit" className="primary-btn">Enter Farmer Portal</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="dashboard-container">
              <header className="navbar">
                <div className="brand">
                  <span className="logo-icon">🌾</span>
                  <div>
                    <strong>KisanSetu</strong>
                    <span className="sub-text">Farmer Delivery Scheduling & P2P Swap</span>
                  </div>
                </div>
                <div className="user-info">
                  <span>{user.name} ({user.village})</span>
                  <button className="text-btn" onClick={() => setUser(null)}>Logout</button>
                </div>
              </header>

              <nav className="tab-bar">
                <button
                  className={activeTab === "tracker" ? "active" : ""}
                  onClick={() => { setActiveTab("tracker"); setMsg(""); }}
                >
                  My HQ QR Passes
                </button>
                <button
                  className={activeTab === "swap" ? "active" : ""}
                  onClick={() => { setActiveTab("swap"); fetchMarketSlots(user.phone); }}
                >
                  🔄 P2P Slot Swap Board {marketSlots.length > 0 && <span className="tab-count">({marketSlots.length})</span>}
                </button>
                <button
                  className={activeTab === "book" ? "active" : ""}
                  onClick={() => { setActiveTab("book"); fetchNearestMandis(); }}
                >
                  Schedule Delivery Slot
                </button>
                <button
                  className={activeTab === "payments" ? "active" : ""}
                  onClick={() => { setActiveTab("payments"); setMsg(""); }}
                >
                  💰 DBT Disbursal Status
                </button>
              </nav>

              <main className="content-body">
                {activeTab === "tracker" && (
                  <div className="section">
                    <h3>Active Mandi Passes & Security Badges</h3>
                    {msg && <div className="alert-banner">{msg}</div>}
                    {slots.length === 0 ? (
                      <p className="empty-state">No passes active. Use the Schedule Delivery Slot tab to book.</p>
                    ) : (
                      <div className="grid-cards">
                        {slots.map((s) => {
                          const hqPayload = JSON.stringify({
                            tkn: s.id,
                            sig: s.hq_hash,
                            crop: s.crop,
                            qty: s.quantity_quintals,
                            bay: s.assigned_bay
                          });

                          return (
                            <div key={s.id} className="token-card">
                              <div className="token-header">
                                <div>
                                  <span className="token-id">{s.id}</span>
                                  <span className="bay-badge">{s.assigned_bay}</span>
                                </div>
                                <span className={`status-pill ${s.status.toLowerCase().replace(/\s+/g, "-")}`}>
                                  {s.status}
                                </span>
                              </div>

                              {s.status === "Booked" && s.has_weather_risk && (
                                <div className="rain-alert-card">
                                  <div className="rain-alert-header">
                                    <span>🌧️ <strong>Mandi Rain Guard ({s.rain_prob}% Risk)</strong></span>
                                    <span className="rain-risk-tag">Moisture Spoilage Danger</span>
                                  </div>
                                  <p className="rain-desc">
                                    Heavy precipitation detected near {s.assigned_mandi}. Uncovered grain waiting in open trolleys risks moisture penalties or total rejection.
                                  </p>
                                  <button
                                    type="button"
                                    className="rain-reschedule-btn"
                                    onClick={() => handleWeatherReschedule(s, s.safe_date)}
                                  >
                                    🛡️ Rain-Safe Reschedule to {s.safe_date} (Clear Skies)
                                  </button>
                                </div>
                              )}

                              {s.is_listed_for_swap && (
                                <div className="swap-listed-badge">
                                  🔄 Listed on Swap Board: "{s.swap_reason}"
                                </div>
                              )}

                              <div className="qr-container">
                                <QRCodeSVG value={hqPayload} size={110} level={"H"} />
                                <div className="qr-meta">
                                  <strong>HQ Security QR Pass</strong>
                                  <span className="security-sig">Sig: {s.hq_hash}</span>
                                  <p>Scan at Gate #2 terminal for instant check-in.</p>
                                </div>
                              </div>

                              <div className="details-table">
                                <div><span>Crop & Net Load:</span> <strong>{s.crop} ({s.quantity_quintals} Qtl)</strong></div>
                                <div><span>Destination:</span> <strong>{s.assigned_mandi}</strong></div>
                                <div><span>Arrival Window:</span> <strong>{s.time_slot} ({s.booking_date})</strong></div>
                                <div><span>Moisture & Grade:</span> <strong>{s.moisture_percent}% ({s.quality_grade})</strong></div>
                                <div><span>Net MSP Payout:</span> <strong className="green-text">₹{s.net_payout?.toLocaleString()}</strong></div>
                              </div>

                              {s.status === "Booked" && (
                                <div className="driver-share-box">
                                  {sharingTokenId === s.id ? (
                                    <div className="driver-input-card">
                                      <label>Driver's Mobile Number (WhatsApp):</label>
                                      <div className="driver-input-row">
                                        <input
                                          type="tel"
                                          placeholder="Enter 10-digit number"
                                          value={driverPhone}
                                          onChange={(e) => setDriverPhone(e.target.value)}
                                          maxLength={10}
                                        />
                                        <button
                                          type="button"
                                          className="wa-send-btn"
                                          onClick={() => handleSendToDriver(s)}
                                        >
                                          📲 Open WhatsApp
                                        </button>
                                        <button
                                          type="button"
                                          className="cancel-btn"
                                          onClick={() => { setSharingTokenId(""); setDriverPhone(""); }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="driver-share-btn"
                                      onClick={() => setSharingTokenId(s.id)}
                                    >
                                      📲 Share Gate Pass with Driver (WhatsApp)
                                    </button>
                                  )}
                                </div>
                              )}

                              {!s.is_listed_for_swap && s.status === "Booked" && (
                                <div className="swap-action-box">
                                  {listingTokenId === s.id ? (
                                    <div className="listing-form">
                                      <label>Reason for Delay:</label>
                                      <select value={swapReason} onChange={(e) => setSwapReason(e.target.value)}>
                                        <option value="Machinery/Harvester delayed">Machinery / Harvester Delayed</option>
                                        <option value="Labor shortage for bagging">Labor Shortage for Bagging</option>
                                        <option value="Unseasonal localized rain">Unseasonal Localized Rain</option>
                                        <option value="Need earlier slot">Harvest ready earlier than planned</option>
                                      </select>
                                      <div className="listing-btn-group">
                                        <button type="button" className="confirm-swap-btn" onClick={() => handleListForSwap(s.id)}>
                                          Publish to Swap Board
                                        </button>
                                        <button type="button" className="cancel-btn" onClick={() => setListingTokenId("")}>
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="swap-trigger-btn"
                                      onClick={() => setListingTokenId(s.id)}
                                    >
                                      🔄 Trade / Swap Slot With Another Farmer
                                    </button>
                                  )}
                                </div>
                              )}

                              {s.status === "Booked" && (
                                <div className="cancel-action-box">
                                  {cancellingTokenId === s.id ? (
                                    <div className="listing-form cancel-confirm-form">
                                      <label>Reason for Cancellation:</label>
                                      <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                                        <option value="Harvest not ready / Labor delay">Harvest not ready / Labor delay</option>
                                        <option value="Sold to local PACS / Private Trader">Sold to local PACS / Private Trader</option>
                                        <option value="Transport / Tractor breakdown">Transport / Tractor breakdown</option>
                                        <option value="Weather / Unseasonal Rain">Weather / Unseasonal Rain</option>
                                      </select>
                                      <div className="listing-btn-group">
                                        <button
                                          type="button"
                                          className="danger-confirm-btn"
                                          onClick={() => handleCancelSlot(s.id)}
                                        >
                                          Confirm Ticket Cancellation
                                        </button>
                                        <button
                                          type="button"
                                          className="cancel-btn"
                                          onClick={() => setCancellingTokenId("")}
                                        >
                                          Back
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="cancel-trigger-btn"
                                      onClick={() => setCancellingTokenId(s.id)}
                                    >
                                      🛑 Cancel This Delivery Pass
                                    </button>
                                  )}
                                </div>
                              )}

                              <div className="sms-feed">
                                <div className="sms-feed-header">📡 Real-Time Dispatch Log</div>
                                {s.notification_log?.map((item, i) => (
                                  <div key={i} className="sms-bubble">{item}</div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "swap" && (
                  <div className="section">
                    <div className="swap-board-header">
                      <h3>🔄 Peer-to-Peer Mandi Slot Exchange</h3>
                      <p className="section-desc">
                        Machinery broken or harvest ready earlier than planned? Trade delivery windows directly with neighboring farmers.
                      </p>
                    </div>

                    {msg && <div className="alert-banner">{msg}</div>}

                    {marketSlots.length === 0 ? (
                      <div className="empty-swap-state">
                        <p>No open swap listings from other farmers in your district right now.</p>
                        <small>When other farmers face delays, their listed slots will appear here for instant trade.</small>
                      </div>
                    ) : (
                      <div className="grid-cards">
                        {marketSlots.map((m) => (
                          <div key={m.id} className="token-card swap-market-card">
                            <div className="token-header">
                              <span className="token-id">{m.id}</span>
                              <span className="swap-available-pill">Available for Trade</span>
                            </div>

                            <div className="swap-profile">
                              <strong>Farmer: {m.farmer_name}</strong>
                              <span className="swap-address">{m.farmer_address}</span>
                            </div>

                            <div className="swap-highlight-box">
                              <div className="swap-time-label">Offered Delivery Window:</div>
                              <div className="swap-time-value">⏰ {m.time_slot} ({m.booking_date})</div>
                              <div className="swap-bay-label">{m.assigned_mandi} • {m.assigned_bay}</div>
                            </div>

                            <div className="reason-quote">
                              <strong>Reason:</strong> "{m.swap_reason}"
                            </div>

                            <div className="details-table" style={{ margin: "0.8rem 0" }}>
                              <div><span>Crop:</span> <strong>{m.crop} ({m.quantity_quintals} Qtl)</strong></div>
                              <div><span>Vehicle:</span> <strong>{m.vehicle_type}</strong></div>
                            </div>

                            <button
                              type="button"
                              className="execute-swap-btn"
                              onClick={() => handleExecuteSwap(m.id)}
                            >
                              🤝 Trade My Current Slot for This ({m.time_slot})
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "book" && (
                  <div className="section narrow">
                    <h3>Schedule Mandi Delivery</h3>
                    <p className="section-desc">Verified land-yield capping and nearest-mandi routing.</p>
                    <form onSubmit={handleBook} className="booking-form">
                      <div className="land-verify-card">
                        <div className="card-title">📜 Verified State Land Record</div>
                        <div className="form-row">
                          <div className="input-group">
                            <label>Khasra Number</label>
                            <input type="text" value={khasraNo} onChange={(e) => setKhasraNo(e.target.value)} required />
                          </div>
                          <div className="input-group">
                            <label>Holding (Acres)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={registeredAcres}
                              onChange={(e) => setRegisteredAcres(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="cap-indicator-box">
                          <span>Yield Cap ({crop}):</span>
                          <strong>{maxAllowable} Quintals max</strong>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label>Select Crop</label>
                          <select value={crop} onChange={(e) => setCrop(e.target.value)}>
                            <option value="Wheat">Wheat (MSP ₹2,275 • Max 25 Qtl/Acre)</option>
                            <option value="Paddy">Paddy (MSP ₹2,183 • Max 28 Qtl/Acre)</option>
                            <option value="Mustard">Mustard (MSP ₹5,650 • Max 10 Qtl/Acre)</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Quantity (Quintals)</label>
                          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} required />
                          {isOverCeiling && (
                            <span className="error-hint">⚠️ Capped to {maxAllowable} Qtl limit.</span>
                          )}
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Target Mandi Center</label>
                        <div className="mandi-selector">
                          {mandis.map((m, index) => (
                            <div
                              key={m.id}
                              className={`mandi-card-option ${selectedMandi === m.id ? "selected" : ""}`}
                              onClick={() => setSelectedMandi(m.id)}
                            >
                              <div className="mandi-title-row">
                                <strong>{m.name}</strong>
                                {index === 0 && <span className="recommended-badge">Closest</span>}
                              </div>
                              <div className="mandi-meta-row">
                                <span>Distance: <strong>{m.distance_km} km</strong></span>
                                <span className={`load-indicator ${m.status.toLowerCase().replace(/\s+/g, "-")}`}>
                                  {m.status}
                                </span>
                              </div>
                              <div className="mandi-weather-subrow">
                                <span>{m.rain_probability >= 60 ? "🌧️" : "☀️"} {m.weather_condition} ({m.rain_probability}% Rain Risk)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label>Vehicle Type</label>
                          <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                            <option value="Pickup Truck (Bolero)">Bolero Pickup (Express Light Bay)</option>
                            <option value="Tractor Trolley">Tractor Trolley (Heavy Tractor Bay)</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Date</label>
                          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Harvest Moisture % (Limit: ≤12%)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="8"
                          max="20"
                          value={moisture}
                          onChange={(e) => setMoisture(e.target.value)}
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label>Select Arrival Window</label>
                        <div className="capacity-selector">
                          {Object.entries(capacities).map(([slotName, info]) => {
                            const isFull = info.booked >= info.max;
                            const isSelected = timeSlot === slotName;
                            return (
                              <div
                                key={slotName}
                                className={`slot-pill ${isSelected ? "selected" : ""} ${isFull ? "disabled" : ""}`}
                                onClick={() => !isFull && setTimeSlot(slotName)}
                              >
                                <span className="slot-name">{slotName}</span>
                                <span className="slot-count">{isFull ? "FULL" : `${info.booked}/${info.max} Trucks`}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button type="submit" className="primary-btn">Generate Official Pass</button>
                    </form>
                  </div>
                )}

                {activeTab === "payments" && (
                  <div className="section">
                    <div className="payment-window-header">
                      <h3>🏦 Direct Benefit Transfer (DBT) & Mandi Settlement Ledger</h3>
                      <p className="section-desc">
                        Official PFMS and RBI e-Kuber treasury integration for transparent Minimum Support Price (MSP) disbursals.
                      </p>
                    </div>

                    {slots.length === 0 ? (
                      <p className="empty-state">No payment records found. Deliver grain through an active pass to initialize DBT.</p>
                    ) : (
                      <div className="grid-cards">
                        {slots.map((s) => {
                          const dbt = s.dbt_details || {};
                          const isCredited = dbt.payout_status?.includes("Credited");

                          return (
                            <div key={s.id} className="token-card payment-card">
                              <div className="token-header">
                                <div>
                                  <span className="token-id">{s.id}</span>
                                  <span className="bay-badge">{s.crop} ({s.quantity_quintals} Qtl)</span>
                                </div>
                                <span className={`status-pill ${isCredited ? "at-weighbridge" : "booked"}`}>
                                  {dbt.payout_status || "Processing"}
                                </span>
                              </div>

                              <div className="payout-amount-box">
                                <span className="payout-amount-label">Net Payable Amount (MSP):</span>
                                <strong className="payout-amount-value">₹{s.net_payout?.toLocaleString()}</strong>
                                <span className="payout-sub">Base MSP: ₹{s.base_msp}/Qtl • {s.quality_grade}</span>
                              </div>

                              <div className="details-table payment-details">
                                <div><span>Beneficiary Name:</span> <strong>{s.farmer_name}</strong></div>
                                <div><span>Masked Aadhaar:</span> <strong>{dbt.aadhaar || "XXXX-XXXX-4819"}</strong></div>
                                <div><span>Bank & Branch:</span> <strong>{dbt.bank || "State Bank of India"}</strong></div>
                                <div><span>Masked Account:</span> <strong>{dbt.account_masked || "••••••••4102"}</strong></div>
                                <div><span>PFMS Treasury Ref:</span> <strong className="mono-text">{dbt.pfms_ref_no || "PFMS-2026-IN-893021"}</strong></div>
                                <div><span>Settlement Channel:</span> <strong>RBI e-Kuber Auto-Clearing</strong></div>
                              </div>

                              <div className="disbursal-pipeline">
                                <div className="pipeline-title">Disbursal Pipeline Progress:</div>
                                <div className="timeline-steps">
                                  <div className="step completed">
                                    <div className="step-dot">✓</div>
                                    <div className="step-info">
                                      <strong>Gate Pass Authorized</strong>
                                      <span>Token validated at entry checkpost</span>
                                    </div>
                                  </div>
                                  <div className={`step ${s.status !== "Booked" ? "completed" : "pending"}`}>
                                    <div className="step-dot">{s.status !== "Booked" ? "✓" : "2"}</div>
                                    <div className="step-info">
                                      <strong>Gross & Tare Weighbridge</strong>
                                      <span>Weighbridge net tonnage verified</span>
                                    </div>
                                  </div>
                                  <div className={`step ${s.status === "Unloaded" ? "completed" : "pending"}`}>
                                    <div className="step-dot">{s.status === "Unloaded" ? "✓" : "3"}</div>
                                    <div className="step-info">
                                      <strong>Quality Assayer Pass</strong>
                                      <span>Moisture inspection sign-off ({s.moisture_percent}%)</span>
                                    </div>
                                  </div>
                                  <div className={`step ${isCredited ? "credited" : "queued"}`}>
                                    <div className="step-dot">{isCredited ? "✓" : "4"}</div>
                                    <div className="step-info">
                                      <strong>DBT Bank Disbursal</strong>
                                      <span>{isCredited ? "Credited to Bank Account" : "Queued in Treasury Batch"}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </main>
            </div>
          )}
        </>
      )}

      {/* 2. MANDI OFFICIAL ADMIN PORTAL */}
      {portalMode === "admin" && (
        <>
          {!adminUser ? (
            <div className="auth-wrapper admin-theme">
              <div className="auth-card admin-card">
                <div className="admin-badge">🛡️ APMC Official Terminal</div>
                <h2>Mandi Gate Control System</h2>
                <p className="subtitle">Department of Consumer Affairs • Live Checkpost Verification</p>
                <form onSubmit={handleAdminLogin}>
                  <div className="input-group">
                    <label>Official Station ID</label>
                    <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Officer Access PIN</label>
                    <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} required />
                  </div>
                  <button type="submit" className="primary-btn admin-btn">Open Mandi Gate Console</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="dashboard-container admin-console">
              <header className="navbar admin-nav">
                <div className="brand">
                  <span className="logo-icon">🛡️</span>
                  <div>
                    <strong>APMC Checkpost Command</strong>
                    <span className="sub-text">{adminUser.mandi} • {adminUser.officer}</span>
                  </div>
                </div>
                <button className="text-btn" onClick={() => setAdminUser(null)}>Lock Console</button>
              </header>

              <main className="content-body wide-admin">
                {adminStats && (
                  <div className="stats-row">
                    <div className="stat-card">
                      <span className="stat-label">Total Passes</span>
                      <strong className="stat-value">{adminStats.total_passes}</strong>
                    </div>
                    <div className="stat-card green">
                      <span className="stat-label">Admitted Today</span>
                      <strong className="stat-value">{adminStats.admitted_today}</strong>
                    </div>
                    <div className="stat-card yellow">
                      <span className="stat-label">Pending in Queue</span>
                      <strong className="stat-value">{adminStats.pending_queue}</strong>
                    </div>
                    <div className="stat-card blue">
                      <span className="stat-label">Green Corridor Trucks</span>
                      <strong className="stat-value">{adminStats.green_corridor_trucks}</strong>
                    </div>
                  </div>
                )}

                <div className="admin-grid">
                  {/* Column 1: QR Scanner */}
                  <div className="scanner-panel">
                    <h3>📷 High-Speed QR Checkpost Scanner</h3>
                    <p className="section-desc">Scan or input the farmer's HQ QR token hash to verify digital authenticity.</p>

                    <div className="scanner-viewfinder">
                      <div className="laser-line"></div>
                      <span>Center QR Ticket in Viewfinder</span>
                    </div>

                    <form onSubmit={handleAdminVerify} className="scanner-input-box">
                      <input
                        type="text"
                        placeholder="Scan / Input Token ID (e.g. TKN-101)"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        required
                      />
                      <button type="submit" className="primary-btn admin-btn">Verify & Clear Boom Barrier</button>
                    </form>

                    {scanResult && (
                      <div className={`scan-feedback ${scanResult.success ? "success" : "danger"}`}>
                        <h4>{scanResult.success ? "✅ ACCESS GRANTED" : "❌ ACCESS DENIED"}</h4>
                        <p>{scanResult.message}</p>
                        {scanResult.token && (
                          <div className="scanned-token-details">
                            <div><span>Vehicle:</span> <strong>{scanResult.token.vehicle_type}</strong></div>
                            <div><span>Admit To:</span> <strong className="green-text">{scanResult.token.assigned_bay}</strong></div>
                            <div><span>Procured:</span> <strong>{scanResult.token.quantity_quintals} Qtl {scanResult.token.crop}</strong></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Moisture Assessment & Quality Check Bench */}
                  <div className="assayer-panel">
                    <div className="assayer-header">
                      <h3>🔬 FCI Moisture & Quality Bench</h3>
                      <span className="assayer-badge">Official Assayer Terminal</span>
                    </div>
                    <p className="section-desc">
                      Log electronic probe moisture tests and physical grain purity to finalize statutory MSP deductions.
                    </p>

                    {assayMsg && <div className="alert-banner">{assayMsg}</div>}

                    <div className="assayer-form">
                      <div className="input-group">
                        <label>Active Lot / Token ID</label>
                        <input
                          type="text"
                          value={assayTokenId}
                          onChange={(e) => setAssayTokenId(e.target.value)}
                          placeholder="e.g. TKN-101"
                        />
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label>Measured Moisture % (Target ≤12%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={measuredMoisture}
                            onChange={(e) => setMeasuredMoisture(e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label>Foreign Matter % (Max 1%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={foreignMatter}
                            onChange={(e) => setForeignMatter(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="moisture-slab-preview">
                        <div className="slab-title">Calculated Grade & Penalty Slab:</div>
                        {parseFloat(measuredMoisture) <= 12.0 ? (
                          <span className="slab-badge optimal">Grade A: 100% MSP Payout (Optimal)</span>
                        ) : parseFloat(measuredMoisture) <= 14.0 ? (
                          <span className="slab-badge warning">
                            Grade B: 1.5% deduction per percent above 12% moisture
                          </span>
                        ) : (
                          <span className="slab-badge danger">
                            Grade C: Heavy Moisture (&gt;14%) • Max 5% penalty
                          </span>
                        )}
                      </div>

                      <div className="input-group">
                        <label>Assayer Notes / Grain Condition</label>
                        <input
                          type="text"
                          value={assayerNotes}
                          onChange={(e) => setAssayerNotes(e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        className="primary-btn assayer-btn"
                        onClick={handleQualitySubmit}
                        disabled={isSubmittingAssay}
                      >
                        {isSubmittingAssay ? "Certifying..." : "⚖️ Certify Quality & Lock DBT Payout"}
                      </button>
                    </div>
                  </div>

                  {/* Column 3: Live Manifest & Disbursal Table */}
                  <div className="yard-feed-panel">
                    <h3>Live Yard Manifest & Treasury Settlement</h3>
                    <div className="table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Token</th>
                            <th>Farmer</th>
                            <th>Crop / Qtl</th>
                            <th>Moisture</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminStats?.all_passes.map((p) => (
                            <tr 
                              key={p.id}
                              onClick={() => {
                                setAssayTokenId(p.id);
                                setMeasuredMoisture(p.moisture_percent || 12.0);
                                setForeignMatter(p.foreign_matter_percent || 0.5);
                              }}
                              style={{ cursor: "pointer" }}
                              title="Click to load into Quality Bench"
                            >
                              <td><strong>{p.id}</strong></td>
                              <td>{p.farmer_name}</td>
                              <td>{p.quantity_quintals} Qtl</td>
                              <td><strong>{p.moisture_percent}%</strong></td>
                              <td>
                                <span className={`table-status ${p.status.toLowerCase().replace(/\s+/g, "-")}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td>
                                {p.status === "At Weighbridge" ? (
                                  <button
                                    className="release-dbt-table-btn"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await fetch(`${API_BASE}/admin/release-payout`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ token_id: p.id })
                                      });
                                      fetchAdminStats();
                                      if (user) fetchSlots(user.phone);
                                    }}
                                  >
                                    💰 Release DBT
                                  </button>
                                ) : (
                                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                    {p.status === "Unloaded" ? "Credited" : "Pending Gate"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          )}
        </>
      )}
    </div>
  );
}