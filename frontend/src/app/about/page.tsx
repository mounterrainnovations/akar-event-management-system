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

export default function AboutPage() {
    return (
        <main className="min-h-screen relative bg-white">
            {/* Background Image Banner */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
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
                                {['Our', 'Present,'].map((word, i) => (
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
                                {['past', 'future', 'together.'].map((word, i) => (
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

                {/* Additional About Us content will go here */}
                <section className="px-4 md:px-12 lg:px-16 flex items-center justify-center py-20">
                    <p className="text-[#1a1a1a]/40 uppercase tracking-[0.2em] text-xs font-bold">About Us content coming soon</p>
                </section>
            </div>
        </main>
    );
}
