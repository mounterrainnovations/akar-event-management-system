'use client';


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { instrumentSerif } from '@/lib/fonts';
import Image from 'next/image';
import { getBackendUrl } from '@/lib/backend';

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

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const }
    }
};

const masonryItems = [
    { id: 1, aspect: "aspect-[3/4]", label: "Portrait Moment" },
    { id: 2, aspect: "aspect-[16/9]", label: "Landscape View" },
    { id: 3, aspect: "aspect-square", label: "Focused Detail" },
    { id: 4, aspect: "aspect-[2/3]", label: "Vertical Capture" },
    { id: 5, aspect: "aspect-[4/3]", label: "Wide Perspective" },
    { id: 6, aspect: "aspect-[3/5]", label: "Tall Structure" },
    { id: 7, aspect: "aspect-video", label: "Cinematic Frame" },
    { id: 8, aspect: "aspect-[4/5]", label: "Classic Portrait" },
    { id: 9, aspect: "aspect-square", label: "Minimalist Square" },
    { id: 10, aspect: "aspect-[16/10]", label: "Balanced Frame" },
    { id: 11, aspect: "aspect-[3/4]", label: "Vertical Story" },
    { id: 12, aspect: "aspect-[2/1]", label: "Panoramic" },
];

type WebsiteMediaItem = {
    id: string;
    mediaId: string;
    section: "highlights";
    displayOrder: number;
    isActive: boolean;
    fileName: string;
    mimeType: string;
    fileSize: number;
    previewUrl: string;
};

export default function HighlightsPage() {
    const [mediaItems, setMediaItems] = useState<WebsiteMediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHighlights() {
            try {
                const baseUrl = getBackendUrl();
                const res = await fetch(`${baseUrl}/api/website-media/highlights?active=true`);
                if (!res.ok) throw new Error('Failed to fetch highlights');
                const data = await res.json();
                if (data.items) {
                    setMediaItems(data.items);
                }
            } catch (error) {
                console.error("Error fetching highlights:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchHighlights();
    }, []);

    return (
        <main className="min-h-screen relative bg-white">
            {/* Background Image Banner */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
                style={{ backgroundImage: 'url("/contact_banner.png")' }}
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

                {/* Aesthetic Masonry Grid */}
                <section className="px-4 md:px-12 lg:px-16 overflow-hidden">
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                        {masonryItems.map((item, index) => {
                            const media = mediaItems[index]; // Map backend items to grid slots

                            return (
                                <motion.div
                                    key={item.id}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.1 }}
                                    className={`break-inside-avoid mb-8 relative group overflow-hidden rounded-[2.5rem] bg-[#f5f5f5] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500`}
                                >
                                    {/* Photo Placeholder or Real Image */}
                                    <div className={`${item.aspect} w-full bg-[#f0f0f0] transition-transform duration-700 group-hover:scale-105 flex items-center justify-center relative overflow-hidden`}>
                                        {media ? (
                                            <Image
                                                src={media.previewUrl}
                                                alt={media.fileName}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <span className="text-gray-400 font-medium tracking-widest text-[10px] uppercase opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                                                Photo Placeholder
                                            </span>
                                        )}
                                    </div>

                                    {/* Overlay Content */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

                                    <div className="absolute bottom-6 left-8 md:bottom-8 md:left-10 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
                                            {item.label}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

            </div>
        </main>
    );
}
