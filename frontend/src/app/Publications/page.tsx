'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { instrumentSerif } from '@/lib/fonts';
import { fetchSectionMedia, type WebsiteMediaItem } from '@/lib/websiteMedia';
import { FileText } from 'lucide-react';

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
    const [publications, setPublications] = useState<WebsiteMediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPublications() {
            setLoading(true);
            try {
                const results = await fetchSectionMedia('publications');
                setPublications(results);
            } catch (error) {
                console.error('Failed to load publications', error);
            } finally {
                setLoading(false);
            }
        }
        loadPublications();
    }, []);

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={`skeleton-${i}`} className="animate-pulse flex flex-col">
                                    <div className="aspect-[3/4] bg-black/5 rounded-[1.5rem] mb-5" />
                                    <div className="px-2 text-center sm:text-left">
                                        <div className="h-6 bg-black/5 rounded-md w-3/4 mb-2 mx-auto sm:mx-0" />
                                        <div className="h-4 bg-black/5 rounded-md w-1/2 mx-auto sm:mx-0" />
                                    </div>
                                </div>
                            ))
                        ) : publications.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-[#1a1a1a]/50 text-xl font-medium">
                                No publications available right now. Check back later!
                            </div>
                        ) : (
                            publications.map((item) => (
                                <div
                                    key={item.id}
                                    className="group cursor-pointer flex flex-col"
                                    onClick={() => window.open(item.previewUrl, '_blank')}
                                >
                                    <div className="aspect-[3/4] bg-[#f8f8f8] border border-[#1a1a1a]/5 transition-colors group-hover:bg-[#f1f1f1] rounded-[1.5rem] overflow-hidden mb-5 relative flex flex-col items-center justify-center">
                                        {item.thumbnailUrl ? (
                                            <img
                                                src={item.thumbnailUrl}
                                                alt={item.title || item.fileName}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <>
                                                <div className="absolute inset-x-0 top-6 flex justify-center">
                                                    <span className="inline-block bg-[#1a1a1a]/5 text-[#1a1a1a]/60 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                                        PDF Document
                                                    </span>
                                                </div>
                                                <FileText size={48} className="text-[#1a1a1a]/30 group-hover:text-[#db2929] transition-colors duration-500" />
                                            </>
                                        )}

                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="bg-[#1a1a1a] text-white text-sm font-medium py-2 px-5 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl">
                                                View
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-2 text-center sm:text-left">
                                        <h3 className={`${instrumentSerif.className} text-2xl mb-1.5 text-[#1a1a1a] transition-colors leading-tight`}>
                                            {item.title || item.fileName}
                                        </h3>
                                        {item.description && (
                                            <p className="text-[#1a1a1a]/60 text-sm font-medium">
                                                By {item.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
