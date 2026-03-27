import { useState, useEffect } from "react";
import BrandLogo from "../components/Shared/BrandLogo";
import BookingForm from "../components/Booking/BookingForm";

const IMAGES = [
  "https://snippo.com/wp-content/uploads/2026/03/Gemini_Generated_Image_dd81sgdd81sgdd81-scaled.png",
  "https://snippo.com/wp-content/uploads/2026/03/Gemini_Generated_Image_cmuqe8cmuqe8cmuq-scaled.png",
  "https://snippo.com/wp-content/uploads/2026/03/Gemini_Generated_Image_42xzze42xzze42xz-1-scaled.png",
  "https://snippo.com/wp-content/uploads/2026/02/Gemini_Generated_Image_9wn7gp9wn7gp9wn7-1-2048x1143.jpg",
  "https://snippo.com/wp-content/uploads/2026/02/Gemini_Generated_Image_2i7vw82i7vw82i7v-1-2048x1143.jpg"
];

export default function HomePage({ 
  user, services, staff, bookings, busySlots, 
  onCreateBooking, onUserAuth, onNavigateToPayment, onGoDash, stripeKey, token,
  onLoginClick,
  embedMode = false 
}) {
  const [curr, setCurr] = useState(0);

  useEffect(() => {
    const itv = setInterval(() => setCurr(c => (c + 1) % IMAGES.length), 5000);
    return () => clearInterval(itv);
  }, []);

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      background: "var(--bg)",
      flexDirection: window.innerWidth < 1000 ? "column" : "row"
    }}>
      {/* Left: Image Slider (Fixed) */}
      <div style={{ 
        flex: 1, 
        position: "relative", 
        overflow: "hidden",
        minHeight: window.innerWidth < 1000 ? "45vh" : "100vh"
      }}>
        {IMAGES.map((src, i) => (
          <div
            key={src}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === curr ? 1 : 0,
              transition: "opacity 1s ease-in-out",
              background: `url(${src}) center/cover no-repeat`
            }}
          >
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)"
            }} />
          </div>
        ))}
        
        {/* Slider Overlay Info */}
        <div style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          zIndex: 2,
          color: "#fff"
        }}>
          <div style={{
            background: "var(--red)",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 10,
            fontWeight: 700,
            display: "inline-block",
            marginBottom: 12,
            letterSpacing: ".05em"
          }}>PREMIUM STUDIO EXPERIENCE</div>
          <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-.03em", marginBottom: 8 }}>Start Your Journey</h2>
          <p style={{ opacity: 0.8, fontSize: 13, maxWidth: 350 }}>Join Snippo Entertainment today. Create your artist profile and connect with professional specialists.</p>
        </div>
      </div>

      {/* Right: Inline Booking Flow */}
      <div style={{ 
        flex: 1.2, 
        padding: window.innerWidth < 1000 ? "24px 16px" : "40px", 
        paddingTop: window.innerWidth < 1000 ? "24px" : "calc(var(--nh) + 40px)",
        maxHeight: window.innerWidth < 1000 ? "none" : "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <BrandLogo />
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>500+</div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>ARTISTS</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>24/7</div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>ACCESS</div>
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: 32, borderRadius: 24 }}>
            <BookingForm
              user={user}
              services={services}
              staff={staff}
              bookings={busySlots || bookings}
              onUserAuth={onUserAuth}
              onGoDash={onGoDash}
              onNavigateToPayment={onNavigateToPayment}
              onLoginClick={onLoginClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
