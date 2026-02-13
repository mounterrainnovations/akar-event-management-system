'use client';

import { useState, useRef, useEffect } from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { instrumentSerif } from '@/lib/fonts';
import JourneySection from '@/components/JourneySection';

const heroImages = [
    '/1.jpg',
    '/2.jpg',
    '/3.jpg',
    '/4.jpg',
    '/5.jpg',
    '/6.jpg',
    '/7.jpg',
];

const heroLines = [
    ['Akar', 'Women', 'Group', 'is', 'a', 'compassionate', 'platform'],
    ['dedicated', 'to', 'women', 'empowerment', 'and'],
    ['holistic', 'child', 'development.'],
];

const secondLines = [
    ['Founded', 'with', 'the', 'vision', 'of', 'creating'],
    ['a', 'supportive', 'ecosystem', 'to', 'learn,'],
    ['grow,', 'and', 'uplift', 'one', 'another.'],
];

const events = [
    {
        title: 'Young Leaders Summit',
        date: 'March 15, 2026',
        time: '10:00 AM — 4:00 PM',
        location: 'Grand Ballroom, New Delhi',
        description: 'An immersive day of talks, panels, and networking celebrating women who lead with vision and purpose.',
        tag: 'Leadership',
        image: 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Youth Empowerment Workshop',
        date: 'March 28, 2026',
        time: '9:00 AM — 1:00 PM',
        location: 'Community Center, Mumbai',
        description: 'Hands-on workshop designed to equip young minds with skills in communication, creativity, and confidence.',
        tag: 'Workshop',
        image: 'https://images.unsplash.com/flagged/photo-1574097656146-0b43b7660cb6?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Age of New Women: Talk Session',
        date: 'April 12, 2026',
        time: '7:00 PM — 11:00 PM',
        location: 'The Oberoi, Bangalore',
        description: 'An elegant evening of dining, performances, and fundraising to support education initiatives across India.',
        tag: 'Fundraiser',
        image: 'https://images.unsplash.com/photo-1661534424056-6589e239546b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Health & Wellness Camp',
        date: 'April 25, 2026',
        time: '8:00 AM — 2:00 PM',
        location: 'City Park, Jaipur',
        description: 'Free health check-ups, yoga sessions, and wellness talks for women and children in the community.',
        tag: 'Wellness',
        image: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'Skill Development Bootcamp',
        date: 'May 5, 2026',
        time: '10:00 AM — 5:00 PM',
        location: 'Tech Hub, Hyderabad',
        description: 'Intensive bootcamp covering digital literacy, financial planning, and entrepreneurship fundamentals.',
        tag: 'Education',
        image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'Cultural Heritage Festival',
        date: 'May 20, 2026',
        time: '11:00 AM — 8:00 PM',
        location: 'Heritage Grounds, Udaipur',
        description: 'A vibrant celebration of art, music, dance, and traditional crafts from communities across India.',
        tag: 'Culture',
        image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2070&auto=format&fit=crop'
    },
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

export default function Home() {
    const [activeEvent, setActiveEvent] = useState(0);
    const [heroIndex, setHeroIndex] = useState(0);
    const mobileScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000); // Change slide every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (mobileScrollRef.current) {
            const { current } = mobileScrollRef;
            const scrollAmount = window.innerWidth * 0.85; // Scroll by one card width
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <>
            {/* New Hero Section */}
            <section className="min-h-screen flex items-start justify-center pt-[87px] pb-8 relative">
                <motion.div
                    className="relative w-[90vw] h-[80vh] rounded-[40px] overflow-hidden bg-black"
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={heroIndex}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
                            className="absolute inset-0 w-full h-full"
                        >
                            <Image
                                src={heroImages[heroIndex]}
                                alt="Hero Image"
                                fill
                                className="object-cover"
                                priority={true}
                            />
                            {/* Overlay for better text visibility if needed */}
                            <div className="absolute inset-0 bg-black/20" />
                        </motion.div>
                    </AnimatePresence>

                    <motion.div
                        className="absolute bottom-0 left-0 w-full p-8 md:p-12 pt-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end items-center text-center z-10"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                        viewport={{ once: false }}
                    >
                        <h2 className={`${instrumentSerif.className} text-white text-6xl md:text-8xl leading-none mb-4`}>
                            She <span className="italic">Rises</span>. The <span className="italic">Future</span> Follows.
                        </h2>
                        <p className={`${instrumentSerif.className} text-white/90 text-2xl md:text-4xl italic`}>
                            Empowered women empower women.
                        </p>
                    </motion.div>
                </motion.div>
            </section>

            {/* Hero Section */}
            <section
                className="min-h-screen flex flex-col justify-center px-4 md:px-12 lg:px-16 pt-[120px] relative"
            >
                <div className="w-full">
                    <motion.h1
                        className={`${instrumentSerif.className} text-white text-[12vw] md:text-[7.5vw] lg:text-[7vw] xl:text-[5.5vw] leading-[1] md:leading-[0.95] tracking-[-0.02em]`}
                        variants={container}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.3 }}
                    >
                        {heroLines.map((line, lineIndex) => (
                            <span key={lineIndex} className="block">
                                {line.map((word, wordIndex) => (
                                    <motion.span
                                        key={`${lineIndex}-${wordIndex}`}
                                        variants={wordAnim}
                                        className="inline-block mr-[0.3em]"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </motion.h1>

                    <motion.div
                        className="mt-[60px]"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: false }}
                        transition={{ duration: 1, delay: 1.2, ease: 'easeOut' }}
                    >
                        <Link href="/events">
                            <button className="px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-base md:text-lg font-medium transition-all duration-300 hover:bg-white hover:text-black">
                                Our Events
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Second Section */}
            <section
                className="min-h-screen flex flex-col justify-center px-4 md:px-12 lg:px-16"
            >
                <div className="w-full">
                    <motion.h1
                        className={`${instrumentSerif.className} text-[#1a1a1a] text-[12vw] md:text-[7.5vw] lg:text-[7vw] xl:text-[5.5vw] leading-[1] md:leading-[0.95] tracking-[-0.02em]`}
                        variants={container}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.3 }}
                    >
                        {secondLines.map((line, lineIndex) => (
                            <span key={lineIndex} className="block">
                                {line.map((word, wordIndex) => (
                                    <motion.span
                                        key={`${lineIndex}-${wordIndex}`}
                                        variants={wordAnim}
                                        className="inline-block mr-[0.3em]"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </motion.h1>

                    <motion.div
                        className="mt-[60px]"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: false }}
                        transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                    >
                        <button className="px-8 py-3 rounded-full bg-black/10 backdrop-blur-md border border-black/20 text-[#1a1a1a] text-base md:text-lg font-medium transition-all duration-300 hover:bg-black hover:text-white">
                            Our work
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Current Events Section - Interactive Showcase */}
            <section className="min-h-screen py-[120px] pb-[144px] px-4 md:px-12 lg:px-16 flex flex-col items-center justify-center gap-12">

                {/* Section Header */}
                <div className="w-full max-w-[1400px] flex items-end justify-between px-4">
                    <h2 className={`${instrumentSerif.className} text-3xl md:text-5xl text-[#1a1a1a] leading-tight whitespace-nowrap`}>
                        Current events, from intimate workshops to grand galas
                    </h2>
                    <Link href="/events" className="hidden md:flex items-center gap-2 text-[#1a1a1a] font-medium group transition-all pb-2 text-xl">
                        See all <span className="text-2xl transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </Link>
                </div>

                {/* Desktop View: Interactive Showcase */}
                <div className="hidden md:block w-full h-[95vh] relative rounded-[40px] overflow-hidden shadow-2xl transition-all duration-700">

                    {/* Background Image with Transition */}
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={activeEvent}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 z-0"
                        >
                            <Image
                                src={events[activeEvent].image}
                                alt={events[activeEvent].title}
                                fill
                                className="object-cover transition-transform duration-700 hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/40" />
                        </motion.div>
                    </AnimatePresence>

                    {/* Content Container */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center gap-10 px-8 md:px-16 h-full">
                        {events.slice(0, 3).map((event, index) => {
                            const isActive = index === activeEvent;
                            return (
                                <motion.div
                                    key={index}
                                    layout
                                    onMouseEnter={() => setActiveEvent(index)}
                                    className={`relative rounded-[30px] overflow-hidden cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] border border-white/30 flex-shrink-0
                                        ${isActive
                                            ? 'w-[350px] md:w-[450px] h-[350px] md:h-[450px] bg-[#fdfaf7] shadow-2xl z-20'
                                            : 'w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-white/20 backdrop-blur-xl hover:bg-white/30 z-10'
                                        }`}
                                >
                                    {isActive ? (
                                        // Active Card Content
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2, duration: 0.3 }}
                                            className="h-full flex flex-col p-6 lg:p-8"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-[#1a1a1a] text-white">
                                                    {event.tag}
                                                </span>
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            </div>

                                            <h3 className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl md:text-4xl leading-[1.1] mb-2`}>
                                                {event.title}
                                            </h3>

                                            <div className="flex flex-col gap-3 mt-auto">
                                                <div className="flex flex-col gap-1.5 text-[#1a1a1a]/70 text-xs md:text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                        <span>{event.date} · {event.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                            <circle cx="12" cy="10" r="3" />
                                                        </svg>
                                                        <span>{event.location}</span>
                                                    </div>
                                                </div>

                                                <p className="text-[#1a1a1a]/60 text-xs md:text-sm leading-relaxed line-clamp-3">
                                                    {event.description}
                                                </p>

                                                <div className="h-px w-full bg-[#1a1a1a]/10 my-1" />

                                                <div className="pt-2">
                                                    <Link href="/event">
                                                        <button className="group/btn flex items-center justify-between w-full px-6 py-3 bg-[#1a1a1a] text-white rounded-full font-medium transition-all duration-300 hover:bg-black hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/5">
                                                            More Details
                                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover/btn:translate-x-1">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                                                                </svg>
                                                            </div>
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        // Inactive Card Content
                                        <div className="h-full flex flex-col justify-center items-center p-6 relative group-hover:scale-[1.02] transition-transform duration-300">
                                            <div className="bg-gradient-to-tr from-white/10 to-transparent absolute inset-0 z-0" />
                                            <div className="relative z-10 text-center">
                                                <h3 className={`${instrumentSerif.className} text-white text-2xl md:text-3xl opacity-90 group-hover:opacity-100 transition-opacity mb-2`}>
                                                    {event.title}
                                                </h3>
                                                {/* <span className="text-white/80 text-xs font-medium tracking-widest uppercase">
                                                    {event.tag}
                                                </span> */}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile View: Event Carousel */}
                {/* Mobile View: Event Carousel */}
                <div className="md:hidden w-full relative">
                    {/* Mobile Scroll Controls */}
                    <div className="flex justify-center gap-4 mb-4 px-4">
                        <button
                            onClick={() => scroll('left')}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-[#1a1a1a] hover:bg-white/40 transition-all active:scale-95"
                            aria-label="Scroll left"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-[#1a1a1a] hover:bg-white/40 transition-all active:scale-95"
                            aria-label="Scroll right"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </div>

                    <div
                        ref={mobileScrollRef}
                        className="w-full overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 flex gap-4"
                    >
                        {events.map((event, index) => (
                            <div key={index} className="snap-center shrink-0 w-[85vw] max-w-[340px] rounded-[24px] overflow-hidden bg-[#EFF2F6] shadow-lg flex flex-col">
                                {/* Image Section */}
                                <div className="relative h-[220px] w-full">
                                    <Image
                                        src={event.image}
                                        alt={event.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]">
                                        {event.tag}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 flex flex-col gap-4 flex-grow">
                                    <h3 className={`${instrumentSerif.className} text-[#1a1a1a] text-2xl leading-tight`}>
                                        {event.title}
                                    </h3>

                                    <div className="flex flex-col gap-2 text-[#1a1a1a]/70 text-sm">
                                        <div className="flex items-center gap-2.5">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-70">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            <span className="font-medium text-[#1a1a1a]/80">{event.date} · {event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-70">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            <span className="font-medium text-[#1a1a1a]/80">{event.location}</span>
                                        </div>
                                    </div>

                                    <p className="text-[#1a1a1a]/60 text-sm leading-relaxed line-clamp-3">
                                        {event.description}
                                    </p>

                                    <Link href="/event" className="mt-auto pt-2">
                                        <button className="w-full py-3.5 bg-[#1a1a1a] text-white rounded-[16px] text-sm font-semibold tracking-wide hover:bg-black transition-colors shadow-lg shadow-black/5">
                                            Register Now
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile 'See All' Button */}
                    <div className="flex justify-center mt-2 px-4">
                        <Link href="/events" className="w-full">
                            <button className="w-full py-4 rounded-full bg-transparent border border-[#1a1a1a]/20 text-[#1a1a1a] text-base font-medium flex items-center justify-center gap-2 hover:bg-[#1a1a1a] hover:text-white transition-all duration-300">
                                See all events
                                <span className="text-xl">→</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Journey Section */}
            <JourneySection />
        </>
    );
}
