'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Lock, Mail, Phone, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { instrumentSerif } from '@/lib/fonts';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function SettingsPage() {
    const { user, updateProfile, updatePassword, isLoading: authLoading } = useAuth();
    const { showToast } = useToast();

    // Profile State
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhoneNumber(user.phoneNumber || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);

        const { error } = await updateProfile({ name, phoneNumber });

        if (error) {
            showToast(error, 'error');
        } else {
            showToast('Profile updated successfully', 'success');
            setIsEditingProfile(false);
        }

        setIsSavingProfile(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        setIsChangingPassword(true);

        const { error } = await updatePassword(newPassword);

        if (error) {
            showToast(error, 'error');
        } else {
            showToast('Password updated successfully', 'success');
            setNewPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
        }

        setIsChangingPassword(false);
    };

    const isGoogleUser = user?.provider === 'google';

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-black/20" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white pt-32 pb-20 px-8 md:px-12 lg:px-16 text-[#1a1a1a]">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mb-8">
                        <Settings className="w-6 h-6" />
                    </div>

                    <h1 className={`${instrumentSerif.className} text-6xl md:text-7xl mb-12`}>
                        Account Settings
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Profile Section */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <User className="w-5 h-5" />
                                    Profile Details
                                </h2>

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#1a1a1a]/60 uppercase tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className="w-full bg-black/[0.03] border border-black/5 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#1a1a1a]/60 uppercase tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={user?.email}
                                                disabled
                                                className="w-full bg-black/[0.03] border border-black/5 rounded-xl px-5 py-4 text-[#1a1a1a]/40 cursor-not-allowed font-medium"
                                            />
                                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/20" />
                                        </div>
                                        <p className="text-xs text-[#1a1a1a]/40 mt-1">Email address cannot be changed</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#1a1a1a]/60 uppercase tracking-wider">Phone Number</label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                disabled={!isEditingProfile}
                                                className="w-full bg-black/[0.03] border border-black/5 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/20" />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        {!isEditingProfile ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingProfile(true)}
                                                className="px-6 py-3 bg-[#1a1a1a] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-black/80 transition-all"
                                            >
                                                Edit Profile
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="submit"
                                                    disabled={isSavingProfile}
                                                    className="px-6 py-3 bg-[#1a1a1a] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-black/80 transition-all disabled:opacity-70 disabled:cursor-wait flex items-center gap-2"
                                                >
                                                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    Save Changes
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsEditingProfile(false);
                                                        setName(user?.name || '');
                                                        setPhoneNumber(user?.phoneNumber || '');
                                                    }}
                                                    className="px-6 py-3 bg-black/5 text-[#1a1a1a] rounded-xl font-bold text-sm tracking-wide hover:bg-black/10 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Divider for mobile */}
                            <div className="lg:hidden w-full h-[1px] bg-black/5" />
                        </div>

                        {/* Security Section */}
                        <div className="space-y-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Lock className="w-5 h-5" />
                                Security
                            </h2>

                            {isGoogleUser ? (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Google Account</h3>
                                    <p className="text-[#1a1a1a]/60 leading-relaxed text-sm">
                                        You are logged in via Google. Your password and security settings are managed through your Google Account.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdatePassword} className="bg-black/[0.02] border border-black/5 rounded-3xl p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#1a1a1a]/60 uppercase tracking-wider">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-white border border-black/5 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#1a1a1a]/60 uppercase tracking-wider">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-white border border-black/5 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isChangingPassword || !newPassword || !confirmPassword}
                                            className="w-full px-6 py-4 bg-white border border-black/10 text-[#1a1a1a] rounded-xl font-bold text-sm tracking-wide hover:bg-black/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isChangingPassword ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Update Password'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="mt-20 pt-8 border-t border-black/5 flex justify-center">
                        <Link
                            href="/"
                            className="text-[#1a1a1a]/40 hover:text-[#1a1a1a] font-bold text-sm tracking-widest uppercase transition-colors"
                        >
                            Return to Homepage
                        </Link>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
