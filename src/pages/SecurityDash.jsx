import React, { useState, useEffect, Fragment } from "react";
import Toasts, { useToast } from "../components/Shared/Toasts";
import { apiRequest } from "../utils/api";

export default function SecurityDash({ user: initialUser, onSignOut, token, initialTab = "shifts", initialDate = null, onTabChange, onDateChange }) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState(initialTab);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAvail, setSavingAvail] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showVerifyModal, setShowVerifyModal] = useState(null); // Booking object to verify
  const { toasts, toast } = useToast();

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [avail, setAvail] = useState(initialUser?.availability || DAYS.map(d => ({ day: d, enabled: d !== "Saturday" && d !== "Sunday", startTime: "09:00", endTime: "20:00" })));

  useEffect(() => { setTab(initialTab); }, [initialTab]);
  useEffect(() => { setSelectedDate(initialDate); }, [initialDate]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/security/shifts", { token });
      setBookings(res.bookings || []);
    } catch (e) {
      toast(e.message || "Failed to load shifts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (initialTab && initialTab !== tab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (onTabChange) onTabChange(newTab);
    if (newTab !== 'shifts') {
      setSelectedDate(null);
      if (onDateChange) onDateChange(null);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    if (onDateChange) onDateChange(newDate);
  };

  const handleVerify = async (booking) => {
    console.log(`[SecurityDash] Verifying booking ${booking.id}...`);
    try {
      const res = await apiRequest(`/security/bookings/${booking.id}/verify`, { method: "POST", token });
      console.log(`[SecurityDash] Verification successful for ${booking.id}. Response:`, res);
      toast("Booking verified successfully!", "success");
      setShowVerifyModal(null);
      fetchShifts();
    } catch (e) {
      console.error(`[SecurityDash] Verification failed for ${booking.id}:`, e);
      toast(e.message || "Verification failed", "error");
    }
  };

  const saveAvail = async () => {
    console.log("[SecurityDash] Saving availability:", avail);
    setSavingAvail(true);
    try {
      const res = await apiRequest("/security/availability", { method: "PUT", token, body: { availability: avail } });
      console.log("[SecurityDash] Save successful. Response:", res);
      setAvail(res.availability);
      toast("Availability saved!", "success");
    } catch (e) {
      console.error("[SecurityDash] Save failed:", e);
      toast(e.message || "Failed to save availability", "error");
    } finally {
      setSavingAvail(false);
    }
  };

  const bmap = { upcoming: "bu", completed: "bc", cancelled: "bx", active: "ba" };

  // Group bookings by Date, then by Time Slot
  const groupedShifts = bookings.reduce((acc, b) => {
    const date = b.dt;
    const time = b.t;
    if (!acc[date]) acc[date] = {};
    if (!acc[date][time]) acc[date][time] = [];
    acc[date][time].push(b);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedShifts).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="dash">
      <div className="sidebar">
        <div style={{ padding: "9px 10px 13px", borderBottom: "1px solid var(--border)", marginBottom: 7 }}>
          <div className="avt" style={{ background: `linear-gradient(135deg,#10b981,rgba(0,0,0,.3))`, width: 36, height: 36, fontSize: 13, marginBottom: 7 }}>
            {user?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.name || "Security"}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{user?.roleTitle || "Security Officer"}</div>
        </div>
        
        <div className={`sitem ${tab === "shifts" ? "act" : ""}`} onClick={() => handleTabChange("shifts")}>
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </span>
          Duty Schedule
        </div>

        <div className={`sitem ${tab === "availability" ? "act" : ""}`} onClick={() => handleTabChange("availability")}>
          <span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </span>
          Availability
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div className="sitem" style={{ color: "var(--red)" }} onClick={onSignOut}>
            <span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            Sign Out
          </div>
        </div>
      </div>

      <div className="ca">
        {tab === "shifts" && (
          <>
            <h1 className="sh">Duty Schedule & Verification</h1>
            <p className="ss">Showing bookings that fall under your availability. Use the calendar to navigate dates.</p>
            
            {!selectedDate ? (
              <>
                <h1 className="sh">Duty Schedule & Verification</h1>
                <p className="ss">Select a date from the calendar to view detailed bookings and perform verification.</p>
                <div className="glass" style={{ padding: 24, maxWidth: 440 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                    <div className="badge bw">Calendar Navigation</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 900, color: 'var(--muted2)', padding: '5px 0' }}>{d}</div>
                    ))}
                    {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                      const day = i + 1;
                      const dateObj = new Date(new Date().getFullYear(), new Date().getMonth(), day);
                      const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      const urlDate = `${dateStr.replace(' ', '-')}-${dateObj.getFullYear()}`;
                      const dayBookings = bookings.filter(b => b.dt.includes(dateStr));
                      const isToday = day === new Date().getDate() && new Date().getMonth() === new Date().getMonth();
                      const isSelected = selectedDate === urlDate;
                      
                      return (
                        <div 
                          key={i} 
                          onClick={() => handleDateChange(urlDate)}
                          style={{ 
                            aspectRatio: '1/1', 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            borderRadius: 10, 
                            cursor: 'pointer',
                            background: isSelected ? 'var(--p)' : (isToday ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)'),
                            border: isToday ? '1px solid var(--p)' : '1px solid transparent',
                            transition: 'all .2s'
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#fff' : 'inherit' }}>{day}</span>
                          {dayBookings.length > 0 && (
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : 'var(--p)', marginTop: 2 }}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
                   <button 
                     className="btn btn-g btn-sm" 
                     onClick={() => handleDateChange(null)}
                     style={{ borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                   >
                     ←
                   </button>
                   <div>
                     <h1 className="sh" style={{ margin: 0 }}>Duty for {selectedDate.split('-').slice(0,2).join(' ')}</h1>
                     <p className="ss" style={{ margin: 0 }}>Showing verified and pending check-ins for this session.</p>
                   </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading verification slots...</div>
                  ) : bookings.filter(b => b.dt.includes(selectedDate.split('-').slice(0, 2).join(' '))).length === 0 ? (
                    <div className="glass" style={{ padding: 40, textAlign: "center" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>No bookings found</div>
                      <p style={{ color: "var(--muted)", fontSize: 13 }}>There are no bookings matching your availability for this date.</p>
                      <button className="btn btn-p btn-sm" style={{ marginTop: 15 }} onClick={() => handleDateChange(null)}>Back to Calendar</button>
                    </div>
                  ) : (
                    bookings.filter(b => b.dt.includes(selectedDate.split('-').slice(0, 2).join(' '))).map(b => (
                      <div key={b.id} className="glass" style={{ padding: 18, borderLeft: `4px solid ${b.verifiedBySecurity ? 'var(--success)' : 'var(--p)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase' }}>{b.dt} • {b.t}</div>
                            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>{b.u}</div>
                          </div>
                          <div className="badge bc" style={{ height: 'fit-content' }}>#{b.id}</div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15, background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800 }}>SPECIALIST</div>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{b.stf}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 800 }}>SERVICE</div>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{b.svc}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>
                            👥 {b.peopleCount || 1} Guests
                          </div>
                          {b.verifiedBySecurity ? (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: 13 }}>✓ VERIFIED</div>
                              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>STAMP: {b.verifiedByName || "Security"}</div>
                            </div>
                          ) : (
                            <button className="btn btn-p btn-sm" onClick={() => setShowVerifyModal(b)}>Verify Details</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Verify Confirmation Modal ── */}
        {showVerifyModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div className="glass" style={{ maxWidth: 400, width: '100%', padding: 30, textAlign: 'center', border: '1px solid var(--p)' }}>
              <div style={{ fontSize: 40, marginBottom: 15 }}>🛡️</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Confirm Verification</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 25 }}>
                Are you sure? We are verifying all the details are correct for booking <strong style={{color:'var(--text)'}}>#{showVerifyModal.id}</strong>?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setShowVerifyModal(null)}>Cancel</button>
                <button className="btn btn-p" style={{ flex: 1 }} onClick={() => handleVerify(showVerifyModal)}>Yes, Verify</button>
              </div>
            </div>
          </div>
        )}

        {tab === "availability" && (
          <div style={{ maxWidth: 640 }}>
            <h1 className="sh">Shift Availability</h1>
            <p className="ss">Set your active working hours. Customers will see these slots in the booking system if assigned.</p>
            
            <div className="glass" style={{ padding: "20px 24px" }}>
              {DAYS.map((d, index) => {
                const dayAvail = avail.find(a => a.day === d) || { day: d, enabled: false, startTime: "09:00", endTime: "20:00" };
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: index < 6 ? "1px solid var(--border)" : "none", gap: 15, flexWrap: 'wrap' }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 120 }}>
                      <input 
                        type="checkbox" 
                        checked={dayAvail.enabled} 
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                        onChange={e => {
                          const newAvail = [...avail];
                          const foundIdx = newAvail.findIndex(a => a.day === d);
                          if (foundIdx > -1) newAvail[foundIdx].enabled = e.target.checked;
                          else newAvail.push({ day: d, enabled: e.target.checked, startTime: "09:00", endTime: "20:00" });
                          setAvail(newAvail);
                        }}
                      />
                      <span style={{ fontWeight: 600, color: dayAvail.enabled ? "var(--text)" : "var(--muted)" }}>{d}</span>
                    </div>

                    {dayAvail.enabled ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input 
                          type="time" 
                          className="inp" 
                          style={{ padding: '4px 8px', width: 110, height: 32, fontSize: 13 }}
                          value={dayAvail.startTime}
                          onChange={e => {
                            const newAvail = [...avail];
                            newAvail.find(a => a.day === d).startTime = e.target.value;
                            setAvail(newAvail);
                          }}
                        />
                        <span style={{ color: "var(--muted)" }}>to</span>
                        <input 
                          type="time" 
                          className="inp" 
                          style={{ padding: '4px 8px', width: 110, height: 32, fontSize: 13 }}
                          value={dayAvail.endTime}
                          onChange={e => {
                            const newAvail = [...avail];
                            newAvail.find(a => a.day === d).endTime = e.target.value;
                            setAvail(newAvail);
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ color: "var(--muted)", fontSize: 13, fontStyle: 'italic' }}>Off Duty</div>
                    )}
                  </div>
                );
              })}
              
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px dashed var(--border)" }}>
                <button className={`btn btn-p ${savingAvail ? "loading" : ""}`} onClick={saveAvail} disabled={savingAvail} style={{ width: '100%', maxWidth: 200 }}>
                  {savingAvail ? "Saving..." : "Save Availability"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bnav">
        <div className={`bni ${tab === "shifts" ? "act" : ""}`} onClick={() => handleTabChange("shifts")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Shifts</span>
        </div>
        <div className={`bni ${tab === "availability" ? "act" : ""}`} onClick={() => handleTabChange("availability")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Availability</span>
        </div>
      </div>
      
      <Toasts toasts={toasts} />
    </div >   
  );
}
