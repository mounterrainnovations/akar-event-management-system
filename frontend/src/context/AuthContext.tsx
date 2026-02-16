'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
    provider?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, name: string, phoneNumber: string) => Promise<{ error: string | null }>;
    updateProfile: (data: { name?: string; phoneNumber?: string }) => Promise<{ error: string | null }>;
    updatePassword: (password: string) => Promise<{ error: string | null }>;
    googleLogin: () => Promise<void>;
    logout: () => Promise<void>;
    isAuthModalOpen: boolean;
    openAuthModal: (returnTo?: string) => void;
    closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
    return {
        id: supabaseUser.id,
        name:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split('@')[0] ||
            'User',
        email: supabaseUser.email || '',
        phoneNumber: supabaseUser.user_metadata?.phone || '',
        avatarUrl:
            supabaseUser.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.email}`,
        provider: supabaseUser.app_metadata?.provider || 'email',
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        // Get the initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(mapSupabaseUser(session.user));
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(mapSupabaseUser(session.user));
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string): Promise<{ error: string | null }> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return { error: error.message };
        }
        closeAuthModal();
        return { error: null };
    };

    const signUp = async (
        email: string,
        password: string,
        name: string,
        phoneNumber: string
    ): Promise<{ error: string | null }> => {
        // Call server-side API that creates user with auto-confirm
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, phoneNumber }),
        });
        const data = await res.json();
        if (!res.ok) {
            return { error: data.error || 'Sign up failed' };
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return { error: error.message || 'Account created, but sign in failed' };
        }
        closeAuthModal();
        return { error: null };
    };

    const updateProfile = async (data: { name?: string; phoneNumber?: string }): Promise<{ error: string | null }> => {
        try {
            const updates: any = {};
            if (data.name) updates.full_name = data.name;
            if (data.phoneNumber) updates.phone = data.phoneNumber;

            const { error, data: { user: updatedUser } } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;

            if (updatedUser) {
                setUser(mapSupabaseUser(updatedUser));
            }

            return { error: null };
        } catch (error: any) {
            return { error: error.message || 'Failed to update profile' };
        }
    };

    const updatePassword = async (password: string): Promise<{ error: string | null }> => {
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            return { error: null };
        } catch (error: any) {
            return { error: error.message || 'Failed to update password' };
        }
    };

    const googleLogin = async () => {
        let redirectSuffix = '';
        if (typeof window !== 'undefined') {
            const returnTo =
                sessionStorage.getItem('auth:returnTo') ||
                `${window.location.pathname}${window.location.search}${window.location.hash}`;
            if (returnTo && returnTo.startsWith('/')) {
                redirectSuffix = `?redirectTo=${encodeURIComponent(returnTo)}`;
            }
        }
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback${redirectSuffix}`,
            },
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const openAuthModal = (returnTo?: string) => {
        setIsAuthModalOpen(true);
        if (typeof window !== 'undefined') {
            let target = typeof returnTo === 'string' ? returnTo : '';

            if (!target) {
                target = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            }

            if (target && target.startsWith('/')) {
                sessionStorage.setItem('auth:returnTo', target);
            }
        }
    };
    const closeAuthModal = () => setIsAuthModalOpen(false);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                signUp,
                updateProfile,
                updatePassword,
                googleLogin,
                logout,
                isAuthModalOpen,
                openAuthModal,
                closeAuthModal,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
