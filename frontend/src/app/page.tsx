'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { instrumentSerif } from '@/lib/fonts';
import JourneySection from '@/components/JourneySection';
import { supabase } from '@/lib/supabase';
import { fetchSectionMedia } from '@/lib/websiteMedia';
import { getProxiedImageUrl } from '@/lib/utils';

const fallbackHeroImages = [
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

interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    tag: string;
    image: string;
}

export default function Home() {
    const [events, setEvents] = useState<Event[]>([]);
    const [activeEvent, setActiveEvent] = useState(0);
    const [heroIndex, setHeroIndex] = useState(0);
    const [heroImages, setHeroImages] = useState<string[]>(fallbackHeroImages);
    const mobileScrollRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .gte('event_date', today.toISOString())
                    .in('status', ['published', 'waitlist'])
                    .is('deleted_at', null)
                    .order('event_date', { ascending: true })
                    .limit(3);

                if (error) {
                    console.error('Error fetching events:', error);
                    return;
                }

                if (data) {
                    const mappedEvents = data.map((event: any) => {
                        const eventDate = event.event_date ? new Date(event.event_date) : null;
                        const formattedDate = eventDate
                            ? eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                            : 'Date TBA';
                        const formattedTime = eventDate
                            ? eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                            : 'Time TBA';

                        return {
                            id: event.id,
                            title: event.name,
                            date: formattedDate,
                            time: formattedTime,
                            location: `${event.city || ''}, ${event.country || ''}`.replace(/^, /, '').replace(/, $/, '') || 'Location TBA',
                            description: event.about || 'No description available.',
                            tag: 'Event', // You might want to add a tag field to your DB or derive it
                            image: getProxiedImageUrl(event.base_event_banner) || '/1.jpg', // Fallback image
                        };
                    });
                    setEvents(mappedEvents);
                }
            } catch (err) {
                console.error('Unexpected error fetching events:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);

    useEffect(() => {
        const fetchHeroCarousel = async () => {
            try {
                const items = await fetchSectionMedia('hero-carousel', { active: true, limit: 12 });
                const urls = items
                    .map((item) => item.previewUrl)
                    .filter((url): url is string => typeof url === 'string' && url.length > 0);

                if (urls.length > 0) {
                    setHeroImages(urls);
                    return;
                }
            } catch (err) {
                console.error('Error fetching hero carousel media:', err);
            }

            setHeroImages(fallbackHeroImages);
        };

        fetchHeroCarousel();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % Math.max(heroImages.length, 1));
        }, 5000); // Change slide every 5 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setHeroIndex(0);
    }, [heroImages]);

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
                                src={heroImages[heroIndex] || fallbackHeroImages[0]}
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
                <div className="w-full max-w-[1400px] flex items-end justify-between">
                    <h2 className={`${instrumentSerif.className} text-3xl md:text-5xl text-[#1a1a1a] leading-tight`}>
                        Current events, from intimate workshops to grand galas
                    </h2>
                    <Link href="/events" className="hidden md:flex items-center gap-2 text-[#1a1a1a] font-medium group transition-all pb-2 text-xl">
                        See all <span className="text-2xl transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="w-full h-[50vh] flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-[#1a1a1a] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="w-full h-[30vh] flex flex-col items-center justify-center text-[#1a1a1a]/60">
                        <p className={`${instrumentSerif.className} text-2xl mb-4`}>No upcoming events at the moment.</p>
                        <p>Check back soon for updates!</p>
                    </div>
                ) : (
                    <>
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
                                        src={events[activeEvent]?.image || '/1.jpg'}
                                        alt={events[activeEvent]?.title || 'Event Image'}
                                        fill
                                        className="object-cover transition-transform duration-700 hover:scale-105"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-black/40" />
                                </motion.div>
                            </AnimatePresence>

                            {/* Content Container */}
                            <div className="absolute inset-0 z-10 flex items-center justify-center gap-10 px-8 md:px-16 h-full">
                                {events.map((event, index) => {
                                    const isActive = index === activeEvent;
                                    return (
                                        <motion.div
                                            key={event.id}
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
                                                            <Link href={`/event/${event.id}`}>
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
                                className="w-[calc(100%+32px)] -ml-4 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide px-[7.5vw] flex gap-4"
                            >
                                {events.map((event, index) => (
                                    <div key={event.id} className="snap-center shrink-0 w-[85vw] rounded-[24px] overflow-hidden bg-[#EFF2F6] shadow-lg flex flex-col">
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

                                            <Link href={`/event/${event.id}`} className="mt-auto pt-2">
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
                    </>
                )}
            </section>

            {/* Journey Section */}
            <JourneySection />
        </>
    );
}
