'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AuthInput } from './AuthInput';
import { Loader2, AlertCircle } from 'lucide-react';

interface AuthFormsProps {
    mode: 'login' | 'register';
    onToggleMode: () => void;
}

export default function AuthForms({ mode, onToggleMode }: AuthFormsProps) {
    const {
        login,
        signUp,
        googleLogin,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        updatePassword,
        closeAuthModal
    } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [view, setView] = useState<'login' | 'register' | 'forgot' | 'verify' | 'newPassword'>(mode);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const redirectToStoredPath = () => {
        if (typeof window === 'undefined') return;
        const returnTo = sessionStorage.getItem('auth:returnTo');
        if (!returnTo) return;
        sessionStorage.removeItem('auth:returnTo');
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (returnTo !== current) {
            router.replace(returnTo);
        }
    };

    useEffect(() => {
        setView(mode);
        setError(null);
    }, [mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (view !== 'login' && view !== 'register') return;
        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'register') {
                const result = await signUp(email, password, name, phoneNumber);
                if (result.error) {
                    setError(result.error);
                } else {
                    showToast('Account created! You are now signed in.', 'success');
                    setName('');
                    setPhoneNumber('');
                    setPassword('');
                    redirectToStoredPath();
                }
            } else {
                const result = await login(email, password);
                if (result.error) {
                    setError(result.error);
                } else {
                    showToast('Welcome back! You are now signed in.', 'success');
                    redirectToStoredPath();
                }
            }
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = async (event?: React.SyntheticEvent) => {
        event?.preventDefault();
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setError('Please enter your email address.');
            return;
        }
        if (normalizedEmail !== email) {
            setEmail(normalizedEmail);
        }
        setIsSendingOtp(true);
        setError(null);
        setOtp('');
        try {
            const result = await sendPasswordResetOtp(normalizedEmail);
            if (result.error) {
                setError(result.error);
                return;
            }
            showToast('OTP sent to your email. Please check your inbox.', 'success');
            setView('verify');
        } catch {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !otp) {
            setError('Please fill in all the fields.');
            return;
        }
        setIsVerifyingOtp(true);
        setError(null);
        try {
            const result = await verifyPasswordResetOtp(normalizedEmail, otp);
            if (result.error) {
                setError(result.error);
                return;
            }
            showToast('OTP verified. Please set a new password.', 'success');
            setView('newPassword');
        } catch {
            setError('Invalid OTP. Please try again.');
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) {
            setError('Please enter a new password.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsResettingPassword(true);
        setError(null);
        try {
            const result = await updatePassword(newPassword);
            if (result.error) {
                setError(result.error);
                return;
            }
            showToast('Password updated successfully. You are now signed in.', 'success');
            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setOtp('');
            closeAuthModal();
            redirectToStoredPath();
        } catch {
            setError('Failed to reset password. Please try again.');
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError(null);
        try {
            await googleLogin();
        } catch {
            setError('Google login failed. Please try again.');
            setGoogleLoading(false);
        }
    };

    const isAuthView = view === 'login' || view === 'register';

    const headerCopy = (() => {
        if (view === 'forgot') {
            return {
                title: 'Forgot Password',
                subtitle: 'Enter your email to receive a one-time code.'
            };
        }
        if (view === 'verify') {
            return {
                title: 'Verify OTP',
                subtitle: 'Enter the code sent to your email to continue.'
            };
        }
        if (view === 'newPassword') {
            return {
                title: 'Reset Password',
                subtitle: 'Create a new password for your account.'
            };
        }
        return {
            title: mode === 'login' ? 'Welcome back' : 'Create an account',
            subtitle: mode === 'login'
                ? 'Enter your credentials to access your account'
                : 'Enter your details to get started'
        };
    })();

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    {headerCopy.title}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                    {headerCopy.subtitle}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {isAuthView && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {mode === 'register' && (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <AuthInput
                                    label="Name"
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <AuthInput
                                    label="Phone Number"
                                    id="phoneNumber"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <AuthInput
                        label="Email"
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <div className="space-y-2">
                        <AuthInput
                            label="Password"
                            id="password"
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {mode === 'login' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setView('forgot');
                                }}
                                className="text-xs font-medium text-black hover:underline"
                            >
                                Forgot password?
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Please wait
                            </>
                        ) : (
                            mode === 'login' ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>
            )}

            {view === 'forgot' && (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                    <AuthInput
                        label="Email"
                        id="reset-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="mt-2 w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSendingOtp ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Sending OTP
                            </>
                        ) : (
                            'Send OTP'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('login')}
                        className="text-sm text-gray-600 hover:underline"
                    >
                        Back to sign in
                    </button>
                </form>
            )}

            {view === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                    <AuthInput
                        label="Email"
                        id="reset-email-readonly"
                        type="email"
                        value={email}
                        disabled
                    />
                    <AuthInput
                        label="OTP Code"
                        id="reset-otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="mt-2 w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isVerifyingOtp ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Verifying OTP
                            </>
                        ) : (
                            'Verify OTP'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isSendingOtp}
                        className="text-sm text-gray-600 hover:underline"
                    >
                        {isSendingOtp ? 'Resending OTP...' : 'Resend OTP'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('login')}
                        className="text-sm text-gray-600 hover:underline"
                    >
                        Back to sign in
                    </button>
                </form>
            )}

            {view === 'newPassword' && (
                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                    <AuthInput
                        label="Email"
                        id="reset-email-locked"
                        type="email"
                        value={email}
                        disabled
                    />
                    <AuthInput
                        label="New Password"
                        id="reset-password"
                        type="password"
                        placeholder="********"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <AuthInput
                        label="Confirm Password"
                        id="reset-password-confirm"
                        type="password"
                        placeholder="********"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        disabled={isResettingPassword}
                        className="mt-2 w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isResettingPassword ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Updating Password
                            </>
                        ) : (
                            'Update Password'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('login')}
                        className="text-sm text-gray-600 hover:underline"
                    >
                        Back to sign in
                    </button>
                </form>
            )}

            {isAuthView && (
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                </div>
            )}

            {isAuthView && (
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
                >
                    {googleLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    )}
                    Google
                </button>
            )}

            {isAuthView && (
                <div className="text-center text-sm text-gray-500">
                    {mode === 'login' ? (
                        <>
                            Don&apos;t have an account?{' '}
                            <button
                                onClick={onToggleMode}
                                className="text-black font-medium hover:underline"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button
                                onClick={onToggleMode}
                                className="text-black font-medium hover:underline"
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
