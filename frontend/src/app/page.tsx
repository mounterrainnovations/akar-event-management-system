'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { instrumentSerif } from '@/lib/fonts';

const heroLines = [
    ['Akar', 'Women', 'Group', 'is', 'a', 'dynamic', 'platform'],
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
        title: 'Women in Leadership Summit',
        date: 'March 15, 2026',
        time: '10:00 AM — 4:00 PM',
        location: 'Grand Ballroom, New Delhi',
        description: 'An immersive day of talks, panels, and networking celebrating women who lead with vision and purpose.',
        tag: 'Leadership',
    },
    {
        title: 'Youth Empowerment Workshop',
        date: 'March 28, 2026',
        time: '9:00 AM — 1:00 PM',
        location: 'Community Center, Mumbai',
        description: 'Hands-on workshop designed to equip young minds with skills in communication, creativity, and confidence.',
        tag: 'Workshop',
    },
    {
        title: 'Annual Charity Gala',
        date: 'April 12, 2026',
        time: '7:00 PM — 11:00 PM',
        location: 'The Oberoi, Bangalore',
        description: 'An elegant evening of dining, performances, and fundraising to support education initiatives across India.',
        tag: 'Fundraiser',
    },
    {
        title: 'Health & Wellness Camp',
        date: 'April 25, 2026',
        time: '8:00 AM — 2:00 PM',
        location: 'City Park, Jaipur',
        description: 'Free health check-ups, yoga sessions, and wellness talks for women and children in the community.',
        tag: 'Wellness',
    },
    {
        title: 'Skill Development Bootcamp',
        date: 'May 5, 2026',
        time: '10:00 AM — 5:00 PM',
        location: 'Tech Hub, Hyderabad',
        description: 'Intensive bootcamp covering digital literacy, financial planning, and entrepreneurship fundamentals.',
        tag: 'Education',
    },
    {
        title: 'Cultural Heritage Festival',
        date: 'May 20, 2026',
        time: '11:00 AM — 8:00 PM',
        location: 'Heritage Grounds, Udaipur',
        description: 'A vibrant celebration of art, music, dance, and traditional crafts from communities across India.',
        tag: 'Culture',
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

const cardAnim = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
    },
};

export default function Home() {
    return (
        <>
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
                        <Link href="/event">
                            <button className="px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-base md:text-lg font-medium transition-all duration-300 hover:bg-white hover:text-black">
                                Events
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

            {/* Current Events Section */}
            <section className="min-h-screen py-[120px] pb-[144px] px-4 md:px-12 lg:px-16">
                <div className="w-full">
                    {/* Section Heading + See All */}
                    <motion.div
                        className="flex items-start md:items-center justify-between gap-6 mb-8 md:mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.5 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <p className={`${instrumentSerif.className} text-[#1a1a1a] text-[5vw] md:text-[2.5vw] lg:text-[2vw] leading-[1.3] tracking-[-0.01em] font-bold`}>
                            Current events, from intimate workshops to grand galas
                        </p>
                        <Link href="/event">
                            <button className="flex items-center gap-2 text-[#1a1a1a]/60 text-lg font-normal tracking-wide transition-all duration-300 hover:text-[#1a1a1a] hover:gap-3 shrink-0 whitespace-nowrap">
                                See all <span className="text-xl">→</span>
                            </button>
                        </Link>
                    </motion.div>

                    {/* Events Grid — only first 3 */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.1 } },
                        }}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.1 }}
                    >
                        {events.slice(0, 3).map((event, index) => (
                            <motion.div
                                key={index}
                                variants={cardAnim}
                                className="group bg-white/60 backdrop-blur-sm border border-black/10 rounded-2xl overflow-hidden transition-all duration-500 hover:bg-white/80 hover:border-black/20 hover:-translate-y-1"
                            >
                                {/* Event Image */}
                                <div className="relative h-[200px] overflow-hidden">
                                    <Image
                                        src="https://images.unsplash.com/photo-1464047736614-af63643285bf?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0"
                                        alt={event.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Tag */}
                                    <span className="absolute top-4 left-4 px-3 py-1 text-xs font-medium tracking-wider uppercase rounded-full bg-white/70 backdrop-blur-sm border border-white/40 text-[#1a1a1a]">
                                        {event.tag}
                                    </span>
                                </div>

                                {/* Card Content */}
                                <div className="p-6 flex flex-col gap-4">
                                    <h3 className={`${instrumentSerif.className} text-[#1a1a1a] text-xl md:text-2xl leading-[1.1]`}>
                                        {event.title}
                                    </h3>

                                    <div className="flex flex-col gap-1.5 text-[#1a1a1a]/60 text-sm">
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

                                    <p className="text-[#1a1a1a]/50 text-sm leading-relaxed">
                                        {event.description}
                                    </p>

                                    <Link href="/event">
                                        <button className="mt-2 w-full px-6 py-3 rounded-full bg-[#1a1a1a] border border-[#1a1a1a] text-white text-sm font-medium tracking-wide transition-all duration-300 hover:bg-black">
                                            Register Now
                                        </button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>


                </div>
            </section>
        </>
    );
}
