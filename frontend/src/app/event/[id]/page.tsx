'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { instrumentSerif } from '@/lib/fonts';
import Image from 'next/image';
import { Loader2, MapPin, Calendar, Clock, User, ArrowLeft, X, Info, Users, Star } from 'lucide-react';
import Link from 'next/link';
import RegistrationModal from '@/components/RegistrationModal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getBackendUrl } from '@/lib/backend';
import { supabase } from '@/lib/supabase';

const BACKEND_URL = getBackendUrl();

interface EventDetailData {
    event: {
        id: string;
        name: string;
        bannerUrl: string | null;
        eventDate: string | null;
        address1: string;
        address2: string | null;
        city: string;
        state: string;
        country: string;
        about: string | null;
        termsAndConditions: string | null;
        status: string;
        locationUrl: string | null;
    };
    tickets: Array<{
        id: string;
        description: any;
        price: number;
        quantity: number | null;
        soldCount: number;
        status: string;
        maxQuantityPerPerson: number;
        visibilityConfig?: Record<string, string[]>;
    }>;
    formFields: Array<{
        id: string;
        fieldName: string;
        label: string;
        fieldType: string;
        isRequired: boolean;
        isHidden: boolean;
        options: any;
        displayOrder: number;
    }>;
    bundleOffers: Array<{
        id: string;
        name: string;
        buyQuantity: number;
        getQuantity: number;
        offerType: string;
        applicableTicketIds: string[] | null;
    }>;
}

