'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    name: string;
    email: string;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string) => void;
    googleLogin: () => void;
    logout: () => void;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Check for persisted user on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('akar_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (email: string) => {
        const mockUser = {
            name: email.split('@')[0],
            email: email,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        };
        setUser(mockUser);
        localStorage.setItem('akar_user', JSON.stringify(mockUser));
        closeAuthModal();
    };

    const googleLogin = () => {
        // Simulate network delay
        setTimeout(() => {
            const mockUser = {
                name: 'Google User',
                email: 'user@gmail.com',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google'
            };
            setUser(mockUser);
            localStorage.setItem('akar_user', JSON.stringify(mockUser));
            closeAuthModal();
        }, 1000);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('akar_user');
    };

    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            googleLogin,
            logout,
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal
        }}>
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
