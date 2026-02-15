'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { instrumentSerif } from '@/lib/fonts';
import Image from 'next/image';
import { Loader2, MapPin, Calendar, Clock, User, ArrowLeft } from 'lucide-react';
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
    const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState(false);
    const [isCheckingWaitlist, setIsCheckingWaitlist] = useState(false);
    const { user, isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();
    const { showToast } = useToast();

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
            if (!id || !data?.event || data.event.status !== 'waitlist' || !isAuthenticated || !user?.id) {
                setHasJoinedWaitlist(false);
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
                    return;
                }

                const response = await fetch(`${BACKEND_URL}/api/bookings/event/${id}?page=1&limit=20`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    setHasJoinedWaitlist(false);
                    return;
                }

                const payload = await response.json();
                const items = Array.isArray(payload?.items) ? payload.items : [];
                const activeWaitlistBooking = items.find(
                    (item: { deletedAt?: string | null; isWaitlisted?: boolean }) =>
                        !item?.deletedAt && item?.isWaitlisted === true,
                );
                setHasJoinedWaitlist(Boolean(activeWaitlistBooking));
            } catch {
                setHasJoinedWaitlist(false);
            } finally {
                setIsCheckingWaitlist(false);
            }
        };

        checkWaitlistStatus();
    }, [id, data?.event, isAuthenticated, user?.id]);

    const minPrice = useMemo(() => {
        if (!data?.tickets || data.tickets.length === 0) return 0;
        return Math.min(...data.tickets.map(t => t.price));
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

    return (
        <main className="min-h-screen bg-white">
            {/* Hero Wrapper with background image */}
            <div
                className="relative w-full bg-cover bg-top bg-no-repeat"
                style={{ backgroundImage: "url('/event_bg.png')" }}
            >

                {/* Banner Section - First */}
                <section className="pt-32 pb-8">
                    <div className="w-full max-w-[85vw] md:max-w-7xl mx-auto px-4 md:px-12 lg:px-16">
                        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 bg-gray-50">
                            <Image
                                src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop'}
                                alt={event.name}
                                fill
                                className="object-cover"
                                unoptimized={true}
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>
                    </div>
                </section>

                {/* Event Title Section - Second */}
                <section className="pb-16 text-center px-4">
                    <div className="flex flex-col items-center">
                        <h1 className={`${instrumentSerif.className} text-[#1a1a1a] text-[8vw] md:text-[6vw] lg:text-[5vw] leading-[1] text-center mb-4`}>
                            {event.name}
                        </h1>
                        <div className="flex flex-col gap-1 text-[#1a1a1a] text-lg md:text-xl font-medium tracking-wide items-center font-montserrat">
                            <p>{eventDate ? eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date TBD'}</p>
                            <p>{event.city}, {event.state}</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Event Details Content - Third */}
            <section className="bg-white pb-48 px-4 md:px-12 lg:px-16" id="details">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-16">
                        {/* About */}
                        <div>
                            <h2 className={`${instrumentSerif.className} text-[#1a1a1a] text-4xl mb-6`}>
                                About the Event
                            </h2>
                            <p className="font-montserrat text-[#1a1a1a]/80 text-lg leading-relaxed whitespace-pre-wrap">
                                {event.about || "No description provided for this event."}
                            </p>
                        </div>

                        {/* Terms and Conditions */}
                        {event.termsAndConditions && (
                            <div>
                                <h3 className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl mb-4`}>
                                    Terms and Conditions
                                </h3>
                                <ul className="list-disc pl-5 font-montserrat text-[#1a1a1a]/70 text-base space-y-3">
                                    {event.termsAndConditions.split('\n').filter(line => line.trim() !== '').map((line, index) => (
                                        <li key={index}>{line.trim()}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Location Map */}
                        <div>
                            <h3 className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl mb-6`}>
                                Location
                            </h3>
                            <p className="font-montserrat text-[#1a1a1a]/80 text-lg mb-4 flex items-center gap-2">
                                <span className="font-semibold">{event.address1}</span>
                                {event.address2 && <span>— {event.address2}</span>}
                                <span>, {event.city}, {event.state} {event.country}</span>
                            </p>
                            <div className="w-full h-[400px] rounded-3xl overflow-hidden shadow-lg border border-gray-100 relative grayscale hover:grayscale-0 transition-all duration-500">
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
                            {event.locationUrl && (
                                <a
                                    href={event.locationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-6 inline-flex items-center gap-2 font-montserrat text-sm font-semibold text-[#1a1a1a] hover:text-primary transition-colors group"
                                >
                                    <MapPin className="w-4 h-4" />
                                    <span>View on Google Maps</span>
                                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 space-y-8">

                            {/* Date & Time */}
                            <div className="space-y-6">
                                <div>
                                    <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-2">Date</p>
                                    <p className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl`}>
                                        {eventDate ? eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-2">Time</p>
                                    <p className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl`}>
                                        {eventDate ? eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'TBD'}
                                    </p>
                                </div>
                            </div>

                            {event.status !== 'published' && (
                                <>
                                    <div className="h-px bg-gray-100" />

                                    {/* Status */}
                                    <div>
                                        <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-2">Status</p>
                                        <p className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl capitalize`}>
                                            {event.status === 'published' ? 'Upcoming' : (event.status === 'waitlist' ? 'Waitlist' : event.status)}
                                        </p>
                                    </div>
                                </>
                            )}

                            {event.status !== 'waitlist' && event.status !== 'cancelled' && (
                                <>
                                    <div className="h-px bg-gray-100" />
                                    {/* Price */}
                                    <div>
                                        <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-2">Starting From</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className={`${instrumentSerif.className} text-[#1a1a1a] text-5xl`}>₹{minPrice}</p>
                                            <span className="font-montserrat text-sm text-[#1a1a1a]/50">/ person</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                onClick={handleBookNowClick}
                                className={`w-full py-5 rounded-full font-montserrat font-semibold tracking-wide transition-all duration-300 shadow-xl shadow-black/10 ${(event.status === 'published' || event.status === 'waitlist')
                                    ? (event.status === 'waitlist' && hasJoinedWaitlist)
                                        ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                                        : 'bg-[#1a1a1a] text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    }`}
                                disabled={
                                    (event.status !== 'published' && event.status !== 'waitlist') ||
                                    authLoading ||
                                    isCheckingWaitlist ||
                                    (event.status === 'waitlist' && hasJoinedWaitlist)
                                }
                            >
                                {event.status === 'published'
                                    ? 'Book Now'
                                    : event.status === 'waitlist'
                                        ? (isCheckingWaitlist ? 'Checking...' : hasJoinedWaitlist ? 'Joined Waitlist' : 'Join Waitlist')
                                        : 'Registration Closed'}
                            </button>

                            <p className="font-montserrat text-xs text-center text-[#1a1a1a]/40">
                                {event.status === 'published'
                                    ? 'Limited seats available'
                                    : event.status === 'waitlist'
                                        ? (hasJoinedWaitlist ? 'You are already on the waitlist for this event' : 'Join the waitlist for future updates')
                                        : 'Event is no longer accepting registrations'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

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
                />
            )}
        </main>
    );
}
