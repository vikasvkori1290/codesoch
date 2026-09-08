import React, { useState, useEffect } from 'react';
import { Brain, User, Shield, Flame, Trophy, CheckCircle2, Save, Trash2, Link, Phone, Mail, AlertTriangle, Sparkles, LogOut, Edit3, X, History, Calendar, CheckSquare } from 'lucide-react';
import axios from 'axios';
import { getCurrentUser, logoutUser, initAuth } from '../services/auth';
import { API_URL } from '../config/api.js';

export default function ProfilePage({ onGoHome, onLogout }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    mobile: '',
    leetcodeUrl: '',
    socialUrl: '',
  });

  const [userStats, setUserStats] = useState({
    xp: 0,
    level: 1,
    streak: 0,
    isProfileComplete: false,
    quizzesSolved: 0,
    avgAccuracy: 0,
    dueSrsCount: 0,
    rank: '#1',
  });

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    initAuth();
    fetchRealProfile();
  }, []);

  const fetchRealProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`);
      const u = response.data.user || response.data;
      const s = response.data.stats || {};
      const h = response.data.history || [];

      setFormData({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        username: u.username || '',
        email: u.email || '',
        mobile: u.mobile || '',
        leetcodeUrl: u.leetcodeUrl || '',
        socialUrl: u.socialUrl || '',
      });

      setUserStats({
        xp: u.xp || 0,
        level: u.level || Math.floor((u.xp || 0) / 100) + 1,
        streak: u.streak || 0,
        isProfileComplete: Boolean(u.isProfileComplete),
        quizzesSolved: s.quizzesSolved || 0,
        avgAccuracy: s.avgAccuracy || 0,
        dueSrsCount: s.dueSrsCount || 0,
        rank: s.rank || '#1',
      });

      setHistory(h);
    } catch (err) {
      console.warn('[Profile]: Backend unauthenticated or error. Falling back to local storage profile.', err);
      const cached = getCurrentUser();
      if (cached) {
        setFormData({
          firstName: cached.firstName || 'Vikas',
          lastName: cached.lastName || 'Kori',
          username: cached.username || 'vikaskori',
          email: cached.email || 'vikas@codesoch.dev',
          mobile: cached.mobile || '+91 9876543210',
          leetcodeUrl: cached.leetcodeUrl || '',
          socialUrl: cached.socialUrl || '',
        });
        setUserStats({
          xp: cached.xp || 0,
          level: cached.level || 1,
          streak: cached.streak || 0,
          isProfileComplete: Boolean(cached.mobile),
          quizzesSolved: 0,
          avgAccuracy: 0,
          dueSrsCount: 0,
          rank: '#1',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaveSuccess(true);

    try {
      const response = await axios.put(`${API_URL}/auth/profile`, formData);
      const u = response.data.user || response.data;
      const s = response.data.stats || {};

      setUserStats((prev) => ({
        ...prev,
        xp: u.xp || prev.xp,
        level: u.level || prev.level,
        isProfileComplete: Boolean(u.isProfileComplete),
        quizzesSolved: s.quizzesSolved !== undefined ? s.quizzesSolved : prev.quizzesSolved,
        avgAccuracy: s.avgAccuracy !== undefined ? s.avgAccuracy : prev.avgAccuracy,
        rank: s.rank || prev.rank,
      }));
    } catch (err) {
      console.warn('[Profile]: Failed to update profile on backend server.', err);
    }

    setTimeout(() => {
      setSaveSuccess(false);
      setShowEditModal(false);
    }, 1200);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await axios.delete('http://localhost:5000/api/user/delete');
    } catch (err) {
      console.warn('[Profile]: Backend delete call failed.', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      logoutUser();
      if (onLogout) onLogout();
      onGoHome();
    }
  };

  const handleLogoutClick = () => {
    logoutUser();
    if (onLogout) onLogout();
    onGoHome();
  };

  const initials = `${(formData.firstName || 'C').charAt(0)}${(formData.lastName || 'S').charAt(0)}`.toUpperCase();

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans selection:bg-amber-500 selection:text-black relative overflow-x-hidden">
      {/* Subtle Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#17140b_1px,transparent_1px),linear-gradient(to_bottom,#17140b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Subtle Aesthetic Dynamic Island Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#08090e]/75 backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 rounded-full px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex items-center gap-3 transition-all duration-300">
        <div 
          onClick={onGoHome}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-sm font-black tracking-tight text-white/90 font-sans">
            Code<span className="text-amber-400">Soch</span>
          </span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 text-xs font-mono font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3.5 py-1.5 rounded-full transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={onGoHome}
            className="flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-300 hover:text-amber-400 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 px-3.5 py-1.5 rounded-full transition-all"
          >
            <span>← Home</span>
          </button>
        </div>
      </header>

      {/* Main Minimalist Profile Container */}
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16 space-y-6 relative z-10">
        {/* Profile Header & Avatar Card */}
        <div className="bg-[#0c0d12]/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(245,158,11,0.08)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Custom Initial Avatar with Hover Edit Badge */}
            <div
              onClick={() => setShowEditModal(true)}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-amber-500 to-amber-700 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0 cursor-pointer group"
              title="Click to Edit Profile"
            >
              <div className="w-full h-full bg-[#12131a] rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black text-amber-400 group-hover:opacity-30 transition-opacity">
                {initials}
              </div>

              <div className="absolute inset-0 rounded-2xl bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-amber-400 font-mono text-[10px] font-bold">
                <Edit3 className="w-4 h-4 mb-0.5" />
                <span>EDIT</span>
              </div>
            </div>

            {/* Name & Handle */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {formData.firstName || 'Developer'} {formData.lastName || ''}
                </h1>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <p className="text-xs font-mono text-zinc-400">
                @{formData.username || 'user'} • <span className="text-amber-400 font-semibold">Algorithm Architect</span>
              </p>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  {userStats.streak} Day Streak
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <Trophy className="w-3.5 h-3.5" />
                  {userStats.xp.toLocaleString()} XP
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full">
                  <Shield className="w-3.5 h-3.5" />
                  Level {userStats.level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-[#0c0d12]/80 border border-zinc-800/80 rounded-xl p-4 text-center hover:border-amber-500/30 transition-all">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Quizzes Solved</span>
            <span className="text-2xl font-black text-white">{userStats.quizzesSolved}</span>
          </div>
          <div className="bg-[#0c0d12]/80 border border-zinc-800/80 rounded-xl p-4 text-center hover:border-amber-500/30 transition-all">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Avg Accuracy</span>
            <span className="text-2xl font-black text-emerald-400">{userStats.avgAccuracy}%</span>
          </div>
          <div className="bg-[#0c0d12]/80 border border-zinc-800/80 rounded-xl p-4 text-center hover:border-amber-500/30 transition-all">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">SRS Due Items</span>
            <span className="text-2xl font-black text-amber-400">{userStats.dueSrsCount}</span>
          </div>
          <div className="bg-[#0c0d12]/80 border border-zinc-800/80 rounded-xl p-4 text-center hover:border-amber-500/30 transition-all">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Current Rank</span>
            <span className="text-2xl font-black text-amber-400">{userStats.rank}</span>
          </div>
        </div>

        {/* Quiz Submission History Section */}
        <div className="bg-[#0c0d12]/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Quiz Submission History</h3>
                <p className="text-[11px] font-mono text-zinc-400">
                  Tracked LeetCode problem sessions and Socratic performance
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              {history.length} {history.length === 1 ? 'Attempt' : 'Attempts'}
            </span>
          </div>

          {/* History List */}
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="bg-[#12131c]/70 border border-zinc-800/80 hover:border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                        #{item.problemNumber || '15'}
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {item.problemTitle || '3Sum'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {formatDate(item.date)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-zinc-300">
                        <CheckSquare className="w-3 h-3 text-emerald-400" />
                        {item.correctCount}/{item.totalQuestions || 5} Correct
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                      {item.score}% Accuracy
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
                      +{item.xpEarned || 0} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 space-y-3 bg-[#12131c]/30 rounded-xl border border-dashed border-zinc-800">
              <Brain className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-mono text-zinc-400">
                No quiz submissions recorded yet. Complete a quiz to build your history!
              </p>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-[#0c0d12]/90 border border-rose-500/20 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-5 h-5 fill-rose-500/20" />
            <h3 className="text-base font-bold text-white">Danger Zone</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-normal">
            Permanently delete your CodeSoch account, submission history, and XP stats. This action is non-reversible.
          </p>

          <div className="pt-1">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-400 text-xs font-mono font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account Permanently</span>
            </button>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0d12] border border-amber-500/30 rounded-2xl p-6 sm:p-8 max-w-xl w-full relative shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-in fade-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Edit Profile Details</h2>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Update your developer credentials saved in MongoDB
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowEditModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-zinc-400">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-zinc-400">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-zinc-400">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-zinc-400">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-zinc-400">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-zinc-400">LeetCode Profile URL</label>
                  <div className="relative">
                    <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                    <input
                      type="text"
                      name="leetcodeUrl"
                      value={formData.leetcodeUrl}
                      onChange={handleChange}
                      placeholder="https://leetcode.com/u/username"
                      className="w-full bg-[#14151c] border border-zinc-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
                {saveSuccess ? (
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Profile Updated!
                  </span>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold px-4 py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black font-mono uppercase px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0d12] border border-rose-500/50 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-[0_0_50px_rgba(244,63,94,0.2)]">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirm Account Deletion</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently purge your account data? All quiz records and XP stats will be lost forever.
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
