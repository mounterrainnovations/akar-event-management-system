'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { instrumentSerif } from '@/lib/fonts';

const container = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const wordAnim = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
    },
};

export default function PublicationsPage() {
    return (
        <main className="min-h-screen relative bg-white overflow-hidden">
            {/* Background Image Banner - Mirroring About Page */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20 scale-110"
                style={{ backgroundImage: 'url("/event_bg.png")' }}
            />

            <div className="relative z-10 pt-[120px] pb-32">
                {/* Hero Section */}
                <section className="mb-24 px-4 md:px-12 lg:px-16 text-center lg:text-left">
                    <div className="max-w-4xl mx-auto lg:mx-0">
                        <motion.h1
                            className={`${instrumentSerif.className} text-[#1a1a1a] text-[12vw] md:text-[7.5vw] lg:text-[7vw] xl:text-[5.5vw] leading-[1] md:leading-[0.95] tracking-[-0.02em]`}
                            variants={container}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.3 }}
                        >
                            <div className="block">
                                {['Our', 'Voices,'].map((word, i) => (
                                    <motion.span
                                        key={`title-${i}`}
                                        variants={wordAnim}
                                        className="inline-block mr-[0.3em]"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </div>
                            <div className="block text-[#1a1a1a]/40">
                                {['shared', 'stories,', 'lasting', 'impact.'].map((word, i) => (
                                    <motion.span
                                        key={`subtitle-${i}`}
                                        variants={wordAnim}
                                        className="inline-block mr-[0.3em]"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.h1>
                    </div>
                </section>

                {/* Publications Grid */}
                <section className="px-4 md:px-12 lg:px-16 py-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="group cursor-pointer"
                            >
                                <div className="aspect-[3/4] bg-black/5 rounded-[2rem] overflow-hidden mb-6 relative">
                                    <div className="absolute inset-0 flex items-center justify-center text-[#1a1a1a]/20 font-bold uppercase tracking-widest text-[10px]">
                                        Publication Preview
                                    </div>
                                </div>
                                <h3 className={`${instrumentSerif.className} text-4xl mb-2 text-[#1a1a1a] transition-colors`}>
                                    Akar Volume 0{item}
                                </h3>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
