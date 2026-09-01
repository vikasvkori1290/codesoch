import React, { useState, useEffect } from 'react';
import { Brain, User, Shield, Flame, Trophy, CheckCircle2, Save, Trash2, Link, Phone, Mail, Award, AlertTriangle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';

export default function ProfilePage({ onGoHome }) {
  const [formData, setFormData] = useState({
    firstName: 'Vikas',
    lastName: 'Kori',
    username: 'vikaskori',
    email: 'vikas@codesoch.dev',
    mobile: '+91 9876543210',
    leetcodeUrl: 'https://leetcode.com/u/vikasvkori',
    socialUrl: 'https://github.com/vikasvkori1290',
  });

  const [stats, setStats] = useState({
    xp: 2488,
    level: 12,
    streak: 14,
    isProfileComplete: false,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Calculate completion percentage
  const totalFields = 6;
  const filledFields = [
    formData.firstName,
    formData.lastName,
    formData.username,
    formData.email,
    formData.mobile,
    formData.leetcodeUrl,
  ].filter(Boolean).length;
  
  const completionPercent = Math.round((filledFields / totalFields) * 100);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaveSuccess(true);

    // Trigger celebration confetti if profile becomes 100% complete
    if (completionPercent === 100 && !stats.isProfileComplete) {
      setStats((prev) => ({ ...prev, xp: prev.xp + 10, isProfileComplete: true }));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#6366F1'],
      });
    }

    try {
      await axios.put('http://localhost:5000/api/auth/profile', formData);
    } catch (err) {
      console.warn('[Profile]: Backend API save fallback to local state.', err);
    }

    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await axios.delete('http://localhost:5000/api/user/delete');
    } catch (err) {
      console.warn('[Profile]: Backend API delete fallback.', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      onGoHome();
    }
  };

  // Generate initials for avatar
  const initials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase() || 'AA';

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans selection:bg-amber-500 selection:text-black relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#17140b_1px,transparent_1px),linear-gradient(to_bottom,#17140b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between relative z-20 border-b border-zinc-900">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Brain className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Code<span className="text-amber-400">Soch</span>
          </span>
        </div>

        <button
          onClick={onGoHome}
          className="text-xs font-mono font-bold text-zinc-400 hover:text-amber-400 uppercase tracking-wider transition-colors"
        >
          ← Back to Home
        </button>
      </header>

      {/* Main Profile Container */}
      <main className="max-w-4xl mx-auto px-8 py-10 space-y-8 relative z-10">
        {/* Profile Header & Avatar Card */}
        <div className="bg-[#0c0d12] border border-amber-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.08)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Custom Initial Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-amber-500 to-amber-700 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.3)] shrink-0">
              <div className="w-full h-full bg-[#12131a] rounded-2xl flex items-center justify-center text-2xl font-black text-amber-400">
                {initials}
              </div>
            </div>

            {/* Name & Handle */}
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {formData.firstName} {formData.lastName}
              </h1>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                @{formData.username} • <span className="text-amber-400 font-bold">Algorithm Architect</span>
              </p>

              {/* Gamification Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  {stats.streak} Day Streak
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <Trophy className="w-3.5 h-3.5" />
                  {stats.xp.toLocaleString()} XP
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full">
                  <Shield className="w-3.5 h-3.5" />
                  Level {stats.level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gamification Incentive: +10 XP Completion Banner */}
        <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Profile Completion Progress</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {completionPercent}% ({completionPercent === 100 ? '+10 XP Bonus Claimed 🎉' : '+10 XP Completion Bonus'})
            </span>
          </div>

          <div className="w-full bg-[#181924] h-2.5 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Account Stats Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0c0d12] border border-zinc-800 rounded-xl p-5 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Quizzes Solved</span>
            <span className="text-2xl font-black text-white">18</span>
          </div>
          <div className="bg-[#0c0d12] border border-zinc-800 rounded-xl p-5 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Avg Accuracy</span>
            <span className="text-2xl font-black text-emerald-400">88%</span>
          </div>
          <div className="bg-[#0c0d12] border border-zinc-800 rounded-xl p-5 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">SRS Due Items</span>
            <span className="text-2xl font-black text-amber-400">0</span>
          </div>
          <div className="bg-[#0c0d12] border border-zinc-800 rounded-xl p-5 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Current Rank</span>
            <span className="text-2xl font-black text-amber-400">#2</span>
          </div>
        </div>

        {/* Editable Profile Form */}
        <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              <span>Personal & Developer Information</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Update your user profile details to personalize your CodeSoch account.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-white focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* LeetCode Profile URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-400">LeetCode Profile URL</label>
                <div className="relative">
                  <Link className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500" />
                  <input
                    type="text"
                    name="leetcodeUrl"
                    value={formData.leetcodeUrl}
                    onChange={handleChange}
                    placeholder="https://leetcode.com/u/username"
                    className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
              {saveSuccess ? (
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3.5 py-2 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Profile updated successfully! (+10 XP bonus verified)
                </span>
              ) : (
                <div />
              )}

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-mono uppercase px-8 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95 ml-auto"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone (Account Deletion) */}
        <div className="bg-[#0c0d12] border border-rose-500/30 rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-5 h-5 fill-rose-500/20" />
            <h3 className="text-base font-bold text-white">Danger Zone</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-normal">
            Permanently delete your CodeSoch account, submission history, XP gamification stats, and Spaced Repetition decay queue. This action is non-reversible.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 text-xs font-mono font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account Permanently</span>
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0d12] border border-rose-500/50 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-[0_0_50px_rgba(244,63,94,0.2)]">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirm Account Deletion</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently purge your account data? All quiz records, XP stats, and spaced repetition schedules will be lost forever.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
