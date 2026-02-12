'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthForms from './AuthForms';

export default function AuthModal() {
    const { isAuthModalOpen, closeAuthModal } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'register' : 'login');
    };

    return (
        <AnimatePresence>
            {isAuthModalOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAuthModal}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
                        >
                            {/* Close Button */}
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={closeAuthModal}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <AuthForms mode={mode} onToggleMode={toggleMode} />
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
