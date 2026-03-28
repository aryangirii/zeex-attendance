"use client";
import { useState } from "react";

export default function DocumentVault({ employeeId, token }: { employeeId: string; token: string }) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});

  const upload = async (file: File, type: "aadhaar" | "pan" | "contract") => {
    setUploading(type);
    try {
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employeeId, docType: type, fileName: file.name }),
      });
      const { url } = await res.json();
      await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setUploaded(p => ({ ...p, [type]: true }));
    } catch {
      alert("Upload failed. Try again.");
    }
    setUploading(null);
  };

  const DocUpload = ({ label, type }: { label: string; type: "aadhaar" | "pan" | "contract" }) => (
    <label className="block cursor-pointer">
      <span className="text-sm text-gray-600 mb-1 block">{label}</span>
      <div className={`border-2 border-dashed rounded-lg px-4 py-3 text-center transition-colors ${
        uploaded[type] ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-purple-400"
      }`}>
        {uploading === type ? (
          <span className="text-purple-500 text-sm">Uploading...</span>
        ) : uploaded[type] ? (
          <span className="text-green-600 text-sm">Uploaded</span>
        ) : (
          <span className="text-gray-400 text-sm">Click to upload</span>
        )}
      </div>
      <input
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={e => e.target.files?.[0] && upload(e.target.files[0], type)}
      />
    </label>
  );

  return (
    <div className="space-y-3">
      <DocUpload label="Aadhaar Card" type="aadhaar" />
      <DocUpload label="PAN Card" type="pan" />
      <DocUpload label="Contract / Offer Letter" type="contract" />
    </div>
  );
}