import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";

const Login = () => {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const err = await login(email.trim(), password);
      if (err) setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-900 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
      >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MAGLINE</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
            Switchboards (Pvt) Ltd
          </p>
          <p className="text-sm text-slate-600 mt-4">Sign in to the management system</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
            >
              {error}
            </motion.div>
          )}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-2.5 bg-slate-50 text-sm"
            />
          </div>
          <motion.div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-2.5 bg-slate-50 text-sm"
            />
          </motion.div>
          <motion.button
            type="submit"
            disabled={submitting || loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </motion.button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Access is by invitation only. Contact your administrator for an account.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Login;
