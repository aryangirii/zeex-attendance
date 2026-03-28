"use client";
import { QRCodeCanvas } from "qrcode.react";

export default function QRGenerator({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${employeeId}`;

  const download = () => {
    const canvas = document.getElementById(`qr-canvas-${employeeId}`) as HTMLCanvasElement;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `QR-${employeeName}.png`;
    a.click();
  };

  return (
    <div className="flex items-center gap-2">
      <div style={{ display: "none" }}>
        <QRCodeCanvas
          id={`qr-canvas-${employeeId}`}
          value={url}
          size={300}
          level="H"
          includeMargin={true}
        />
      </div>
      <button
        onClick={download}
        className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors">
        Download QR
      </button>
    </div>
  );
}