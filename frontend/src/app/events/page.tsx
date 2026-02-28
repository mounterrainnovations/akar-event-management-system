'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, Calendar as CalendarIcon, MapPin, ArrowUpRight, X, ChevronLeft, ChevronRight, SlidersHorizontal, Loader2 } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { instrumentSerif } from '@/lib/fonts';
import { getBackendUrl } from '@/lib/backend';
import { getProxiedImageUrl } from '@/lib/utils';

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

const categories = ['All', 'Upcoming', 'Waitlist', 'Completed', 'Cancelled'];

const BACKEND_URL = getBackendUrl();

interface ApiEvent {
    id: string;
    name: string;
    bannerUrl: string | null;
    status: string;
    eventDate: string | null;
    city: string;
    state: string;
    country: string;
    about: string | null;
}

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/events`);
                if (!response.ok) throw new Error('Failed to fetch events');
                const data: ApiEvent[] = await response.json();

                const mappedEvents = data.map(event => ({
                    id: event.id,
                    title: event.name,
                    date: event.eventDate || new Date().toISOString(),
                    location: `${event.city}, ${event.state}`,
                    category: 'Event', // Default category since not in DB
                    image: getProxiedImageUrl(event.bannerUrl) || 'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1170&auto=format&fit=crop',
                    status: event.status
                }));

                setEvents(mappedEvents);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.location.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesStatus = true;
            if (selectedCategory !== 'All') {
                let normalizedStatus = '';
                if (event.status === 'published') normalizedStatus = 'Upcoming';
                else if (event.status === 'waitlist') normalizedStatus = 'Waitlist';
                else normalizedStatus = event.status.charAt(0).toUpperCase() + event.status.slice(1);

                matchesStatus = normalizedStatus === selectedCategory;
            }

            let matchesDate = true;
            if (dateRange[0] && dateRange[1]) {
                const eventDate = new Date(event.date);
                matchesDate = eventDate >= dateRange[0] && eventDate <= dateRange[1];
            } else if (dateRange[0]) {
                const eventDate = new Date(event.date);
                matchesDate = eventDate.toDateString() === dateRange[0].toDateString();
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [searchQuery, selectedCategory, dateRange, events]);

    return (
        <main className="min-h-screen relative bg-white pb-32">
            {/* Background Image Banner */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
                style={{ backgroundImage: 'url("/event_bg.png")' }}
            />

            <div className="relative z-10 pt-[120px] px-4 md:px-12 lg:px-16">
                {/* Hero Section */}
                <section className="mb-24 text-center lg:text-left">
                    <div className="max-w-4xl mx-auto lg:mx-0">
                        <motion.h1
                            className={`${instrumentSerif.className} text-[#1a1a1a] text-[12vw] md:text-[7.5vw] lg:text-[7vw] xl:text-[5.5vw] leading-[1] md:leading-[0.95] tracking-[-0.02em]`}
                            variants={container}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.3 }}
                        >
                            <div className="block">
                                {['All', 'Events,'].map((word, i) => (
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
                                {['at', 'one', 'place'].map((word, i) => (
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

                {/* Search and Filters Section */}
                <section className="mb-20">
                    <style jsx global>{`
                        .react-calendar {
                            border: none !important;
                            font-family: inherit !important;
                            width: 100% !important;
                            background: transparent !important;
                            padding: 10px !important;
                        }
                        /* Header Navigation */
                        .react-calendar__navigation {
                            display: flex !important;
                            height: 44px !important;
                            margin-bottom: 20px !important;
                            background: rgba(0,0,0,0.03) !important;
                            border-radius: 14px !important;
                            padding: 4px !important;
                        }
                        .react-calendar__navigation button {
                            min-width: 36px !important;
                            background: none !important;
                            border-radius: 10px !important;
                            transition: all 0.2s !important;
                            font-weight: 700 !important;
                            color: #1a1a1a !important;
                        }
                        .react-calendar__navigation button:enabled:hover,
                        .react-calendar__navigation button:enabled:focus {
                            background-color: white !important;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
                        }
                        .react-calendar__navigation__label {
                            flex-grow: 1 !important;
                            font-size: 15px !important;
                            letter-spacing: -0.01em !important;
                        }
                        /* Hide year navigation (double arrows) */
                        .react-calendar__navigation__prev2-button,
                        .react-calendar__navigation__next2-button {
                            display: none !important;
                        }
                        /* Weekdays Header */
                        .react-calendar__month-view__weekdays {
                            text-align: center !important;
                            text-transform: uppercase !important;
                            font-weight: 800 !important;
                            font-size: 10px !important;
                            letter-spacing: 0.1em !important;
                            color: rgba(26, 26, 26, 0.3) !important;
                            padding-bottom: 12px !important;
                        }
                        .react-calendar__month-view__weekdays__weekday abbr {
                            text-decoration: none !important;
                        }
                        /* Day Tiles */
                        .react-calendar__tile {
                            padding: 12px 8px !important;
                            font-size: 13px !important;
                            font-weight: 600 !important;
                            color: #1a1a1a !important;
                            border-radius: 12px !important;
                            transition: all 0.2s !important;
                            position: relative !important;
                            z-index: 1 !important;
                        }
                        /* Fix Red Weekend Color */
                        .react-calendar__month-view__days__day--weekend {
                            color: #1a1a1a !important;
                        }
                        .react-calendar__month-view__days__day--neighboringMonth {
                            color: rgba(26, 26, 26, 0.15) !important;
                        }
                        .react-calendar__tile:enabled:hover,
                        .react-calendar__tile:enabled:focus {
                            background-color: rgba(0,0,0,0.05) !important;
                            color: #1a1a1a !important;
                        }
                        /* Active & Range States */
                        .react-calendar__tile--now {
                            background: rgba(0,0,0,0.03) !important;
                            color: #1a1a1a !important;
                        }
                        .react-calendar__tile--active {
                            background: #1a1a1a !important;
                            color: white !important;
                            box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
                        }
                        .react-calendar__tile--rangeStart, 
                        .react-calendar__tile--rangeEnd {
                            background: #1a1a1a !important;
                            color: white !important;
                            border-radius: 14px !important;
                            z-index: 2 !important;
                        }
                        .react-calendar__tile--range {
                            background: rgba(0,0,0,0.05) !important;
                            color: #1a1a1a !important;
                            border-radius: 0 !important;
                        }
                        .react-calendar__tile--rangeStart {
                            border-top-right-radius: 0 !important;
                            border-bottom-right-radius: 0 !important;
                        }
                        .react-calendar__tile--rangeEnd {
                            border-top-left-radius: 0 !important;
                            border-bottom-left-radius: 0 !important;
                        }
                    `}</style>

                    <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center">
                        {/* Search Bar */}
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/20 group-focus-within:text-[#1a1a1a] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 rounded-full bg-black/5 hover:bg-black/[0.08] focus:bg-white focus:ring-1 focus:ring-black/10 transition-all outline-none text-base font-medium placeholder:text-[#1a1a1a]/20 text-[#1a1a1a]"
                            />
                        </div>

                        {/* Filter Actions */}
                        <div className="flex items-center gap-4">
                            {/* Date Range Filter */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsCalendarOpen(!isCalendarOpen);
                                        setIsFilterOpen(false);
                                    }}
                                    className={`p-4 rounded-full border transition-all duration-300 flex items-center gap-2.5 ${(dateRange[0] || isCalendarOpen)
                                        ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-lg shadow-black/5 px-6'
                                        : 'bg-white text-[#1a1a1a]/60 border-black/5 hover:border-black/20 hover:text-[#1a1a1a]'
                                        }`}
                                >
                                    <CalendarIcon className="w-5 h-5" />
                                    {(dateRange[0] || isCalendarOpen) && (
                                        <span className="font-bold text-sm whitespace-nowrap">
                                            {dateRange[0] ? (
                                                dateRange[1] ? (
                                                    `${dateRange[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${dateRange[1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                                ) : dateRange[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            ) : 'Dates'}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isCalendarOpen && (
                                        <>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsCalendarOpen(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-4 z-50 bg-white p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 min-w-[300px]"
                                            >
                                                <div className="mb-4 px-2 flex items-center justify-between">
                                                    <h4 className="font-bold text-sm tracking-tight">Select Dates</h4>
                                                    {(dateRange[0] || dateRange[1]) && (
                                                        <button
                                                            onClick={() => setDateRange([null, null])}
                                                            className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600"
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                </div>
                                                <Calendar
                                                    onChange={(val) => {
                                                        if (Array.isArray(val)) {
                                                            setDateRange([val[0] as Date, val[1] as Date]);
                                                        } else {
                                                            setDateRange([val as Date, null]);
                                                        }
                                                    }}
                                                    selectRange={true}
                                                    value={dateRange[0] ? (dateRange[1] ? [dateRange[0], dateRange[1]] : dateRange[0]) : null}
                                                    nextLabel={<ChevronRight className="w-5 h-5" />}
                                                    prevLabel={<ChevronLeft className="w-5 h-5" />}
                                                />
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Category Filter Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsFilterOpen(!isFilterOpen);
                                        setIsCalendarOpen(false);
                                    }}
                                    className={`p-4 rounded-full border transition-all duration-300 flex items-center gap-2.5 ${(selectedCategory !== 'All' || isFilterOpen)
                                        ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-lg shadow-black/5 px-6'
                                        : 'bg-white text-[#1a1a1a]/60 border-black/5 hover:border-black/20 hover:text-[#1a1a1a]'
                                        }`}
                                >
                                    <SlidersHorizontal className="w-5 h-5" />
                                    {(selectedCategory !== 'All' || isFilterOpen) && (
                                        <span className="font-bold text-sm">{selectedCategory === 'All' ? 'Filter' : selectedCategory}</span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsFilterOpen(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-4 z-50 bg-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 min-w-[220px]"
                                            >
                                                <div className="space-y-1">
                                                    {categories.map((category) => (
                                                        <button
                                                            key={category}
                                                            onClick={() => {
                                                                setSelectedCategory(category);
                                                                setIsFilterOpen(false);
                                                            }}
                                                            className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all ${selectedCategory === category
                                                                ? 'bg-[#1a1a1a] text-white'
                                                                : 'text-[#1a1a1a]/60 hover:bg-black/5 hover:text-[#1a1a1a]'
                                                                }`}
                                                        >
                                                            {category}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Events Grid */}
                <section className="min-h-[600px]">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 text-center w-full col-span-full">
                                <Loader2 className="w-10 h-10 text-[#1a1a1a]/20 animate-spin mb-4" />
                                <p className="text-[#1a1a1a]/40 font-medium">Loading events...</p>
                            </div>
                        ) : filteredEvents.length > 0 ? (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20"
                                layout
                            >
                                {filteredEvents.map((event) => (
                                    <Link href={`/event/${event.id}`} key={event.id}>
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                                            className="relative group cursor-pointer"
                                        >
                                            <div className="relative aspect-[16/10] overflow-hidden rounded-[2.5rem] bg-gray-100 mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                                                <Image
                                                    src={event.image}
                                                    alt={event.title}
                                                    fill
                                                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-500" />

                                                {/* Status Badge */}
                                                <div className="absolute top-6 right-6">
                                                    <div className="px-5 py-2 rounded-full backdrop-blur-xl border-t border-l border-white/20 bg-white/10 shadow-lg text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
                                                        <span className="relative drop-shadow-md">
                                                            {event.status === 'published' ? 'Upcoming' : (event.status === 'waitlist' ? 'Waitlist' : event.status)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Hover Icon */}
                                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                                    <div className="bg-white p-3 rounded-full shadow-2xl">
                                                        <ArrowUpRight className="w-5 h-5 text-[#1a1a1a]" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-2 space-y-4">
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[#1a1a1a]/40 font-bold text-[10px] uppercase tracking-[0.2em]">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-3.5 h-3.5" />
                                                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {event.location}
                                                    </div>
                                                </div>

                                                <h3 className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl md:text-4xl leading-tight group-hover:text-[#1a1a1a]/60 transition-colors duration-300`}>
                                                    {event.title}
                                                </h3>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-40 text-center"
                            >
                                <p className={`${instrumentSerif.className} text-4xl text-[#1a1a1a]/20 mb-4`}>No events found</p>
                                <p className="text-[#1a1a1a]/40 font-medium">Try adjusting your search or filters</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </div>
        </main>
    );
}
