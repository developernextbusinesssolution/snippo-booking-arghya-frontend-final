import { useState, useEffect } from "react";
import { MNS, DS, TIMES, cal, fmtDur } from "../../utils/helpers";
import Progress from "../Shared/Progress";
import StaffDetailsModal from "../Shared/StaffDetailsModal";
import { apiRequest } from "../../utils/api";

function StepDate({ sel, onSel }) {
  const now = new Date();
  const [mn, setMn] = useState(now.getMonth());
  const [yr, setYr] = useState(now.getFullYear());
  const days = cal(yr, mn);
  const selStr = sel ? `${sel.getFullYear()}-${sel.getMonth()}-${sel.getDate()}` : "";

  return (
    <div className="se anim-fade-in">
      <div className="glass" style={{ padding: 24, maxWidth: 450, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button className="btn btn-g btn-sm btn-icon" onClick={() => (mn === 0 ? (setMn(11), setYr(y => y - 1)) : setMn(m => m - 1))}>‹</button>
          <span style={{ fontWeight: 800, fontSize: 16 }}>{MNS[mn]} {yr}</span>
          <button className="btn btn-g btn-sm btn-icon" onClick={() => (mn === 11 ? (setMn(0), setYr(y => y + 1)) : setMn(m => m + 1))}>›</button>
        </div>
        <div className="calg">
          {DS.map(d => <div key={d} className="cdn">{d}</div>)}
          {days.map((d, i) => {
            if (!d) return <div key={i} className="cd cem" />;
            const date = new Date(yr, mn, d);
            const past = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const today = d === now.getDate() && mn === now.getMonth() && yr === now.getFullYear();
            return (
              <div
                key={i}
                className={`cd${past ? " cpast" : ""}${today ? " ctoday" : ""}${selStr === `${yr}-${mn}-${d}` ? " csel" : ""}`}
                onClick={() => !past && onSel(date)}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepTime({ sel, onSel, busySlots, stf, staff, date, onBackToDate }) {
  const dayName = date ? date.toLocaleDateString("en-US", { weekday: "long" }) : "";
  const dateStr = date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }) : "";

  const blockedTimes = (busySlots || [])
    .filter(b => (!stf || b.staffId === stf.id) && b.dt === dateStr)
    .map(b => b.t);

  const isTimeInRange = (t, start, end) => {
    if (!start || !end) return true;
    return t >= start && t <= end;
  };

  const getDayAvail = (s, dName) => {
    if (s.availability && s.availability.length === 7) {
      return s.availability.find(a => a.day === dName);
    }
    // Fallback to legacy avail array
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const idx = DAYS.indexOf(dName);
    if (idx === -1) return null;
    return { enabled: !!s.avail?.[idx], startTime: "09:00", endTime: "18:00" };
  };

  const filteredTimes = TIMES.filter(t => {
    if (blockedTimes.includes(t)) return false;
    
    if (stf) {
      const av = getDayAvail(stf, dayName);
      if (!av || !av.enabled) return false;
      return isTimeInRange(t, av.startTime, av.endTime);
    } else {
      // If no staff selected, show time if AT LEAST ONE staff is available
      return staff.some(s => {
        if (!s.active) return false;
        const av = getDayAvail(s, dayName);
        if (!av || !av.enabled) return false;
        return isTimeInRange(t, av.startTime, av.endTime);
      });
    }
  });

  if (filteredTimes.length === 0) {
    return (
      <div className="se anim-fade-in" style={{ textAlign: "center", padding: 40 }}>
        <div className="glass" style={{ padding: 40, borderRadius: 24, background: "rgba(230,57,70,0.05)" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
          <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: "var(--red)" }}>No Slots Available</h3>
          <p style={{ color: "var(--muted)", maxWidth: 350, margin: "0 auto 24px" }}>
            There are no available slots for {date?.toLocaleDateString("en-US", { month: "long", day: "numeric" })}.
          </p>
          <button className="btn btn-g" onClick={() => onBackToDate()}>Return to Calendar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="se anim-fade-in">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 16, textAlign: "center" }}>SELECT A TIME SLOT</div>
        <div className="tg">
          {TIMES.map(t => {
            const isBlocked = blockedTimes.includes(t);
            const isOutsideWorkingHours = !filteredTimes.includes(t);
            const disabled = isBlocked || isOutsideWorkingHours;
            
            return (
              <div
                key={t}
                className={`ts${disabled ? " tbk" : ""}${sel === t ? " tsel" : ""}`}
                onClick={() => !disabled && onSel(t)}
                style={isOutsideWorkingHours ? { opacity: 0.3, cursor: "not-allowed" } : {}}
              >
                {(() => {
                  const hour = parseInt(t.split(":")[0], 10);
                  const ampm = hour >= 12 ? "PM" : "AM";
                  const hour12 = hour % 12 || 12;
                  return `${hour12}:00 ${ampm}`;
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepService({ sel, onSel, services }) {
  const [showModal, setShowModal] = useState(false);
  const [pendingSvc, setPendingSvc] = useState(null);

  const handleClick = (s) => {
    setPendingSvc(s);
    setShowModal(true);
  };

  const handleAccept = () => {
    onSel(pendingSvc);
    setShowModal(false);
  };

  return (
    <div className="se anim-fade-in">
      <div className="sg">
        {services.filter(s => s.active).map(s => (
          <div key={s.id} className={`scard ${sel?.id === s.id ? "sel" : ""}`} onClick={() => handleClick(s)}>
            <div className="simg">
              {s.img ? <img src={s.img} alt={s.name} /> : <div className="simg-fb">🧖</div>}
            </div>
            <div className="sbody">
              <div className="sname">{s.name}</div>
              <div className="sdesc">{s.desc}</div>
              <div className="smeta">
                <span className="sprice">${s.price}</span>
                <span className="sdur">⏱ {fmtDur(s.dur)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="glass anim-fade-in" style={{ maxWidth: 450, padding: 32, textAlign: "center", border: "1px solid rgba(230,57,70,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎙️</div>
            <h3 style={{ marginBottom: 16, fontWeight: 900 }}>Booking Terms</h3>
            <p style={{ lineHeight: 1.6, marginBottom: 28, fontSize: 15, color: "var(--text)" }}>
              Studio Recording $60 per hour initial booking. 2hr minimum required, after initial booking each additional hour is $60 per session
            </p>
            <button className="btn btn-p" style={{ width: "100%", padding: "14px" }} onClick={handleAccept}>I accepted</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepStaff({ sel, onSel, staff, svcId, date, time, onDetails, onBackToSvc, onBackToTime }) {
  const dayName = date ? date.toLocaleDateString("en-US", { weekday: "long" }) : "";
  
  const isTimeInRange = (t, start, end) => {
    if (!start || !end) return true;
    return t >= start && t <= end;
  };

  const getDayAvail = (s, dName) => {
    if (s.availability && s.availability.length === 7) {
      return s.availability.find(a => a.day === dName);
    }
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const idx = DAYS.indexOf(dName);
    if (idx === -1) return null;
    return { enabled: !!s.avail?.[idx], startTime: "09:00", endTime: "18:00" };
  };

  const list = staff.filter(s => {
    if (!s.active) return false;
    if (svcId && !s.services.includes(svcId)) return false;
    
    // Check if staff is available on this day and time
    if (dayName && time) {
      const av = getDayAvail(s, dayName);
      if (!av || !av.enabled) return false;
      if (!isTimeInRange(time, av.startTime, av.endTime)) return false;
    }
    return true;
  });
  if (list.length === 0) {
    return (
      <div className="se anim-fade-in" style={{ textAlign: "center", padding: 40 }}>
        <div className="glass" style={{ padding: 40 }}>
          <h3>No Specialists Available</h3>
          <button className="btn btn-g" onClick={onBackToSvc}>Change Service</button>
        </div>
      </div>
    );
  }
  return (
    <div className="se anim-fade-in">
      <div className="staffg" style={{ gap: 16 }}>
        {list.map(s => (
          <div key={s.id} className={`stcard ${sel?.id === s.id ? "sel" : ""}`} style={{ padding: 16 }}>
            <div onClick={() => onSel(s)} style={{ cursor: "pointer" }}>
              <div className="avt" style={{ width: 64, height: 64, margin: "0 auto 12px", background: `linear-gradient(135deg,${s.c},rgba(0,0,0,.3))` }}>
                {s.profileImage ? <img src={s.profileImage} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.i}
              </div>
              <div style={{ fontWeight: 800 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.role}</div>
            </div>
            <button className="btn btn-g btn-sm" style={{ marginTop: 12, width: "100%" }} onClick={() => onDetails(s)}>Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepAccount({ det, onChange, user, onLoginClick }) {
  if (user) return (
    <div className="se anim-fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Profile Details</h3>
        <p style={{ fontWeight: 700, marginBottom: 20, wordBreak: "break-all" }}>{user.name} ({user.email})</p>
        
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>BILLING ADDRESS (Required for Stripe India)</div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <input className="inp" style={{ gridColumn: "span 2" }} placeholder="Street Address" value={det.address || ""} onChange={e => onChange({ ...det, address: e.target.value })} />
            <input className="inp" placeholder="City" value={det.city || ""} onChange={e => onChange({ ...det, city: e.target.value })} />
            <input className="inp" placeholder="Zip / Postal Code" value={det.zip || ""} onChange={e => onChange({ ...det, zip: e.target.value })} />
            <input className="inp" placeholder="State / Province" value={det.state || ""} onChange={e => onChange({ ...det, state: e.target.value })} />
            <input className="inp" placeholder="Country (e.g., US, IN)" value={det.country || ""} onChange={e => onChange({ ...det, country: e.target.value.toUpperCase().slice(0, 2) })} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="se anim-fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="glass" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800 }}>Create Your Account</h3>
          <button className="btn btn-g btn-sm" onClick={onLoginClick}>Sign In Instead</button>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <input className="inp" style={{ gridColumn: "span 2" }} placeholder="Full Name" value={det.name || ""} onChange={e => onChange({ ...det, name: e.target.value })} />
          <input className="inp" style={{ gridColumn: "span 2" }} type="email" placeholder="Email" value={det.email || ""} onChange={e => onChange({ ...det, email: e.target.value })} />
          <input className="inp" type="password" placeholder="Password" value={det.password || ""} onChange={e => onChange({ ...det, password: e.target.value })} />
          <input className="inp" placeholder="Phone" value={det.phone || ""} onChange={e => onChange({ ...det, phone: e.target.value })} />
          
          <div style={{ gridColumn: "span 2", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>BILLING ADDRESS (Required for Stripe India)</div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              <input className="inp" style={{ gridColumn: "span 2" }} placeholder="Street Address" value={det.address || ""} onChange={e => onChange({ ...det, address: e.target.value })} />
              <input className="inp" placeholder="City" value={det.city || ""} onChange={e => onChange({ ...det, city: e.target.value })} />
              <input className="inp" placeholder="Zip / Postal Code" value={det.zip || ""} onChange={e => onChange({ ...det, zip: e.target.value })} />
              <input className="inp" placeholder="State / Province" value={det.state || ""} onChange={e => onChange({ ...det, state: e.target.value })} />
              <input className="inp" placeholder="Country (2-letter code, e.g., US, IN)" value={det.country || ""} onChange={e => onChange({ ...det, country: e.target.value.toUpperCase().slice(0, 2) })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDetails({ svc, peopleCount, setPeopleCount, additionalHours, setAdditionalHours }) {
  const isStudio = svc?.name === "Studio Recording";
  const basePrice = svc?.price || 0;
  const totalPrice = basePrice + (additionalHours * 60);

  return (
    <div className="se anim-fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Booking Details</h3>
        {isStudio && (
          <div className="badge bx" style={{ background: "rgba(230,57,70,0.1)", color: "var(--red)", border: "1px solid var(--red)", padding: "10px 14px", marginBottom: 20, fontSize: 13, lineHeight: 1.5, borderRadius: 12 }}>
            <strong>Studio Recording:</strong> $60 per hour initial booking. 2hr minimum required, after initial booking each additional hour is $60 per session.
          </div>
        )}
        
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>HOW MANY GUEST ARE YOu BRINGING? (MAX 2)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="btn btn-g btn-icon" style={{ borderRadius: "50%", width: 42, height: 42 }} onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}>-</button>
            <span style={{ fontSize: 24, fontWeight: 800, minWidth: 40, textAlign: "center" }}>{peopleCount}</span>
            <button className="btn btn-g btn-icon" style={{ borderRadius: "50%", width: 42, height: 42 }} onClick={() => setPeopleCount(Math.min(2, peopleCount + 1))}>+</button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>ADDITIONAL HOURS ($60/hr)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="btn btn-g btn-icon" style={{ borderRadius: "50%", width: 42, height: 42 }} onClick={() => setAdditionalHours(Math.max(0, additionalHours - 1))}>-</button>
            <span style={{ fontSize: 24, fontWeight: 800, minWidth: 40, textAlign: "center" }}>+{additionalHours}h</span>
            <button className="btn btn-g btn-icon" style={{ borderRadius: "50%", width: 42, height: 42 }} onClick={() => setAdditionalHours(additionalHours + 1)}>+</button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20, marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Total Service Cost:</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: "var(--red)" }}>${totalPrice}</span>
        </div>
      </div>
    </div>
  );
}

function StepIdentity({ det, onChange, user }) {
  if (user && user.idDocument) {
    return (
      <div className="se anim-fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
        <div className="glass" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Identity Verified</h3>
          <p style={{ color: "var(--muted)" }}>Your identity document is already on file.</p>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("File size must be under 5MB");
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...det, idImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="se anim-fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Identity Verification</h3>
        <p style={{ color: "var(--muted)", marginBottom: 20, fontSize: 13, lineHeight: 1.5 }}>
          Please provide a valid government-issued ID (Passport, Driver's License, or State ID). This is required for security purposes.
        </p>

        <div style={{ 
          border: "2px dashed rgba(255,255,255,0.2)", 
          borderRadius: 16, 
          padding: 32, 
          textAlign: "center",
          background: det.idImage ? "rgba(230,57,70,0.05)" : "transparent",
          position: "relative",
          transition: "all 0.2s ease"
        }}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            style={{ 
              position: "absolute", 
              inset: 0, 
              width: "100%", 
              height: "100%", 
              opacity: 0, 
              cursor: "pointer",
              zIndex: 10
            }} 
          />
          {det.idImage ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <div style={{ fontWeight: 700, color: "var(--red)" }}>ID Document Selected</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Click to change file</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📤</div>
              <div style={{ fontWeight: 700 }}>Click to Upload ID</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>JPEG, PNG (Max 5MB)</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingForm({ services, staff, bookings, onUserAuth, onNavigateToPayment, user, onLoginClick }) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [svc, setSvc] = useState(null);
  const [stf, setStf] = useState(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [additionalHours, setAdditionalHours] = useState(0);
  const [det, setDet] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);

  const back = () => setStep(s => Math.max(0, s - 1));
  const next = () => setStep(s => s + 1);

  const handleContinueFromAccount = async () => {
    if (user) {
      if (user.idDocument) handleFinishSummary();
      else setStep(6);
      return;
    }
    if (!det.name || !det.email || !det.password) return alert("Required fields missing");
    setLoading(true);
    try {
      const res = await apiRequest("/auth/check-email", { method: "POST", body: { email: det.email } });
      if (res.exists) {
        setShowEmailExistsModal(true);
        setLoading(false);
        return;
      }
      setStep(6);
    } catch (err) { alert("Check failed"); }
    finally { setLoading(false); }
  };

  const handleFinishSummary = (overrideDet) => {
    const basePrice = svc?.price || 0;
    const totalP = basePrice + (additionalHours * 60);
    const summary = {
      serviceId: svc?.id, staffId: stf?.id, svc: svc?.name, stf: stf?.name,
      dt: date?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }),
      t: time ? (() => {
        const h = parseInt(time.split(":")[0], 10);
        return `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
      })() : time,
      p: `$${totalP}`, det: overrideDet || det,
      peopleCount, additionalHours
    };
    sessionStorage.setItem("last_booking_summary", JSON.stringify(summary));
    onNavigateToPayment("summary");
  };

  const handleFinishRegistration = async () => {
    if (!user) {
      if (!det.idImage) return alert("ID required");
      setLoading(true);
      try {
        const res = await apiRequest("/auth/register-user", { method: "POST", body: det });
        if (res.token && res.user && onUserAuth) onUserAuth({ token: res.token, user: res.user });
      } catch (err) {
        alert(err.message || "Registration failed");
        setLoading(false);
        return;
      }
    }
    handleFinishSummary();
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      console.log("[BookingForm] Syncing user data to fields:", user);
      setDet(prev => {
        const updated = { ...prev };
        let changed = false;

        const fields = ["name", "email", "phone", "address", "city", "state", "zip", "country"];
        fields.forEach(f => {
          if (!updated[f] && user[f]) {
            console.log(`[BookingForm] Pre-filling field: ${f} = ${user[f]}`);
            updated[f] = user[f];
            changed = true;
          }
        });

        return changed ? updated : prev;
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && (step === 5 || step === 6)) {
      // If address is missing and we are on the account step, don't auto-skip
      const hasAddress = det.address && det.city && det.zip && det.country;
      if (step === 5 && !hasAddress) return;

      if (user.idDocument) {
        const updated = {
          ...det,
          name: det.name || user.name || "",
          email: det.email || user.email || "",
          phone: det.phone || user.phone || "",
          address: det.address || user.address || "",
          city: det.city || user.city || "",
          state: det.state || user.state || "",
          zip: det.zip || user.zip || "",
          country: det.country || user.country || ""
        };
        setDet(updated);
        handleFinishSummary(updated);
      }
      else if (step === 5) setStep(6);
    }
  }, [user, step]);

  const steps = ["Date", "Time", "Service", "Staff", "Details", "Account", "Identity"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <Progress step={step} steps={steps} />
      <div style={{ minHeight: 400 }}>
        {step === 0 && <StepDate sel={date} onSel={d => { setDate(d); next(); }} />}
        {step === 1 && <StepTime sel={time} onSel={t => { setTime(t); next(); }} busySlots={bookings} stf={stf} staff={staff} date={date} onBackToDate={back} />}
        {step === 2 && <StepService sel={svc} onSel={s => { setSvc(s); next(); }} services={services} />}
        {step === 3 && <StepStaff sel={stf} onSel={s => { setStf(s); next(); }} staff={staff} svcId={svc?.id} date={date} time={time} onDetails={setSelectedStaff} onBackToSvc={back} onBackToTime={() => setStep(1)} />}
        {step === 4 && <StepDetails svc={svc} peopleCount={peopleCount} setPeopleCount={setPeopleCount} additionalHours={additionalHours} setAdditionalHours={setAdditionalHours} />}
        {step === 5 && <StepAccount det={det} onChange={setDet} user={user} onLoginClick={onLoginClick} />}
        {step === 6 && <StepIdentity det={det} onChange={setDet} user={user} />}
      </div>
      <div className="bfoot" style={{ justifyContent: "center", gap: 16 }}>
        {step > 0 && <button className="btn btn-g" onClick={back}>← Back</button>}
        {step === 4 && <button className="btn btn-p" onClick={next}>Continue →</button>}
        {step === 5 && <button className="btn btn-p" onClick={handleContinueFromAccount} disabled={loading}>{loading ? "Checking..." : "Continue →"}</button>}
        {step === 6 && <button className="btn btn-p" onClick={handleFinishRegistration} disabled={loading}>{loading ? "Processing..." : (user ? "Review Summary →" : "Create Profile →")}</button>}
      </div>
      {selectedStaff && <StaffDetailsModal member={selectedStaff} onClose={() => setSelectedStaff(null)} />}
      {showEmailExistsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="glass anim-fade-in" style={{ maxWidth: 450, width: "100%", padding: 32, textAlign: "center", border: "1px solid rgba(230,57,70,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
            <h3 style={{ marginBottom: 16, fontWeight: 900 }}>Account Already Exists</h3>
            <p style={{ lineHeight: 1.6, marginBottom: 28, fontSize: 15, color: "var(--text)" }}>
              An account with the email <strong>{det.email}</strong> already exists. Would you like to sign in instead?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setShowEmailExistsModal(false)}>Cancel</button>
              <button className="btn btn-p" style={{ flex: 1 }} onClick={() => { setShowEmailExistsModal(false); if(onLoginClick) onLoginClick(); }}>Sign In</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.anim-fade-in { animation: fadeIn 0.4s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
