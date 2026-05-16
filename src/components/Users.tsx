import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, UserCog, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

type SystemUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-2.5 bg-slate-50 text-sm";

const labelClass = "block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1";

function generatePassword() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let pwd = "Mgl!";
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

const Users = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const loadUsers = async () => {
    setLoading(true);
    const res = await apiFetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openForm = () => {
    setName("");
    setEmail("");
    setPassword(generatePassword());
    setError(null);
    setMessage(null);
    setShowForm(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await apiFetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not create user");
      setSaving(false);
      return;
    }

    setMessage(`User created. Login password: ${password}`);
    setShowForm(false);
    loadUsers();
    setSaving(false);
  };

  const toggleActive = async (user: SystemUser) => {
    await apiFetch(`/api/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !user.active }),
    });
    loadUsers();
  };

  const resetPassword = async (user: SystemUser) => {
    const newPassword = generatePassword();
    const res = await apiFetch(`/api/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) {
      setMessage(`New password for ${user.email}: ${newPassword}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">User access</h2>
          <p className="text-xs text-slate-500">Super admin — create and manage system logins</p>
        </div>
        <button
          type="button"
          onClick={openForm}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={16} /> Add user
        </button>
      </header>

      <div className="p-6 flex-1">
        {message && (
          <div className="mb-4 text-sm px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-green-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No users yet. Add the first team member.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {u.role === "SUPER_ADMIN" ? "Super admin" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          u.active ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {u.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {u.role !== "SUPER_ADMIN" && (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleActive(u)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {u.active ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => resetPassword(u)}
                            className="text-xs text-slate-600 hover:underline flex items-center gap-1"
                          >
                            <RefreshCw size={12} /> Reset password
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserCog className="text-blue-600" size={20} />
              <h3 className="text-lg font-bold text-slate-900">New user</h3>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={labelClass}>Full name</label>
                <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Email (login)</label>
                <input
                  type="email"
                  required
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <motion.div className="flex gap-2">
                  <input
                    required
                    minLength={10}
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="shrink-0 px-3 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Generate
                  </button>
                </motion.div>
                <p className="text-[10px] text-slate-400 mt-1">Share this password securely with the user.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create user"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Users;
