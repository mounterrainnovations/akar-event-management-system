'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { instrumentSerif } from '@/lib/fonts';

const categories = ['All', 'Strategy', 'Design', 'Development', 'Experience'];

const workItems = [
    {
        id: 1,
        title: 'Sylvera',
        subtitle: 'Data Driven Climate',
        category: 'Design',
        image: 'https://images.unsplash.com/photo-1464047736614-af63643285bf?q=80&w=1974&auto=format&fit=crop',
    },
    {
        id: 2,
        title: 'Knotel',
        subtitle: 'World Wide Workscapes',
        category: 'Strategy',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
    },
    {
        id: 3,
        title: 'Follio',
        subtitle: 'Digital Brand System',
        category: 'Development',
        image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: 4,
        title: 'Akar Wellness',
        subtitle: 'Community Living',
        category: 'Experience',
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: 5,
        title: 'Tech Summit',
        subtitle: 'Identity & Experience',
        category: 'Design',
        image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop',
    },
    {
        id: 6,
        title: 'Global Ventures',
        subtitle: 'Venture Capital Brand',
        category: 'Strategy',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: 7,
        title: 'Oceanic',
        subtitle: 'Sustainability Report',
        category: 'Design',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop',
    },
    {
        id: 8,
        title: 'Vertex',
        subtitle: 'AI Research Lab',
        category: 'Development',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: 9,
        title: 'Elysium',
        subtitle: 'Luxury Living',
        category: 'Experience',
        image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: 10,
        title: 'Nexus',
        subtitle: 'Digital Transformation',
        category: 'Strategy',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: 11,
        title: 'Prism',
        subtitle: 'Creative Studio',
        category: 'Design',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
    },
    {
        id: 12,
        title: 'Blueprint',
        subtitle: 'Strategic Growth',
        category: 'Strategy',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
    },
    {
        id: 13,
        title: 'CodeBase',
        subtitle: 'SaaS Architecture',
        category: 'Development',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop',
    },
    {
        id: 14,
        title: 'Sync',
        subtitle: 'Cloud Solutions',
        category: 'Development',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    },
    {
        id: 15,
        title: 'Zenith',
        subtitle: 'Boutique Hotel',
        category: 'Experience',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
    }
];

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

export default function WorkPage() {
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredItems = activeCategory === 'All'
        ? workItems
        : workItems.filter(item => item.category === activeCategory);

    return (
        <main className="min-h-screen relative overflow-hidden bg-white">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40"
                style={{ backgroundImage: 'url("/event_bg.png")' }}
            />

            <div className="relative z-10 pt-[120px] pb-24 px-4 md:px-12 lg:px-16">
                {/* Hero Section */}
                <section className="mb-24">
                    <div className="max-w-4xl">
                        <motion.h1
                            className={`${instrumentSerif.className} text-[#1a1a1a] text-[12vw] md:text-[7.5vw] lg:text-[7vw] xl:text-[5.5vw] leading-[1] md:leading-[0.95] tracking-[-0.02em]`}
                            variants={container}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.3 }}
                        >
                            <div className="block">
                                {['Our', 'work'].map((word, i) => (
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
                                {['From', 'idea', 'to', 'exit'].map((word, i) => (
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

                {/* Filter Navigation */}
                <div className="mb-16 border-b border-black/5 pb-6">
                    <div className="flex flex-wrap gap-x-12 gap-y-6 items-center">
                        {categories.map((category, index) => (
                            <React.Fragment key={category}>
                                <button
                                    onClick={() => setActiveCategory(category)}
                                    className={`text-xl md:text-3xl font-medium transition-all duration-300 ${activeCategory === category
                                        ? 'text-[#1a1a1a]'
                                        : 'text-[#1a1a1a]/30 hover:text-[#1a1a1a]/50'
                                        }`}
                                >
                                    {category}
                                </button>
                                {category === 'All' && (
                                    <span className="text-[#1a1a1a]/10 text-3xl">—</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Work Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 min-h-[800px]">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{
                                    layout: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
                                    opacity: { duration: 0.4 },
                                    scale: { duration: 0.4 }
                                }}
                                className="group cursor-pointer"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gray-100 mb-6">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>

                                <div className="space-y-1 transform transition-all duration-500 ease-out group-hover:-translate-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[#1a1a1a] text-2xl font-semibold tracking-tight">
                                            {item.title}
                                        </h3>
                                        <ArrowUpRight
                                            className="w-6 h-6 text-[#1a1a1a] opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0"
                                        />
                                    </div>
                                    <p className="text-[#1a1a1a]/40 text-lg font-medium">
                                        {item.subtitle}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
