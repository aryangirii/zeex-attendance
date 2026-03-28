"use client";
import { useState, useEffect } from "react";

type DocType = "aadhaar" | "pan" | "contract" | "profilePhoto";

const DOC_LABELS: Record<DocType, string> = {
  profilePhoto: "Profile Photo",
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  contract: "Contract / Offer Letter",
};

const DOC_FIELDS: Record<DocType, string> = {
  profilePhoto: "profilePhotoUrl",
  aadhaar: "aadhaarUrl",
  pan: "panUrl",
  contract: "contractUrl",
};

function ViewButton({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition-colors">
      View
    </a>
  );
}

function DocRow({ type, urls, uploading, onUpload }: {
  type: DocType;
  urls: Record<string, string>;
  uploading: DocType | null;
  onUpload: (file: File, type: DocType) => void;
}) {
  const existingUrl = urls[type];
  const isImage = type === "profilePhoto" || type === "aadhaar" || type === "pan";

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {existingUrl && isImage ? (
          <img src={existingUrl} className="w-10 h-10 rounded-lg object-cover border border-gray-200" onError={e => (e.currentTarget.style.display = "none")} />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg">
            {type === "contract" ? "📄" : type === "profilePhoto" ? "🖼️" : "🪪"}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-700">{DOC_LABELS[type]}</p>
          <p className="text-xs text-gray-400">{existingUrl ? "Uploaded ✓" : "Not uploaded"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {existingUrl && <ViewButton url={existingUrl} />}
        <label className="cursor-pointer">
          <span className={`text-xs px-3 py-1.5 rounded-lg transition-colors inline-block ${
            uploading === type ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : existingUrl ? "bg-orange-50 hover:bg-orange-100 text-orange-700"
            : "bg-purple-50 hover:bg-purple-100 text-purple-700"
          }`}>
            {uploading === type ? "Uploading..." : existingUrl ? "Re-upload" : "Upload"}
          </span>
          <input
            type="file"
            accept={type === "profilePhoto" ? "image/*" : "image/*,.pdf"}
            className="hidden"
            disabled={uploading === type}
            onChange={e => e.target.files?.[0] && onUpload(e.target.files[0], type)}
          />
        </label>
      </div>
    </div>
  );
}

export default function DocumentVault({ employeeId, token, employee, onUpdate }: {
  employeeId: string;
  token: string;
  employee: any;
  onUpdate: () => void;
}) {
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const existing: Record<string, string> = {};
    Object.entries(DOC_FIELDS).forEach(([type, field]) => {
      if (employee?.[field]) existing[type] = employee[field];
    });
    setUrls(existing);
  }, [employee]);

  const upload = async (file: File, type: DocType) => {
    setUploading(type);
    try {
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employeeId, docType: type, fileName: file.name, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { url, publicUrl } = await res.json();

      const uploadRes = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("S3 upload failed");

      const saveRes = await fetch("/api/admin/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "updateDocs", id: employeeId, docType: type, url: publicUrl }),
      });
      if (!saveRes.ok) throw new Error("Failed to save URL to database");

      setUrls(p => ({ ...p, [type]: publicUrl }));
      onUpdate();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    }
    setUploading(null);
  };

  return (
    <div>
      <DocRow type="profilePhoto" urls={urls} uploading={uploading} onUpload={upload} />
      <DocRow type="aadhaar" urls={urls} uploading={uploading} onUpload={upload} />
      <DocRow type="pan" urls={urls} uploading={uploading} onUpload={upload} />
      <DocRow type="contract" urls={urls} uploading={uploading} onUpload={upload} />
    </div>
  );
}