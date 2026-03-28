"use client";
import { useState, useEffect } from "react";
import { loginAdmin, logoutAdmin, getToken } from "@/lib/cognito";
import QRGenerator from "@/components/QRGenerator";
import DocumentVault from "@/components/DocumentVault";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [cognitoUser, setCognitoUser] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [editingEmp, setEditingEmp] = useState<any>(null);
  const [newEmp, setNewEmp] = useState({
    fullName: "", role: "", employeeId: "", mobile: "",
    email: "", assignedOffice: "Mumbai", dateOfJoining: "",
    aadhaarNumber: "", panNumber: "", address: "",
  });

  useEffect(() => {
    getToken().then(t => {
      if (t) { setToken(t); fetchEmployees(t); }
    });
  }, []);

  const fetchEmployees = async (t: string) => {
    const res = await fetch("/api/admin/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ action: "list" }),
    });
    const data = await res.json();
    setEmployees(Array.isArray(data) ? data : []);
  };

  const handleLogin = async () => {
    try {
      const result = await loginAdmin(email, password);
      if (result.newPasswordRequired) {
        setNeedsNewPassword(true);
        setCognitoUser(result.user);
      } else {
        const t = result.getIdToken().getJwtToken();
        setToken(t);
        fetchEmployees(t);
      }
    } catch (err: any) {
      alert(err.message || "Login failed");
    }
  };

  const handleNewPassword = () => {
    cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: (result: any) => {
        const t = result.getIdToken().getJwtToken();
        setToken(t);
        fetchEmployees(t);
        setNeedsNewPassword(false);
      },
      onFailure: (err: any) => alert(err.message),
    });
  };

  const handleLogout = () => {
    logoutAdmin();
    setToken(null);
    setEmployees([]);
  };

  const addEmployee = async () => {
    if (!token) return;
    await fetch("/api/admin/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "add", ...newEmp }),
    });
    setShowAddForm(false);
    setNewEmp({ fullName:"",role:"",employeeId:"",mobile:"",email:"",
      assignedOffice:"Mumbai",dateOfJoining:"",aadhaarNumber:"",panNumber:"",address:"" });
    fetchEmployees(token);
  };

  const toggleStatus = async (id: string, current: string) => {
    if (!token) return;
    await fetch("/api/admin/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "toggleStatus", id, status: current === "active" ? "inactive" : "active" }),
    });
    fetchEmployees(token);
  };

  const deleteEmployee = async (id: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this employee?")) return;
    await fetch("/api/admin/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "delete", id }),
    });
    fetchEmployees(token);
  };

  const saveEdit = async () => {
    if (!token || !editingEmp) return;
    await fetch("/api/admin/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "update", ...editingEmp }),
    });
    setEditingEmp(null);
    fetchEmployees(token);
  };

  if (needsNewPassword) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow w-80 space-y-4">
        <h1 className="text-lg font-semibold text-center">Set New Password</h1>
        <p className="text-sm text-gray-500 text-center">First time login — please set a permanent password</p>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" type="password"
          placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <button onClick={handleNewPassword}
          className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium">
          Set Password
        </button>
      </div>
    </div>
  );

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow w-80 space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold text-purple-600 tracking-widest uppercase mb-1">Zeex AI</p>
          <h1 className="text-xl font-bold">Admin Login</h1>
        </div>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" type="password"
          placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <button onClick={handleLogin}
          className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700">
          Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs font-semibold text-purple-600 tracking-widest uppercase">Zeex AI</p>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
              + Add Employee
            </button>
            <button onClick={handleLogout} className="text-gray-500 text-sm hover:text-gray-700">Logout</button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow">
            <h2 className="font-semibold mb-4 text-gray-800">New Employee</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["fullName","Full Name"],["employeeId","Employee ID"],
                ["role","Role"],["mobile","Mobile Number"],
                ["email","Email"],["dateOfJoining","Date of Joining"],
                ["aadhaarNumber","Aadhaar Number"],["panNumber","PAN Number"],
                ["address","Residential Address"],
              ].map(([key, label]) => (
                <input key={key} placeholder={label}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                  value={(newEmp as any)[key]}
                  onChange={e => setNewEmp(p => ({ ...p, [key]: e.target.value }))} />
              ))}
              <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                value={newEmp.assignedOffice}
                onChange={e => setNewEmp(p => ({ ...p, assignedOffice: e.target.value }))}>
                <option>Mumbai</option><option>Pune</option><option>Surat</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={addEmployee}
                className="bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-600">
                Save Employee
              </button>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {employees.length === 0 && (
            <div className="text-center text-gray-400 py-12">No employees yet. Add your first one.</div>
          )}
          {employees.map(emp => (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm overflow-hidden">

              {/* Status bar on top */}
              <div className={`h-1 w-full ${emp.status === "active" ? "bg-green-500" : "bg-red-500"}`} />

              <div className="p-4">
                {editingEmp?.id === emp.id ? (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-3">Edit Employee</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["fullName","Full Name"],["employeeId","Employee ID"],
                        ["role","Role"],["mobile","Mobile Number"],
                        ["email","Email"],["dateOfJoining","Date of Joining"],
                        ["aadhaarNumber","Aadhaar Number"],["panNumber","PAN Number"],
                        ["address","Residential Address"],
                      ].map(([key, label]) => (
                        <input key={key} placeholder={label}
                          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                          value={editingEmp[key] || ""}
                          onChange={e => setEditingEmp((p: any) => ({ ...p, [key]: e.target.value }))} />
                      ))}
                      <select className="border rounded-lg px-3 py-2 text-sm"
                        value={editingEmp.assignedOffice}
                        onChange={e => setEditingEmp((p: any) => ({ ...p, assignedOffice: e.target.value }))}>
                        <option>Mumbai</option><option>Pune</option><option>Surat</option>
                      </select>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={saveEdit}
                        className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                        Save Changes
                      </button>
                      <button onClick={() => setEditingEmp(null)} className="text-gray-500 text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{emp.fullName}</p>
                      <p className="text-sm text-gray-500">{emp.role} · {emp.assignedOffice} · ID: {emp.employeeId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Aadhaar: {emp.aadhaarNumber} · PAN: {emp.panNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        emp.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>{emp.status}</span>
                      <QRGenerator employeeId={emp.id} employeeName={emp.fullName} />
                      <button onClick={() => toggleStatus(emp.id, emp.status)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors">
                        Toggle Status
                      </button>
                      <button onClick={() => setEditingEmp({ ...emp })}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg transition-colors">
                        Edit
                      </button>
                      <button onClick={() => deleteEmployee(emp.id)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded-lg transition-colors">
                        Delete
                      </button>
                      <button onClick={() => setSelectedEmp(selectedEmp === emp.id ? null : emp.id)}
                        className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1 rounded-lg transition-colors">
                        Documents
                      </button>
                    </div>
                  </div>
                )}

                {selectedEmp === emp.id && editingEmp?.id !== emp.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">Upload Documents</p>
                    <DocumentVault employeeId={emp.id} token={token} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}