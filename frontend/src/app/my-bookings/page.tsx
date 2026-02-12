'use client';

import { motion } from 'framer-motion';
import { Ticket } from 'lucide-react';
import { instrumentSerif } from '@/lib/fonts';
import Link from 'next/link';

export default function MyBookingsPage() {
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
                        <Ticket className="w-6 h-6" />
                    </div>

                    <h1 className={`${instrumentSerif.className} text-6xl md:text-8xl mb-8`}>
                        My Bookings
                    </h1>

                    <p className="text-xl md:text-2xl text-[#1a1a1a]/60 leading-relaxed mb-12">
                        View and manage your upcoming events and historical experiences. We&apos;re currently refining this space to provide you with a more integrated experience.
                    </p>

                    <div className="p-8 rounded-[2rem] bg-black/5 border border-black/5 flex flex-col items-center justify-center text-center space-y-4">
                        <p className="font-bold text-[#1a1a1a]/40 uppercase tracking-widest text-[10px]">Current Status</p>
                        <p className="text-2xl font-bold">Booking History Coming Soon</p>
                        <Link
                            href="/events"
                            className="px-8 py-4 bg-[#1a1a1a] text-white rounded-full font-bold hover:scale-105 transition-transform"
                        >
                            Explore Events
                        </Link>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
