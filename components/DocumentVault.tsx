"use client";
import { useState } from "react";

type DocType = "aadhaar" | "pan" | "contract" | "profilePhoto";

export default function DocumentVault({
  employeeId,
  token,
}: {
  employeeId: string;
  token: string;
}) {
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [uploaded, setUploaded] = useState<Record<string, string>>({});

  const upload = async (file: File, type: DocType) => {
    setUploading(type);
    try {
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId,
          docType: type,
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { url, key } = await res.json();

      const uploadRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("S3 upload failed");
      setUploaded((p) => ({ ...p, [type]: key }));
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    }
    setUploading(null);
  };

  const DocUpload = ({
    label,
    type,
    accept,
  }: {
    label: string;
    type: DocType;
    accept: string;
  }) => (
    <label className="block cursor-pointer">
      <span className="text-sm text-gray-600 mb-1 block">{label}</span>
      <div
        className={`border-2 border-dashed rounded-lg px-4 py-3 text-center transition-colors ${
          uploaded[type]
            ? "border-green-400 bg-green-50"
            : "border-gray-200 hover:border-purple-400"
        }`}
      >
        {uploading === type ? (
          <span className="text-purple-500 text-sm">Uploading...</span>
        ) : uploaded[type] ? (
          <span className="text-green-600 text-sm">✓ Uploaded successfully</span>
        ) : (
          <span className="text-gray-400 text-sm">Click to upload</span>
        )}
      </div>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) =>
          e.target.files?.[0] && upload(e.target.files[0], type)
        }
      />
    </label>
  );

  return (
    <div className="space-y-3">
      <DocUpload label="Profile Photo" type="profilePhoto" accept="image/*" />
      <DocUpload label="Aadhaar Card" type="aadhaar" accept="image/*,.pdf" />
      <DocUpload label="PAN Card" type="pan" accept="image/*,.pdf" />
      <DocUpload
        label="Contract / Offer Letter"
        type="contract"
        accept="image/*,.pdf"
      />
    </div>
  );
}