export default function EventDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [data, setData] = useState<EventDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState(false);
    const [isCheckingWaitlist, setIsCheckingWaitlist] = useState(false);
    const [existingWaitlistBooking, setExistingWaitlistBooking] = useState<{
        id: string;
        formResponse: Record<string, unknown>;
    } | null>(null);
    const [aboutExpanded, setAboutExpanded] = useState(false);
    const [showFloatingCta, setShowFloatingCta] = useState(true);
    const { user, isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();
    const { showToast } = useToast();

    const inlineCtaRef = useRef<HTMLDivElement>(null);

    // IntersectionObserver to hide floating CTA once inline CTA is visible
    useEffect(() => {
        if (!inlineCtaRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowFloatingCta(!entry.isIntersecting);
            },
            { threshold: 0.3 }
        );
        observer.observe(inlineCtaRef.current);
        return () => observer.disconnect();
    }, [data]);

    useEffect(() => {
        if (!id) return;

        const fetchEventDetail = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/events/${id}`);
                if (!response.ok) throw new Error('Event not found');
                const detail: EventDetailData = await response.json();
                setData(detail);
            } catch (err: any) {
                console.error('Error fetching event detail:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEventDetail();
    }, [id]);

    useEffect(() => {
        const checkWaitlistStatus = async () => {
            if (!id || !data?.event || !isAuthenticated || !user?.id) {
                setHasJoinedWaitlist(false);
                setExistingWaitlistBooking(null);
                return;
            }

            if (data.event.status !== 'waitlist' && data.event.status !== 'published') {
                setHasJoinedWaitlist(false);
                setExistingWaitlistBooking(null);
                return;
            }

            setIsCheckingWaitlist(true);
            try {
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    throw new Error(sessionError.message || 'Unable to fetch session');
                }

                const accessToken = sessionData.session?.access_token;
                if (!accessToken) {
                    setHasJoinedWaitlist(false);
                    setExistingWaitlistBooking(null);
                    return;
                }

                const response = await fetch(`${BACKEND_URL}/api/bookings/event/${id}?page=1&limit=50`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    setHasJoinedWaitlist(false);
                    setExistingWaitlistBooking(null);
                    return;
                }

                const payload = await response.json();
                const items = Array.isArray(payload?.items) ? payload.items : [];
                const activeWaitlistBooking = items.find(
                    (item: { id?: string; deletedAt?: string | null; isWaitlisted?: boolean; formResponse?: Record<string, unknown> | null }) =>
                        !item?.deletedAt && item?.isWaitlisted === true,
                );

                if (data.event.status === 'waitlist') {
                    setHasJoinedWaitlist(Boolean(activeWaitlistBooking));
                    setExistingWaitlistBooking(null);
                    return;
                }

                setHasJoinedWaitlist(false);
                if (activeWaitlistBooking?.id) {
                    setExistingWaitlistBooking({
                        id: activeWaitlistBooking.id,
                        formResponse:
                            activeWaitlistBooking.formResponse &&
                                typeof activeWaitlistBooking.formResponse === 'object' &&
                                !Array.isArray(activeWaitlistBooking.formResponse)
                                ? activeWaitlistBooking.formResponse
                                : {},
                    });
                    return;
                }
                setExistingWaitlistBooking(null);
            } catch {
                setHasJoinedWaitlist(false);
                setExistingWaitlistBooking(null);
            } finally {
                setIsCheckingWaitlist(false);
            }
        };

        checkWaitlistStatus();
    }, [id, data?.event?.status, isAuthenticated, user?.id]);

    const minPrice = useMemo(() => {
        if (!data?.tickets || data.tickets.length === 0) return 0;
        return Math.min(...data.tickets.map(t => t.price));
    }, [data?.tickets]);

    const totalSeatsLeft = useMemo(() => {
        if (!data?.tickets || data.tickets.length === 0) return null;
        let total = 0;
        let hasQuantity = false;
        for (const t of data.tickets) {
            if (t.quantity !== null) {
                hasQuantity = true;
                total += Math.max(0, t.quantity - t.soldCount);
            }
        }
        return hasQuantity ? total : null;
    }, [data?.tickets]);

    const totalAttending = useMemo(() => {
        if (!data?.tickets || data.tickets.length === 0) return 0;
        return data.tickets.reduce((sum, t) => sum + t.soldCount, 0);
    }, [data?.tickets]);

    const getMapEmbedUrl = () => {
        if (!data?.event) return "";
        const { address1, city, state } = data.event;
        const addressQuery = `${address1}, ${city}, ${state}`;
        return `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}&hl=en&z=14&output=embed`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 text-[#1a1a1a]/20 animate-spin mb-4" />
                <p className="text-[#1a1a1a]/40 font-medium font-montserrat">Loading event details...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
                <h2 className={`${instrumentSerif.className} text-4xl text-[#1a1a1a] mb-4`}>Event Not Found</h2>
                <p className="text-[#1a1a1a]/60 font-montserrat mb-8">The event you are looking for might have been removed or is currently unavailable.</p>
                <Link href="/events" className="px-8 py-3 rounded-full bg-[#1a1a1a] text-white font-montserrat font-medium hover:bg-black transition-all">
                    Back to Events
                </Link>
            </div>
        );
    }

    const { event, tickets, formFields } = data;
    const eventDate = event.eventDate ? new Date(event.eventDate) : null;

    const handleBookNowClick = () => {
        if (event.status === 'waitlist' && hasJoinedWaitlist) {
            return;
        }
        if (!isAuthenticated) {
            openAuthModal();
            showToast('Please log in to continue with booking.', 'info');
            return;
        }
        setIsRegModalOpen(true);
    };

    const ctaButtonText = event.status === 'published'
        ? 'Buy Tickets Now'
        : event.status === 'waitlist'
            ? (isCheckingWaitlist ? 'Checking...' : hasJoinedWaitlist ? 'Joined Waitlist' : 'Join Waitlist')
            : 'Registration Closed';

    const ctaDisabled =
        (event.status !== 'published' && event.status !== 'waitlist') ||
        authLoading ||
        isCheckingWaitlist ||
        (event.status === 'waitlist' && hasJoinedWaitlist);

    const ctaClassName = `w-full py-4 rounded-xl font-montserrat font-bold text-sm tracking-wide transition-all duration-300 ${(event.status === 'published' || event.status === 'waitlist')
        ? (event.status === 'waitlist' && hasJoinedWaitlist)
            ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
            : 'bg-[#E91E63] text-white hover:bg-[#d81b60] hover:shadow-lg hover:shadow-pink-200 active:scale-[0.98]'
        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`;

    return (
        <main className="min-h-screen bg-[#f5f5f7]" style={{ padding: '0 20px' }}>
            {/* ===== HERO SECTION ===== */}
            <section className="pt-20 lg:pt-24 pb-4 md:pb-8">
                <div className="max-w-7xl mx-auto">
                    <div
                        className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 bg-gray-50 cursor-pointer group"
                        onClick={() => setIsBannerModalOpen(true)}
                    >
                        {/* Background Image */}
                        <Image
                            src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop'}
                            alt={event.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            unoptimized={true}
                        />
                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 pointer-events-none" />

                        {/* Enlarge Icon on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className="bg-black/50 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-2 font-montserrat font-medium shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                                Enlarge Image
                            </div>
                        </div>

                        {/* Hero Content — Bottom Left (Desktop only) */}
                        <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-10 pb-6 lg:pb-10 pointer-events-none hidden md:block">
                            <h1 className={`${instrumentSerif.className} text-white text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-[1.05] max-w-3xl mb-4`}>
                                {event.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-white/90 font-montserrat text-sm font-medium">
                                <span className="inline-flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {eventDate ? eventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBD'}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {event.city}, {event.state}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {eventDate ? eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'TBD'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== MOBILE INFO BLOCK (below hero) ===== */}
            <section className="md:hidden px-1 pb-4">
                <div className="flex items-start justify-between gap-3">
                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <h1 className={`${instrumentSerif.className} text-[#1a1a1a] text-2xl leading-tight mb-2`}>
                            {event.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#1a1a1a]/60 font-montserrat text-xs font-medium">
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {eventDate ? eventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {event.city}, {event.state}
                            </span>
                        </div>
                    </div>
                    {/* Price Badge */}
                    {event.status !== 'waitlist' && event.status !== 'cancelled' && (
                        <div className="flex-shrink-0 bg-gradient-to-br from-[#E91E63] to-[#d81b60] text-white rounded-xl px-4 py-2.5 text-center shadow-lg shadow-pink-200/40">
                            <span className={`${instrumentSerif.className} text-2xl leading-none block`}>
                                ₹{minPrice.toLocaleString()}
                            </span>
                            <span className="font-montserrat text-[9px] text-white/80 font-medium block mt-0.5">
                                Onwards
                            </span>
                        </div>
                    )}
                    {event.status === 'waitlist' && (
                        <div className="flex-shrink-0 bg-amber-50 text-amber-600 rounded-xl px-4 py-2.5 text-center border border-amber-200">
                            <span className="font-montserrat text-xs font-bold block">Waitlist</span>
                            <span className="font-montserrat text-[9px] text-amber-500 font-medium block mt-0.5">Open</span>
                        </div>
                    )}
                </div>
            </section>

            {/* ===== CONTENT AREA ===== */}
            <section className="py-6 md:py-10 lg:py-14" id="details">
                <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-5 gap-6 md:gap-8 lg:gap-10">

                    {/* ===== LEFT COLUMN (Main Content) ===== */}
                    <div className="lg:col-span-3 space-y-6 md:space-y-8">

                        {/* About Event Card */}
                        <div className="bg-white rounded-2xl p-5 md:p-6 lg:p-8 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2.5 mb-4 md:mb-5">
                                <div className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center">
                                    <Info className="w-4 h-4 text-[#E91E63]" />
                                </div>
                                <h2 className="font-montserrat text-[#1a1a1a] text-base md:text-lg font-bold">About Event</h2>
                            </div>
                            {/* Mobile: truncated with read more */}
                            <div className="md:hidden">
                                <p className={`font-montserrat text-[#1a1a1a]/75 text-sm leading-relaxed whitespace-pre-wrap ${!aboutExpanded ? 'line-clamp-3' : ''}`}>
                                    {event.about || "No description provided for this event."}
                                </p>
                                {event.about && event.about.length > 120 && (
                                    <button
                                        onClick={() => setAboutExpanded(!aboutExpanded)}
                                        className="font-montserrat text-sm font-semibold text-[#E91E63] mt-1.5 hover:text-[#d81b60] transition-colors"
                                    >
                                        {aboutExpanded ? 'Show Less' : 'Read More'}
                                    </button>
                                )}
                            </div>
                            {/* Desktop: full text */}
                            <p className="hidden md:block font-montserrat text-[#1a1a1a]/75 text-sm leading-relaxed whitespace-pre-wrap">
                                {event.about || "No description provided for this event."}
                            </p>
                        </div>

                        {/* Terms and Conditions */}
                        {event.termsAndConditions && (
                            <div className="bg-white rounded-2xl p-5 md:p-6 lg:p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2.5 mb-4 md:mb-5">
                                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
                                        <Info className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <h2 className="font-montserrat text-[#1a1a1a] text-base md:text-lg font-bold">Terms & Conditions</h2>
                                </div>
                                <ul className="list-disc pl-5 font-montserrat text-[#1a1a1a]/70 text-sm space-y-2">
                                    {event.termsAndConditions.split('\n').filter(line => line.trim() !== '').map((line, index) => (
                                        <li key={index}>{line.trim()}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Participants & Host */}
                        {totalAttending > 0 && (
                            <div className="bg-white rounded-2xl p-5 md:p-6 lg:p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2.5 mb-4 md:mb-5">
                                    <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center">
                                        <Users className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <h2 className="font-montserrat text-[#1a1a1a] text-base md:text-lg font-bold">Participants & Host</h2>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Avatar stack */}
                                    <div className="flex -space-x-3">
                                        {[...Array(Math.min(4, totalAttending))].map((_, i) => (
                                            <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 border-2 border-white flex items-center justify-center">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                        ))}
                                        {totalAttending > 4 && (
                                            <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                                                <span className="font-montserrat text-xs font-bold text-gray-500">+{totalAttending - 4 > 999 ? `${Math.floor((totalAttending - 4) / 1000)}k` : totalAttending - 4}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-montserrat text-[#1a1a1a] font-bold text-sm">
                                            {totalAttending > 999 ? `${(totalAttending / 1000).toFixed(0)},${String(totalAttending % 1000).padStart(3, '0')}` : totalAttending.toLocaleString()}+ Attending
                                        </p>
                                        <p className="font-montserrat text-[#1a1a1a]/50 text-xs">
                                            Join the community
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Location Card — Mobile only (inline in content) */}
                        <div className="lg:hidden bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="px-5 pt-4 pb-2">
                                <h3 className="font-montserrat text-[#1a1a1a] text-base font-bold">Location</h3>
                            </div>
                            {/* Map */}
                            <div className="w-full h-[180px] relative bg-gray-50">
                                <iframe
                                    src={getMapEmbedUrl()}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                            {/* Address */}
                            <div className="px-5 py-3">
                                <p className="font-montserrat text-[#1a1a1a] text-sm font-bold mb-1">
                                    {event.address1}
                                </p>
                                <p className="font-montserrat text-[#1a1a1a]/50 text-xs">
                                    {event.address2 && `${event.address2}, `}{event.city}, {event.state}
                                </p>
                                {event.locationUrl && (
                                    <a
                                        href={event.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-2 font-montserrat text-xs font-bold text-[#E91E63] hover:text-[#d81b60] transition-colors"
                                    >
                                        Get Directions
                                        <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Mobile inline CTA anchor (observer target) */}
                        <div ref={inlineCtaRef} className="lg:hidden">
                            <button
                                onClick={handleBookNowClick}
                                className={ctaClassName}
                                disabled={ctaDisabled}
                            >
                                {ctaButtonText}
                            </button>
                        </div>

                    </div>

                    {/* ===== RIGHT COLUMN (Sticky Sidebar — Desktop only) ===== */}
                    <div className="hidden lg:block lg:col-span-2 space-y-6">
                        <div className="lg:sticky lg:top-28 space-y-6">

                            {/* Ticket Price Card */}
                            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                                {event.status !== 'waitlist' && event.status !== 'cancelled' && (
                                    <>
                                        <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/40 font-bold mb-2">Ticket Price</p>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className={`${instrumentSerif.className} text-[#E91E63] text-4xl lg:text-5xl`}>
                                                ₹{minPrice.toLocaleString()}
                                            </span>
                                            <span className="font-montserrat text-sm text-[#1a1a1a]/40 font-medium">
                                                Onwards
                                            </span>
                                        </div>

                                    </>
                                )}

                                {event.status === 'waitlist' && (
                                    <div className="mb-4">
                                        <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/40 font-bold mb-2">Status</p>
                                        <span className={`${instrumentSerif.className} text-amber-500 text-3xl`}>Waitlist Open</span>
                                    </div>
                                )}

                                {/* CTA Button */}
                                <button
                                    onClick={handleBookNowClick}
                                    className={`${ctaClassName} mt-4`}
                                    disabled={ctaDisabled}
                                >
                                    {ctaButtonText}
                                </button>

                            </div>

                            {/* Location Card — Desktop only */}
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                <div className="px-6 pt-5 pb-3">
                                    <h3 className="font-montserrat text-[#1a1a1a] text-base font-bold">Location</h3>
                                </div>
                                {/* Map */}
                                <div className="w-full h-[200px] relative bg-gray-50">
                                    <iframe
                                        src={getMapEmbedUrl()}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                                {/* Address */}
                                <div className="px-6 py-4">
                                    <p className="font-montserrat text-[#1a1a1a] text-sm font-bold mb-1">
                                        {event.address1}
                                    </p>
                                    <p className="font-montserrat text-[#1a1a1a]/50 text-xs">
                                        {event.address2 && `${event.address2}, `}{event.city}, {event.state}
                                    </p>
                                    {event.locationUrl && (
                                        <a
                                            href={event.locationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-3 font-montserrat text-xs font-bold text-[#E91E63] hover:text-[#d81b60] transition-colors"
                                        >
                                            Get Directions
                                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FLOATING MOBILE CTA BAR ===== */}
            {showFloatingCta && (
                <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
                    <div className="bg-gradient-to-t from-white via-white to-white/0 pt-6 pb-5 px-5">
                        <button
                            onClick={handleBookNowClick}
                            className={`w-full py-3.5 rounded-xl font-montserrat font-bold text-sm tracking-wide transition-all duration-300 ${(event.status === 'published' || event.status === 'waitlist')
                                ? (event.status === 'waitlist' && hasJoinedWaitlist)
                                    ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                                    : 'bg-[#E91E63] text-white shadow-lg shadow-pink-200/50 active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                            disabled={ctaDisabled}
                        >
                            {event.status === 'published'
                                ? 'Buy Ticket'
                                : event.status === 'waitlist'
                                    ? (isCheckingWaitlist ? 'Checking...' : hasJoinedWaitlist ? 'Joined Waitlist' : 'Join Waitlist')
                                    : 'Closed'}
                        </button>
                    </div>
                </div>
            )}

            {data && (
                <RegistrationModal
                    isOpen={isRegModalOpen}
                    onClose={() => setIsRegModalOpen(false)}
                    onBookingCreated={(mode) => {
                        if (mode === 'waitlist') {
                            setHasJoinedWaitlist(true);
                        }
                    }}
                    eventId={event.id}
                    eventName={event.name}
                    tickets={tickets}
                    formFields={formFields}
                    bundleOffers={data.bundleOffers}
                    backendUrl={BACKEND_URL}
                    eventStatus={event.status}
                    existingWaitlistBooking={existingWaitlistBooking}
                />
            )}

            {/* Banner Full Screen Modal */}
            {isBannerModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8 cursor-pointer animate-in fade-in duration-300"
                    onClick={() => setIsBannerModalOpen(false)}
                >
                    <div className="relative w-full h-full max-w-7xl flex flex-col items-center justify-center">
                        <button
                            className="absolute top-4 right-4 md:top-0 md:right-0 z-[110] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsBannerModalOpen(false);
                            }}
                            title="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="relative w-full h-full max-h-[85vh] animate-in zoom-in-95 duration-300">
                            <Image
                                src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop'}
                                alt={event.name}
                                fill
                                className="object-contain"
                                unoptimized={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
