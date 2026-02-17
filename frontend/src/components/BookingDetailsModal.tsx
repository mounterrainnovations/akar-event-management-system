'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Ticket, CreditCard, User, FileText, CheckCircle2, Hourglass, XCircle, Clock, Download } from 'lucide-react';
import { instrumentSerif } from '@/lib/fonts';
import Image from 'next/image';

// Define interface matching the Booking type from page.tsx (or a subset relevant for display)
interface BookingDetail {
    id: string;
    eventId: string;
    totalAmount: number;
    finalAmount: number;
    paymentStatus: string;
    createdAt: string;
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

interface BookingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: BookingDetail | null;
}

export default function BookingDetailsModal({ isOpen, onClose, booking }: BookingDetailsModalProps) {
    // Use useLayoutEffect to prevent layout flicker on mount/unmount
    React.useLayoutEffect(() => {
        if (isOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

            // Lock body and html to prevent double scrollbars
            const originalBodyOverflow = document.body.style.overflow;
            const originalBodyPadding = document.body.style.paddingRight;
            const originalHtmlOverflow = document.documentElement.style.overflow;

            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }

            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.body.style.paddingRight = originalBodyPadding;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        }
    }, [isOpen]);

    if (!booking) return null;

    const getStatusConfig = () => {
        if (booking.isWaitlisted) {
            return {
                label: 'Waitlist',
                icon: Hourglass,
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                border: 'border-blue-100'
            };
        }
        if (booking.paymentStatus === 'success' || booking.paymentStatus === 'paid') {
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
            icon: XCircle,
            bg: 'bg-gray-50',
            text: 'text-gray-600',
            border: 'border-gray-100'
        };
    };

    const status = getStatusConfig();
    const StatusIcon = status.icon;

    const eventDate = booking.event.date ? new Date(booking.event.date) : null;
    const bookingDate = new Date(booking.createdAt);

    const formatLabel = (key: string) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleDownloadTicket = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        if (!url) {
            alert('Your ticket is being generated. Please refresh the page in a few seconds to download it.');
            return;
        }
        window.open(url, '_blank');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden">
                    {/* Fixed Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
                    />

                    {/* Scrollable Layer - This is the key for Windows/Chrome scrolling reliability */}
                    <div
                        className="relative w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center py-8 md:py-20 px-4 overscroll-contain"
                        data-lenis-prevent
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden cursor-default shrink-0 mb-8 border border-black/5"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
                                <div className="px-5 md:px-8 py-4 flex flex-wrap items-center gap-3">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.bg} ${status.text} border ${status.border}`}>
                                        <StatusIcon size={12} />
                                        <span>{status.label}</span>
                                    </div>

                                    <div className="flex-1 min-w-[220px]">
                                        <h2 className={`${instrumentSerif.className} text-2xl md:text-3xl text-[#1a1a1a] leading-tight`}>
                                            {booking.event.name}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-montserrat uppercase tracking-widest text-[#1a1a1a]/50 font-bold mt-1">
                                            {eventDate && (
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={12} />
                                                    {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            )}
                                            {booking.event.location && (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin size={12} />
                                                    {booking.event.location}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={12} />
                                                Booked {bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {(booking.ticketUrl || booking.paymentStatus === 'paid') && (
                                            <button
                                                onClick={(e) => handleDownloadTicket(e, booking.ticketUrl || '')}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-full text-[11px] font-bold font-montserrat hover:bg-black/80 transition-colors"
                                            >
                                                <Download size={14} />
                                                {booking.ticketUrl ? 'Download Ticket' : 'Preparing...'}
                                            </button>
                                        )}
                                        <button
                                            onClick={onClose}
                                            aria-label="Close"
                                            className="p-2 rounded-full border border-gray-200 text-[#1a1a1a]/70 hover:text-[#1a1a1a] hover:border-gray-300 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="grid md:grid-cols-[1.15fr_1fr]">
                                {/* Media */}
                                <div className="relative min-h-[220px] md:min-h-full bg-gray-100 overflow-hidden">
                                    {booking.event.bannerUrl ? (
                                        <Image
                                            src={booking.event.bannerUrl}
                                            alt={booking.event.name}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <Calendar size={64} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                                        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/40 backdrop-blur">
                                            {eventDate
                                                ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : 'Date TBA'}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-6 md:p-8 space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                                            <p className="text-[9px] uppercase tracking-widest text-black/30 font-bold mb-1">Booking ID</p>
                                            <p className="font-mono text-xs font-bold text-black/80 break-all">{booking.id.toUpperCase()}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                                            <p className="text-[9px] uppercase tracking-widest text-black/30 font-bold mb-1">Payment</p>
                                            <p className="text-sm font-bold text-black">Rs. {booking.finalAmount}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                                            <p className="text-[9px] uppercase tracking-widest text-black/30 font-bold mb-1">Status</p>
                                            <p className={`text-sm font-bold ${status.text}`}>{status.label}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                                            <p className="text-[9px] uppercase tracking-widest text-black/30 font-bold mb-1">Booked On</p>
                                            <p className="text-sm font-bold text-black">{bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    {!booking.isWaitlisted && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-montserrat text-xs uppercase tracking-[0.3em] font-bold text-black/70">Tickets</h3>
                                                <div className="text-[10px] font-montserrat uppercase tracking-widest text-black/40 font-bold">
                                                    {booking.tickets.length} items
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                {booking.tickets.map((ticket) => (
                                                    <div key={ticket.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                                                                <Ticket className="text-black/40" size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-black truncate">{ticket.name}</p>
                                                                <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">Qty {ticket.quantity}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-black">
                                                                {ticket.price > 0 ? `Rs. ${ticket.price * ticket.quantity}` : 'Free'}
                                                            </p>
                                                            {ticket.price > 0 && (
                                                                <p className="text-[10px] text-black/35 font-bold uppercase tracking-widest">Rs. {ticket.price} each</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!booking.isWaitlisted && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                            {(() => {
                                                const subTotal = booking.tickets.reduce((acc, t) => acc + (t.price * t.quantity), 0);
                                                const discount = subTotal - booking.finalAmount;

                                                if (discount > 0.01) {
                                                    return (
                                                        <>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-black/50 font-medium">Subtotal</span>
                                                                <span className="text-black font-medium">Rs. {subTotal.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-black/50 font-medium">Discount</span>
                                                                <span className="text-red-500 font-medium">- Rs. {discount.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                                                                <span className="font-bold text-black">Total Paid</span>
                                                                <span className="font-bold text-black">Rs. {booking.finalAmount}</span>
                                                            </div>
                                                        </>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    )}

                                    {booking.formResponse && Object.keys(booking.formResponse).length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="font-montserrat text-xs uppercase tracking-[0.3em] font-bold text-black/70">Registration Data</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {Object.entries(booking.formResponse).map(([key, value]) => (
                                                    <div key={key} className="p-4 rounded-2xl border border-gray-100 bg-white">
                                                        <p className="text-[9px] uppercase tracking-widest text-black/30 font-bold mb-1">{formatLabel(key)}</p>
                                                        <p className="text-sm font-semibold text-black break-words">
                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-gray-100 text-center">
                                        <p className="text-[10px] text-black/30 font-bold uppercase tracking-widest">
                                            Thank you for choosing Akar Women Group
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
