'use client';

import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { instrumentSerif } from '@/lib/fonts';
import Link from 'next/link';

export default function SettingsPage() {
    return (
        <main className="min-h-screen bg-white pt-32 pb-20 px-8 md:px-12 lg:px-16 text-[#1a1a1a]">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl"
                >
                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mb-8">
                        <Settings className="w-6 h-6" />
                    </div>

                    <h1 className={`${instrumentSerif.className} text-6xl md:text-8xl mb-8`}>
                        Settings
                    </h1>

                    <p className="text-xl md:text-2xl text-[#1a1a1a]/60 leading-relaxed mb-12">
                        Customize your experience, manage notifications, and update your account details. This section is currently under development to ensure total control.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['Profile Details', 'Notifications', 'Privacy', 'Security'].map((item) => (
                            <div key={item} className="p-6 rounded-3xl bg-black/5 border border-black/5 flex items-center justify-between opacity-50 cursor-not-allowed">
                                <span className="font-bold text-lg">{item}</span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-black/20">Coming Soon</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12">
                        <Link
                            href="/"
                            className="inline-block px-8 py-4 border border-black/10 rounded-full font-bold hover:bg-black hover:text-white transition-all shadow-sm"
                        >
                            Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
