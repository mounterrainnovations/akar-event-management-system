'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, Clock, AlertCircle, CheckCircle2, XCircle, Hourglass, Loader2, Download, FileText } from 'lucide-react';
import { instrumentSerif } from '@/lib/fonts';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getBackendUrl } from '@/lib/backend';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import BookingDetailsModal from '@/components/BookingDetailsModal';

interface Booking {
    id: string;
    eventId: string;
    totalAmount: number;
    finalAmount: number;
    paymentStatus: string;
    createdAt: string;
    ticketsBought: Record<string, number>;
    isWaitlisted: boolean;
    ticketUrl: string | null;
    formResponse: Record<string, any>; // Added formResponse
    event: {
        name: string;
        date: string | null;
        bannerUrl: string | null;
        location: string;
    };
    tickets: {
        id: string;
        name: string;
        price: number;
        quantity: number;
        type: string;
    }[];
}

export default function MyBookingsPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!isAuthenticated || !user) {
                if (!authLoading) setIsLoading(false);
                return;
            }

            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData.session?.access_token;

                if (!token) throw new Error('No access token found');

                const response = await fetch(`${getBackendUrl()}/api/bookings?limit=50`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch bookings');
                }

                const data = await response.json();
                setBookings(data.items || []);
            } catch (err: any) {
                console.error('Error fetching bookings:', err);
                setError('Failed to load your bookings. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookings();
    }, [isAuthenticated, user, authLoading]);

    const getStatusConfig = (booking: Booking) => {
        if (booking.isWaitlisted) {
            return {
                label: 'Waitlist',
                icon: Hourglass,
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                border: 'border-blue-100'
            };
        }
        if (booking.paymentStatus === 'success') {
            return {
                label: 'Confirmed',
                icon: CheckCircle2,
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                border: 'border-emerald-100'
            };
        }
        if (booking.paymentStatus === 'pending') {
            return {
                label: 'Pending',
                icon: Clock,
                bg: 'bg-amber-50',
                text: 'text-amber-600',
                border: 'border-amber-100'
            };
        }
        return {
            label: booking.paymentStatus,
            icon: AlertCircle,
            bg: 'bg-gray-50',
            text: 'text-gray-600',
            border: 'border-gray-100'
        };
    };

    if (authLoading || (isLoading && isAuthenticated)) {
        return (
            <div className="min-h-screen bg-white pt-32 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a1a1a]/20" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-white pt-32 pb-20 px-4">
                <div className="max-w-md mx-auto text-center space-y-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <UserIcon className="w-8 h-8 text-[#1a1a1a]/40" />
                    </div>
                    <h1 className={`${instrumentSerif.className} text-3xl text-[#1a1a1a]`}>
                        Please Log In
                    </h1>
                    <p className="text-[#1a1a1a]/60 font-montserrat">
                        You need to be logged in to view your bookings.
                    </p>
                    <Link href="/auth" className="inline-block px-8 py-3 bg-[#1a1a1a] text-white rounded-full font-bold font-montserrat">
                        Log In
                    </Link>
                </div>
            </main>
        );
    }

    const handleDownloadTicket = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        if (!url) {
            alert('Your ticket is being generated. Please refresh the page in a few seconds to download it.');
            return;
        }
        window.open(url, '_blank');
    };

    return (
        <main className="min-h-screen bg-white pt-32 pb-20 px-8 md:px-12 lg:px-16 text-[#1a1a1a]">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mb-6">
                                <Ticket className="w-6 h-6" />
                            </div>
                            <h1 className={`${instrumentSerif.className} text-5xl md:text-7xl`}>
                                My Bookings
                            </h1>
                        </div>
                    </div>

                    {bookings.length === 0 ? (
                        <div className="p-12 rounded-[2rem] bg-gray-50 border border-gray-100 text-center space-y-6">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto">
                                <Ticket className="w-6 h-6 text-[#1a1a1a]/20" />
                            </div>
                            <div className="space-y-2">
                                <h3 className={`${instrumentSerif.className} text-2xl`}>No Bookings Found</h3>
                                <p className="text-[#1a1a1a]/60 font-montserrat max-w-sm mx-auto">
                                    You haven't made any bookings yet. Explore our upcoming events to get started.
                                </p>
                            </div>
                            <Link
                                href="/events"
                                className="inline-block px-8 py-3 bg-[#1a1a1a] text-white rounded-full font-bold font-montserrat hover:scale-105 transition-transform"
                            >
                                Explore Events
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {bookings.map((booking, index) => {
                                const status = getStatusConfig(booking);
                                const StatusIcon = status.icon;
                                const eventDate = booking.event.date ? new Date(booking.event.date) : null;

                                return (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                        onClick={() => {
                                            setSelectedBooking(booking);
                                            setIsModalOpen(true);
                                        }}
                                        className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {/* Event Image */}
                                            <div className="relative w-full md:w-72 h-48 md:h-auto shrink-0 bg-gray-100">
                                                {booking.event.bannerUrl ? (
                                                    <Image
                                                        src={booking.event.bannerUrl}
                                                        alt={booking.event.name}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-[#1a1a1a]/10">
                                                        <Ticket size={48} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                                    <div className="space-y-2">
                                                        <h3 className={`${instrumentSerif.className} text-2xl md:text-3xl text-[#1a1a1a]`}>
                                                            {booking.event.name}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-4 text-sm font-montserrat text-[#1a1a1a]/60 font-medium">
                                                            {eventDate && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Calendar size={14} />
                                                                    <span>{eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                                </div>
                                                            )}
                                                            {booking.event.location && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <MapPin size={14} />
                                                                    <span>{booking.event.location}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!booking.isWaitlisted ? (
                                                        <div className="text-right space-y-2 shrink-0">
                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.bg} ${status.text} border ${status.border} ml-auto`}>
                                                                <StatusIcon size={12} />
                                                                <span>{status.label}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#1a1a1a]/40 font-bold mb-1">Total Paid</p>
                                                                <p className={`${instrumentSerif.className} text-2xl`}>
                                                                    {booking.finalAmount > 0 ? `₹${booking.finalAmount}` : 'Free'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-right shrink-0">
                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.bg} ${status.text} border ${status.border}`}>
                                                                <StatusIcon size={12} />
                                                                <span>{status.label}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <p className="font-montserrat text-[10px] uppercase tracking-widest text-[#1a1a1a]/40 font-bold">Booking ID</p>
                                                        <p className="font-mono text-xs text-[#1a1a1a]/70">{booking.id.slice(0, 8).toUpperCase()}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedBooking(booking);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-[#1a1a1a] rounded-xl text-xs font-bold font-montserrat hover:bg-gray-200 transition-colors"
                                                        >
                                                            <FileText size={14} />
                                                            View Details
                                                        </button>

                                                        {(booking.ticketUrl || booking.paymentStatus === 'paid') && (
                                                            <button
                                                                onClick={(e) => handleDownloadTicket(e, booking.ticketUrl || '')}
                                                                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold font-montserrat hover:bg-black/80 transition-colors"
                                                            >
                                                                <Download size={14} />
                                                                {booking.ticketUrl ? 'Download Ticket' : 'Preparing...'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            <BookingDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                booking={selectedBooking}
            />
        </main>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
