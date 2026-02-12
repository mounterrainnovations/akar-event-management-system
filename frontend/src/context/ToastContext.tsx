'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const config: Record<ToastType, { bg: string; text: string; icon: React.ReactNode }> = {
        success: {
            bg: '#1a1a1a',
            text: '#ffffff',
            icon: (
                <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#22c55e', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Check size={13} color="#fff" strokeWidth={3} />
                </div>
            ),
        },
        error: {
            bg: '#1a1a1a',
            text: '#ffffff',
            icon: (
                <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#ef4444', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <AlertTriangle size={12} color="#fff" strokeWidth={3} />
                </div>
            ),
        },
        info: {
            bg: '#1a1a1a',
            text: '#ffffff',
            icon: (
                <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#3b82f6', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Info size={12} color="#fff" strokeWidth={3} />
                </div>
            ),
        },
    };

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none',
            }}
        >
            <AnimatePresence>
                {toasts.map(toast => {
                    const c = config[toast.type];
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(4px)' }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '14px',
                                backgroundColor: c.bg,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.06) inset',
                                minWidth: '280px',
                                maxWidth: '420px',
                                pointerEvents: 'auto',
                                backdropFilter: 'blur(20px)',
                            }}
                        >
                            {c.icon}
                            <span
                                style={{
                                    fontSize: '13.5px',
                                    fontWeight: 500,
                                    color: c.text,
                                    flex: 1,
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1.4,
                                }}
                            >
                                {toast.message}
                            </span>
                            <button
                                onClick={() => onRemove(toast.id)}
                                style={{
                                    flexShrink: 0,
                                    padding: '4px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.35)',
                                    display: 'flex',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                            >
                                <X size={14} strokeWidth={2.5} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>,
        document.body
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
