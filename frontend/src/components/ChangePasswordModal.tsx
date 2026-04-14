"use client";

import { useState } from "react";
import { X, KeyRound, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { authAPI } from "@/lib/api";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(res.detail || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Could not update password. Check your current password and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-0/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          <div className="h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

          <div className="relative px-8 pt-8 pb-6 text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/15">
              <KeyRound className="w-7 h-7 text-surface-0" />
            </div>

            <h2 className="text-2xl font-bold font-display">Change Password</h2>
            <p className="text-sm text-white/30 mt-1">Update your password to keep your account secure.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}

            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl bg-surface-2 border border-white/[0.08] text-white placeholder:text-white/20 outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all font-body"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-12 px-4 rounded-xl bg-surface-2 border border-white/[0.08] text-white placeholder:text-white/20 outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all font-body"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-12 px-4 rounded-xl bg-surface-2 border border-white/[0.08] text-white placeholder:text-white/20 outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all font-body"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-surface-0 font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
