"use client";
import { useEffect, useState, use } from "react";
import PunchButton from "@/components/PunchButton";
import Barcode from "react-barcode";

export default function ScanPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = use(params);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/employee/${employeeId}`)
      .then(r => r.json())
      .then(data => { setEmployee(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [employeeId]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f1b2d", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#8899aa", fontSize: 14 }}>Loading profile...</p>
    </div>
  );

  if (!employee || employee.error) return (
    <div style={{ minHeight: "100vh", background: "#0f1b2d", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#ff6b6b", fontSize: 14 }}>Employee not found</p>
    </div>
  );

  const isActive = employee.status === "active";

  return (
    <div style={{ minHeight: "100vh", background: "#0f1b2d", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{
        width: "100%", maxWidth: 360,
        background: "linear-gradient(160deg, #0f1b2d 0%, #1a2e4a 50%, #0f1b2d 100%)",
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.08)"
      }}>

        {/* Top header */}
        <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#fff"
            }}>Z</div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>Zeex AI</span>
          </div>

          {/* Profile photo */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.2)",
              overflow: "hidden", margin: "0 auto",
              background: "#1a3a5c"
            }}>
              <img
                src={employee.profilePhotoUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=1a3a5c&color=fff&size=100`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            {/* Active dot */}
            <div style={{
              position: "absolute", bottom: 4, right: 4,
              width: 16, height: 16, borderRadius: "50%",
              background: isActive ? "#22c55e" : "#ef4444",
              border: "2px solid #0f1b2d"
            }} />
          </div>

          {/* Name & role */}
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 4px", letterSpacing: 1, textTransform: "uppercase" }}>
            {employee.fullName}
          </h1>
          <p style={{ color: "#8899bb", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 20px" }}>
            {employee.role}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />

        {/* Details section */}
        <div style={{ padding: "20px 24px" }}>

          {/* Status badge */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{
              display: "inline-block",
              padding: "6px 20px", borderRadius: 20,
              fontSize: 12, fontWeight: 600, letterSpacing: 1,
              background: isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              color: isActive ? "#22c55e" : "#ef4444",
              border: `1px solid ${isActive ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}>
              {isActive ? "✓ VERIFIED — ACTIVE" : "✗ ACCESS DENIED"}
            </span>
          </div>

          {/* Info rows */}
          {[
            ["ID No", employee.employeeId],
            ["Email", employee.email],
            ["Phone", employee.mobile],
            ["Office", employee.assignedOffice],
            ["Joined", employee.dateOfJoining],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)"
            }}>
              <span style={{ color: "#5a7a9a", fontSize: 12 }}>{label}</span>
              <span style={{ color: "#ccd9e8", fontSize: 13, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Real scannable barcode */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <Barcode
            value={employee.employeeId}
            width={1.5}
            height={50}
            fontSize={11}
            background="transparent"
            lineColor="#ffffff"
            displayValue={true}
            font="monospace"
            textAlign="center"
            textPosition="bottom"
            textMargin={4}
            margin={0}
          />
          <p style={{ color: "#3a5a7a", fontSize: 10, textAlign: "center", letterSpacing: 3, margin: "6px 0 0" }}>
            ZEEX AI PRIVATE LIMITED
          </p>
        </div>

        {/* Punch buttons */}
        <div style={{ padding: "0 24px 24px" }}>
          {isActive ? (
            <PunchButton employeeId={employeeId} employeeName={employee.fullName} />
          ) : (
            <div style={{
              textAlign: "center", padding: "12px",
              background: "rgba(239,68,68,0.1)",
              borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444", fontSize: 13
            }}>
              Attendance actions disabled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}