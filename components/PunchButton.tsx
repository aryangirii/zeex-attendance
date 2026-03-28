"use client";
import { useState } from "react";

export default function PunchButton({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const getDeviceId = () => {
    let id = localStorage.getItem("deviceId");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("deviceId", id); }
    return id;
  };

  const handlePunch = async (type: "in" | "out") => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const res = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId, employeeName, type,
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
          deviceId: getDeviceId(),
        }),
      });
      if (res.ok) setLastAction(`Punch ${type.toUpperCase()} at ${new Date().toLocaleTimeString()}`);
      else alert("Failed. Try again.");
    } catch (err: any) {
      if (err.code === 1) alert("Allow location access to punch in/out.");
      else alert("Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 16 }}>
      {lastAction && (
        <div style={{
          textAlign: "center", padding: "8px 12px", marginBottom: 12,
          background: "rgba(34,197,94,0.1)", borderRadius: 10,
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#22c55e", fontSize: 12
        }}>{lastAction}</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button onClick={() => handlePunch("in")} disabled={loading} style={{
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff", border: "none", borderRadius: 14,
          padding: "14px", fontSize: 15, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1
        }}>
          {loading ? "..." : "Punch In"}
        </button>
        <button onClick={() => handlePunch("out")} disabled={loading} style={{
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "#fff", border: "none", borderRadius: 14,
          padding: "14px", fontSize: 15, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1
        }}>
          {loading ? "..." : "Punch Out"}
        </button>
      </div>
      <p style={{ textAlign: "center", color: "#3a5a7a", fontSize: 11, marginTop: 8 }}>
        Location access required for attendance
      </p>
    </div>
  );
}